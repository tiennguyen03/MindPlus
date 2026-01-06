import React, { useState, useEffect, useRef } from 'react';

interface LockScreenProps {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus input on mount
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passcode.trim()) {
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
        setError('Incorrect passcode. Please try again.');
        setPasscode('');
        inputRef.current?.focus();
      }
    } catch (err) {
      setError('Failed to verify passcode. Please try again.');
      setPasscode('');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="lock-screen">
      <div className="lock-screen-content">
        <div className="lock-icon">🔒</div>
        <h1>MindPlus</h1>
        <p className="lock-subtitle">Enter your passcode to unlock</p>

        <form onSubmit={handleSubmit} className="lock-form">
          <input
            ref={inputRef}
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Enter passcode"
            className="lock-input"
            disabled={isVerifying}
            autoComplete="off"
          />

          {error && <div className="lock-error">{error}</div>}

          <button
            type="submit"
            className="lock-submit"
            disabled={isVerifying}
          >
            {isVerifying ? 'Verifying...' : 'Unlock'}
          </button>
        </form>

        <p className="lock-hint">
          Your journal is protected. Only you can access it.
        </p>
      </div>
    </div>
  );
}
