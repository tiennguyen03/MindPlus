import React, { useState } from 'react';

interface AskYourJournalProps {
  onClose: () => void;
  onResult: (output: AIOutput) => void;
}

interface AIOutput {
  type: string;
  title: string;
  content: string;
  confidence?: string;
  quotes?: string[];
}

export default function AskYourJournal({ onClose, onResult }: AskYourJournalProps) {
  const [question, setQuestion] = useState('');
  const [dateRange, setDateRange] = useState<'all' | 'last-30' | 'last-90' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      setError('Please enter a question.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let start: string | undefined;
      let end: string | undefined;

      // Calculate date range
      if (dateRange === 'last-30' || dateRange === 'last-90') {
        const today = new Date();
        end = today.toISOString().split('T')[0];

        const daysAgo = dateRange === 'last-30' ? 30 : 90;
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - daysAgo);
        start = startDate.toISOString().split('T')[0];
      } else if (dateRange === 'custom') {
        if (!startDate || !endDate) {
          setError('Please select both start and end dates.');
          setIsLoading(false);
          return;
        }
        start = startDate;
        end = endDate;
      }
      // If 'all', leave start and end undefined

      const result = await window.journal.askQuestion(question, start, end);
      onResult(result);

      // Save the result
      const today = new Date().toISOString().split('T')[0];
      const formattedOutput = `# Question: ${question}\n\n**Date Range:** ${
        dateRange === 'all' ? 'All entries' :
        dateRange === 'last-30' ? 'Last 30 days' :
        dateRange === 'last-90' ? 'Last 90 days' :
        `${start} to ${end}`
      }\n\n**Confidence:** ${result.confidence || 'N/A'}\n\n---\n\n${result.content}`;

      await window.journal.saveAIOutput('ask', today, formattedOutput);

      // Update index
      const relativePath = `ai/ask/${today}_${new Date().toISOString().slice(11, 16).replace(':', '')}.ask.md`;
      await window.journal.updateIndexItem(relativePath, 'ai');

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ask-modal" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Ask Your Journal</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <form className="ask-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="question">Your Question</label>
            <textarea
              id="question"
              className="ask-question-input"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Example: What were my main concerns last month? What progress have I made on my goals?"
              rows={3}
              autoFocus
            />
            <p className="form-help">
              Ask anything about your journal entries. AI will search and provide answers with evidence.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="date-range">Search In</label>
            <select
              id="date-range"
              className="date-range-select"
              value={dateRange}
              onChange={e => setDateRange(e.target.value as any)}
            >
              <option value="all">All entries</option>
              <option value="last-30">Last 30 days</option>
              <option value="last-90">Last 90 days</option>
              <option value="custom">Custom date range</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <div className="form-group date-range-inputs">
              <div className="date-input-group">
                <label htmlFor="start-date">From</label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div className="date-input-group">
                <label htmlFor="end-date">To</label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || !question.trim()}
            >
              {isLoading ? 'Searching...' : 'Ask'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
