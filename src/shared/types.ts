export interface JournalEntry {
  path: string;
  date: string; // YYYY-MM-DD
  content: string;
  modified: Date;
  sensitive?: boolean; // Mark entry as sensitive
}

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
}

export interface HashedPasscode {
  hash: string;
  salt: string;
}

export interface EditorPreferences {
  fontFamily: 'default' | 'serif' | 'mono';
  fontSize: 'small' | 'medium' | 'large';
  lineWidth: 'narrow' | 'medium' | 'wide';
  distractionFree: boolean;
}

export interface AIPreferences {
  tone: 'neutral' | 'analytical' | 'reflective';
  verbosity: 'concise' | 'balanced' | 'detailed';
  evidenceStrictness: 'standard' | 'strict';
}

export interface FeatureFlags {
  premiumInsights: boolean;
  advancedAskJournal: boolean;
  unlimitedHistory: boolean;
}

export interface UsageStats {
  daysActive: number;
  entriesWritten: number;
  aiCallsUsed: number;
  lastActiveDate: string; // ISO date string
  firstUseDate: string; // ISO date string
}

export interface Settings {
  journalPath: string | null;
  aiEnabled: boolean;
  theme: 'light' | 'dark' | 'system'; // Legacy - keep for backward compatibility
  uiTheme: 'default' | 'soft-dark' | 'calm-light' | 'system';
  aiApiKey?: string;
  sidebarWidth: number;
  aiPanelWidth: number;
  // Security
  appLockEnabled: boolean;
  appLockPasscode?: HashedPasscode;
  autoLockTimeout: number; // minutes (0 = never)
  // Preferences
  editorPreferences: EditorPreferences;
  aiPreferences: AIPreferences;
  // Feature Flags
  featureFlags: FeatureFlags;
  // Usage Stats
  usageStats: UsageStats;
}

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontFamily: 'default',
  fontSize: 'medium',
  lineWidth: 'medium',
  distractionFree: false,
};

export const DEFAULT_AI_PREFERENCES: AIPreferences = {
  tone: 'neutral',
  verbosity: 'balanced',
  evidenceStrictness: 'standard',
};

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  premiumInsights: false,
  advancedAskJournal: false,
  unlimitedHistory: false,
};

export const DEFAULT_USAGE_STATS: UsageStats = {
  daysActive: 0,
  entriesWritten: 0,
  aiCallsUsed: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
  firstUseDate: new Date().toISOString().split('T')[0],
};

export const DEFAULT_SETTINGS: Settings = {
  journalPath: null,
  aiEnabled: false,
  theme: 'system',
  uiTheme: 'system',
  sidebarWidth: 300,
  aiPanelWidth: 420,
  appLockEnabled: false,
  autoLockTimeout: 0,
  editorPreferences: DEFAULT_EDITOR_PREFERENCES,
  aiPreferences: DEFAULT_AI_PREFERENCES,
  featureFlags: DEFAULT_FEATURE_FLAGS,
  usageStats: DEFAULT_USAGE_STATS,
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
  BUILD_INDEX: 'build-index',
  READ_INDEX: 'read-index',
  UPDATE_INDEX_ITEM: 'update-index-item',
  REMOVE_INDEX_ITEM: 'remove-index-item',
  ASK_QUESTION: 'ask-question',
  GENERATE_MONTHLY_SUMMARY: 'generate-monthly-summary',
  GET_MONTHLY_INSIGHTS: 'get-monthly-insights',
  GET_DATA_STATS: 'get-data-stats',
  EXPORT_JOURNAL: 'export-journal',
  DETECT_PATTERNS: 'detect-patterns',
  // Security
  VERIFY_PASSCODE: 'verify-passcode',
  SET_PASSCODE: 'set-passcode',
  CHECK_LOCK_STATUS: 'check-lock-status',
} as const;
