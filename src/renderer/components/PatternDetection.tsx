import React, { useState, useEffect } from 'react';

interface RecurringTheme {
  theme: string;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  relatedEntries: Array<{
    date: string;
    relativePath: string;
    quote: string;
  }>;
}

interface RecurringLoop {
  loopText: string;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  relatedDates: string[];
}

interface PatternDetectionResult {
  dateRange: {
    start: string;
    end: string;
  };
  recurringThemes: RecurringTheme[];
  recurringLoops: RecurringLoop[];
  generatedAt: string;
}

interface PatternDetectionProps {
  onEntryClick?: (relativePath: string) => void;
}

export default function PatternDetection({ onEntryClick }: PatternDetectionProps) {
  const [patterns, setPatterns] = useState<PatternDetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(90);
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPatterns();
  }, [days]);

  const loadPatterns = async () => {
    setLoading(true);
    try {
      const result = await window.journal.detectPatterns(days);
      setPatterns(result);
    } catch (error) {
      console.error('Failed to detect patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = (theme: string) => {
    setExpandedThemes(prev => {
      const next = new Set(prev);
      if (next.has(theme)) {
        next.delete(theme);
      } else {
        next.add(theme);
      }
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return '📈';
      case 'decreasing':
        return '📉';
      case 'stable':
        return '➡️';
    }
  };

  const getTrendLabel = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return 'Trending up';
      case 'decreasing':
        return 'Trending down';
      case 'stable':
        return 'Stable';
    }
  };

  if (loading) {
    return (
      <div className="pattern-detection">
        <div className="pattern-header">
          <h2>Pattern Detection</h2>
        </div>
        <div className="pattern-loading">Analyzing patterns...</div>
      </div>
    );
  }

  if (!patterns) {
    return (
      <div className="pattern-detection">
        <div className="pattern-header">
          <h2>Pattern Detection</h2>
        </div>
        <div className="pattern-empty">No patterns detected yet.</div>
      </div>
    );
  }

  return (
    <div className="pattern-detection">
      <div className="pattern-header">
        <h2>Pattern Detection</h2>
        <div className="pattern-controls">
          <label>
            Time range:
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 6 months</option>
              <option value={365}>Last year</option>
            </select>
          </label>
        </div>
      </div>

      <div className="pattern-meta">
        Analyzing entries from {formatDate(patterns.dateRange.start)} to {formatDate(patterns.dateRange.end)}
      </div>

      {/* Recurring Themes */}
      <section className="pattern-section">
        <h3>Recurring Themes</h3>
        <p className="pattern-description">
          Themes that appear frequently in your journal entries. Click to see evidence.
        </p>

        {patterns.recurringThemes.length === 0 ? (
          <div className="pattern-empty-section">
            No recurring themes detected. Try increasing the time range or write more entries.
          </div>
        ) : (
          <div className="theme-list">
            {patterns.recurringThemes.map((theme) => (
              <div key={theme.theme} className="theme-card">
                <div
                  className="theme-card-header"
                  onClick={() => toggleTheme(theme.theme)}
                >
                  <div className="theme-card-title">
                    <span className="theme-toggle">
                      {expandedThemes.has(theme.theme) ? '▼' : '▶'}
                    </span>
                    <span className="theme-name">{theme.theme}</span>
                    <span className="theme-badge">{theme.occurrences} times</span>
                  </div>
                  <div className="theme-card-meta">
                    <span className="theme-trend">
                      {getTrendIcon(theme.trend)} {getTrendLabel(theme.trend)}
                    </span>
                    <span className="theme-dates">
                      {formatDate(theme.firstSeen)} - {formatDate(theme.lastSeen)}
                    </span>
                  </div>
                </div>

                {expandedThemes.has(theme.theme) && (
                  <div className="theme-card-content">
                    <h4>Evidence:</h4>
                    <div className="theme-evidence">
                      {theme.relatedEntries.map((entry, idx) => (
                        <div
                          key={idx}
                          className="evidence-item"
                          onClick={() => onEntryClick && onEntryClick(entry.relativePath)}
                        >
                          <div className="evidence-date">{formatDate(entry.date)}</div>
                          <div className="evidence-quote">"{entry.quote}"</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recurring Loops - Placeholder */}
      <section className="pattern-section">
        <h3>Recurring Open Loops</h3>
        <p className="pattern-description">
          Tasks or thoughts that keep coming up without resolution.
        </p>
        <div className="pattern-empty-section">
          Loop analysis requires AI-generated open loops. Use the "Open Loops" AI tool first.
        </div>
      </section>
    </div>
  );
}
