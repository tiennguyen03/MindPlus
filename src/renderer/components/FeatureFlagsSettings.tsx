import React from 'react';
import type { Settings, FeatureFlags as FeatureFlags_ } from '../../shared/types';

interface FeatureFlagsSettingsProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export default function FeatureFlagsSettings({ settings, onSave }: FeatureFlagsSettingsProps) {
  const { featureFlags } = settings;

  const handleFlagChange = <K extends keyof FeatureFlags_>(
    key: K,
    value: FeatureFlags_[K]
  ) => {
    const newSettings: Settings = {
      ...settings,
      featureFlags: {
        ...featureFlags,
        [key]: value,
      },
    };
    onSave(newSettings);
  };

  return (
    <div className="feature-flags-settings">
      <h3>Premium Features</h3>
      <p className="settings-description">
        Enable or disable premium features. These flags control access to advanced functionality.
      </p>

      {/* Premium Insights */}
      <label className="preference-checkbox">
        <input
          type="checkbox"
          checked={featureFlags.premiumInsights}
          onChange={(e) => handleFlagChange('premiumInsights', e.target.checked)}
        />
        <span className="checkbox-label">
          <span className="checkbox-title">Premium Insights</span>
          <span className="checkbox-description">
            Access advanced AI insights, pattern detection, and deep journal analysis
          </span>
        </span>
      </label>

      {/* Advanced Ask Journal */}
      <label className="preference-checkbox">
        <input
          type="checkbox"
          checked={featureFlags.advancedAskJournal}
          onChange={(e) => handleFlagChange('advancedAskJournal', e.target.checked)}
        />
        <span className="checkbox-label">
          <span className="checkbox-title">Advanced Ask Journal</span>
          <span className="checkbox-description">
            Multi-step reasoning, follow-up questions, and complex query support
          </span>
        </span>
      </label>

      {/* Unlimited History */}
      <label className="preference-checkbox">
        <input
          type="checkbox"
          checked={featureFlags.unlimitedHistory}
          onChange={(e) => handleFlagChange('unlimitedHistory', e.target.checked)}
        />
        <span className="checkbox-label">
          <span className="checkbox-title">Unlimited History</span>
          <span className="checkbox-description">
            Access full journal history in AI queries (no 3-month limit)
          </span>
        </span>
      </label>

      <div className="ai-preferences-note">
        <p>
          <strong>Note:</strong> Feature flags are local toggles for testing premium functionality.
          In production, these would be controlled by subscription status.
        </p>
      </div>
    </div>
  );
}
