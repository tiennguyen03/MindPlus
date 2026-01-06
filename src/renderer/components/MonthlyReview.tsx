import React, { useState } from 'react';

interface MonthlyReviewProps {
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

export default function MonthlyReview({ onClose, onResult }: MonthlyReviewProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await window.journal.generateMonthlySummary(selectedMonth);
      onResult(result);

      // Save the result
      const formattedOutput = `# Monthly Summary - ${selectedMonth}\n\n${result.content}`;
      await window.journal.saveAIOutput('monthly', selectedMonth, formattedOutput);

      // Update index
      const relativePath = `ai/monthly/${selectedMonth}.summary.md`;
      await window.journal.updateIndexItem(relativePath, 'ai');

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate list of months for the past 2 years
  const generateMonthOptions = () => {
    const options: { value: string; label: string }[] = [];
    const today = new Date();

    for (let i = 0; i < 24; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const value = `${year}-${month}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }

    return options;
  };

  const monthOptions = generateMonthOptions();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content monthly-modal" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Monthly Summary</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="monthly-form">
          <div className="form-group">
            <label htmlFor="month-select">Select Month</label>
            <select
              id="month-select"
              className="month-select"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
            >
              {monthOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="form-help">
              Generate a comprehensive summary of your journal entries for the selected month.
              Includes themes, wins, challenges, and reflection questions.
            </p>
          </div>

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
              type="button"
              className="btn-primary"
              onClick={handleGenerate}
              disabled={isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate Summary'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
