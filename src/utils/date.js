export const parseLocalDate = (dateString) => {
  if (!dateString) return new Date();
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date(dateString);
};

export const getNowInTimeZone = (timeZone) => {
  const d = new Date();
  if (!timeZone || timeZone === 'Local') {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  }
  
  try {
    const options = { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' };
    const formatter = new Intl.DateTimeFormat('en-CA', options); // en-CA gives YYYY-MM-DD
    const parts = formatter.formatToParts(d);
    const y = parts.find(p => p.type === 'year').value;
    const m = parts.find(p => p.type === 'month').value;
    const dVal = parts.find(p => p.type === 'day').value;
    return `${y}-${m}-${dVal}`;
  } catch (e) {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  }
};

export const formatDisplayDate = (dateObj) => {
  if (!dateObj) return 'N/A';
  return dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

export const getAvailableTimezones = () => {
  return Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [];
};
