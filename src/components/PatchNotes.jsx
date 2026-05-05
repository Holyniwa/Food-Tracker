import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function PatchNotes() {
  const versions = [
    {
      date: "May 5, 2026",
      version: "v0.1.2",
      status: "Latest",
      changes: [
        {
          title: "UI Refinement & Layout Optimization",
          description: "Ported layout improvements from the Activity Tracker to enhance usability and clarity.",
          bullets: [
            "Enhanced Visibility: Moved Categories to a new row in the food entry modal, allowing the Item Name input to take full width for better readability.",
            "Compact Modal Design: Tightened vertical spacing around 'Low Stock Alerts' and footer sections to eliminate unnecessary dead space.",
            "Visual Polish: Standardized modal padding and margins for a sleek, high-end aesthetic across all management interfaces."
          ]
        }
      ]
    },
    {
      date: "April 26, 2026",
      version: "v0.1.1",
      status: null,
      changes: [
        {
          title: "Multi-Profile Management",
          description: "Ported the advanced profile system from FLOW to allow for multiple save files and data sharing.",
          bullets: [
            "Create, rename, and switch between up to 20 different pantry profiles",
            "Generate Share Codes for backups and manual data transfers",
            "Import profiles from other users or devices via Share Code",
            "Automatic migration of legacy data into a 'Main Pantry' profile",
            "Independent theme and timezone settings per profile"
          ]
        },
        {
          title: "Custom Inventory Alerts",
          description: "Major expansion of the alerting system to support item-specific thresholds and untracked inventory.",
          bullets: [
            "User-configurable Low Stock Alerts (Days, Packs, or Servings thresholds)",
            "New 'Untracked' mode for items where servings can't be measured (e.g. sauces, chips)",
            "Advanced Dashboard sorting prioritizing Red status and Tracked items",
            "Refined quantity formatting (auto-strips trailing .0 decimals)",
            "Unified category filter bar with priority sorting and visual interpunct dividers"
          ]
        },
        {
          title: "Unified Ledger System",
          description: "Structural refactor moving from hidden calibration overwrites to a full chronological transaction ledger.",
          bullets: [
            "Syncs now appear as explicit 'Manual Reset' entries in the Raw Ledger",
            "Restocks and Manual Resets are color-coded in the ledger view",
            "Preserved history when calibrating food inventory",
            "Ported timezone stabilization engine for safe midnight logging"
          ]
        }
      ]
    },
    {
      date: "April 26, 2026",
      version: "v0.1.0",
      changes: [
        {
          title: "Initial Application Launch",
          description: "The core food tracking architecture, heavily inspired by FLOW's projection model.",
          bullets: [
            "Food Math aggregation engine for projecting item 'run-out' dates",
            "Cosmic Dark & Pitch Black aesthetic themes",
            "Urgency-based Dashboard visualization",
            "Pantry Ledger for Catalog configuration and Restock entry"
          ]
        }
      ]
    }
  ];

  return (
    <div className="grid gap-6" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex gap-4" style={{ alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ background: 'var(--accent-color)', padding: '0.75rem', borderRadius: '12px' }}>
          <Sparkles size={28} style={{ color: 'white' }} />
        </div>
        <div>
          <h2 style={{ margin: 0 }}>System Patch Notes</h2>
          <p className="text-muted" style={{ margin: 0 }}>Project Improvement Log</p>
        </div>
      </div>

      {versions.map((ver, vIdx) => (
        <div key={vIdx} className="glass-panel" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--panel-border)' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem 1.5rem', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="flex gap-2" style={{ alignItems: 'baseline' }}>
              <h3 style={{ margin: 0, color: 'var(--accent-color)' }}>{ver.date}</h3>
              <span className="text-muted" style={{ fontSize: '0.8rem', opacity: 0.8 }}>({ver.version})</span>
            </div>
            {ver.status && <span style={{ fontSize: '0.75rem', background: 'var(--accent-color)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 'bold' }}>{ver.status}</span>}
          </div>

          <div style={{ padding: '1.5rem' }} className="grid gap-6">
            {ver.changes.map((change, cIdx) => (
              <div key={cIdx} className="grid gap-2">
                <div className="flex gap-2" style={{ alignItems: 'center' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-color)' }}></div>
                  <h4 style={{ margin: 0 }}>{change.title}</h4>
                </div>
                <p className="text-muted" style={{ fontSize: '0.9rem', margin: '0 0 0.5rem 1rem' }}>{change.description}</p>
                <ul style={{ margin: '0 0 0 2rem', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {change.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="text-muted" style={{ fontSize: '0.85rem', listStyle: 'none', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <CheckCircle2 size={14} style={{ color: 'var(--success-color)', marginTop: '2px', flexShrink: 0 }} />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '2rem' }}>
        <p style={{ fontSize: '0.8rem' }}>End of Log</p>
      </div>
    </div>
  );
}
