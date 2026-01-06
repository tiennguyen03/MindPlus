import React from 'react';
import type { Settings } from '../../shared/types';

interface UsageStatsDisplayProps {
  settings: Settings;
}

export default function UsageStatsDisplay({ settings }: UsageStatsDisplayProps) {
  const { usageStats } = settings;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateDaysSinceFirstUse = (): number => {
    const firstUse = new Date(usageStats.firstUseDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - firstUse.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const stats = [
    {
      label: 'Days Active',
      value: usageStats.daysActive,
      description: `Out of ${calculateDaysSinceFirstUse()} days since first use`,
    },
    {
      label: 'Entries Written',
      value: usageStats.entriesWritten,
      description: 'Total journal entries created',
    },
    {
      label: 'AI Calls Used',
      value: usageStats.aiCallsUsed,
      description: 'AI insights and summaries generated',
    },
  ];

  return (
    <div className="usage-stats-display">
      <h3>Usage Statistics</h3>
      <p className="settings-description">
        Track your journaling journey with local usage metrics. All data stays on your device.
      </p>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-value">{stat.value.toLocaleString()}</div>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-description">{stat.description}</div>
          </div>
        ))}
      </div>

      <div className="stats-timeline">
        <div className="timeline-item">
          <span className="timeline-label">First Use</span>
          <span className="timeline-value">{formatDate(usageStats.firstUseDate)}</span>
        </div>
        <div className="timeline-item">
          <span className="timeline-label">Last Active</span>
          <span className="timeline-value">{formatDate(usageStats.lastActiveDate)}</span>
        </div>
      </div>

      <div className="ai-preferences-note">
        <p>
          <strong>Privacy:</strong> Usage stats are stored locally and never sent to external servers.
          They help you track your journaling habits.
        </p>
      </div>
    </div>
  );
}
