import React, { useState, useEffect } from 'react';
import { Settings } from '../../shared/types';

interface SettingsModalProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onClose: () => void;
}

export default function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(settings.aiApiKey || '');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSave = () => {
    onSave({ ...settings, aiApiKey: apiKey.trim() || undefined });
    onClose();
  };

  const maskedKey = apiKey ? `sk-...${apiKey.slice(-8)}` : '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="settings-section">
            <h3>AI Configuration</h3>
            <p className="settings-description">
              Enter your OpenAI API key to enable AI features. Your key is stored locally and never shared.
            </p>

            <label className="settings-label">
              OpenAI API Key
              <div className="api-key-input">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-..."
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {apiKey && !showKey && (
              <p className="key-preview">Current: {maskedKey}</p>
            )}

            <p className="settings-hint">
              Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">platform.openai.com</a>
            </p>
          </div>

          <div className="settings-section">
            <h3>Journal Location</h3>
            <p className="settings-value">{settings.journalPath || 'Not set'}</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
