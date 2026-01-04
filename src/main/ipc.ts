import { ipcMain, dialog, app } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { IPC, Settings, DEFAULT_SETTINGS, TreeNode, JournalEntry } from '../shared/types';
import {
  initOpenAI,
  generateDailyReview,
  generateWeeklySummary,
  generateHighlights,
  generateOpenLoops,
  generateQuestion,
} from './ai';
import {
  buildIndex,
  readIndex,
  writeIndex,
  updateIndexItem,
  removeIndexItem,
} from '../services/indexing/indexBuilder';
import type { JournalIndex } from '../services/indexing/indexTypes';

let cachedSettings: Settings | null = null;

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

async function loadSettings(): Promise<Settings> {
  if (cachedSettings) return cachedSettings;

  try {
    const data = await fs.readFile(getSettingsPath(), 'utf-8');
    const loaded = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    cachedSettings = loaded;

    // Initialize OpenAI if key exists
    if (loaded.aiApiKey) {
      initOpenAI(loaded.aiApiKey);
    }

    return loaded;
  } catch {
    const defaults = { ...DEFAULT_SETTINGS };
    cachedSettings = defaults;
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

    switch (action) {
      case 'daily-review':
        if (!content) throw new Error('No entry found for this date');
        return await generateDailyReview(content);

      case 'weekly-summary': {
        const entries = await getRecentEntries(settings.journalPath, 7);
        if (entries.length === 0) throw new Error('No entries found for this week');
        return await generateWeeklySummary(entries);
      }

      case 'highlights':
        if (!content) throw new Error('No entry found for this date');
        return await generateHighlights(content);

      case 'open-loops': {
        const entries = await getRecentEntries(settings.journalPath, 14);
        if (entries.length === 0) throw new Error('No entries found');
        return await generateOpenLoops(entries);
      }

      case 'question': {
        const entries = await getRecentEntries(settings.journalPath, 3);
        if (entries.length === 0) throw new Error('No recent entries found');
        return await generateQuestion(entries);
      }

      default:
        throw new Error(`Unknown AI action: ${action}`);
    }
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
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
