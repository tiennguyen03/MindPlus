export interface JournalEntry {
  path: string;
  date: string; // YYYY-MM-DD
  content: string;
  modified: Date;
}

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
}

export interface Settings {
  journalPath: string | null;
  aiEnabled: boolean;
  theme: 'light' | 'dark' | 'system'; // Legacy - keep for backward compatibility
  uiTheme: 'default' | 'soft-dark' | 'calm-light' | 'system';
  aiApiKey?: string;
  sidebarWidth: number;
  aiPanelWidth: number;
}

export const DEFAULT_SETTINGS: Settings = {
  journalPath: null,
  aiEnabled: false,
  theme: 'system',
  uiTheme: 'system',
  sidebarWidth: 300,
  aiPanelWidth: 420,
};

export interface AIOutput {
  type: string;
  title: string;
  content: string;
  confidence?: string;
  quotes?: string[];
}

// IPC channel names
export const IPC = {
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
} as const;
