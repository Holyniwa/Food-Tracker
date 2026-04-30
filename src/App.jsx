import React, { useState, useEffect, useMemo } from 'react';
import { loadData, saveData } from './utils/storage';
import Dashboard from './components/Dashboard';
import Pantry from './components/Pantry';
import ProfileManager from './components/ProfileManager';
import PatchNotes from './components/PatchNotes';
import { getAvailableTimezones } from './utils/date';
import { Sparkles, Moon, Sun, FolderTree, LayoutDashboard, Receipt } from 'lucide-react';
import './App.css';

function App() {
  const [rootState, setRootState] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [globalFilter, setGlobalFilter] = useState('All');

  useEffect(() => {
    loadData().then(loadedData => setRootState(loadedData));
  }, []);

  // Derive active data
  const activeProfile = useMemo(() => {
    if (!rootState) return null;
    return rootState.savedProfiles.find(p => p.id === rootState.activeProfileId) || rootState.savedProfiles[0];
  }, [rootState]);

  const activeData = activeProfile ? activeProfile.data : null;

  // Helper to update ONLY the active profile's data
  const setData = (updater) => {
    setRootState(prev => {
      const nextSaved = prev.savedProfiles.map(p => {
        if (p.id === prev.activeProfileId) {
          const newData = typeof updater === 'function' ? updater(p.data) : { ...p.data, ...updater };
          return { ...p, data: newData };
        }
        return p;
      });
      return { ...prev, savedProfiles: nextSaved };
    });
  };

  // Persist data whenever it changes
  useEffect(() => {
    if (!rootState) return;
    saveData(rootState);

    // Apply theme
    if (activeData?.settings?.theme === 'pitch-black') {
      document.documentElement.setAttribute('data-theme', 'pitch-black');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [rootState, activeData]);

  if (!rootState || !activeData) {
    return <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', margin: '2rem', marginTop: '20vh' }}><h3>Initializing Database...</h3><p className="text-muted">Loading your items from disk.</p></div>;
  }

  return (
    <div className="app-container">
      <header className="flex flex-between" style={{ marginBottom: '2rem', alignItems: 'flex-start' }}>
        <div className="flex gap-4" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="flex gap-2" style={{ alignItems: 'baseline' }}>
              <h1 style={{ margin: 0, letterSpacing: '0.05em', lineHeight: 1.2 }}>FOOD TRACKER</h1>
              <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 'bold', opacity: 0.6 }}>v0.1.1</span>
            </div>
            <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>
              <span className="text-muted">Active Profile:</span> <span style={{ color: 'var(--accent-color)', fontWeight: '500' }}>{activeProfile.name}</span>
            </p>
            <button className={`nav-tab flex gap-2 ${activeTab === 'patch-notes' ? 'active' : ''}`} onClick={() => setActiveTab('patch-notes')} style={{ color: 'var(--accent-color)', opacity: activeTab === 'patch-notes' ? 1 : 0.7, padding: '0.2rem 0', fontSize: '1.5rem', marginTop: '0.8rem', borderRadius: 0, borderBottom: activeTab === 'patch-notes' ? '1px solid var(--accent-color)' : 'none' }}>
              <Sparkles size={14} /> Patch Notes
            </button>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '280px', border: '1px solid var(--panel-border)' }}>
          <button className="btn-ghost" onClick={() => setData(prev => ({ ...prev, settings: { ...prev.settings, theme: prev.settings.theme === 'pitch-black' ? 'cosmic-dark' : 'pitch-black' } }))} style={{ width: '100%', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>
            {activeData.settings.theme === 'pitch-black' ? <Sun size={16} style={{ marginRight: '8px' }} /> : <Moon size={16} style={{ marginRight: '8px' }} />}
            {activeData.settings.theme === 'pitch-black' ? 'Cosmic Dark' : 'Pitch Black'}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: '1px solid var(--panel-border)', paddingTop: '0.75rem' }}>
            <label className="flex gap-2" style={{ fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={activeData.settings.syncFilters || false}
                onChange={e => setData(prev => ({ ...prev, settings: { ...prev.settings, syncFilters: e.target.checked } }))}
                style={{ width: 'auto' }}
              />
              Sync Category Filters
            </label>

            <div style={{ marginTop: '0.2rem' }}>
              <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '0.05em' }}>Home Timezone</label>
              <select
                value={activeData.settings.timeZone || 'Local'}
                onChange={e => setData(prev => ({ ...prev, settings: { ...prev.settings, timeZone: e.target.value } }))}
                style={{ fontSize: '0.8rem', padding: '0.3rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--panel-border)', borderRadius: '4px' }}
              >
                <option value="Local">System Local</option>
                {getAvailableTimezones().map(tz => (
                  <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="nav-tabs">
        <button className={`nav-tab flex gap-2 ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <LayoutDashboard size={18} /> Dashboard
        </button>
        <button className={`nav-tab flex gap-2 ${activeTab === 'pantry' ? 'active' : ''}`} onClick={() => setActiveTab('pantry')}>
          <Receipt size={18} /> Pantry Ledger
        </button>
        <button className={`nav-tab flex gap-2 ${activeTab === 'profiles' ? 'active' : ''}`} onClick={() => setActiveTab('profiles')} style={{ marginLeft: 'auto' }}>
          <FolderTree size={18} /> Profiles
        </button>
      </div>

      <main>
        {activeTab === 'dashboard' && <Dashboard data={activeData} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />}
        {activeTab === 'pantry' && <Pantry data={activeData} setData={setData} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />}
        {activeTab === 'profiles' && <ProfileManager rootState={rootState} setRootState={setRootState} />}
        {activeTab === 'patch-notes' && <PatchNotes />}
      </main>
    </div>
  );
}

export default App;
