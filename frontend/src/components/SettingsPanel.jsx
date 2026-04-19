import React from 'react';
import { X } from 'lucide-react';

const SettingsPanel = ({ apiKey, setApiKey, prompts, setPrompts, contextWindows, setContextWindows, onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        background: '#151515',
        width: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: '16px',
        padding: '2rem',
        border: '1px solid var(--border-color)',
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
        
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Strict System Settings</h2>
        
        {/* API Key */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="settings-label">Groq API Key</label>
          <input 
            type="password" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="settings-input"
            placeholder="gsk_..."
          />
        </div>

        {/* Prompt Templates */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="settings-label">Live Suggestions Prompt</label>
          <textarea 
            value={prompts.suggestion}
            onChange={(e) => setPrompts({...prompts, suggestion: e.target.value})}
            className="settings-input"
            rows="3"
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="settings-label">Detailed Answers Prompt (On-Click)</label>
          <textarea 
            value={prompts.detailed}
            onChange={(e) => setPrompts({...prompts, detailed: e.target.value})}
            className="settings-input"
            rows="3"
          />
        </div>

        {/* Context Windows */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            <label className="settings-label">Suggestions Context Window (Chks)</label>
            <input 
              type="number" 
              value={contextWindows.suggestion}
              onChange={(e) => setContextWindows({...contextWindows, suggestion: parseInt(e.target.value)})}
              className="settings-input"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="settings-label">Expanded Context Window (Chks)</label>
            <input 
              type="number" 
              value={contextWindows.detailed}
              onChange={(e) => setContextWindows({...contextWindows, detailed: parseInt(e.target.value)})}
              className="settings-input"
            />
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', borderRadius: '8px', height: '48px', justifyContent: 'center' }} onClick={onClose}>
          Save Configuration
        </button>
      </div>

      <style>{`
        .settings-label {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          font-weight: 600;
        }
        .settings-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0.75rem;
          color: white;
          outline: none;
          font-family: inherit;
        }
        .settings-input:focus {
          border-color: var(--accent-primary);
        }
      `}</style>
    </div>
  );
};

export default SettingsPanel;
