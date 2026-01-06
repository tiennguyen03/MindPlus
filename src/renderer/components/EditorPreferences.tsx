import React from 'react';
import type { Settings, EditorPreferences as EditorPrefs } from '../../shared/types';

interface EditorPreferencesProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export default function EditorPreferences({ settings, onSave }: EditorPreferencesProps) {
  const { editorPreferences } = settings;

  const handlePreferenceChange = <K extends keyof EditorPrefs>(
    key: K,
    value: EditorPrefs[K]
  ) => {
    const newSettings: Settings = {
      ...settings,
      editorPreferences: {
        ...editorPreferences,
        [key]: value,
      },
    };
    onSave(newSettings);
  };

  return (
    <div className="editor-preferences">
      <h3>Editor Preferences</h3>
      <p className="settings-description">
        Customize your writing experience with font, layout, and focus options.
      </p>

      {/* Font Family */}
      <div className="preference-option">
        <label className="preference-label">Font Family</label>
        <div className="preference-radio-group">
          <label className="preference-radio">
            <input
              type="radio"
              name="fontFamily"
              value="default"
              checked={editorPreferences.fontFamily === 'default'}
              onChange={(e) => handlePreferenceChange('fontFamily', e.target.value as EditorPrefs['fontFamily'])}
            />
            <span className="radio-label">
              <span className="radio-title">Default</span>
              <span className="radio-description">System sans-serif font</span>
            </span>
          </label>

          <label className="preference-radio">
            <input
              type="radio"
              name="fontFamily"
              value="serif"
              checked={editorPreferences.fontFamily === 'serif'}
              onChange={(e) => handlePreferenceChange('fontFamily', e.target.value as EditorPrefs['fontFamily'])}
            />
            <span className="radio-label">
              <span className="radio-title">Serif</span>
              <span className="radio-description">Classic book-style font</span>
            </span>
          </label>

          <label className="preference-radio">
            <input
              type="radio"
              name="fontFamily"
              value="mono"
              checked={editorPreferences.fontFamily === 'mono'}
              onChange={(e) => handlePreferenceChange('fontFamily', e.target.value as EditorPrefs['fontFamily'])}
            />
            <span className="radio-label">
              <span className="radio-title">Monospace</span>
              <span className="radio-description">Code-style fixed-width font</span>
            </span>
          </label>
        </div>
      </div>

      {/* Font Size */}
      <div className="preference-option">
        <label className="preference-label">Font Size</label>
        <div className="preference-radio-group">
          <label className="preference-radio">
            <input
              type="radio"
              name="fontSize"
              value="small"
              checked={editorPreferences.fontSize === 'small'}
              onChange={(e) => handlePreferenceChange('fontSize', e.target.value as EditorPrefs['fontSize'])}
            />
            <span className="radio-label">
              <span className="radio-title">Small</span>
              <span className="radio-description">14px - Compact</span>
            </span>
          </label>

          <label className="preference-radio">
            <input
              type="radio"
              name="fontSize"
              value="medium"
              checked={editorPreferences.fontSize === 'medium'}
              onChange={(e) => handlePreferenceChange('fontSize', e.target.value as EditorPrefs['fontSize'])}
            />
            <span className="radio-label">
              <span className="radio-title">Medium</span>
              <span className="radio-description">16px - Comfortable</span>
            </span>
          </label>

          <label className="preference-radio">
            <input
              type="radio"
              name="fontSize"
              value="large"
              checked={editorPreferences.fontSize === 'large'}
              onChange={(e) => handlePreferenceChange('fontSize', e.target.value as EditorPrefs['fontSize'])}
            />
            <span className="radio-label">
              <span className="radio-title">Large</span>
              <span className="radio-description">18px - Easy reading</span>
            </span>
          </label>
        </div>
      </div>

      {/* Line Width */}
      <div className="preference-option">
        <label className="preference-label">Line Width</label>
        <div className="preference-radio-group">
          <label className="preference-radio">
            <input
              type="radio"
              name="lineWidth"
              value="narrow"
              checked={editorPreferences.lineWidth === 'narrow'}
              onChange={(e) => handlePreferenceChange('lineWidth', e.target.value as EditorPrefs['lineWidth'])}
            />
            <span className="radio-label">
              <span className="radio-title">Narrow</span>
              <span className="radio-description">65 characters - Focused</span>
            </span>
          </label>

          <label className="preference-radio">
            <input
              type="radio"
              name="lineWidth"
              value="medium"
              checked={editorPreferences.lineWidth === 'medium'}
              onChange={(e) => handlePreferenceChange('lineWidth', e.target.value as EditorPrefs['lineWidth'])}
            />
            <span className="radio-label">
              <span className="radio-title">Medium</span>
              <span className="radio-description">80 characters - Balanced</span>
            </span>
          </label>

          <label className="preference-radio">
            <input
              type="radio"
              name="lineWidth"
              value="wide"
              checked={editorPreferences.lineWidth === 'wide'}
              onChange={(e) => handlePreferenceChange('lineWidth', e.target.value as EditorPrefs['lineWidth'])}
            />
            <span className="radio-label">
              <span className="radio-title">Wide</span>
              <span className="radio-description">Full width - Spacious</span>
            </span>
          </label>
        </div>
      </div>

      {/* Distraction-Free Mode */}
      <div className="preference-option">
        <label className="preference-checkbox">
          <input
            type="checkbox"
            checked={editorPreferences.distractionFree}
            onChange={(e) => handlePreferenceChange('distractionFree', e.target.checked)}
          />
          <span className="checkbox-label">
            <span className="checkbox-title">Distraction-Free Mode</span>
            <span className="checkbox-description">
              Hide sidebar and AI panel, show only the editor
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}
