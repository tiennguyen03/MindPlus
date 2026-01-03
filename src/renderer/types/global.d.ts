import type { Settings, TreeNode, JournalEntry } from '../../shared/types';

interface AIOutput {
  type: string;
  title: string;
  content: string;
  confidence?: string;
  quotes?: string[];
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
}

declare global {
  interface Window {
    journal: JournalAPI;
  }
}

export {};
