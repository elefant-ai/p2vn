import { useState, useEffect } from 'react';
import { useUITranslation } from '../hooks/useUITranslation';
import { useGameStore } from '../stores/gameStore';

export function Dossier() {
  const { t } = useUITranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { dossier } = useGameStore();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="vn-button vn-button-accent text-sm py-2 px-4 w-full"
      >
        📋 {t('ui.dossier.title')}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 vn-overlay z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="vn-box p-6 md:p-8 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="vn-heading neon-text text-xl md:text-2xl mb-8"
              style={{ color: 'var(--color-primary)' }}
            >
              {t('ui.dossier.title')}
            </h2>

            <div className="mb-8">
              <h3
                className="vn-heading text-base md:text-lg mb-4"
                style={{ color: 'var(--color-secondary)' }}
              >
                {t('ui.dossier.objectives')}
              </h3>
              {dossier.objectives.length === 0 ? (
                <p
                  className="vn-text text-lg italic opacity-50"
                  style={{ color: 'var(--color-text)' }}
                >
                  {t('ui.dossier.no_objectives')}
                </p>
              ) : (
                <ul className="space-y-3">
                  {dossier.objectives.map((obj, i) => (
                    <li
                      key={i}
                      className="vn-text text-lg flex items-start gap-3"
                      style={{ color: 'var(--color-text)' }}
                    >
                      <span style={{ color: 'var(--color-accent)' }}>▸</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3
                className="vn-heading text-base md:text-lg mb-4"
                style={{ color: 'var(--color-secondary)' }}
              >
                {t('ui.dossier.notes')}
              </h3>
              {dossier.notes.length === 0 ? (
                <p
                  className="vn-text text-lg italic opacity-50"
                  style={{ color: 'var(--color-text)' }}
                >
                  {t('ui.dossier.no_notes')}
                </p>
              ) : (
                <ul className="space-y-3">
                  {dossier.notes.map((note, i) => (
                    <li
                      key={i}
                      className="vn-text text-lg flex items-start gap-3"
                      style={{ color: 'var(--color-text)' }}
                    >
                      <span style={{ color: 'var(--color-success)' }}>▸</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="vn-button vn-button-secondary w-full mt-8"
            >
              {t('ui.close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
