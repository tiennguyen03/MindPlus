import React from 'react';

interface MonthlyStatsProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'flat';
}

export default function MonthlyStats({ label, value, sublabel, icon, trend }: MonthlyStatsProps) {
  const trendSymbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendClass = trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : 'trend-flat';

  return (
    <div className="stat-card">
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">
          {value}
          {trend && <span className={`stat-trend ${trendClass}`}>{trendSymbol}</span>}
        </div>
        {sublabel && <div className="stat-sublabel">{sublabel}</div>}
      </div>
    </div>
  );
}
