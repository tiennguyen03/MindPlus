import React from 'react';
import type { Settings, AIPreferences as AIPrefs } from '../../shared/types';

interface AIPreferencesProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export default function AIPreferences({ settings, onSave }: AIPreferencesProps) {
  const { aiPreferences } = settings;

  const handlePreferenceChange = <K extends keyof AIPrefs>(
    key: K,
    value: AIPrefs[K]
  ) => {
    const newSettings: Settings = {
      ...settings,
      aiPreferences: {
        ...aiPreferences,
        [key]: value,
      },
    };
    onSave(newSettings);
  };

  return (
    <div className="ai-preferences">
      <h3>AI Style Preferences</h3>
      <p className="settings-description">
        Customize how AI responds to your journal. These settings affect AI-generated summaries, insights, and answers.
      </p>

      {/* Tone */}
      <div className="preference-option">
        <label className="preference-label">Tone</label>
        <p className="preference-hint">How should AI communicate?</p>
        <div className="preference-radio-group">
          <label className="preference-radio">
            <input
              type="radio"
              name="tone"
              value="neutral"
              checked={aiPreferences.tone === 'neutral'}
              onChange={(e) => handlePreferenceChange('tone', e.target.value as AIPrefs['tone'])}
            />
            <span className="radio-label">
              <span className="radio-title">Neutral</span>
              <span className="radio-description">Objective, balanced perspective</span>
            </span>
          </label>

          <label className="preference-radio">
            <input
              type="radio"
              name="tone"
              value="analytical"
              checked={aiPreferences.tone === 'analytical'}
              onChange={(e) => handlePreferenceChange('tone', e.target.value as AIPrefs['tone'])}
            />
            <span className="radio-label">
              <span className="radio-title">Analytical</span>
              <span className="radio-description">Logical, structured insights</span>
            </span>
          </label>

          <label className="preference-radio">
            <input
              type="radio"
              name="tone"
              value="reflective"
              checked={aiPreferences.tone === 'reflective'}
              onChange={(e) => handlePreferenceChange('tone', e.target.value as AIPrefs['tone'])}
            />
            <span className="radio-label">
              <span className="radio-title">Reflective</span>
              <span className="radio-description">Thoughtful, introspective guidance</span>
            </span>
          </label>
        </div>
      </div>

      {/* Verbosity */}
      <div className="preference-option">
        <label className="preference-label">Verbosity</label>
        <p className="preference-hint">How much detail should AI provide?</p>
        <div className="preference-radio-group">
          <label className="preference-radio">
            <input
              type="radio"
              name="verbosity"
              value="concise"
              checked={aiPreferences.verbosity === 'concise'}
              onChange={(e) => handlePreferenceChange('verbosity', e.target.value as AIPrefs['verbosity'])}
            />
            <span className="radio-label">
              <span className="radio-title">Concise</span>
              <span className="radio-description">Brief, to-the-point responses</span>
            </span>
          </label>

          <label className="preference-radio">
            <input
              type="radio"
              name="verbosity"
              value="balanced"
              checked={aiPreferences.verbosity === 'balanced'}
              onChange={(e) => handlePreferenceChange('verbosity', e.target.value as AIPrefs['verbosity'])}
            />
            <span className="radio-label">
              <span className="radio-title">Balanced</span>
              <span className="radio-description">Moderate detail, well-rounded</span>
            </span>
          </label>

          <label className="preference-radio">
            <input
              type="radio"
              name="verbosity"
              value="detailed"
              checked={aiPreferences.verbosity === 'detailed'}
              onChange={(e) => handlePreferenceChange('verbosity', e.target.value as AIPrefs['verbosity'])}
            />
            <span className="radio-label">
              <span className="radio-title">Detailed</span>
              <span className="radio-description">Comprehensive, thorough analysis</span>
            </span>
          </label>
        </div>
      </div>

      {/* Evidence Strictness */}
      <div className="preference-option">
        <label className="preference-label">Evidence Strictness</label>
        <p className="preference-hint">How strictly should AI cite your journal entries?</p>
        <div className="preference-radio-group">
          <label className="preference-radio">
            <input
              type="radio"
              name="evidenceStrictness"
              value="standard"
              checked={aiPreferences.evidenceStrictness === 'standard'}
              onChange={(e) => handlePreferenceChange('evidenceStrictness', e.target.value as AIPrefs['evidenceStrictness'])}
            />
            <span className="radio-label">
              <span className="radio-title">Standard</span>
              <span className="radio-description">Balance between evidence and synthesis</span>
            </span>
          </label>

          <label className="preference-radio">
            <input
              type="radio"
              name="evidenceStrictness"
              value="strict"
              checked={aiPreferences.evidenceStrictness === 'strict'}
              onChange={(e) => handlePreferenceChange('evidenceStrictness', e.target.value as AIPrefs['evidenceStrictness'])}
            />
            <span className="radio-label">
              <span className="radio-title">Strict</span>
              <span className="radio-description">Only information directly from your journal</span>
            </span>
          </label>
        </div>
      </div>

      <div className="ai-preferences-note">
        <p>
          <strong>Note:</strong> These preferences only affect future AI requests. Previous AI outputs remain unchanged.
        </p>
      </div>
    </div>
  );
}
