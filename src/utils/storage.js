const STORAGE_KEY = 'foodTrackerData';

const DEFAULT_DATA = {
  catalog: [],
  inventory: [],
  settings: {
    theme: 'cosmic-dark'
  }
};

export const loadData = async () => {
  try {
    const response = await fetch('/api/data');
    let fileData = null;
    if (response.ok) {
      fileData = await response.json();
    }
    
    // Recovery from localStorage
    if (!fileData) {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) fileData = JSON.parse(raw);
    }

    if (fileData) {
      // MIGRATION: If no savedProfiles, wrap in a profile
      if (!fileData.savedProfiles) {
        console.log("Migrating legacy data to profile system...");
        const legacyData = {
          catalog: fileData.catalog || [],
          inventory: fileData.inventory || [],
          settings: { ...DEFAULT_DATA.settings, ...(fileData.settings || {}) }
        };
        const root = {
          savedProfiles: [{ id: 'default', name: 'Main Pantry', data: legacyData }],
          activeProfileId: 'default'
        };
        await saveData(root);
        return root;
      }
      return fileData;
    }

    // Default starting state
    return {
      savedProfiles: [{ id: 'default', name: 'Main Pantry', data: DEFAULT_DATA }],
      activeProfileId: 'default'
    };
  } catch (e) {
    console.error("Failed to load data", e);
    return {
      savedProfiles: [{ id: 'default', name: 'Main Pantry', data: DEFAULT_DATA }],
      activeProfileId: 'default'
    };
  }
};

export const saveData = async (rootState) => {
  try {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rootState, null, 2)
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rootState));
  } catch (e) {
    console.error("Failed to save data", e);
  }
};
