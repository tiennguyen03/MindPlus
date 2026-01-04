import React, { useState, useEffect, useCallback } from 'react';
import { Settings, TreeNode, JournalEntry } from '../shared/types';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import EmptyState from './components/EmptyState';
import AIOutputPanel from './components/AIOutputPanel';
import SettingsModal from './components/SettingsModal';
import ResizablePanel from './components/ResizablePanel';
import { useTheme } from './hooks/useTheme';
import { debounce } from './utils/debounce';

interface AIOutput {
  type: string;
  title: string;
  content: string;
  confidence?: string;
  quotes?: string[];
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

  // Load settings on mount
  useEffect(() => {
    window.journal.getSettings().then(setSettings);
  }, []);

  // Apply theme when settings load or change
  useTheme(settings?.uiTheme || 'system');

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
      const existingIndex = await window.journal.readIndex();

      if (!existingIndex) {
        // Build index if it doesn't exist
        await window.journal.buildIndex();
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
    const today = new Date().toISOString().split('T')[0];
    const entryPath = await window.journal.createEntry(today);
    await refreshTree();
    const entry = await window.journal.readEntry(entryPath);
    setCurrentEntry(entry);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSelectEntry = async (path: string) => {
    const entry = await window.journal.readEntry(path);
    setCurrentEntry(entry);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSaveEntry = async (content: string) => {
    if (currentEntry) {
      await window.journal.saveEntry(currentEntry.path, content);
      setCurrentEntry({ ...currentEntry, content });

      // Update index for this entry
      try {
        await window.journal.updateIndexItem(currentEntry.path, 'entry');
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
    if (!settings?.aiEnabled || !currentEntry) return;

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

  // Show setup screen if no journal folder selected
  if (!settings?.journalPath) {
    return (
      <div className="app">
        <EmptyState onSelectFolder={handleSelectFolder} />
      </div>
    );
  }

  return (
    <div className="app">
      {showSettings && settings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Sidebar - Left Panel */}
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
          onSearch={handleSearch}
          onSelectEntry={handleSelectEntry}
          onNewEntry={handleNewEntry}
          onSelectFolder={handleSelectFolder}
          onToggleAI={handleToggleAI}
          onAIAction={handleAIAction}
          onOpenSettings={() => setShowSettings(true)}
          hasApiKey={!!settings.aiApiKey}
        />
      </ResizablePanel>

      {/* Editor - Center Panel */}
      <main className="main-content">
        {currentEntry ? (
          <Editor
            entry={currentEntry}
            onSave={handleSaveEntry}
          />
        ) : (
          <div className="empty-state">
            <h2>No entry selected</h2>
            <p>Select an entry from the sidebar or create a new one</p>
            <button onClick={handleNewEntry}>New Entry for Today</button>
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
