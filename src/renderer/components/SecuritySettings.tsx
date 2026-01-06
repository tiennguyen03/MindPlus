import React, { useState } from 'react';
import type { Settings } from '../../shared/types';

interface SecuritySettingsProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export default function SecuritySettings({ settings, onSave }: SecuritySettingsProps) {
  const [showPasscodeSetup, setShowPasscodeSetup] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSetPasscode = async () => {
    if (!newPasscode) {
      setPasscodeError('Please enter a passcode');
      return;
    }

    if (newPasscode.length < 4) {
      setPasscodeError('Passcode must be at least 4 characters');
      return;
    }

    if (newPasscode !== confirmPasscode) {
      setPasscodeError('Passcodes do not match');
      return;
    }

    setIsSaving(true);
    setPasscodeError('');

    try {
      await window.journal.setPasscode(newPasscode);

      const newSettings: Settings = {
        ...settings,
        appLockEnabled: true,
      };

      onSave(newSettings);

      // Reset form
      setNewPasscode('');
      setConfirmPasscode('');
      setShowPasscodeSetup(false);
    } catch (error) {
      setPasscodeError('Failed to set passcode. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisableLock = () => {
    const newSettings: Settings = {
      ...settings,
      appLockEnabled: false,
      appLockPasscode: undefined,
      autoLockTimeout: 0,
    };

    onSave(newSettings);
  };

  const handleAutoLockChange = (minutes: number) => {
    const newSettings: Settings = {
      ...settings,
      autoLockTimeout: minutes,
    };

    onSave(newSettings);
  };

  return (
    <div className="security-settings">
      <h3>Security & Privacy</h3>
      <p className="settings-description">
        Protect your journal with a passcode. Your journal data never leaves your device.
      </p>

      {/* App Lock Toggle */}
      <div className="security-option">
        <div className="security-option-header">
          <label className="security-label">
            <input
              type="checkbox"
              checked={settings.appLockEnabled}
              onChange={(e) => {
                if (e.target.checked) {
                  setShowPasscodeSetup(true);
                } else {
                  handleDisableLock();
                }
              }}
              disabled={!settings.appLockPasscode && !showPasscodeSetup}
            />
            <span>Enable App Lock</span>
          </label>
          {settings.appLockPasscode && (
            <span className="security-status">Passcode Set</span>
          )}
        </div>

        {!settings.appLockPasscode && !settings.appLockEnabled && (
          <p className="security-hint">
            Require a passcode to access your journal
          </p>
        )}
      </div>

      {/* Passcode Setup Form */}
      {showPasscodeSetup && !settings.appLockPasscode && (
        <div className="passcode-setup">
          <h4>Set Your Passcode</h4>
          <p className="setup-hint">
            Choose a passcode you'll remember. It cannot be recovered if forgotten.
          </p>

          <div className="passcode-fields">
            <input
              type="password"
              value={newPasscode}
              onChange={(e) => setNewPasscode(e.target.value)}
              placeholder="Enter passcode (min 4 characters)"
              className="passcode-input"
              disabled={isSaving}
            />
            <input
              type="password"
              value={confirmPasscode}
              onChange={(e) => setConfirmPasscode(e.target.value)}
              placeholder="Confirm passcode"
              className="passcode-input"
              disabled={isSaving}
            />
          </div>

          {passcodeError && (
            <div className="passcode-error">{passcodeError}</div>
          )}

          <div className="passcode-actions">
            <button
              className="btn-secondary btn-small"
              onClick={() => {
                setShowPasscodeSetup(false);
                setNewPasscode('');
                setConfirmPasscode('');
                setPasscodeError('');
              }}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              className="btn-primary btn-small"
              onClick={handleSetPasscode}
              disabled={isSaving}
            >
              {isSaving ? 'Setting...' : 'Set Passcode'}
            </button>
          </div>
        </div>
      )}

      {/* Auto-Lock Settings */}
      {settings.appLockEnabled && settings.appLockPasscode && (
        <div className="security-option">
          <label className="security-label">Auto-Lock Timeout</label>
          <select
            value={settings.autoLockTimeout}
            onChange={(e) => handleAutoLockChange(Number(e.target.value))}
            className="auto-lock-select"
          >
            <option value={0}>Never</option>
            <option value={1}>After 1 minute</option>
            <option value={5}>After 5 minutes</option>
            <option value={15}>After 15 minutes</option>
            <option value={30}>After 30 minutes</option>
          </select>
          <p className="security-hint">
            Automatically lock the app after period of inactivity
          </p>
        </div>
      )}

      {/* Change Passcode */}
      {settings.appLockEnabled && settings.appLockPasscode && (
        <div className="security-option">
          <button
            className="btn-secondary btn-small"
            onClick={() => {
              handleDisableLock();
              setShowPasscodeSetup(true);
            }}
          >
            Change Passcode
          </button>
        </div>
      )}
    </div>
  );
}
