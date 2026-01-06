import React, { useState, useMemo } from 'react';

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
  sensitive?: boolean;
}

interface EnhancedSearchProps {
  query: string;
  index: IndexItem[];
  onSelectItem: (item: IndexItem) => void;
}

type FilterType = 'all' | 'entry' | 'ai';

export default function EnhancedSearch({ query, index, onSelectItem }: EnhancedSearchProps) {
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Filter and search results
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();

    // Apply type filter
    let filtered = index;
    if (filterType === 'entry') {
      filtered = index.filter(item => item.type === 'entry');
    } else if (filterType === 'ai') {
      filtered = index.filter(item => item.type === 'ai');
    }

    // Search within filtered items
    return filtered
      .filter(item => {
        return (
          item.displayTitle.toLowerCase().includes(lowerQuery) ||
          item.date.includes(lowerQuery) ||
          item.searchableText?.toLowerCase().includes(lowerQuery) ||
          false
        );
      })
      .map(item => {
        // Generate highlighted snippet
        const snippet = generateSnippet(item, lowerQuery);
        return { ...item, snippet };
      })
      .slice(0, 50); // Limit to 50 results
  }, [query, index, filterType]);

  // Generate snippet with highlighted matches
  const generateSnippet = (item: IndexItem, query: string): string => {
    // Hide snippet for sensitive entries
    if (item.sensitive) {
      return '[Sensitive content - unlock to view]';
    }

    const text = item.searchableText || item.excerpt || '';
    if (!text) return '';

    const lowerText = text.toLowerCase();
    const index = lowerText.indexOf(query);

    if (index === -1) {
      // Query not found in text, return excerpt
      return text.slice(0, 150);
    }

    // Extract context around the match
    const contextRadius = 60;
    const start = Math.max(0, index - contextRadius);
    const end = Math.min(text.length, index + query.length + contextRadius);

    let snippet = text.slice(start, end);

    // Add ellipsis if needed
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
  };

  // Highlight query in text
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return text;

    return (
      <>
        {text.slice(0, index)}
        <mark className="search-highlight">{text.slice(index, index + query.length)}</mark>
        {text.slice(index + query.length)}
      </>
    );
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!query.trim()) return null;

  return (
    <div className="enhanced-search">
      <div className="search-filters">
        <button
          className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
          onClick={() => setFilterType('all')}
        >
          All ({index.length})
        </button>
        <button
          className={`filter-btn ${filterType === 'entry' ? 'active' : ''}`}
          onClick={() => setFilterType('entry')}
        >
          Entries ({index.filter(i => i.type === 'entry').length})
        </button>
        <button
          className={`filter-btn ${filterType === 'ai' ? 'active' : ''}`}
          onClick={() => setFilterType('ai')}
        >
          AI Outputs ({index.filter(i => i.type === 'ai').length})
        </button>
      </div>

      <div className="search-results-header">
        {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
      </div>

      <div className="search-results-list">
        {results.length === 0 ? (
          <div className="search-no-results">
            No results found. Try a different search term or filter.
          </div>
        ) : (
          results.map(item => (
            <div
              key={item.id}
              className={`search-result-item ${item.sensitive ? 'is-sensitive' : ''}`}
              onClick={() => onSelectItem(item)}
            >
              <div className="search-result-header">
                <span className="search-result-title">
                  {item.sensitive && <span className="sensitive-indicator-icon">🔒 </span>}
                  {highlightText(item.displayTitle, query)}
                </span>
                <span className="search-result-type">{getTypeLabel(item)}</span>
              </div>
              <div className="search-result-meta">
                <span className="search-result-date">{formatDate(item.date)}</span>
                {item.wordCount && (
                  <span className="search-result-words">{item.wordCount} words</span>
                )}
              </div>
              {item.snippet && (
                <div className="search-result-snippet">
                  {item.sensitive ? item.snippet : highlightText(item.snippet, query)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
