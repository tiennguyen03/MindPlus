import React from 'react';

interface Theme {
  theme: string;
  count: number;
  percentage: number;
  trend?: 'up' | 'down' | 'flat';
  sampleEntries: string[];
}

interface ThemeFrequencyProps {
  themes: Theme[];
  onThemeClick?: (theme: string) => void;
}

export default function ThemeFrequency({ themes, onThemeClick }: ThemeFrequencyProps) {
  if (themes.length === 0) {
    return (
      <div className="theme-frequency-empty">
        <p>Not enough data to identify themes yet.</p>
        <p className="theme-frequency-hint">Themes will appear after you've written several entries.</p>
      </div>
    );
  }

  const maxCount = Math.max(...themes.map(t => t.count));

  return (
    <div className="theme-frequency">
      <h3 className="theme-frequency-title">Top Themes</h3>
      <div className="theme-list">
        {themes.map((theme, index) => {
          const barWidth = (theme.count / maxCount) * 100;
          const trendSymbol = theme.trend === 'up' ? '↑' : theme.trend === 'down' ? '↓' : '';
          const trendClass = theme.trend === 'up' ? 'trend-up' : theme.trend === 'down' ? 'trend-down' : '';

          return (
            <div
              key={index}
              className={`theme-item ${onThemeClick ? 'theme-item-clickable' : ''}`}
              onClick={() => onThemeClick && onThemeClick(theme.theme)}
              title={`Appears in ${theme.sampleEntries.length} entries (${theme.count} mentions)`}
            >
              <div className="theme-header">
                <span className="theme-name">{theme.theme}</span>
                <span className="theme-count">
                  {theme.count} {theme.count === 1 ? 'mention' : 'mentions'}
                  {theme.trend && <span className={`theme-trend ${trendClass}`}> {trendSymbol}</span>}
                </span>
              </div>
              <div className="theme-bar-container">
                <div className="theme-bar" style={{ width: `${barWidth}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
