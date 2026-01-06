// Type definitions for insights and analytics

export interface ThemeFrequency {
  theme: string;
  count: number;
  percentage: number;
  trend?: 'up' | 'down' | 'flat';
  sampleEntries: string[]; // Entry dates for this theme
}

export interface MonthlyStats {
  totalEntries: number;
  daysActive: number;
  daysInMonth: number;
  totalWords: number;
  avgWordsPerEntry: number;
  aiCoverage: {
    dailyReviews: number;
    weeklySummaries: number;
    monthlySummaries: number;
    highlights: number;
    asks: number;
  };
}

export interface MonthlyInsights {
  month: string; // YYYY-MM format
  stats: MonthlyStats;
  themes: ThemeFrequency[];
  topEntries: {
    date: string;
    title: string;
    wordCount: number;
  }[];
}

export interface PatternDetectionResult {
  recurringThemes: RecurringTheme[];
  recurringLoops: RecurringLoop[];
  analysisDate: string;
  daysAnalyzed: number;
}

export interface RecurringTheme {
  theme: string;
  count: number;
  trend: 'up' | 'down' | 'flat';
  firstSeen: string;
  lastSeen: string;
  quotes: {
    text: string;
    source: string;
    date: string;
  }[];
  relatedEntries: string[]; // Entry dates
}

export interface RecurringLoop {
  summary: string;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  relatedEntries: string[];
}

export interface DataStats {
  journalPath: string;
  totalFiles: number;
  totalSizeBytes: number;
  entryCount: number;
  aiOutputCount: number;
  oldestEntry: string | null;
  newestEntry: string | null;
}
