import { useState, useEffect } from 'react';
import { useUITranslation } from '../hooks/useUITranslation';
import { useRegistry } from '../contexts/RegistryContext';
import { useTypewriter } from '../hooks/useTypewriter';

interface ChapterIntroProps {
  chapterId: string;
  onContinue: () => void;
}

export function ChapterIntro({ chapterId, onContinue }: ChapterIntroProps) {
  const { t } = useUITranslation();
  const chapter = useRegistry().getChapter(chapterId);
  const displayText = useTypewriter(chapter.intro, 30);
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        setShowContinue(true);
      },
      chapter.intro.length * 30 + 500
    );

    return () => clearTimeout(timer);
  }, [chapter.intro]);

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

  return (
    <div className="vn-screen flex items-center justify-center min-h-screen cyber-scanlines hologram">
      <div className="cyber-grid" />
      <div className="text-center max-w-3xl px-8">
        <div className="vn-box p-8 mb-8">
          <h2
            className="vn-heading neon-text text-3xl md:text-4xl mb-8"
            style={{ color: 'var(--color-secondary)' }}
          >
            {chapter.title}
          </h2>
          <p className="vn-text text-2xl leading-relaxed" style={{ color: 'var(--color-text)' }}>
            {displayText}
            <span className="inline-block w-3 h-6 ml-1 bg-current animate-pulse terminal-cursor"></span>
          </p>
        </div>

        {showContinue && (
          <div
            className="vn-text text-xl neon-text animate-pulse"
            style={{ color: 'var(--color-accent)' }}
          >
            ▼ {t('ui.press_enter')} ▼
          </div>
        )}
      </div>
    </div>
  );
}
