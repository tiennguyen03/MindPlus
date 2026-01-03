import React, { useState, useEffect, useCallback, useRef } from 'react';
import { JournalEntry } from '../../shared/types';

interface EditorProps {
  entry: JournalEntry;
  onSave: (content: string) => void;
}

export default function Editor({ entry, onSave }: EditorProps) {
  const [content, setContent] = useState(entry.content);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimeoutRef = useRef<number | null>(null);

  // Update content when entry changes
  useEffect(() => {
    setContent(entry.content);
    setSaveStatus('saved');
  }, [entry.path, entry.content]);

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
        <span className="save-status">{statusText[saveStatus]}</span>
      </header>
      <div className="editor-container">
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
