import React, { useState, useEffect } from 'react';
import MonthlyStats from './MonthlyStats';
import ThemeFrequency from './ThemeFrequency';
import PatternDetection from './PatternDetection';

interface InsightsDashboardProps {
  onThemeClick?: (theme: string) => void;
  onEntryClick?: (relativePath: string) => void;
}

export default function InsightsDashboard({ onThemeClick, onEntryClick }: InsightsDashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'monthly' | 'patterns'>('monthly');

  useEffect(() => {
    loadInsights();
  }, [selectedMonth]);

  const loadInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await window.journal.getMonthlyInsights(selectedMonth);
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const generateMonthOptions = () => {
    const options: { value: string; label: string }[] = [];
    const today = new Date();

    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const value = `${year}-${month}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }

    return options;
  };

  const monthOptions = generateMonthOptions();

  if (loading) {
    return (
      <div className="insights-dashboard">
        <header className="insights-header">
          <h1>Insights</h1>
        </header>
        <div className="insights-loading">Loading insights...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="insights-dashboard">
        <header className="insights-header">
          <h1>Insights</h1>
        </header>
        <div className="insights-error">
          <p>{error}</p>
          <button onClick={loadInsights} className="btn-secondary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!insights || insights.stats.totalEntries === 0) {
    return (
      <div className="insights-dashboard">
        <header className="insights-header">
          <h1>Insights</h1>
          <select
            className="month-selector"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
          >
            {monthOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </header>
        <div className="insights-empty">
          <h2>No entries for {monthOptions.find(m => m.value === selectedMonth)?.label}</h2>
          <p>Start writing to see insights appear here.</p>
        </div>
      </div>
    );
  }

  const { stats, themes, topEntries } = insights;

  // Calculate completion rate
  const completionRate = Math.round((stats.daysActive / stats.daysInMonth) * 100);

  return (
    <div className="insights-dashboard">
      <header className="insights-header">
        <h1>Insights</h1>
        <div className="insights-tabs">
          <button
            className={`tab-btn ${activeTab === 'monthly' ? 'active' : ''}`}
            onClick={() => setActiveTab('monthly')}
          >
            Monthly Stats
          </button>
          <button
            className={`tab-btn ${activeTab === 'patterns' ? 'active' : ''}`}
            onClick={() => setActiveTab('patterns')}
          >
            Pattern Detection
          </button>
        </div>
        {activeTab === 'monthly' && (
          <select
            className="month-selector"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
          >
            {monthOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </header>

      <div className="insights-content">
        {activeTab === 'patterns' ? (
          <PatternDetection onEntryClick={onEntryClick} />
        ) : (
          <>
        {/* Stats Cards */}
        <div className="stats-grid">
          <MonthlyStats
            label="Entries Written"
            value={stats.totalEntries}
            sublabel={`${stats.daysActive} of ${stats.daysInMonth} days`}
            icon="📝"
          />
          <MonthlyStats
            label="Writing Streak"
            value={`${completionRate}%`}
            sublabel={`${stats.daysActive} active days`}
            icon="🔥"
          />
          <MonthlyStats
            label="Words Written"
            value={stats.totalWords.toLocaleString()}
            sublabel={`${stats.avgWordsPerEntry} avg per entry`}
            icon="✍️"
          />
          <MonthlyStats
            label="AI Insights"
            value={stats.aiCoverage.dailyReviews + stats.aiCoverage.weeklySummaries + stats.aiCoverage.monthlySummaries}
            sublabel={`${stats.aiCoverage.dailyReviews} daily, ${stats.aiCoverage.weeklySummaries} weekly`}
            icon="🤖"
          />
        </div>

        {/* Theme Frequency */}
        <div className="insights-section">
          <ThemeFrequency themes={themes} onThemeClick={onThemeClick} />
        </div>

        {/* Top Entries */}
        {topEntries.length > 0 && (
          <div className="insights-section">
            <h3 className="section-title">Longest Entries</h3>
            <div className="top-entries-list">
              {topEntries.map((entry: any, index: number) => (
                <div key={index} className="top-entry-item">
                  <span className="entry-date">{entry.date}</span>
                  <span className="entry-title">{entry.title}</span>
                  <span className="entry-words">{entry.wordCount} words</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Coverage Details */}
        {stats.aiCoverage.asks > 0 && (
          <div className="insights-section">
            <h3 className="section-title">AI Activity</h3>
            <div className="ai-coverage-details">
              <div className="coverage-item">
                <span className="coverage-label">Questions Asked</span>
                <span className="coverage-value">{stats.aiCoverage.asks}</span>
              </div>
              <div className="coverage-item">
                <span className="coverage-label">Highlights Generated</span>
                <span className="coverage-value">{stats.aiCoverage.highlights}</span>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
