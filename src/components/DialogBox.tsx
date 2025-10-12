import { useEffect } from 'react';
import { useUITranslation } from '../hooks/useUITranslation';
import { useTypewriter } from '../hooks/useTypewriter';

interface DialogBoxProps {
  speakerName: string | null;
  text: string;
  showContinue: boolean;
  onContinue: () => void;
  isAIThinking?: boolean;
  characterColor?: string;
}

export function DialogBox({
  speakerName,
  text,
  showContinue,
  onContinue,
  isAIThinking,
  characterColor,
}: DialogBoxProps) {
  const { t } = useUITranslation();
  const displayText = useTypewriter(text, 30);

  useEffect(() => {
    if (!showContinue) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onContinue();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showContinue, onContinue]);

  const characterColorValue = characterColor || 'var(--color-primary)';

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-30 pointer-events-auto">
      <div
        className="vn-box p-6 max-w-4xl mx-auto"
        style={
          {
            '--dialog-character-color': characterColorValue,
            borderColor: characterColorValue,
          } as React.CSSProperties
        }
      >
        {speakerName && (
          <div
            className="vn-heading text-sm md:text-base mb-3"
            style={{ color: characterColorValue }}
          >
            {speakerName.toUpperCase()}
          </div>
        )}

        {isAIThinking ? (
          <div
            className="vn-text text-xl italic animate-pulse"
            style={{ color: 'var(--color-secondary)' }}
          >
            {t('ui.thinking')}...
            <span className="inline-block w-2 h-5 ml-1 bg-current terminal-cursor"></span>
          </div>
        ) : (
          <div
            className="vn-text text-xl md:text-2xl leading-relaxed"
            style={{ color: 'var(--color-text)' }}
          >
            {displayText}
            {!showContinue && (
              <span className="inline-block w-2 h-5 ml-1 bg-current animate-pulse terminal-cursor"></span>
            )}
          </div>
        )}

        {showContinue && (
          <div
            className="text-right vn-text mt-3 animate-pulse"
            style={{ color: 'var(--color-accent)' }}
          >
            ▼ {t('ui.continue')} ▼
          </div>
        )}
      </div>
    </div>
  );
}
