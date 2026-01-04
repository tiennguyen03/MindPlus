import React, { useState, useEffect, useRef, useMemo } from 'react';

interface IndexItem {
  id: string;
  type: 'entry' | 'ai';
  subtype?: 'daily' | 'weekly' | 'highlights' | 'loops' | 'questions';
  relativePath: string;
  displayTitle: string;
  date: string;
  updatedAt: string;
  wordCount?: number;
  excerpt?: string;
  searchableText?: string;
}

interface QuickSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: IndexItem) => void;
  index: IndexItem[];
}

export default function QuickSwitcher({ isOpen, onClose, onSelect, index }: QuickSwitcherProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter and rank results
  const results = useMemo(() => {
    if (!query.trim()) {
      // Show recent items when no query
      return index
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 20);
    }

    const lowerQuery = query.toLowerCase();
    const filtered = index.filter(item => {
      return (
        item.displayTitle.toLowerCase().includes(lowerQuery) ||
        item.date.includes(lowerQuery) ||
        item.searchableText?.toLowerCase().includes(lowerQuery) ||
        false
      );
    });

    // Rank by relevance
    return filtered
      .map(item => {
        let score = 0;
        const lowerTitle = item.displayTitle.toLowerCase();

        // Exact match
        if (lowerTitle === lowerQuery) score += 100;
        // Starts with query
        else if (lowerTitle.startsWith(lowerQuery)) score += 50;
        // Contains query in title
        else if (lowerTitle.includes(lowerQuery)) score += 20;
        // Contains in date
        else if (item.date.includes(lowerQuery)) score += 10;
        // Contains in searchable text
        else score += 1;

        // Boost recent items
        const daysSinceUpdate = (Date.now() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 7) score += 5;
        if (daysSinceUpdate < 1) score += 10;

        return { item, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(r => r.item);
  }, [query, index]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  const handleSelect = (item: IndexItem) => {
    onSelect(item);
    onClose();
  };

  const getTypeLabel = (item: IndexItem): string => {
    if (item.type === 'entry') return 'Entry';
    if (item.subtype === 'daily') return 'Daily Review';
    if (item.subtype === 'weekly') return 'Weekly Summary';
    if (item.subtype === 'highlights') return 'Highlights';
    if (item.subtype === 'loops') return 'Open Loops';
    if (item.subtype === 'questions') return 'Question';
    return 'AI Output';
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="quick-switcher-overlay" onClick={onClose}>
      <div className="quick-switcher" onClick={e => e.stopPropagation()}>
        <div className="quick-switcher-header">
          <input
            ref={inputRef}
            type="text"
            className="quick-switcher-input"
            placeholder="Search entries and AI outputs..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="quick-switcher-results" ref={listRef}>
          {results.length === 0 ? (
            <div className="quick-switcher-empty">
              {query ? 'No results found' : 'No entries yet'}
            </div>
          ) : (
            results.map((item, idx) => (
              <div
                key={item.id}
                className={`quick-switcher-item ${idx === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="quick-switcher-item-main">
                  <span className="quick-switcher-item-title">{item.displayTitle}</span>
                  <span className="quick-switcher-item-type">{getTypeLabel(item)}</span>
                </div>
                <div className="quick-switcher-item-meta">
                  <span className="quick-switcher-item-date">{formatDate(item.date)}</span>
                  {item.wordCount && (
                    <span className="quick-switcher-item-words">{item.wordCount} words</span>
                  )}
                </div>
                {item.excerpt && (
                  <div className="quick-switcher-item-excerpt">{item.excerpt}</div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="quick-switcher-footer">
          <span className="quick-switcher-hint">
            <kbd>↑↓</kbd> Navigate
            <kbd>↵</kbd> Select
            <kbd>Esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}
