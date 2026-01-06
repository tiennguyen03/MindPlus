import type { Settings, TreeNode, JournalEntry } from '../../shared/types';

interface AIOutput {
  type: string;
  title: string;
  content: string;
  confidence?: string;
  quotes?: string[];
}

interface IndexItem {
  id: string;
  type: 'entry' | 'ai';
  subtype?: 'daily' | 'weekly' | 'highlights' | 'loops' | 'questions';
  relativePath: string;
  displayTitle: string;
  date: string;
  updatedAt: string;
  wordCount?: number;
  excerpt?: string;
  searchableText?: string;
}

interface JournalIndex {
  version: number;
  lastBuilt: string;
  items: IndexItem[];
}

interface JournalAPI {
  selectFolder: () => Promise<string | null>;
  getSettings: () => Promise<Settings>;
  saveSettings: (settings: Settings) => Promise<void>;
  readEntry: (path: string) => Promise<JournalEntry | null>;
  saveEntry: (path: string, content: string) => Promise<void>;
  getEntriesTree: () => Promise<TreeNode | null>;
  searchEntries: (query: string) => Promise<JournalEntry[]>;
  createEntry: (date: string) => Promise<string>;
  runAI: (action: string, date: string) => Promise<AIOutput>;
  saveAIOutput: (type: string, date: string, content: string) => Promise<void>;
  buildIndex: () => Promise<JournalIndex>;
  readIndex: () => Promise<JournalIndex | null>;
  updateIndexItem: (relativePath: string, type: 'entry' | 'ai', subtype?: 'daily' | 'weekly' | 'highlights' | 'loops' | 'questions') => Promise<void>;
  removeIndexItem: (relativePath: string) => Promise<void>;
  askQuestion: (question: string, startDate?: string, endDate?: string) => Promise<AIOutput>;
  generateMonthlySummary: (month: string) => Promise<AIOutput>;
  getMonthlyInsights: (month: string) => Promise<any>;
  getDataStats: () => Promise<any>;
  exportJournal: () => Promise<{ success: boolean; message: string } | null>;
  detectPatterns: (days?: number) => Promise<any>;
  // Security
  verifyPasscode: (passcode: string) => Promise<{ valid: boolean; error?: string }>;
  setPasscode: (passcode: string) => Promise<{ success: boolean }>;
  checkLockStatus: () => Promise<{ isLockEnabled: boolean; hasPasscode: boolean; autoLockTimeout: number }>;
  // Background Tasks
  getTasks: () => Promise<any[]>;
  startTask: (type: string, params?: any) => Promise<{ taskId: string }>;
  cancelTask: (taskId: string) => Promise<{ success: boolean }>;
}

declare global {
  interface Window {
    journal: JournalAPI;
    electron: {
      ipcRenderer: {
        on: (channel: string, func: (...args: any[]) => void) => void;
        removeListener: (channel: string, func: (...args: any[]) => void) => void;
      };
    };
  }
}

export {};
