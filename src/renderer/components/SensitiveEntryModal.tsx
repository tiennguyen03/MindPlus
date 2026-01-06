import React, { useState, useEffect, useRef } from 'react';

interface SensitiveEntryModalProps {
  entryTitle: string;
  onUnlock: () => void;
  onCancel: () => void;
}

export default function SensitiveEntryModal({
  entryTitle,
  onUnlock,
  onCancel,
}: SensitiveEntryModalProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus input when modal opens
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passcode) {
      setError('Please enter your passcode');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await window.journal.verifyPasscode(passcode);

      if (result.valid) {
        onUnlock();
      } else {
        setError('Incorrect passcode');
        setPasscode('');
        inputRef.current?.focus();
      }
    } catch (err) {
      setError('Failed to verify passcode');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="sensitive-entry-modal-overlay" onClick={onCancel}>
      <div className="sensitive-entry-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sensitive-modal-content">
          <div className="sensitive-modal-icon">🔒</div>
          <h2>Sensitive Entry</h2>
          <p className="sensitive-modal-title">"{entryTitle}"</p>
          <p className="sensitive-modal-description">
            This entry is marked as sensitive. Enter your passcode to view it.
          </p>

          <form onSubmit={handleSubmit} className="sensitive-form">
            <input
              ref={inputRef}
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode"
              className="sensitive-input"
              disabled={isVerifying}
            />

            {error && <div className="sensitive-error">{error}</div>}

            <div className="sensitive-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onCancel}
                disabled={isVerifying}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isVerifying}
              >
                {isVerifying ? 'Verifying...' : 'Unlock'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
