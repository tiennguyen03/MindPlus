import type { JournalIndex, IndexItem } from '../indexing/indexTypes';

export interface RecurringTheme {
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

export interface RecurringLoop {
  loopText: string;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  relatedDates: string[];
}

export interface PatternDetectionResult {
  dateRange: {
    start: string;
    end: string;
  };
  recurringThemes: RecurringTheme[];
  recurringLoops: RecurringLoop[];
  generatedAt: string;
}

const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'was', 'were', 'been', 'has', 'had', 'are', 'is', 'am', 'can', 'could',
  'today', 'yesterday', 'tomorrow', 'day', 'week', 'month', 'year',
]);

/**
 * Detect recurring themes over the last N days
 * Analyzes theme frequency trends and extracts evidence quotes
 */
export function detectRecurringThemes(index: JournalIndex, days: number = 90): RecurringTheme[] {
  const entries = index.items.filter((item: IndexItem) => item.type === 'entry') as IndexItem[];

  // Filter entries to last N days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  const recentEntries = entries.filter(e => e.date >= cutoffStr);

  if (recentEntries.length === 0) {
    return [];
  }

  // Extract themes (keywords) from entries
  const themeToEntries = new Map<string, Array<{ date: string; relativePath: string; excerpt: string }>>();

  recentEntries.forEach(entry => {
    const text = `${entry.displayTitle} ${entry.excerpt || ''}`.toLowerCase();
    const words = text.split(/\s+/)
      .filter(w => w.length > 3 && !STOP_WORDS.has(w))
      .map(w => w.replace(/[^a-z0-9]/g, ''));

    words.forEach(word => {
      if (!themeToEntries.has(word)) {
        themeToEntries.set(word, []);
      }
      const entryList = themeToEntries.get(word)!;
      // Avoid duplicates
      if (!entryList.some(e => e.date === entry.date)) {
        entryList.push({
          date: entry.date,
          relativePath: entry.relativePath,
          excerpt: entry.excerpt || entry.displayTitle,
        });
      }
    });
  });

  // Only keep themes that appear in at least 3 entries
  const recurringThemes: RecurringTheme[] = [];

  themeToEntries.forEach((entryList, theme) => {
    if (entryList.length >= 3) {
      // Sort by date
      entryList.sort((a, b) => a.date.localeCompare(b.date));

      const firstSeen = entryList[0].date;
      const lastSeen = entryList[entryList.length - 1].date;

      // Calculate trend: compare first half vs second half occurrences
      const midpoint = Math.floor(entryList.length / 2);
      const firstHalf = entryList.slice(0, midpoint).length;
      const secondHalf = entryList.length - firstHalf;

      let trend: 'increasing' | 'decreasing' | 'stable';
      if (secondHalf > firstHalf * 1.3) {
        trend = 'increasing';
      } else if (secondHalf < firstHalf * 0.7) {
        trend = 'decreasing';
      } else {
        trend = 'stable';
      }

      // Extract quotes (first 100 chars of excerpt)
      const relatedEntries = entryList.slice(0, 5).map(e => ({
        date: e.date,
        relativePath: e.relativePath,
        quote: e.excerpt.length > 100 ? e.excerpt.slice(0, 100) + '...' : e.excerpt,
      }));

      recurringThemes.push({
        theme,
        occurrences: entryList.length,
        firstSeen,
        lastSeen,
        trend,
        relatedEntries,
      });
    }
  });

  // Sort by occurrences descending
  recurringThemes.sort((a, b) => b.occurrences - a.occurrences);

  // Return top 10
  return recurringThemes.slice(0, 10);
}

/**
 * Analyze open loops to find recurring patterns
 * Note: This is a placeholder - actual implementation would read open_loops.md
 */
export function analyzeOpenLoops(journalPath: string): RecurringLoop[] {
  // TODO: This would require file system access
  // For now, return empty array
  // Real implementation would:
  // 1. Read ai/loops/open_loops.md
  // 2. Parse loop items
  // 3. Group similar loops (fuzzy matching)
  // 4. Track first/last seen dates from entry references

  return [];
}

/**
 * Generate complete pattern detection report
 */
export function generatePatternReport(index: JournalIndex, days: number = 90): PatternDetectionResult {
  const entries = index.items.filter((item: IndexItem) => item.type === 'entry') as IndexItem[];

  // Calculate date range
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const startDate = cutoffDate.toISOString().split('T')[0];
  const endDate = new Date().toISOString().split('T')[0];

  const recurringThemes = detectRecurringThemes(index, days);
  const recurringLoops = analyzeOpenLoops(''); // Placeholder

  return {
    dateRange: {
      start: startDate,
      end: endDate,
    },
    recurringThemes,
    recurringLoops,
    generatedAt: new Date().toISOString(),
  };
}
