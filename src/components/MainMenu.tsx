import { useState } from 'react';
import { useUITranslation } from '../hooks/useUITranslation';
import { useRegistry } from '../contexts/RegistryContext';
import { LanguageSelector } from './LanguageSelector';

interface MainMenuProps {
  onStart: () => void;
  onContinue: () => void;
}

export function MainMenu({ onStart, onContinue }: MainMenuProps) {
  const { t } = useUITranslation();
  const game = useRegistry().getGame();
  const hasSave = !!localStorage.getItem('vn_save');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="vn-screen fixed inset-0 flex items-center justify-center">
      {/* Background Image */}
      {game.main_menu_image?.uri && (
        <div className="absolute inset-0 z-0">
          <img
            src={game.main_menu_image.uri}
            className="w-full h-full object-cover"
            alt="Main menu background"
          />
        </div>
      )}

      <div className="text-center px-8 py-12 max-w-3xl w-full relative z-10">
        <div className="mb-16">
          <h1
            className="vn-heading text-5xl md:text-6xl mb-8"
            style={{ color: 'var(--color-primary)' }}
          >
            {game.title}
          </h1>
          <div className="vn-box p-6 mx-auto max-w-xl">
            <p className="vn-text text-2xl" style={{ color: 'var(--color-text)' }}>
              {game.description}
            </p>
          </div>
        </div>

        <div className="space-y-6 flex flex-col items-center">
          <button onClick={onStart} className="vn-button w-80">
            {t('ui.new_game')}
          </button>

          {hasSave && (
            <button onClick={onContinue} className="vn-button vn-button-secondary w-80">
              {t('ui.continue_game')}
            </button>
          )}

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="vn-button vn-button-accent w-80"
          >
            {t('ui.settings')}
          </button>
        </div>

        <div className="mt-16 vn-text text-sm opacity-50" style={{ color: 'var(--color-text)' }}>
          {game.authors.join(', ')} - v{game.version}
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div
          className="fixed inset-0 vn-overlay z-50 flex items-center justify-center p-4"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div className="vn-box p-6 md:p-8 max-w-xl w-full" onClick={(e) => e.stopPropagation()}>
            <h2
              className="vn-heading text-2xl md:text-3xl mb-8"
              style={{ color: 'var(--color-primary)' }}
            >
              {t('ui.settings')}
            </h2>

            <div className="mb-8">
              <h3
                className="vn-heading text-base md:text-lg mb-4"
                style={{ color: 'var(--color-secondary)' }}
              >
                🌐 Language
              </h3>
              <LanguageSelector />
            </div>

            <button
              onClick={() => setIsSettingsOpen(false)}
              className="vn-button vn-button-secondary w-full mt-4"
            >
              {t('ui.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
