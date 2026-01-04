import { contextBridge, ipcRenderer } from 'electron';

// IPC channel names
const IPC = {
  SELECT_FOLDER: 'select-folder',
  GET_SETTINGS: 'get-settings',
  SAVE_SETTINGS: 'save-settings',
  READ_ENTRY: 'read-entry',
  SAVE_ENTRY: 'save-entry',
  GET_ENTRIES_TREE: 'get-entries-tree',
  SEARCH_ENTRIES: 'search-entries',
  CREATE_ENTRY: 'create-entry',
  RUN_AI: 'run-ai',
  SAVE_AI_OUTPUT: 'save-ai-output',
  BUILD_INDEX: 'build-index',
  READ_INDEX: 'read-index',
  UPDATE_INDEX_ITEM: 'update-index-item',
  REMOVE_INDEX_ITEM: 'remove-index-item',
} as const;

// Types for the API
export interface Settings {
  journalPath: string | null;
  aiEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface JournalEntry {
  path: string;
  date: string;
  content: string;
  modified: Date;
}

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
}

export interface AIOutput {
  type: string;
  title: string;
  content: string;
  confidence?: string;
  quotes?: string[];
}

export interface IndexItem {
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

export interface JournalIndex {
  version: number;
  lastBuilt: string;
  items: IndexItem[];
}

const api = {
  selectFolder: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC.SELECT_FOLDER),

  getSettings: (): Promise<Settings> =>
    ipcRenderer.invoke(IPC.GET_SETTINGS),

  saveSettings: (settings: Settings): Promise<void> =>
    ipcRenderer.invoke(IPC.SAVE_SETTINGS, settings),

  readEntry: (path: string): Promise<JournalEntry | null> =>
    ipcRenderer.invoke(IPC.READ_ENTRY, path),

  saveEntry: (path: string, content: string): Promise<void> =>
    ipcRenderer.invoke(IPC.SAVE_ENTRY, path, content),

  getEntriesTree: (): Promise<TreeNode | null> =>
    ipcRenderer.invoke(IPC.GET_ENTRIES_TREE),

  searchEntries: (query: string): Promise<JournalEntry[]> =>
    ipcRenderer.invoke(IPC.SEARCH_ENTRIES, query),

  createEntry: (date: string): Promise<string> =>
    ipcRenderer.invoke(IPC.CREATE_ENTRY, date),

  runAI: (action: string, date: string): Promise<AIOutput> =>
    ipcRenderer.invoke(IPC.RUN_AI, action, date),

  saveAIOutput: (type: string, date: string, content: string): Promise<void> =>
    ipcRenderer.invoke(IPC.SAVE_AI_OUTPUT, type, date, content),

  buildIndex: (): Promise<JournalIndex> =>
    ipcRenderer.invoke(IPC.BUILD_INDEX),

  readIndex: (): Promise<JournalIndex | null> =>
    ipcRenderer.invoke(IPC.READ_INDEX),

  updateIndexItem: (relativePath: string, type: 'entry' | 'ai', subtype?: 'daily' | 'weekly' | 'highlights' | 'loops' | 'questions'): Promise<void> =>
    ipcRenderer.invoke(IPC.UPDATE_INDEX_ITEM, relativePath, type, subtype),

  removeIndexItem: (relativePath: string): Promise<void> =>
    ipcRenderer.invoke(IPC.REMOVE_INDEX_ITEM, relativePath),
};

contextBridge.exposeInMainWorld('journal', api);

export type JournalAPI = typeof api;
