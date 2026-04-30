import { parseLocalDate } from './date';

/**
 * Calculates the current inventory and run-out projection for a food item.
 * @param {Object} item - The catalog item.
 * @param {Array} inventory - The full array of inventory transactions (purchases).
 * @param {Date} nowObj - The current date object to project from.
 * @returns {Object} Health metrics (currentRaw, currentServings, daysRemaining, runOutDate)
 */
export const calculateItemHealth = (item, inventory, nowObj = new Date()) => {
  // 1. Calculate daily raw consumption rate
  let servingsPerDay = 0;
  const rate = parseFloat(item.rate) || 0;
  if (item.rateUnit === 'days') servingsPerDay = rate;
  else if (item.rateUnit === 'weeks') servingsPerDay = rate / 7;
  else if (item.rateUnit === 'months') servingsPerDay = rate / 30.416;
  
  const legacyServingSize = parseFloat(item.servingSize) || 1;
  const unitSize = parseFloat(item.unitSize) || 1;
  const servingUnits = parseFloat(item.servingUnits) || legacyServingSize;
  const servingYield = parseFloat(item.servingYield) || 1;
  
  const dailyRawConsumption = servingsPerDay * (servingUnits / servingYield);
  
  // 2. Filter and sort inventory for this specific item (chronologically)
  const itemInventory = inventory
    .filter(inv => inv.catalogId === item.id)
    .sort((a, b) => {
       const dateDiff = parseLocalDate(a.dateAdded) - parseLocalDate(b.dateAdded);
       if (dateDiff !== 0) return dateDiff;
       return parseInt(a.id) - parseInt(b.id);
    });
  
  // 3. Determine the "Base Date" from the latest 'reset' entry
  const resetEntries = itemInventory.filter(inv => inv.type === 'reset');
  const latestReset = resetEntries.length > 0 ? resetEntries[resetEntries.length - 1] : null;
  
  let baseDate = latestReset ? parseLocalDate(latestReset.dateAdded) : null;
  let rawQuantity = latestReset ? (parseFloat(latestReset.quantity) * (servingUnits / servingYield)) : 0;
  
  if (!baseDate && itemInventory.length > 0) {
     baseDate = parseLocalDate(itemInventory[0].dateAdded);
  } else if (!baseDate) {
     baseDate = nowObj; // No purchases and no sync yet
  }
  
  // 4. Aggregate all purchases that happened ON or AFTER the baseDate
  let currentRaw = 0;
  let effectiveBaseDate = baseDate;
  let hasHitReset = !latestReset;

  itemInventory.forEach(inv => {
     if (latestReset && inv.id === latestReset.id) {
         currentRaw = parseFloat(inv.quantity) * (servingUnits / servingYield);
         effectiveBaseDate = parseLocalDate(inv.dateAdded);
         hasHitReset = true;
     } else if (hasHitReset && inv.type !== 'reset') {
         // It's a restock after the baseline
         currentRaw += unitSize * (parseFloat(inv.quantity) || 1);
     }
  });
  
  // 5. Calculate consumption degradation from baseDate up to NOW
  const msPassed = nowObj.getTime() - effectiveBaseDate.getTime();
  const daysPassed = Math.max(0, msPassed / (1000 * 60 * 60 * 24));
  
  const consumedRaw = daysPassed * dailyRawConsumption;
  currentRaw = currentRaw - consumedRaw;
  
  if (currentRaw < 0) currentRaw = 0;
  
  // 6. Predict the Empty/Run-out Date
  let runOutDate = null;
  let daysRemaining = 0;
  
  if (currentRaw > 0 && dailyRawConsumption > 0) {
      daysRemaining = currentRaw / dailyRawConsumption;
      runOutDate = new Date(nowObj.getTime() + (daysRemaining * 24 * 60 * 60 * 1000));
  } else if (currentRaw > 0 && dailyRawConsumption === 0) {
      daysRemaining = Infinity; // Will never run out
  }
  
  return {
     currentRaw,
     currentServings: currentRaw * (servingYield / servingUnits),
     daysRemaining,
     runOutDate,
     dailyRawConsumption
  };
};

/**
 * Sorts items by how soon they will run out.
 */
export const getPrioritizedPantry = (catalog, inventory, nowObj = new Date()) => {
   return catalog.map(item => {
       const health = calculateItemHealth(item, inventory, nowObj);
       return { ...item, health };
   }).sort((a, b) => {
       // Items already out or running out soonest go first
       if (a.health.daysRemaining === Infinity && b.health.daysRemaining === Infinity) return 0;
       if (a.health.daysRemaining === Infinity) return 1;
       if (b.health.daysRemaining === Infinity) return -1;
       return a.health.daysRemaining - b.health.daysRemaining;
   });
};
