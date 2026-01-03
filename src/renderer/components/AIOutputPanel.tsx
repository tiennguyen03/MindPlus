import React from 'react';

interface AIOutput {
  type: string;
  title: string;
  content: string;
  confidence?: string;
  quotes?: string[];
}

interface AIOutputPanelProps {
  loading: boolean;
  output: AIOutput | null;
  onClose: () => void;
  onSave: () => void;
  onRefresh: () => void;
}

export default function AIOutputPanel({ loading, output, onClose, onSave, onRefresh }: AIOutputPanelProps) {
  if (loading) {
    return (
      <div className="ai-output-panel">
        <div className="ai-loading">Generating AI insights...</div>
      </div>
    );
  }

  if (!output) return null;

  return (
    <div className="ai-output-panel">
      <div className="ai-output-header">
        <h3>{output.title}</h3>
        <div className="ai-output-actions">
          <button onClick={onRefresh} title="Regenerate">↻</button>
          <button onClick={onSave}>Save</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
      <div className="ai-output-content">
        {output.confidence && (
          <span className="confidence">Confidence: {output.confidence}</span>
        )}
        <div dangerouslySetInnerHTML={{ __html: formatContent(output.content) }} />
        {output.quotes && output.quotes.length > 0 && (
          <div className="quotes-section">
            <strong>Evidence:</strong>
            {output.quotes.map((quote, i) => (
              <blockquote key={i}>{quote}</blockquote>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatContent(content: string): string {
  // Simple markdown-like formatting
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
}
