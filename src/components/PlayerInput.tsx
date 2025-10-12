import { useState, useRef, useEffect } from 'react';
import { useUITranslation } from '../hooks/useUITranslation';

interface PlayerInputProps {
  enabled: boolean;
  onSubmit: (text: string) => void;
  placeholder?: string;
}

export function PlayerInput({ enabled, onSubmit, placeholder }: PlayerInputProps) {
  const { t } = useUITranslation();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (enabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [enabled]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && enabled) {
      onSubmit(trimmed);
      setValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  if (!enabled) return null;

  return (
    <div className="absolute bottom-32 left-0 right-0 px-4 md:px-8 z-30 pointer-events-auto">
      <div className="max-w-4xl mx-auto flex gap-3">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder || t('ui.input_placeholder')}
          className="flex-1 vn-input"
          style={{
            color: 'var(--color-text)',
            borderColor: 'var(--color-secondary)',
            backgroundColor: 'var(--color-background)',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="vn-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('ui.send')}
        </button>
      </div>
    </div>
  );
}
