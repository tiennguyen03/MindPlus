import React, { useState, useEffect, useCallback, useRef } from 'react';
import { JournalEntry, EditorPreferences } from '../../shared/types';

interface EditorProps {
  entry: JournalEntry;
  preferences: EditorPreferences;
  onSave: (content: string) => void;
}

/**
 * Parse frontmatter from markdown content
 */
function parseFrontmatter(content: string): { sensitive: boolean; body: string } {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) {
    return { sensitive: false, body: content };
  }

  const frontmatter = frontmatterMatch[1];
  const body = frontmatterMatch[2];

  // Parse sensitive flag
  const sensitiveMatch = frontmatter.match(/sensitive:\s*(true|false)/i);
  const sensitive = sensitiveMatch ? sensitiveMatch[1].toLowerCase() === 'true' : false;

  return { sensitive, body };
}

/**
 * Update or add frontmatter to content
 */
function updateFrontmatter(content: string, sensitive: boolean): string {
  const { body } = parseFrontmatter(content);

  if (sensitive) {
    return `---\nsensitive: true\n---\n${body}`;
  } else {
    // Remove frontmatter if not sensitive
    return body;
  }
}

export default function Editor({ entry, preferences, onSave }: EditorProps) {
  const [content, setContent] = useState(entry.content);
  const [isSensitive, setIsSensitive] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimeoutRef = useRef<number | null>(null);

  // Generate CSS classes based on preferences
  const editorClasses = [
    'editor-container',
    `font-${preferences.fontFamily}`,
    `size-${preferences.fontSize}`,
    `width-${preferences.lineWidth}`,
  ].join(' ');

  // Update content when entry changes
  useEffect(() => {
    setContent(entry.content);
    const { sensitive } = parseFrontmatter(entry.content);
    setIsSensitive(sensitive);
    setSaveStatus('saved');
  }, [entry.path, entry.content]);

  // Handle sensitive toggle
  const handleSensitiveToggle = useCallback((checked: boolean) => {
    setIsSensitive(checked);
    const updatedContent = updateFrontmatter(content, checked);
    setContent(updatedContent);
    setSaveStatus('unsaved');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      setSaveStatus('saving');
      onSave(updatedContent);
      setSaveStatus('saved');
    }, 500);
  }, [content, onSave]);

  // Auto-save with debounce
  const handleChange = useCallback((newContent: string) => {
    setContent(newContent);
    setSaveStatus('unsaved');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      setSaveStatus('saving');
      onSave(newContent);
      setSaveStatus('saved');
    }, 1000);
  }, [onSave]);

  // Keyboard shortcut for save
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      setSaveStatus('saving');
      onSave(content);
      setSaveStatus('saved');
    }
  }, [content, onSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const statusText = {
    saved: 'Saved',
    saving: 'Saving...',
    unsaved: 'Unsaved',
  };

  return (
    <>
      <header className="editor-header">
        <h2>{entry.date}</h2>
        <div className="editor-header-actions">
          <label className="sensitive-toggle">
            <input
              type="checkbox"
              checked={isSensitive}
              onChange={(e) => handleSensitiveToggle(e.target.checked)}
            />
            <span className="sensitive-toggle-label">
              {isSensitive ? '🔒 Sensitive' : 'Mark as Sensitive'}
            </span>
          </label>
          <span className="save-status">{statusText[saveStatus]}</span>
        </div>
      </header>
      <div className={editorClasses}>
        <textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Start writing..."
          autoFocus
        />
      </div>
    </>
  );
}
