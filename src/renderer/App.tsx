import React, { useState, useEffect, useCallback } from 'react';
import { Settings, TreeNode, JournalEntry } from '../shared/types';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import EmptyState from './components/EmptyState';
import AIOutputPanel from './components/AIOutputPanel';
import SettingsModal from './components/SettingsModal';
import ResizablePanel from './components/ResizablePanel';
import { useTheme } from './hooks/useTheme';

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
    }
  }, [settings?.journalPath]);

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
    if (aiOutput) {
      await window.journal.saveAIOutput(aiOutput.type, currentEntry?.date || '', aiOutput.content);
      // Could show a toast notification here
    }
  };

  const handleSaveSettings = async (newSettings: Settings) => {
    await window.journal.saveSettings(newSettings);
    setSettings(newSettings);
  };

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
      <ResizablePanel
        direction="horizontal"
        defaultSize={300}
        minSize={200}
        maxSize={600}
        className="sidebar-panel"
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
      <main className="main-content">
        {currentEntry ? (
          <>
            <Editor
              entry={currentEntry}
              onSave={handleSaveEntry}
            />
            {(aiLoading || aiOutput) && (
              <ResizablePanel
                direction="vertical"
                defaultSize={300}
                minSize={150}
                maxSize={600}
                className="ai-panel"
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
          </>
        ) : (
          <div className="empty-state">
            <h2>No entry selected</h2>
            <p>Select an entry from the sidebar or create a new one</p>
            <button onClick={handleNewEntry}>New Entry for Today</button>
          </div>
        )}
      </main>
    </div>
  );
}
