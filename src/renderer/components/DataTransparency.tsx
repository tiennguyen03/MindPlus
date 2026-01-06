import React, { useState, useEffect } from 'react';

interface DataStats {
  journalPath: string;
  totalFiles: number;
  totalSizeBytes: number;
  entryCount: number;
  aiOutputCount: number;
  oldestEntry: string | null;
  newestEntry: string | null;
}

export default function DataTransparency() {
  const [stats, setStats] = useState<DataStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await window.journal.getDataStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load data stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShowInFinder = () => {
    if (stats?.journalPath) {
      // Open the journal folder in Finder/Explorer
      // This would require an IPC call - for now, just copy the path
      navigator.clipboard.writeText(stats.journalPath);
      alert(`Path copied to clipboard:\n${stats.journalPath}\n\nYou can paste this in Finder/Explorer to open the folder.`);
    }
  };

  const handleExport = async () => {
    try {
      const result = await window.journal.exportJournal();
      if (result) {
        if (result.success) {
          alert('Journal exported successfully!');
        } else {
          alert(result.message);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="data-transparency">
        <h3>Data & Privacy</h3>
        <p className="loading-text">Loading data statistics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="data-transparency">
        <h3>Data & Privacy</h3>
        <p className="error-text">Failed to load data statistics.</p>
      </div>
    );
  }

  return (
    <div className="data-transparency">
      <h3>Data & Privacy</h3>
      <p className="data-intro">
        Your journal is stored locally on your computer. You have complete control over your data.
      </p>

      <div className="data-location">
        <div className="data-row">
          <span className="data-label">Journal Location:</span>
          <code className="data-path">{stats.journalPath}</code>
        </div>
        <button className="btn-secondary btn-small" onClick={handleShowInFinder}>
          📂 Show in Finder
        </button>
      </div>

      <div className="data-stats-grid">
        <div className="data-stat">
          <div className="data-stat-value">{stats.totalFiles}</div>
          <div className="data-stat-label">Total Files</div>
        </div>
        <div className="data-stat">
          <div className="data-stat-value">{formatSize(stats.totalSizeBytes)}</div>
          <div className="data-stat-label">Total Size</div>
        </div>
        <div className="data-stat">
          <div className="data-stat-value">{stats.entryCount}</div>
          <div className="data-stat-label">Journal Entries</div>
        </div>
        <div className="data-stat">
          <div className="data-stat-value">{stats.aiOutputCount}</div>
          <div className="data-stat-label">AI Outputs</div>
        </div>
      </div>

      <div className="data-timeline">
        <div className="timeline-item">
          <span className="timeline-label">First Entry:</span>
          <span className="timeline-value">{formatDate(stats.oldestEntry)}</span>
        </div>
        <div className="timeline-item">
          <span className="timeline-label">Latest Entry:</span>
          <span className="timeline-value">{formatDate(stats.newestEntry)}</span>
        </div>
      </div>

      <div className="data-privacy">
        <h4>Privacy Guarantee</h4>
        <ul className="privacy-list">
          <li>✅ All data is stored locally on your device</li>
          <li>✅ No cloud sync or remote storage</li>
          <li>✅ AI processing uses your API key directly</li>
          <li>✅ You can access, copy, or delete files anytime</li>
          <li>✅ No telemetry or tracking</li>
        </ul>
      </div>

      <div className="data-actions">
        <button className="btn-secondary" onClick={handleExport}>
          📦 Export Journal
        </button>
        <p className="data-actions-note">
          Export creates a ZIP archive of your entire journal for backup or migration.
        </p>
      </div>
    </div>
  );
}
