import { ipcMain, dialog, app } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { IPC, Settings, DEFAULT_SETTINGS, TreeNode, JournalEntry } from '../shared/types';
import {
  initOpenAI,
  updateAIPreferences,
  generateDailyReview,
  generateWeeklySummary,
  generateHighlights,
  generateOpenLoops,
  generateQuestion,
  askYourJournal,
  generateMonthlySummary,
} from './ai';
import {
  buildIndex,
  readIndex,
  writeIndex,
  updateIndexItem,
  removeIndexItem,
} from '../services/indexing/indexBuilder';
import type { JournalIndex } from '../services/indexing/indexTypes';
import { buildMonthlyInsights, calculateThemeTrends } from '../services/insights/insightBuilder';
import type { DataStats } from '../services/insights/insightTypes';
import { generatePatternReport } from '../services/insights/patternDetection';
import { hashPasscode, verifyPasscode } from '../services/security/encryptionUtils';
import type { HashedPasscode } from '../shared/types';
import { trackEntryWritten, trackAICall, trackDayActive } from './usage-tracker';

let cachedSettings: Settings | null = null;

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

export async function loadSettings(): Promise<Settings> {
  if (cachedSettings) return cachedSettings;

  try {
    const data = await fs.readFile(getSettingsPath(), 'utf-8');
    const loaded = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    cachedSettings = loaded;

    // Initialize OpenAI if key exists
    if (loaded.aiApiKey) {
      initOpenAI(loaded.aiApiKey);
    }

    // Update AI preferences
    updateAIPreferences(loaded.aiPreferences);

    return loaded;
  } catch {
    const defaults = { ...DEFAULT_SETTINGS };
    cachedSettings = defaults;

    // Update AI preferences with defaults
    updateAIPreferences(defaults.aiPreferences);

    return defaults;
  }
}

async function saveSettings(settings: Settings): Promise<void> {
  cachedSettings = settings;
  await fs.writeFile(getSettingsPath(), JSON.stringify(settings, null, 2));

  // Re-initialize OpenAI with new key
  if (settings.aiApiKey) {
    initOpenAI(settings.aiApiKey);
  }

  // Update AI preferences
  updateAIPreferences(settings.aiPreferences);
}

async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch {
    // Directory likely exists
  }
}

async function buildTree(dirPath: string, relativePath: string = ''): Promise<TreeNode | null> {
  try {
    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) return null;

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const children: TreeNode[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relPath = path.join(relativePath, entry.name);

      if (entry.isDirectory()) {
        const subtree = await buildTree(fullPath, relPath);
        if (subtree) {
          children.push(subtree);
        }
      } else if (entry.name.endsWith('.md')) {
        children.push({
          name: entry.name,
          path: relPath,
          type: 'file',
        });
      }
    }

    children.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return {
      name: path.basename(dirPath),
      path: relativePath,
      type: 'folder',
      children,
    };
  } catch {
    return null;
  }
}

async function searchInFile(filePath: string, query: string): Promise<JournalEntry | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();

    if (lowerContent.includes(lowerQuery)) {
      const stats = await fs.stat(filePath);
      const filename = path.basename(filePath, '.md');
      return {
        path: filePath,
        date: filename,
        content,
        modified: stats.mtime,
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function searchDirectory(dirPath: string, query: string): Promise<JournalEntry[]> {
  const results: JournalEntry[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const subResults = await searchDirectory(fullPath, query);
        results.push(...subResults);
      } else if (entry.name.endsWith('.md')) {
        const match = await searchInFile(fullPath, query);
        if (match) results.push(match);
      }
    }
  } catch {
    // Silently handle errors
  }

  return results;
}

async function readEntryByDate(journalPath: string, date: string): Promise<string | null> {
  const [year, month] = date.split('-');
  const entryPath = path.join(journalPath, 'entries', year, month, `${date}.md`);

  try {
    return await fs.readFile(entryPath, 'utf-8');
  } catch {
    return null;
  }
}

