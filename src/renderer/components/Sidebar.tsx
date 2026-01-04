import React, { useState, useMemo } from 'react';
import { TreeNode, JournalEntry } from '../../shared/types';
import { format, parse } from 'date-fns';
import EnhancedSearch from './EnhancedSearch';

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

interface SidebarProps {
  tree: TreeNode | null;
  searchQuery: string;
  searchResults: JournalEntry[];
  selectedPath: string | null;
  aiEnabled: boolean;
  index: IndexItem[];
  onSearch: (query: string) => void;
  onSelectEntry: (path: string) => void;
  onSelectIndexItem: (item: IndexItem) => void;
  onNewEntry: () => void;
  onSelectFolder: () => void;
  onToggleAI: () => void;
  onAIAction: (action: string) => void;
  onOpenSettings: () => void;
  hasApiKey: boolean;
}

interface EntryItem {
  path: string;
  date: Date;
  label: string;
}

interface MonthSection {
  key: string;
  label: string;
  entries: EntryItem[];
}

function flattenTree(node: TreeNode | null): EntryItem[] {
  if (!node) return [];

  const entries: EntryItem[] = [];

  function traverse(n: TreeNode) {
    if (n.type === 'file') {
      // Extract date from filename (YYYY-MM-DD.md)
      const filename = n.name.replace('.md', '');
      try {
        const date = parse(filename, 'yyyy-MM-dd', new Date());
        if (!isNaN(date.getTime())) {
          entries.push({
            path: n.path,
            date,
            label: format(date, 'EEEE, MMMM d'),
          });
        }
      } catch {
        // Skip invalid dates
      }
    }
    if (n.children) {
      n.children.forEach(traverse);
    }
  }

  traverse(node);

  // Sort by date descending (newest first)
  entries.sort((a, b) => b.date.getTime() - a.date.getTime());

  return entries;
}

function groupByMonth(entries: EntryItem[]): MonthSection[] {
  const groups = new Map<string, EntryItem[]>();

  entries.forEach(entry => {
    const key = format(entry.date, 'yyyy-MM');
    const existing = groups.get(key) || [];
    existing.push(entry);
    groups.set(key, existing);
  });

  return Array.from(groups.entries()).map(([key, items]) => ({
    key,
    label: format(items[0].date, 'MMMM yyyy'),
    entries: items,
  }));
}

export default function Sidebar({
  tree,
  searchQuery,
  searchResults,
  selectedPath,
  aiEnabled,
  index,
  onSearch,
  onSelectEntry,
  onSelectIndexItem,
  onNewEntry,
  onSelectFolder,
  onToggleAI,
  onAIAction,
  onOpenSettings,
  hasApiKey,
}: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showAIPanel, setShowAIPanel] = useState(false);

  const isSearching = searchQuery.trim().length > 0;

  const sections = useMemo(() => {
    const entries = flattenTree(tree);
    const grouped = groupByMonth(entries);

    // Auto-expand first section
    if (grouped.length > 0 && expandedSections.size === 0) {
      setExpandedSections(new Set([grouped[0].key]));
    }

    return grouped;
  }, [tree]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Journal</h1>
        <div className="sidebar-actions">
          <button className="primary" onClick={onNewEntry}>
            + New
          </button>
          <button onClick={onOpenSettings} title="Settings">
            ⚙
          </button>
        </div>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search entries..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="sections-container">
        {isSearching ? (
          <EnhancedSearch
            query={searchQuery}
            index={index}
            onSelectItem={onSelectIndexItem}
          />
        ) : sections.length > 0 ? (
          sections.map(section => (
            <div key={section.key} className="section">
              <div
                className="section-header"
                onClick={() => toggleSection(section.key)}
              >
                <span className="section-toggle">
                  {expandedSections.has(section.key) ? '▼' : '▶'}
                </span>
                <span className="section-title">{section.label}</span>
                <span className="section-count">{section.entries.length}</span>
              </div>
              {expandedSections.has(section.key) && (
                <div className="section-entries">
                  {section.entries.map(entry => (
                    <div
                      key={entry.path}
                      className={`entry-item ${entry.path === selectedPath ? 'selected' : ''}`}
                      onClick={() => onSelectEntry(entry.path)}
                    >
                      {entry.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="empty-message">No entries yet</div>
        )}
      </div>

      {/* AI Section */}
      <div className="ai-section">
        <div
          className="ai-header"
          onClick={() => setShowAIPanel(!showAIPanel)}
        >
          <span className="section-toggle">{showAIPanel ? '▼' : '▶'}</span>
          <span className="section-title">AI Tools</span>
          <label className="ai-toggle" onClick={e => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={aiEnabled}
              onChange={onToggleAI}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {showAIPanel && (
          <div className="ai-tools">
            {!aiEnabled ? (
              <div className="ai-disabled-message">
                Enable AI to use these tools
              </div>
            ) : !hasApiKey ? (
              <div className="ai-disabled-message">
                <p>API key required</p>
                <button className="ai-setup-btn" onClick={onOpenSettings}>
                  Add OpenAI Key
                </button>
              </div>
            ) : (
              <>
                <button
                  className="ai-tool-btn"
                  onClick={() => onAIAction('daily-review')}
                >
                  <span className="ai-icon">📅</span>
                  Daily Review
                </button>
                <button
                  className="ai-tool-btn"
                  onClick={() => onAIAction('weekly-summary')}
                >
                  <span className="ai-icon">📊</span>
                  Weekly Summary
                </button>
                <button
                  className="ai-tool-btn"
                  onClick={() => onAIAction('highlights')}
                >
                  <span className="ai-icon">✨</span>
                  Highlights
                </button>
                <button
                  className="ai-tool-btn"
                  onClick={() => onAIAction('open-loops')}
                >
                  <span className="ai-icon">🔄</span>
                  Open Loops
                </button>
                <button
                  className="ai-tool-btn"
                  onClick={() => onAIAction('question')}
                >
                  <span className="ai-icon">💭</span>
                  Question of the Day
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
