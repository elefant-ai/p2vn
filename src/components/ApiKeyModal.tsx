import { useState } from 'react';

interface ApiKeyModalProps {
  onSubmit: (key: string) => void;
  onCancel?: () => void;
  error?: string | null;
}

export function ApiKeyModal({ onSubmit, onCancel, error }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsValidating(true);
    await onSubmit(apiKey.trim());
    setIsValidating(false);
  };

  return (
    <div
      className="fixed inset-0 vn-overlay z-[100] flex items-center justify-center p-4"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="vn-box p-8 max-w-2xl w-full relative mx-auto">
        <h2
          className="vn-heading text-2xl md:text-3xl mb-6"
          style={{ color: 'var(--color-primary)' }}
        >
          🔑 PLAYER2 API KEY REQUIRED
        </h2>

        <div className="vn-text text-lg mb-6 space-y-3" style={{ color: 'var(--color-text)' }}>
          <p>This game uses AI-powered conversations through Player2.</p>
          <p>
            To play, you'll need a free API key from{' '}
            <a
              href="https://player2.game"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-75 transition-opacity"
              style={{ color: 'var(--color-accent)' }}
            >
              player2.game
            </a>
          </p>
        </div>

        {error && (
          <div
            className="vn-box p-4 mb-6 border-2"
            style={{
              borderColor: 'var(--color-error)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
            }}
          >
            <p className="vn-text text-base" style={{ color: 'var(--color-error)' }}>
              ⚠️ {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="api-key"
              className="vn-text text-sm mb-2 block"
              style={{ color: 'var(--color-secondary)' }}
            >
              Enter your API key:
            </label>
            <input
              id="api-key"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="p2_..."
              className="vn-input w-full"
              disabled={isValidating}
              autoFocus
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={!apiKey.trim() || isValidating}
              className="vn-button flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isValidating ? 'VALIDATING...' : 'CONNECT'}
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isValidating}
                className="vn-button vn-button-secondary flex-1 disabled:opacity-50"
              >
                CANCEL
              </button>
            )}
          </div>
        </form>

        <div
          className="mt-6 vn-text text-sm opacity-70 text-center"
          style={{ color: 'var(--color-text)' }}
        >
          Your API key is stored locally and never shared.
        </div>
      </div>
    </div>
  );
}
