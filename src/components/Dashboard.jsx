import React, { useMemo, useState } from 'react';
import { getPrioritizedPantry } from '../utils/foodMath';
import { formatDisplayDate, getNowInTimeZone, parseLocalDate } from '../utils/date';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

export default function Dashboard({ data, globalFilter, setGlobalFilter }) {
  const [localFilter, setLocalFilter] = useState('All');
  const filterCat = data.settings.syncFilters ? globalFilter : localFilter;

  const setFilterCat = (val) => {
    if (data.settings.syncFilters) setGlobalFilter(val);
    else setLocalFilter(val);
  };

  const existingCategories = useMemo(() => {
    const raw = [...new Set(data.catalog.flatMap(c => (c.category || '').split(',').map(s => s.trim()).filter(Boolean)))];
    const priority = ['Breakfast', 'Lunch', 'Dinner', 'Food', 'Drink'];
    return raw.sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [data.catalog]);

  const prioritizedPantry = useMemo(() => {
    const nowObj = parseLocalDate(getNowInTimeZone(data.settings.timeZone));
    let list = getPrioritizedPantry(data.catalog, data.inventory, nowObj);
    
    // Custom Sorting Logic
    list.sort((a, b) => {
      const getStatusRank = (item) => {
        const { health } = item;
        const mode = item.alertMode || (item.isUntracked ? 'packs' : 'days');
        const yellowThresh = item.alertYellow !== undefined ? parseFloat(item.alertYellow) : (item.isUntracked ? 1 : 7);
        const redThresh = item.alertRed !== undefined ? parseFloat(item.alertRed) : (item.isUntracked ? 0 : 3);

        let val = 0;
        if (mode === 'days') val = health.daysRemaining;
        else if (mode === 'packs') val = health.currentRaw / parseFloat(item.unitSize || 1);
        else if (mode === 'servings') val = health.currentServings;

        let colorRank = 4; // Green
        if (health.currentServings <= 0) colorRank = -2;
        else if (val <= redThresh) colorRank = 0; // Red
        else if (val <= yellowThresh) colorRank = 2; // Yellow
        
        // Offset untracked to appear after dated items within the same color block
        if (item.isUntracked) colorRank += 1;
        return colorRank;
      };

      const rankA = getStatusRank(a);
      const rankB = getStatusRank(b);

      if (rankA !== rankB) return rankA - rankB;

      // Tie-breaker for same rank:
      // For dated items (ranks -2, 0, 2, 4), sort by urgency (days remaining)
      if ([-2, 0, 2, 4].includes(rankA)) {
        return a.health.daysRemaining - b.health.daysRemaining;
      }
      
      // For untracked items or fallback, sort by name
      return a.name.localeCompare(b.name);
    });

    if (filterCat !== 'All') {
      list = list.filter(item => {
        const cats = (item.category || '').split(',').map(s => s.trim()).filter(Boolean);
        return cats.includes(filterCat);
      });
    }
    return list;
  }, [data.catalog, data.inventory, data.settings.timeZone, filterCat]);

  if (data.catalog.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <h3 className="text-muted">Your pantry is empty</h3>
        <p style={{ marginTop: '0.5rem' }}>Head over to the Pantry Ledger to add items and log purchases.</p>
      </div>
    );
  }

  return (
    <div className="grid">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>Run-out Projections</h2>
        {existingCategories.length > 0 && (
          <div className="flex gap-1" style={{ justifyContent: 'flex-end', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            <button 
              onClick={() => setFilterCat('All')} 
              className={`btn-ghost ${filterCat === 'All' ? 'active' : ''}`}
              style={{ fontSize: '0.8rem', borderRadius: '16px', padding: '0.2rem 0.6rem', border: filterCat === 'All' ? '1px solid var(--accent-color)' : '1px solid transparent' }}
            >
              All
            </button>
            {existingCategories.map((cat, idx) => (
              <React.Fragment key={cat}>
                {cat === 'Food' && idx > 0 && (
                  <span style={{ alignSelf: 'center', margin: '0 0.2rem', opacity: 0.3 }}>·</span>
                )}
                <button 
                  onClick={() => setFilterCat(cat)} 
                  className={`btn-ghost ${filterCat === cat ? 'active' : ''}`}
                  style={{ fontSize: '0.8rem', borderRadius: '16px', padding: '0.2rem 0.6rem', border: filterCat === cat ? '1px solid var(--accent-color)' : '1px solid transparent' }}
                >
                  {cat}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
      
      {prioritizedPantry.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No items found in this category.</div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {prioritizedPantry.map((item) => {
          const { health } = item;
          
          const mode = item.alertMode || (item.isUntracked ? 'packs' : 'days');
          const yellowThresh = item.alertYellow !== undefined ? parseFloat(item.alertYellow) : (item.isUntracked ? 1 : 7);
          const redThresh = item.alertRed !== undefined ? parseFloat(item.alertRed) : (item.isUntracked ? 0 : 3);

          let val = 0;
          if (mode === 'days') val = health.daysRemaining;
          else if (mode === 'packs') val = health.currentRaw / parseFloat(item.unitSize || 1);
          else if (mode === 'servings') val = health.currentServings;

          let statusColor = 'var(--success-color)';
          let Icon = CheckCircle;
          
          if (health.currentServings <= 0) {
            statusColor = 'var(--danger-color)';
            Icon = AlertTriangle;
          } else if (val <= redThresh) {
            statusColor = 'var(--danger-color)';
            Icon = AlertTriangle;
          } else if (val <= yellowThresh) {
            statusColor = 'var(--warning-color)';
            Icon = Clock;
          }

          return (
            <div key={item.id} className="glass-panel" style={{ borderTop: `4px solid ${statusColor}`, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="flex flex-between" style={{ alignItems: 'center' }}>
                <div className="flex gap-2 flex-wrap" style={{ alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: 0, marginRight: '0.5rem' }}>{item.name}</h3>
                  {item.category && item.category.split(',').map(c => c.trim()).filter(Boolean).map(cat => (
                    <span key={cat} style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '0.1rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cat}</span>
                  ))}
                </div>
                <Icon color={statusColor} size={20} />
              </div>
              
              <div className="flex flex-between text-muted" style={{ fontSize: '0.9rem' }}>
                <span>Remaining:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {health.currentServings <= 0 ? 'Empty' : (item.isUntracked ? `${parseFloat((health.currentRaw / (parseFloat(item.unitSize) || 1)).toFixed(2))} packs` : `${parseFloat(health.currentServings.toFixed(1))} servings`)}
                </span>
              </div>
              
              <div className="flex flex-between text-muted" style={{ fontSize: '0.9rem' }}>
                <span>Runs out:</span>
                <span style={{ fontWeight: 'bold', color: statusColor }}>
                  {health.currentServings <= 0 ? 'Now' : (health.runOutDate ? formatDisplayDate(health.runOutDate) : (item.isUntracked ? 'Untracked' : 'Never'))}
                </span>
              </div>
              
              <div style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  background: statusColor, 
                  width: `${health.currentServings <= 0 ? 0 : Math.min(100, Math.max(5, (yellowThresh > 0 ? (val / (yellowThresh * 2)) * 100 : 100)))}%`,
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
