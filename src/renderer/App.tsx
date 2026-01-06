import React, { useState, useEffect, useCallback } from 'react';
import { Settings, TreeNode, JournalEntry } from '../shared/types';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import EmptyState from './components/EmptyState';
import AIOutputPanel from './components/AIOutputPanel';
import SettingsModal from './components/SettingsModal';
import QuickSwitcher from './components/QuickSwitcher';
import AskYourJournal from './components/AskYourJournal';
import MonthlyReview from './components/MonthlyReview';
import InsightsDashboard from './components/InsightsDashboard';
import ResizablePanel from './components/ResizablePanel';
import LockScreen from './components/LockScreen';
import SensitiveEntryModal from './components/SensitiveEntryModal';
import TaskIndicator from './components/TaskIndicator';
import { useTheme } from './hooks/useTheme';
import { debounce } from './utils/debounce';

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
  sensitive?: boolean;
}

/**
 * Parse frontmatter to check if entry is sensitive
 */
function isSensitiveEntry(content: string): boolean {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatterMatch) return false;

  const frontmatter = frontmatterMatch[1];
  const sensitiveMatch = frontmatter.match(/sensitive:\s*true/i);
  return !!sensitiveMatch;
}

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<JournalEntry[]>([]);
  const [aiOutput, setAIOutput] = useState<AIOutput | null>(null);
  const [aiLoading, setAILoading] = useState(false);
  const [lastAIAction, setLastAIAction] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);
  const [showAskModal, setShowAskModal] = useState(false);
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [index, setIndex] = useState<IndexItem[]>([]);
  const [currentView, setCurrentView] = useState<'journal' | 'insights'>('journal');
  const [isLocked, setIsLocked] = useState(true);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [pendingSensitiveEntry, setPendingSensitiveEntry] = useState<JournalEntry | null>(null);

  // Load settings on mount and check lock status
  useEffect(() => {
    const init = async () => {
      const loadedSettings = await window.journal.getSettings();
      setSettings(loadedSettings);

      // Check if app lock is enabled
      if (loadedSettings.appLockEnabled && loadedSettings.appLockPasscode) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    };

    init();
  }, []);

  // Apply theme when settings load or change
  useTheme(settings?.uiTheme || 'system');

  // Auto-lock timer
  useEffect(() => {
    if (!settings?.appLockEnabled || !settings?.appLockPasscode || settings.autoLockTimeout === 0) {
      return;
    }

    const checkAutoLock = () => {
      const now = Date.now();
      const timeoutMs = settings.autoLockTimeout * 60 * 1000; // Convert minutes to ms

      if (now - lastActivityTime > timeoutMs && !isLocked) {
        setIsLocked(true);
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkAutoLock, 30000);

    return () => clearInterval(interval);
  }, [settings, lastActivityTime, isLocked]);

  // Track user activity
  useEffect(() => {
    if (isLocked) return;

    const updateActivity = () => {
      setLastActivityTime(Date.now());
    };

    // Track mouse movement and keyboard
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
    };
  }, [isLocked]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K for Quick Switcher
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickSwitcher(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load tree when journal path changes
  useEffect(() => {
    if (settings?.journalPath) {
      refreshTree();
      buildOrReadIndex();
    }
  }, [settings?.journalPath]);

  // Build or read index
  const buildOrReadIndex = useCallback(async () => {
    try {
      setIndexing(true);
      let indexData = await window.journal.readIndex();

      if (!indexData) {
        // Build index if it doesn't exist
        indexData = await window.journal.buildIndex();
      }

      // Load index items into state
      if (indexData) {
        setIndex(indexData.items);
      }
    } catch (error) {
      console.error('Error initializing index:', error);
    } finally {
      setIndexing(false);
    }
  }, []);

  const refreshTree = useCallback(async () => {
    const treeData = await window.journal.getEntriesTree();
    setTree(treeData);
  }, []);

  const handleSelectFolder = async () => {
    const folderPath = await window.journal.selectFolder();
    if (folderPath && settings) {
      const newSettings = { ...settings, journalPath: folderPath };
      await window.journal.saveSettings(newSettings);
      setSettings(newSettings);
    }
  };

  const handleNewEntry = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const entryPath = await window.journal.createEntry(today);

      // Refresh tree and index
      await refreshTree();

      // Read the entry
      const entry = await window.journal.readEntry(entryPath);

      if (entry) {
        setCurrentEntry(entry);
        setSearchQuery('');
        setSearchResults([]);

        // Update index for this new entry
        try {
          await window.journal.updateIndexItem(entryPath, 'entry');
          const indexData = await window.journal.readIndex();
          if (indexData) setIndex(indexData.items);
        } catch (error) {
          console.error('Error updating index:', error);
        }
      } else {
        console.error('Failed to read newly created entry');
      }
    } catch (error) {
      console.error('Error creating new entry:', error);
    }
  };

  const handleSelectEntry = async (path: string) => {
    const entry = await window.journal.readEntry(path);

    // Check if entry is sensitive and app lock is enabled
    if (entry && isSensitiveEntry(entry.content) && settings?.appLockEnabled && settings?.appLockPasscode) {
      setPendingSensitiveEntry(entry);
      return;
    }

    setCurrentEntry(entry);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleUnlockSensitiveEntry = () => {
    if (pendingSensitiveEntry) {
      setCurrentEntry(pendingSensitiveEntry);
      setPendingSensitiveEntry(null);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleCancelSensitiveEntry = () => {
    setPendingSensitiveEntry(null);
  };

  const handleSaveEntry = async (content: string) => {
    if (currentEntry) {
      await window.journal.saveEntry(currentEntry.path, content);
      setCurrentEntry({ ...currentEntry, content });

      // Update index for this entry
      try {
        await window.journal.updateIndexItem(currentEntry.path, 'entry');
        // Reload index to get updated data
        const indexData = await window.journal.readIndex();
        if (indexData) setIndex(indexData.items);
      } catch (error) {
        console.error('Error updating index:', error);
      }
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await window.journal.searchEntries(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleToggleAI = async () => {
    if (settings) {
      const newSettings = { ...settings, aiEnabled: !settings.aiEnabled };
      await window.journal.saveSettings(newSettings);
      setSettings(newSettings);
    }
  };

  const handleAIAction = async (action: string) => {
    if (!settings?.aiEnabled) return;

    // Handle modal-based actions
    if (action === 'ask-question') {
      setShowAskModal(true);
      return;
    }

    if (action === 'monthly-summary') {
      setShowMonthlyModal(true);
      return;
    }

    // Handle entry-based AI actions (require current entry)
    if (!currentEntry) return;

    setAILoading(true);
    setAIOutput(null);
    setLastAIAction(action);

    try {
      const result = await window.journal.runAI(action, currentEntry.date);
      setAIOutput(result);
    } catch (error) {
      console.error('AI action failed:', error);
      setAIOutput({
        type: 'error',
        title: 'Error',
        content: 'Failed to generate AI output. Please try again.',
      });
    } finally {
      setAILoading(false);
    }
  };

  const handleRefreshAI = () => {
    if (lastAIAction) {
      handleAIAction(lastAIAction);
    }
  };

  const handleCloseAIOutput = () => {
    setAIOutput(null);
  };

  const handleSaveAIOutput = async () => {
    if (aiOutput && currentEntry) {
      await window.journal.saveAIOutput(aiOutput.type, currentEntry.date, aiOutput.content);

      // Update index for AI output
      try {
        const subtypeMap: Record<string, 'daily' | 'weekly' | 'highlights' | 'loops' | 'questions'> = {
          'daily-review': 'daily',
          'weekly-summary': 'weekly',
          'highlights': 'highlights',
          'open-loops': 'loops',
          'question': 'questions',
        };
        const subtype = subtypeMap[aiOutput.type];
        if (subtype) {
          // For AI outputs, the relativePath varies by type
          let relativePath = '';
          if (subtype === 'daily') {
            relativePath = `${currentEntry.date}.review.md`;
          } else if (subtype === 'weekly') {
            const weekNum = getWeekNumber(new Date(currentEntry.date));
            const year = currentEntry.date.split('-')[0];
            relativePath = `${year}-W${weekNum.toString().padStart(2, '0')}.summary.md`;
          } else if (subtype === 'highlights') {
            relativePath = `${currentEntry.date}.highlights.md`;
          } else if (subtype === 'loops') {
            relativePath = 'open_loops.md';
          } else if (subtype === 'questions') {
            relativePath = `${currentEntry.date}.question.md`;
          }

          await window.journal.updateIndexItem(relativePath, 'ai', subtype);
          // Reload index to get updated data
          const indexData = await window.journal.readIndex();
          if (indexData) setIndex(indexData.items);
        }
      } catch (error) {
        console.error('Error updating index:', error);
      }
    }
  };

  // Helper function to get week number
  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const handleSaveSettings = async (newSettings: Settings) => {
    await window.journal.saveSettings(newSettings);
    setSettings(newSettings);
  };

  // Handle Ask/Monthly results - display in AI panel
  const handleAskResult = (output: AIOutput) => {
    setAIOutput(output);
    setLastAIAction('ask-question');
    // Reload index to show new AI output
    buildOrReadIndex();
  };

  const handleMonthlyResult = (output: AIOutput) => {
    setAIOutput(output);
    setLastAIAction('monthly-summary');
    // Reload index to show new AI output
    buildOrReadIndex();
  };

  // Handle Quick Switcher item selection
  const handleQuickSwitcherSelect = async (item: IndexItem) => {
    if (item.type === 'entry') {
      // Open entry
      const entry = await window.journal.readEntry(item.relativePath);
      if (entry) {
        setCurrentEntry(entry);
        setSearchQuery('');
        setSearchResults([]);
      }
    } else if (item.type === 'ai') {
      // For AI outputs, we could potentially show them in the AI panel
      // For now, just log it - can be enhanced later
      console.log('Selected AI output:', item);
    }
  };

  // Debounced handlers for panel resize persistence
  const handleSidebarResize = useCallback(
    debounce((size: number) => {
      if (settings) {
        const newSettings = { ...settings, sidebarWidth: size };
        window.journal.saveSettings(newSettings);
        setSettings(newSettings);
      }
    }, 200),
    [settings]
  );

  const handleAIPanelResize = useCallback(
    debounce((size: number) => {
      if (settings) {
        const newSettings = { ...settings, aiPanelWidth: size };
        window.journal.saveSettings(newSettings);
        setSettings(newSettings);
      }
    }, 200),
    [settings]
  );

  const handleUnlock = () => {
    setIsLocked(false);
    setLastActivityTime(Date.now());
  };

  // Show lock screen if app is locked
  if (isLocked && settings?.appLockEnabled && settings?.appLockPasscode) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  // Show setup screen if no journal folder selected
  if (!settings?.journalPath) {
    return (
      <div className="app">
        <EmptyState onSelectFolder={handleSelectFolder} />
      </div>
    );
  }

  // Generate app classes based on editor preferences
  const appClasses = [
    'app',
    settings.editorPreferences.distractionFree ? 'distraction-free' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={appClasses}>
      {showSettings && settings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Quick Switcher (Cmd/Ctrl+K) */}
      <QuickSwitcher
        isOpen={showQuickSwitcher}
        onClose={() => setShowQuickSwitcher(false)}
        onSelect={handleQuickSwitcherSelect}
        index={index}
      />

      {/* Ask Your Journal Modal */}
      {showAskModal && (
        <AskYourJournal
          onClose={() => setShowAskModal(false)}
          onResult={handleAskResult}
        />
      )}

      {/* Monthly Summary Modal */}
      {showMonthlyModal && (
        <MonthlyReview
          onClose={() => setShowMonthlyModal(false)}
          onResult={handleMonthlyResult}
        />
      )}

      {/* Sensitive Entry Unlock Modal */}
      {pendingSensitiveEntry && (
        <SensitiveEntryModal
          entryTitle={pendingSensitiveEntry.date}
          onUnlock={handleUnlockSensitiveEntry}
          onCancel={handleCancelSensitiveEntry}
        />
      )}

      {/* Sidebar - Left Panel */}
      {/* Task Indicator */}
      <TaskIndicator className="app-task-indicator" />

      <ResizablePanel
        direction="horizontal"
        defaultSize={300}
        persistedSize={settings.sidebarWidth}
        minSize={200}
        maxSize={600}
        className="sidebar-panel"
        onResizeEnd={handleSidebarResize}
      >
        <Sidebar
          tree={tree}
          searchQuery={searchQuery}
          searchResults={searchResults}
          selectedPath={currentEntry?.path || null}
          aiEnabled={settings.aiEnabled}
          index={index}
          currentView={currentView}
          onSearch={handleSearch}
          onSelectEntry={handleSelectEntry}
          onSelectIndexItem={handleQuickSwitcherSelect}
          onNewEntry={handleNewEntry}
          onSelectFolder={handleSelectFolder}
          onToggleAI={handleToggleAI}
          onAIAction={handleAIAction}
          onOpenSettings={() => setShowSettings(true)}
          onViewChange={setCurrentView}
          hasApiKey={!!settings.aiApiKey}
        />
      </ResizablePanel>

      {/* Main Content - Center Panel */}
      <main className="main-content">
        {currentView === 'insights' ? (
          <InsightsDashboard
            onThemeClick={(theme) => {
              // Switch to journal view and search for theme
              setCurrentView('journal');
              handleSearch(theme);
            }}
            onEntryClick={(relativePath) => {
              // Switch to journal view and open the entry
              setCurrentView('journal');
              handleSelectEntry(relativePath);
            }}
          />
        ) : currentEntry ? (
          <Editor
            entry={currentEntry}
            preferences={settings.editorPreferences}
            onSave={handleSaveEntry}
          />
        ) : (
          <div className="empty-state">
            <h2>No entry selected</h2>
            <p>Select an entry from the sidebar or open today's journal</p>
            <button onClick={handleNewEntry}>Open Today's Entry</button>
          </div>
        )}
      </main>

      {/* AI Panel - Right Panel (conditional) */}
      {(aiLoading || aiOutput) && (
        <ResizablePanel
          direction="horizontal"
          defaultSize={420}
          persistedSize={settings.aiPanelWidth}
          minSize={300}
          maxSize={720}
          className="ai-panel-right"
          onResizeEnd={handleAIPanelResize}
        >
          <AIOutputPanel
            loading={aiLoading}
            output={aiOutput}
            onClose={handleCloseAIOutput}
            onSave={handleSaveAIOutput}
            onRefresh={handleRefreshAI}
          />
        </ResizablePanel>
      )}
    </div>
  );
}
