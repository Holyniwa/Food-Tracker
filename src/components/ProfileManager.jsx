import React, { useState } from 'react';
import { Plus, Trash2, Edit2, FolderPlus, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfileManager({ rootState, setRootState }) {
  const [newProfileName, setNewProfileName] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState('');
  const [importCode, setImportCode] = useState('');
  const [success, setSuccess] = useState('');

  const activeProfile = rootState.savedProfiles.find(p => p.id === rootState.activeProfileId);

  const createNewProfileData = () => ({
    catalog: [],
    inventory: [],
    settings: {
      theme: 'cosmic-dark'
    }
  });

  const handleAddProfile = (e) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    if (rootState.savedProfiles.length >= 20) {
      setError('Maximum limit of 20 profiles reached.');
      return;
    }

    const newProfile = {
      id: Date.now().toString(),
      name: newProfileName.trim(),
      data: createNewProfileData()
    };

    setRootState(prev => ({
      ...prev,
      savedProfiles: [...prev.savedProfiles, newProfile],
      activeProfileId: newProfile.id
    }));

    setNewProfileName('');
    setError('');
    setSuccess('New profile created!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleRename = (id) => {
    if (!tempName.trim()) {
      setEditingId(null);
      return;
    }
    setRootState(prev => ({
      ...prev,
      savedProfiles: prev.savedProfiles.map(p => 
        p.id === id ? { ...p, name: tempName.trim() } : p
      )
    }));
    setEditingId(null);
    setTempName('');
    setSuccess('Profile renamed!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const startEditing = (p) => {
    setEditingId(p.id);
    setTempName(p.name);
  };

  const handleImport = () => {
    try {
      if (!importCode.trim()) return;
      const parsed = JSON.parse(importCode);
      if (typeof parsed !== 'object' || !parsed) throw new Error("Invalid format");

      let profileData = parsed.data || parsed;
      let profileName = parsed.name || 'Imported Profile';

      // Basic validation of Food Tracker schema
      if (!profileData.catalog && !profileData.inventory) {
        throw new Error("Missing food tracker data fields");
      }

      const newProfile = {
        id: Date.now().toString(),
        name: profileName,
        data: { ...createNewProfileData(), ...profileData }
      };

      setRootState(prev => ({
        ...prev,
        savedProfiles: [...prev.savedProfiles, newProfile],
        activeProfileId: newProfile.id
      }));

      setImportCode('');
      setSuccess('Profile imported successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to import. Please check your Share Code.');
    }
  };

  const copyExportCode = () => {
    if (!activeProfile) return;
    const code = JSON.stringify(activeProfile);
    navigator.clipboard.writeText(code);
    setSuccess('Share code copied to clipboard!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const switchProfile = (id) => {
    setRootState(prev => ({ ...prev, activeProfileId: id }));
  };

  const deleteProfile = (id) => {
    if (rootState.savedProfiles.length <= 1) return;
    if (!window.confirm("Are you sure? This will delete all catalog items and ledger history in this profile permanently.")) return;

    setRootState(prev => {
      const nextSaved = prev.savedProfiles.filter(p => p.id !== id);
      const nextActiveId = prev.activeProfileId === id ? nextSaved[0].id : prev.activeProfileId;
      return {
        ...prev,
        savedProfiles: nextSaved,
        activeProfileId: nextActiveId
      };
    });
  };

  return (
    <div className="grid">
      <div className="glass-panel">
        <h2 style={{ marginBottom: '1.5rem' }}>Create New Profile</h2>
        <form onSubmit={handleAddProfile} className="flex gap-4" style={{ alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Profile Name (Save File)</label>
            <input 
              value={newProfileName} 
              onChange={e => setNewProfileName(e.target.value)} 
              placeholder="e.g. My Shared Household" 
              maxLength={30}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
            <FolderPlus size={18} /> Create
          </button>
        </form>
        {error && <p className="text-danger flex gap-2" style={{ marginTop: '1rem', fontSize: '0.85rem' }}><AlertCircle size={14} /> {error}</p>}
        {success && <p className="text-success flex gap-2" style={{ marginTop: '1rem', fontSize: '0.85rem' }}><CheckCircle2 size={14} /> {success}</p>}
      </div>

      <div className="glass-panel">
        <div className="flex flex-between" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>Saved Profiles</h2>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>{rootState.savedProfiles.length} / 20 limit</span>
        </div>
        
        <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
          <div className="grid gap-4">
            {rootState.savedProfiles.map(p => {
              const isActive = rootState.activeProfileId === p.id;
              const isEditing = editingId === p.id;

              return (
                <div 
                  key={p.id} 
                  className="flex flex-between" 
                  style={{ 
                    padding: '1rem', 
                    background: isActive ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255,255,255,0.02)', 
                    borderRadius: '8px', 
                    border: isActive ? '1px solid var(--accent-color)' : '1px solid var(--panel-border)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditing ? (
                      <div className="flex gap-2" style={{ alignItems: 'center' }}>
                         <input 
                            autoFocus
                            value={tempName}
                            onChange={e => setTempName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRename(p.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            onBlur={() => handleRename(p.id)}
                            style={{ margin: 0, padding: '0.3rem 0.6rem', height: 'auto', width: 'auto' }}
                         />
                         <button className="btn-ghost text-success" onClick={() => handleRename(p.id)} style={{ padding: '0.3rem' }}>
                            <CheckCircle2 size={18} />
                         </button>
                      </div>
                    ) : (
                      <div className="flex gap-2" style={{ alignItems: 'center', cursor: 'pointer' }} onClick={() => switchProfile(p.id)}>
                        <h3 style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</h3>
                        {isActive && <CheckCircle2 size={16} style={{ color: 'var(--accent-color)' }} />}
                        <button 
                          className="btn-ghost text-muted" 
                          onClick={(e) => { e.stopPropagation(); startEditing(p); }} 
                          style={{ padding: '0.3rem', marginLeft: '0.2rem', opacity: 0.5 }}
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {p.data.catalog.length} Food Items • {p.data.inventory.length} Ledger Entries
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                        className={`btn-ghost ${isActive ? 'btn-primary' : ''}`} 
                        onClick={() => switchProfile(p.id)}
                        disabled={isActive}
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                    >
                      {isActive ? 'Active' : 'Load'}
                    </button>
                    {rootState.savedProfiles.length > 1 && (
                      <button className="btn-ghost text-danger" onClick={() => deleteProfile(p.id)}>
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent-color)' }}>Share, Backup & Recovery</h2>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <h4 style={{ marginBottom: '0.5rem' }}>Export / Share</h4>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
              Generate a <strong>Share Code</strong> for the <strong>{activeProfile?.name}</strong> profile. 
              You can send this to a friend or save it as a backup.
            </p>
            <button className="btn-ghost" onClick={copyExportCode} style={{ width: '100%', border: '1px solid var(--panel-border)' }}>
              Copy Share Code
            </button>
          </div>
          <div>
            <h4 style={{ marginBottom: '0.5rem' }}>Import / Restore</h4>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
              Paste a <strong>Share Code</strong> below to import a profile from another user or device.
            </p>
            <textarea 
               value={importCode}
               onChange={e => setImportCode(e.target.value)}
               placeholder="Paste share code here..."
               style={{ width: '100%', height: '80px', fontSize: '0.75rem', marginBottom: '0.5rem', fontFamily: 'monospace' }}
            />
            <button className="btn-primary" onClick={handleImport} style={{ width: '100%' }}>
              Import Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
