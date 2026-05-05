import React, { useState, useMemo } from 'react';
import { Plus, Edit2, ShoppingCart, RefreshCw, Trash2, X, Copy } from 'lucide-react';
import { calculateItemHealth } from '../utils/foodMath';
import { getNowInTimeZone, parseLocalDate, formatDisplayDate } from '../utils/date';

export default function Pantry({ data, setData, globalFilter, setGlobalFilter }) {
  const [view, setView] = useState('catalog'); // 'catalog', 'ledger'
  const [editingItem, setEditingItem] = useState(null);
  const [restockItem, setRestockItem] = useState(null);
  const [calibrateItem, setCalibrateItem] = useState(null);
  const [syncMode, setSyncMode] = useState('packs');
  const [calibrateInput, setCalibrateInput] = useState("");

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

  const handleSaveItem = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const isUntracked = formData.get('isUntracked') === 'on';
    const alertMode = formData.get('alertMode') || (isUntracked ? 'packs' : 'days');
    const item = {
      id: editingItem.id || Date.now().toString(),
      name: formData.get('name'),
      category: formData.get('category') || '',
      unitSize: parseFloat(formData.get('unitSize')), // e.g. 15 slices
      isUntracked: isUntracked,
      servingUnits: isUntracked ? 1 : parseFloat(formData.get('servingUnits')),
      servingYield: isUntracked ? 1 : parseFloat(formData.get('servingYield')),
      rate: isUntracked ? 0 : parseFloat(formData.get('rate')), // e.g. 1 (serving)
      rateUnit: isUntracked ? 'days' : formData.get('rateUnit'), // 'days', 'weeks', 'months'
      alertMode: alertMode,
      alertYellow: formData.get('alertYellow') ? parseFloat(formData.get('alertYellow')) : (isUntracked ? 1 : 7),
      alertRed: formData.get('alertRed') ? parseFloat(formData.get('alertRed')) : (isUntracked ? 0 : 3),
    };

    setData(prev => {
      const isExisting = prev.catalog.some(c => c.id === item.id);
      return {
        ...prev,
        catalog: isExisting ? prev.catalog.map(c => c.id === item.id ? item : c) : [...prev.catalog, item]
      };
    });
    setEditingItem(null);
  };

  const handleLogPurchase = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const qty = parseFloat(formData.get('quantity'));
    const dateAdded = formData.get('dateAdded');

    const entry = {
      id: Date.now().toString(),
      catalogId: restockItem.id,
      type: 'restock',
      quantity: qty,
      dateAdded: dateAdded
    };

    setData(prev => ({ ...prev, inventory: [...prev.inventory, entry] }));
    setRestockItem(null);
  };

  const handleCalibrate = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const syncDate = formData.get('syncDate');
    const val = parseFloat(calibrateInput) || 0;

    let remainingServings = val;
    if (syncMode === 'packs') {
      const servingsPerPack = (parseFloat(calibrateItem.unitSize || 1) * (parseFloat(calibrateItem.servingYield || 1) / parseFloat(calibrateItem.servingUnits || calibrateItem.servingSize || 1)));
      remainingServings = val * servingsPerPack;
    }

    const entry = {
      id: Date.now().toString(),
      catalogId: calibrateItem.id,
      type: 'reset',
      quantity: remainingServings, // In the math engine, reset quantity directly dictates remaining servings
      dateAdded: syncDate
    };

    setData(prev => ({ ...prev, inventory: [...prev.inventory, entry] }));
    setCalibrateItem(null);
  };

  const deleteItem = (id) => {
    if (confirm("Are you sure you want to delete this food item and all its ledger history?")) {
      setData(prev => ({
        ...prev,
        catalog: prev.catalog.filter(c => c.id !== id),
        inventory: prev.inventory.filter(i => i.catalogId !== id)
      }));
    }
  };

  const deleteLedgerEntry = (id) => {
    if (confirm("Delete this purchase?")) {
      setData(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== id) }));
    }
  }

  return (
    <div className="grid">
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="flex flex-between" style={{ marginBottom: '1rem', alignItems: 'center' }}>
          <div className="flex gap-2">
            <button className={`btn-ghost ${view === 'catalog' ? 'active' : ''}`} style={{ borderBottom: view === 'catalog' ? '2px solid var(--accent-color)' : '2px solid transparent', borderRadius: 0 }} onClick={() => setView('catalog')}>Food Catalog</button>
            <button className={`btn-ghost ${view === 'ledger' ? 'active' : ''}`} style={{ borderBottom: view === 'ledger' ? '2px solid var(--accent-color)' : '2px solid transparent', borderRadius: 0 }} onClick={() => setView('ledger')}>Raw Ledger</button>
          </div>

          {view === 'catalog' && (
            <button className="btn-primary" onClick={() => setEditingItem({})}>
              <Plus size={18} /> Add Food
            </button>
          )}
        </div>

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

      {view === 'catalog' && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {data.catalog
            .filter(item => {
              if (filterCat === 'All') return true;
              return (item.category || '').split(',').map(s => s.trim()).includes(filterCat);
            })
            .map(item => {
              const nowObj = parseLocalDate(getNowInTimeZone(data.settings.timeZone));
              const health = calculateItemHealth(item, data.inventory, nowObj);
              return (
                <div key={item.id} className="glass-panel" style={{ position: 'relative' }}>
                  <div className="flex flex-between" style={{ marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                    <div className="flex flex-col gap-1">
                      <h3 style={{ margin: 0 }}>{item.name}</h3>
                      {item.category && (
                        <div className="flex gap-2 flex-wrap" style={{ marginTop: '0.15rem' }}>
                          {item.category.split(',').map(c => c.trim()).filter(Boolean).map(cat => (
                            <span key={cat} style={{ fontSize: '0.65rem', background: 'var(--accent-color)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cat}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2" style={{ alignItems: 'center' }}>
                      <button className="btn-ghost" style={{ padding: '0.25rem' }} onClick={() => setEditingItem({ ...item, id: null, name: item.name + ' (Copy)' })} title="Duplicate Food">
                        <Copy size={16} />
                      </button>
                      <button className="btn-ghost" style={{ padding: '0.25rem' }} onClick={() => setEditingItem(item)} title="Edit Food Details">
                        <Edit2 size={16} />
                      </button>
                      <button className="btn-ghost text-danger" style={{ padding: '0.25rem' }} onClick={() => deleteItem(item.id)} title="Delete Food">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2 text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                    <div className="flex flex-between">
                      <span>Pack Size:</span> <span>{item.unitSize} units</span>
                    </div>
                    {item.isUntracked ? (
                      <>
                        <div className="flex flex-between">
                          <span>Tracking:</span> <span>Packs Only</span>
                        </div>
                        <div className="flex flex-between" style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '0.5rem', marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                          <span>Est. Packs Remaining:</span>
                          <span style={{ fontWeight: 'bold' }}>{health.currentRaw <= 0 ? '0' : parseFloat((health.currentRaw / parseFloat(item.unitSize || 1)).toFixed(2))}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-between">
                          <span>Serving Def:</span> <span>{item.servingUnits || item.servingSize || 1} unit(s) = {item.servingYield || 1} serving(s)</span>
                        </div>
                        <div className="flex flex-between">
                          <span>Consumption:</span> <span>{item.rate} serving(s) / {item.rateUnit}</span>
                        </div>
                        <div className="flex flex-between" style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '0.5rem', marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                          <span>Current Est. Servings:</span>
                          <span style={{ fontWeight: 'bold' }}>{health.currentServings <= 0 ? '0' : parseFloat(health.currentServings.toFixed(1))}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2" style={{ marginTop: 'auto' }}>
                    <button className="btn-success" style={{ flex: 1 }} onClick={() => setRestockItem(item)}>
                      <ShoppingCart size={16} /> Restock
                    </button>
                    <button className="btn-ghost" style={{ flex: 1, border: '1px solid var(--panel-border)' }} onClick={() => {
                      setCalibrateItem({ ...item, currentServings: health.currentServings });
                      const sPerPack = (parseFloat(item.unitSize || 1) * (parseFloat(item.servingYield || 1) / parseFloat(item.servingUnits || item.servingSize || 1)));
                      setSyncMode('packs');
                      setCalibrateInput(parseFloat((Math.max(0, health.currentServings || 0) / sPerPack).toFixed(2)));
                    }}>
                      <RefreshCw size={16} /> Sync
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {view === 'ledger' && (
        <div className="glass-panel">
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--panel-border)' }}>
                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Date</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Item</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Type</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Value</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.inventory
                .filter(inv => {
                  if (filterCat === 'All') return true;
                  const catalogItem = data.catalog.find(c => c.id === inv.catalogId);
                  if (!catalogItem) return false;
                  return (catalogItem.category || '').split(',').map(s => s.trim()).includes(filterCat);
                })
                .sort((a, b) => parseLocalDate(b.dateAdded) - parseLocalDate(a.dateAdded))
                .map(inv => {
                  const catalogItem = data.catalog.find(c => c.id === inv.catalogId);
                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '0.75rem' }}>{formatDisplayDate(parseLocalDate(inv.dateAdded))}</td>
                      <td style={{ padding: '0.75rem' }}>{catalogItem ? catalogItem.name : 'Unknown Item'}</td>
                      <td style={{ padding: '0.75rem' }}>
                        {inv.type === 'reset' ? <span style={{ color: 'var(--warning-color)' }}>Manual Reset</span> : <span style={{ color: 'var(--success-color)' }}>Restock</span>}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {inv.type === 'reset' ? `${inv.quantity} servings set` : `+${inv.quantity} packs`}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <button className="btn-ghost text-danger" style={{ padding: '0.25rem' }} onClick={() => deleteLedgerEntry(inv.id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              {data.inventory.length === 0 && (
                <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No restock history found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODALS */}
      {editingItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2>{editingItem.id ? 'Edit Food Item' : 'New Food Item'}</h2>
              <button className="btn-ghost" onClick={() => setEditingItem(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveItem} className="grid gap-4">
              <div className="grid gap-4">
                <div>
                  <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Item Name (Pack)</label>
                  <input name="name" required defaultValue={editingItem.name || ''} placeholder="e.g., Tofurkey Slices, Thai Box" />
                </div>
                <div>
                  <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Categories (Comma separated)</label>
                  <input name="category" value={editingItem.category || ''} onChange={(e) => setEditingItem(prev => ({ ...prev, category: e.target.value }))} placeholder="e.g., Snack, Drink, Dinner" />
                  {existingCategories.length > 0 && (
                    <div className="flex gap-2 flex-wrap" style={{ marginTop: '0.5rem' }}>
                      {existingCategories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setEditingItem(prev => {
                            const current = (prev.category || '').split(',').map(s => s.trim()).filter(Boolean);
                            if (!current.includes(cat)) current.push(cat);
                            return { ...prev, category: current.join(', ') };
                          })}
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        >
                          + {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Total Units (per Pack)</label>
                  <input type="number" step="any" name="unitSize" required defaultValue={editingItem.unitSize || 1} onChange={(e) => setEditingItem(prev => ({ ...prev, unitSize: e.target.value }))} />
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--panel-border)', gridColumn: '1 / -1' }}>
                  <div className="flex flex-between" style={{ marginBottom: '0.5rem', alignItems: 'center' }}>
                    <label className="text-muted" style={{ display: 'block', fontSize: '0.9rem', color: 'var(--accent-color)', fontWeight: 'bold', margin: 0 }}>Serving Definition</label>
                    <label className="flex gap-2" style={{ alignItems: 'center', cursor: 'pointer', fontSize: '0.8rem' }}>
                      <input type="checkbox" name="isUntracked" checked={editingItem.isUntracked || false} onChange={(e) => setEditingItem(prev => ({ ...prev, isUntracked: e.target.checked, alertMode: e.target.checked ? 'packs' : 'days' }))} style={{ margin: 0, width: 'auto' }} />
                      <span>Servings cannot be determined (Track packs only)</span>
                    </label>
                  </div>

                  {!editingItem.isUntracked && (
                    <div className="flex gap-2" style={{ alignItems: 'center' }}>
                      <input type="number" step="any" name="servingUnits" required defaultValue={editingItem.servingUnits || editingItem.servingSize || 1} onChange={(e) => setEditingItem(prev => ({ ...prev, servingUnits: e.target.value }))} style={{ width: '80px', padding: '0.4rem' }} />
                      <span className="text-muted" style={{ fontSize: '0.9rem' }}>Unit(s) = </span>
                      <input type="number" step="any" name="servingYield" required defaultValue={editingItem.servingYield || 1} onChange={(e) => setEditingItem(prev => ({ ...prev, servingYield: e.target.value }))} style={{ width: '80px', padding: '0.4rem' }} />
                      <span className="text-muted" style={{ fontSize: '0.9rem' }}>Serving(s)</span>
                    </div>
                  )}
                </div>
              </div>

              {!editingItem.isUntracked && (
                <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div>
                    <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>I consume...</label>
                    <input type="number" step="any" name="rate" required defaultValue={editingItem.rate || 1} />
                  </div>
                  <div>
                    <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Servings per...</label>
                    <select name="rateUnit" defaultValue={editingItem.rateUnit || 'days'}>
                      <option value="days">Day</option>
                      <option value="weeks">Week</option>
                      <option value="months">Month</option>
                    </select>
                  </div>
                </div>
              )}

              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--panel-border)', gridColumn: '1 / -1', marginTop: '0.25rem' }}>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>Low Stock Alerts</label>
                <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div>
                    <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem' }}>Alert Based On</label>
                    <select name="alertMode" value={editingItem.alertMode || (editingItem.isUntracked ? 'packs' : 'days')} onChange={e => setEditingItem(prev => ({ ...prev, alertMode: e.target.value }))}>
                      <option value="days" disabled={editingItem.isUntracked}>Days Remaining</option>
                      <option value="packs">Packs Remaining</option>
                      <option value="servings" disabled={editingItem.isUntracked}>Servings Remaining</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--warning-color)' }}>Yellow Alert at...</label>
                    <input type="number" step="any" name="alertYellow" defaultValue={editingItem.alertYellow !== undefined ? editingItem.alertYellow : (editingItem.isUntracked ? 1 : 7)} />
                  </div>
                  <div>
                    <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--danger-color)' }}>Red Alert at...</label>
                    <input type="number" step="any" name="alertRed" defaultValue={editingItem.alertRed !== undefined ? editingItem.alertRed : (editingItem.isUntracked ? 0 : 3)} />
                  </div>
                </div>
              </div>

              <div className="flex flex-between" style={{ marginTop: '0.5rem', alignItems: 'center' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid var(--accent-color)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    {editingItem.isUntracked ? (
                      <strong>Math Check: Untracked Item (No consumption rate)</strong>
                    ) : (
                      <strong>Math Check: 1 Pack = {parseFloat((parseFloat(editingItem.unitSize || 1) * (parseFloat(editingItem.servingYield || 1) / parseFloat(editingItem.servingUnits || editingItem.servingSize || 1))).toFixed(1))} Servings</strong>
                    )}
                  </span>
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem' }}>Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {restockItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2>Restock: {restockItem.name}</h2>
              <button className="btn-ghost" onClick={() => setRestockItem(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleLogPurchase} className="grid gap-4">
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Date Purchased</label>
                <input type="date" name="dateAdded" required defaultValue={getNowInTimeZone(data.settings.timeZone)} />
              </div>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Quantity (Number of Packs bought)</label>
                <input type="number" step="any" name="quantity" required defaultValue={1} />
              </div>
              <div className="flex" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" className="btn-success">Log Purchase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {calibrateItem && (() => {
        const servingsPerPack = (parseFloat(calibrateItem.unitSize || 1) * (parseFloat(calibrateItem.servingYield || 1) / parseFloat(calibrateItem.servingUnits || calibrateItem.servingSize || 1)));

        return (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="flex flex-between" style={{ marginBottom: '1.5rem' }}>
                <h2>Manual Sync: {calibrateItem.name}</h2>
                <button className="btn-ghost" onClick={() => setCalibrateItem(null)}><X size={20} /></button>
              </div>
              <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                Life happens! If the automatic projection is off, count how much you actually have left today and enter it below to re-calibrate the timeline.
              </p>
              <form onSubmit={handleCalibrate} className="grid gap-4">
                <div>
                  <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Calibration Date</label>
                  <input type="date" name="syncDate" required defaultValue={getNowInTimeZone(data.settings.timeZone)} />
                </div>
                <div>
                  <div className="flex flex-between" style={{ marginBottom: '0.5rem', alignItems: 'flex-end' }}>
                    <label className="text-muted" style={{ display: 'block', fontSize: '0.9rem' }}>{syncMode === 'packs' ? 'Packs Remaining' : 'Servings Remaining'}</label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)' }}>1 Pack = {parseFloat(servingsPerPack.toFixed(1))} Servings</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      required
                      value={calibrateInput}
                      onChange={(e) => setCalibrateInput(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <select
                      value={syncMode}
                      onChange={(e) => {
                        const newMode = e.target.value;
                        if (newMode === syncMode) return;
                        const currentVal = parseFloat(calibrateInput) || 0;
                        if (newMode === 'packs') {
                          setCalibrateInput(parseFloat((currentVal / servingsPerPack).toFixed(2)));
                        } else {
                          setCalibrateInput(parseFloat((currentVal * servingsPerPack).toFixed(1)));
                        }
                        setSyncMode(newMode);
                      }}
                      style={{ width: '120px' }}
                    >
                      <option value="servings">Servings</option>
                      <option value="packs">Packs</option>
                    </select>
                  </div>
                </div>
                <div className="flex" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="submit" className="btn-primary">Apply Sync Override</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
