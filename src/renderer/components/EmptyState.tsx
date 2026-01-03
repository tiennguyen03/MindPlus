import React from 'react';

interface EmptyStateProps {
  onSelectFolder: () => void;
}

export default function EmptyState({ onSelectFolder }: EmptyStateProps) {
  return (
    <div className="empty-state" style={{ width: '100%' }}>
      <h2>Welcome to Journal</h2>
      <p>Select a folder to store your journal entries</p>
      <button onClick={onSelectFolder}>Choose Journal Folder</button>
    </div>
  );
}