async function getRecentEntries(journalPath: string, days: number): Promise<{ date: string; content: string }[]> {
  const entries: { date: string; content: string }[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const content = await readEntryByDate(journalPath, dateStr);
    if (content) {
      entries.push({ date: dateStr, content });
    }
  }

  return entries;
}

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.SELECT_FOLDER, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Journal Folder',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const selectedPath = result.filePaths[0];

    await ensureDir(path.join(selectedPath, 'entries'));
    await ensureDir(path.join(selectedPath, 'ai', 'daily'));
    await ensureDir(path.join(selectedPath, 'ai', 'weekly'));
    await ensureDir(path.join(selectedPath, 'ai', 'highlights'));
    await ensureDir(path.join(selectedPath, 'ai', 'loops'));
    await ensureDir(path.join(selectedPath, 'ai', 'questions'));
    await ensureDir(path.join(selectedPath, 'ai', 'ask'));
    await ensureDir(path.join(selectedPath, 'ai', 'monthly'));

    return selectedPath;
  });

  ipcMain.handle(IPC.GET_SETTINGS, async () => {
    return await loadSettings();
  });

  ipcMain.handle(IPC.SAVE_SETTINGS, async (_, settings: Settings) => {
    await saveSettings(settings);
  });

  ipcMain.handle(IPC.READ_ENTRY, async (_, entryPath: string) => {
    const settings = await loadSettings();
    if (!settings.journalPath) return null;

    const fullPath = path.join(settings.journalPath, 'entries', entryPath);

    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const stats = await fs.stat(fullPath);
      const filename = path.basename(fullPath, '.md');

      return {
        path: entryPath,
        date: filename,
        content,
        modified: stats.mtime,
      } as JournalEntry;
    } catch {
      return null;
    }
  });

  ipcMain.handle(IPC.SAVE_ENTRY, async (_, entryPath: string, content: string) => {
    const settings = await loadSettings();
    if (!settings.journalPath) throw new Error('No journal folder selected');

    const fullPath = path.join(settings.journalPath, 'entries', entryPath);
    await ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content, 'utf-8');

    // Track usage stats
    await trackEntryWritten();
    await trackDayActive();
  });

  ipcMain.handle(IPC.GET_ENTRIES_TREE, async () => {
    const settings = await loadSettings();
    if (!settings.journalPath) return null;

    const entriesPath = path.join(settings.journalPath, 'entries');
    return await buildTree(entriesPath);
  });

  ipcMain.handle(IPC.SEARCH_ENTRIES, async (_, query: string) => {
    const settings = await loadSettings();
    if (!settings.journalPath || !query.trim()) return [];

    const entriesPath = path.join(settings.journalPath, 'entries');
    return await searchDirectory(entriesPath, query);
  });

  ipcMain.handle(IPC.CREATE_ENTRY, async (_, date: string) => {
    const settings = await loadSettings();
    if (!settings.journalPath) throw new Error('No journal folder selected');

    const [year, month] = date.split('-');
    const entryPath = path.join(year, month, `${date}.md`);
    const fullPath = path.join(settings.journalPath, 'entries', entryPath);

    await ensureDir(path.dirname(fullPath));

    try {
      await fs.access(fullPath);
    } catch {
      const header = `# ${date}\n\n`;
      await fs.writeFile(fullPath, header, 'utf-8');
    }

    return entryPath;
  });

  ipcMain.handle(IPC.RUN_AI, async (_, action: string, date: string) => {
    const settings = await loadSettings();
    if (!settings.journalPath) throw new Error('No journal folder selected');
    if (!settings.aiApiKey) throw new Error('OpenAI API key not configured. Click the ⚙ button to add your API key.');

    const content = await readEntryByDate(settings.journalPath, date);

    let result;
    switch (action) {
      case 'daily-review':
        if (!content) throw new Error('No entry found for this date');
        result = await generateDailyReview(content);
        break;

      case 'weekly-summary': {
        const entries = await getRecentEntries(settings.journalPath, 7);
        if (entries.length === 0) throw new Error('No entries found for this week');
        result = await generateWeeklySummary(entries);
        break;
      }

      case 'highlights':
        if (!content) throw new Error('No entry found for this date');
        result = await generateHighlights(content);
        break;

      case 'open-loops': {
        const entries = await getRecentEntries(settings.journalPath, 14);
        if (entries.length === 0) throw new Error('No entries found');
        result = await generateOpenLoops(entries);
        break;
      }

      case 'question': {
        const entries = await getRecentEntries(settings.journalPath, 3);
        if (entries.length === 0) throw new Error('No recent entries found');
        result = await generateQuestion(entries);
        break;
      }

      default:
        throw new Error(`Unknown AI action: ${action}`);
    }

    // Track AI usage
    await trackAICall();

    return result;
  });

  ipcMain.handle(IPC.SAVE_AI_OUTPUT, async (_, type: string, date: string, content: string) => {
    const settings = await loadSettings();
    if (!settings.journalPath) throw new Error('No journal folder selected');

    let filePath: string;
    const [year] = date.split('-');

    switch (type) {
      case 'daily-review':
        filePath = path.join(settings.journalPath, 'ai', 'daily', `${date}.review.md`);
        break;
      case 'weekly-summary': {
        const weekNum = getWeekNumber(new Date(date));
        filePath = path.join(settings.journalPath, 'ai', 'weekly', `${year}-W${weekNum.toString().padStart(2, '0')}.summary.md`);
        break;
      }
      case 'highlights':
        filePath = path.join(settings.journalPath, 'ai', 'highlights', `${date}.highlights.md`);
        break;
      case 'open-loops':
        filePath = path.join(settings.journalPath, 'ai', 'loops', 'open_loops.md');
        break;
      case 'question':
        filePath = path.join(settings.journalPath, 'ai', 'questions', `${date}.question.md`);
        break;
      case 'ask': {
        // Format: YYYY-MM-DD_HHMM.ask.md
        const timestamp = new Date().toISOString().slice(11, 16).replace(':', '');
        filePath = path.join(settings.journalPath, 'ai', 'ask', `${date}_${timestamp}.ask.md`);
        break;
      }
      case 'monthly':
        // date format for monthly is YYYY-MM
        filePath = path.join(settings.journalPath, 'ai', 'monthly', `${date}.summary.md`);
        break;
      default:
        throw new Error(`Unknown AI output type: ${type}`);
    }

    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
  });

  // Index management handlers
  ipcMain.handle(IPC.BUILD_INDEX, async () => {
    const settings = await loadSettings();
    if (!settings.journalPath) throw new Error('No journal folder selected');

    const index = await buildIndex(settings.journalPath);
    await writeIndex(settings.journalPath, index);
    return index;
  });

  ipcMain.handle(IPC.READ_INDEX, async () => {
    const settings = await loadSettings();
    if (!settings.journalPath) return null;

    return await readIndex(settings.journalPath);
  });

  ipcMain.handle(IPC.UPDATE_INDEX_ITEM, async (_, relativePath: string, type: 'entry' | 'ai', subtype?: 'daily' | 'weekly' | 'highlights' | 'loops' | 'questions') => {
    const settings = await loadSettings();
    if (!settings.journalPath) throw new Error('No journal folder selected');

    await updateIndexItem(settings.journalPath, relativePath, type, subtype);
  });

  ipcMain.handle(IPC.REMOVE_INDEX_ITEM, async (_, relativePath: string) => {
    const settings = await loadSettings();
    if (!settings.journalPath) throw new Error('No journal folder selected');

    await removeIndexItem(settings.journalPath, relativePath);
  });

  // Ask-Your-Journal handler with retrieval logic
  ipcMain.handle(IPC.ASK_QUESTION, async (_, question: string, startDate?: string, endDate?: string) => {
    const settings = await loadSettings();
    if (!settings.journalPath) throw new Error('No journal folder selected');
    if (!settings.aiApiKey) throw new Error('OpenAI API key not configured. Click the ⚙ button to add your API key.');

    // Load index for fast retrieval
    const index = await readIndex(settings.journalPath);
    if (!index || index.items.length === 0) {
      throw new Error('No entries found. Create some journal entries first.');
    }

    // Filter by date range if provided
    let filteredItems = index.items.filter(item => item.type === 'entry');

    if (startDate && endDate) {
      filteredItems = filteredItems.filter(item =>
        item.date >= startDate && item.date <= endDate
      );
    }

    if (filteredItems.length === 0) {
      throw new Error('No entries found in the selected date range.');
    }

    // Score and rank entries by relevance
    const lowerQuery = question.toLowerCase();
    const queryTerms = lowerQuery.split(/\s+/).filter(term => term.length > 2);

    const scoredEntries = filteredItems.map(item => {
      let score = 0;
      const searchText = item.searchableText?.toLowerCase() || '';
      const title = item.displayTitle.toLowerCase();

      // Keyword scoring
      for (const term of queryTerms) {
        // Title matches worth more
        if (title.includes(term)) score += 10;
        // Count occurrences in searchable text
        const matches = (searchText.match(new RegExp(term, 'g')) || []).length;
        score += matches * 2;
      }

      // Recency boost - more recent entries get higher scores
      const daysSinceUpdate = (Date.now() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 7) score += 3;
      if (daysSinceUpdate < 30) score += 1;

      return { item, score };
    });

    // Sort by score and take top 8 entries
    const topEntries = scoredEntries
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .filter(e => e.score > 0); // Only include entries with at least some relevance

    if (topEntries.length === 0) {
      throw new Error('No relevant entries found for your question. Try rephrasing or broadening your search.');
    }

    // Load full content for top entries
    const entriesWithContent = await Promise.all(
      topEntries.map(async ({ item }) => {
        const fullPath = path.join(settings.journalPath!, 'entries', item.relativePath);
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          return {
            date: item.date,
            content,
            path: item.relativePath,
          };
        } catch {
          return null;
        }
      })
    );

    const validEntries = entriesWithContent.filter((e): e is { date: string; content: string; path: string } => e !== null);

    // Call AI with retrieved entries
    const result = await askYourJournal(question, validEntries);

    // Track AI usage
    await trackAICall();

    return result;
  });

  // Monthly Summary handler
  ipcMain.handle(IPC.GENERATE_MONTHLY_SUMMARY, async (_, month: string) => {
    const settings = await loadSettings();
    if (!settings.journalPath) throw new Error('No journal folder selected');
    if (!settings.aiApiKey) throw new Error('OpenAI API key not configured. Click the ⚙ button to add your API key.');

    // Load index to find entries for this month
    const index = await readIndex(settings.journalPath);
    if (!index || index.items.length === 0) {
      throw new Error('No entries found.');
    }

    // Filter entries for the specified month
    const monthEntries = index.items.filter(item =>
      item.type === 'entry' && item.date.startsWith(month)
    );

    if (monthEntries.length === 0) {
      return await generateMonthlySummary([], month);
    }

    // Load full content for entries (limit to 25 most significant)
    // Strategy: Take most recent 15, plus 10 with highest word counts
    const sortedByDate = [...monthEntries].sort((a, b) => b.date.localeCompare(a.date));
    const recentEntries = sortedByDate.slice(0, 15);

    const sortedByWordCount = [...monthEntries]
      .sort((a, b) => (b.wordCount || 0) - (a.wordCount || 0))
      .filter(item => !recentEntries.find(e => e.id === item.id))
      .slice(0, 10);

    const selectedEntries = [...recentEntries, ...sortedByWordCount];

    // Load content
    const entriesWithContent = await Promise.all(
      selectedEntries.map(async (item) => {
        const fullPath = path.join(settings.journalPath!, 'entries', item.relativePath);
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          return {
            date: item.date,
            content,
            path: item.relativePath,
          };
        } catch {
          return null;
        }
      })
    );

    const validEntries = entriesWithContent.filter((e): e is { date: string; content: string; path: string } => e !== null);

    const result = await generateMonthlySummary(validEntries, month);

    // Track AI usage
    await trackAICall();

    return result;
  });

  // Get monthly insights
  ipcMain.handle(IPC.GET_MONTHLY_INSIGHTS, async (_, month: string) => {
    const settings = await loadSettings();
    if (!settings.journalPath) throw new Error('No journal folder selected');

    const index = await readIndex(settings.journalPath);
    if (!index) {
      throw new Error('Index not available. Please rebuild index.');
    }

    // Build insights for current month
    const insights = buildMonthlyInsights(month, index);

    // Calculate previous month for trend analysis
    const [year, monthNum] = month.split('-').map(Number);
    const prevDate = new Date(year, monthNum - 2, 1); // -2 because month is 1-indexed
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    const prevInsights = buildMonthlyInsights(prevMonth, index);

    // Add trends to themes
    const themesWithTrends = calculateThemeTrends(insights, prevInsights.stats.totalEntries > 0 ? prevInsights : null);

    return {
      ...insights,
      themes: themesWithTrends,
    };
  });

  // Get data statistics
  ipcMain.handle(IPC.GET_DATA_STATS, async () => {
    const settings = await loadSettings();
    if (!settings.journalPath) throw new Error('No journal folder selected');

    const index = await readIndex(settings.journalPath);

    // Calculate total size
    let totalSize = 0;
    const calculateDirSize = async (dirPath: string): Promise<number> => {
      let size = 0;
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          if (entry.isDirectory()) {
            size += await calculateDirSize(fullPath);
          } else {
            const stats = await fs.stat(fullPath);
            size += stats.size;
          }
        }
      } catch {
        // Ignore errors
      }
      return size;
    };

    totalSize = await calculateDirSize(settings.journalPath);

    const entryCount = index?.items.filter(i => i.type === 'entry').length || 0;
    const aiOutputCount = index?.items.filter(i => i.type === 'ai').length || 0;

    // Find oldest and newest entries
    const entries = index?.items.filter(i => i.type === 'entry').sort((a, b) => a.date.localeCompare(b.date)) || [];
    const oldestEntry = entries.length > 0 ? entries[0].date : null;
    const newestEntry = entries.length > 0 ? entries[entries.length - 1].date : null;

    const stats: DataStats = {
      journalPath: settings.journalPath,
      totalFiles: (index?.items.length || 0),
      totalSizeBytes: totalSize,
      entryCount,
      aiOutputCount,
      oldestEntry,
      newestEntry,
    };

    return stats;
  });

  // Export journal
  ipcMain.handle(IPC.EXPORT_JOURNAL, async () => {
    const settings = await loadSettings();
    if (!settings.journalPath) throw new Error('No journal folder selected');

    // Show save dialog
    const result = await dialog.showSaveDialog({
      title: 'Export Journal',
      defaultPath: `journal-export-${new Date().toISOString().split('T')[0]}.zip`,
      filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    // TODO: Implement zip creation (requires archiver package)
    // For now, return a placeholder message
    return {
      success: false,
      message: 'Export feature requires additional setup. Use "Show in Finder" to access your journal folder directly.',
    };
  });

  // Detect patterns (recurring themes and loops)
  ipcMain.handle(IPC.DETECT_PATTERNS, async (_, days: number = 90) => {
    const settings = await loadSettings();
    if (!settings.journalPath) throw new Error('No journal folder selected');

    const index = await readIndex(settings.journalPath);
    if (!index) {
      throw new Error('Index not available. Please rebuild index.');
    }

    return generatePatternReport(index, days);
  });

  // Security - Set Passcode
  ipcMain.handle(IPC.SET_PASSCODE, async (_, passcode: string) => {
    const settings = await loadSettings();
    const hashed = await hashPasscode(passcode);

    const newSettings = {
      ...settings,
      appLockPasscode: hashed,
    };

    await saveSettings(newSettings);
    return { success: true };
  });

  // Security - Verify Passcode
  ipcMain.handle(IPC.VERIFY_PASSCODE, async (_, passcode: string) => {
    const settings = await loadSettings();

    if (!settings.appLockPasscode) {
      return { valid: false, error: 'No passcode set' };
    }

    try {
      const isValid = await verifyPasscode(passcode, settings.appLockPasscode);
      return { valid: isValid };
    } catch (error) {
      console.error('Passcode verification error:', error);
      return { valid: false, error: 'Verification failed' };
    }
  });

  // Security - Check Lock Status
  ipcMain.handle(IPC.CHECK_LOCK_STATUS, async () => {
    const settings = await loadSettings();
    return {
      isLockEnabled: settings.appLockEnabled,
      hasPasscode: !!settings.appLockPasscode,
      autoLockTimeout: settings.autoLockTimeout,
    };
  });
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
