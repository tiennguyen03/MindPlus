import type { JournalIndex, IndexItem } from '../indexing/indexTypes';
import type { MonthlyInsights, MonthlyStats, ThemeFrequency } from './insightTypes';

/**
 * Build monthly insights from index data only (no file reads)
 */
export function buildMonthlyInsights(month: string, index: JournalIndex): MonthlyInsights {
  // Filter entries for this month
  const monthEntries = index.items.filter(
    item => item.type === 'entry' && item.date.startsWith(month)
  );

  // Filter AI outputs for this month
  const aiOutputs = index.items.filter(
    item => item.type === 'ai' && item.date.startsWith(month)
  );

  // Calculate stats
  const stats = calculateMonthlyStats(month, monthEntries, aiOutputs);

  // Extract themes from entries
  const themes = extractThemes(monthEntries);

  // Find top entries by word count
  const topEntries = monthEntries
    .filter(e => e.wordCount && e.wordCount > 0)
    .sort((a, b) => (b.wordCount || 0) - (a.wordCount || 0))
    .slice(0, 5)
    .map(e => ({
      date: e.date,
      title: e.displayTitle,
      wordCount: e.wordCount || 0,
    }));

  return {
    month,
    stats,
    themes,
    topEntries,
  };
}

function calculateMonthlyStats(
  month: string,
  entries: IndexItem[],
  aiOutputs: IndexItem[]
): MonthlyStats {
  const totalEntries = entries.length;
  const totalWords = entries.reduce((sum, e) => sum + (e.wordCount || 0), 0);
  const avgWordsPerEntry = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;

  // Calculate days in month
  const [year, monthNum] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  // Count unique days with entries
  const uniqueDays = new Set(entries.map(e => e.date)).size;

  // Count AI outputs by type
  const aiCoverage = {
    dailyReviews: aiOutputs.filter(a => a.subtype === 'daily').length,
    weeklySummaries: aiOutputs.filter(a => a.subtype === 'weekly').length,
    monthlySummaries: aiOutputs.filter(a => a.relativePath.includes('monthly')).length,
    highlights: aiOutputs.filter(a => a.subtype === 'highlights').length,
    asks: aiOutputs.filter(a => a.relativePath.includes('/ask/')).length,
  };

  return {
    totalEntries,
    daysActive: uniqueDays,
    daysInMonth,
    totalWords,
    avgWordsPerEntry,
    aiCoverage,
  };
}

function extractThemes(entries: IndexItem[]): ThemeFrequency[] {
  // Simple keyword extraction from titles and excerpts
  const themeMap = new Map<string, { count: number; entries: string[] }>();

  for (const entry of entries) {
    const text = `${entry.displayTitle} ${entry.excerpt || ''}`.toLowerCase();
    const words = text.split(/\s+/).filter(w => w.length > 3);

    // Common words to ignore
    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'been',
      'were', 'they', 'what', 'about', 'which', 'when', 'where', 'there',
      'their', 'would', 'could', 'should', 'just', 'like', 'more', 'some',
      'into', 'than', 'time', 'very', 'after', 'before', 'today', 'entry',
      'journal', 'wrote', 'writing', 'think', 'thought', 'feeling', 'felt',
    ]);

    for (const word of words) {
      if (stopWords.has(word)) continue;

      const existing = themeMap.get(word);
      if (existing) {
        existing.count++;
        if (!existing.entries.includes(entry.date)) {
          existing.entries.push(entry.date);
        }
      } else {
        themeMap.set(word, { count: 1, entries: [entry.date] });
      }
    }
  }

  // Convert to array and filter to themes that appear in multiple entries
  const themes: ThemeFrequency[] = Array.from(themeMap.entries())
    .filter(([_, data]) => data.count >= 2) // Must appear at least twice
    .map(([theme, data]) => ({
      theme,
      count: data.count,
      percentage: entries.length > 0 ? Math.round((data.entries.length / entries.length) * 100) : 0,
      sampleEntries: data.entries.slice(0, 3), // Keep first 3 entries
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 themes

  return themes;
}

/**
 * Get insights for multiple months (for trend analysis)
 */
export function buildMultiMonthInsights(
  months: string[],
  index: JournalIndex
): Map<string, MonthlyInsights> {
  const insights = new Map<string, MonthlyInsights>();

  for (const month of months) {
    insights.set(month, buildMonthlyInsights(month, index));
  }

  return insights;
}

/**
 * Calculate theme trends by comparing two months
 */
export function calculateThemeTrends(
  currentMonth: MonthlyInsights,
  previousMonth: MonthlyInsights | null
): ThemeFrequency[] {
  if (!previousMonth) {
    return currentMonth.themes;
  }

  const prevThemeMap = new Map(
    previousMonth.themes.map(t => [t.theme, t.count])
  );

  return currentMonth.themes.map(theme => {
    const prevCount = prevThemeMap.get(theme.theme) || 0;
    let trend: 'up' | 'down' | 'flat' = 'flat';

    if (prevCount === 0) {
      trend = 'up'; // New theme
    } else if (theme.count > prevCount * 1.2) {
      trend = 'up';
    } else if (theme.count < prevCount * 0.8) {
      trend = 'down';
    }

    return { ...theme, trend };
  });
}
