import { useState, useEffect, useRef } from 'react';
import { useUITranslation } from '../hooks/useUITranslation';
import { useGameStore } from '../stores/gameStore';
import { useRegistry } from '../contexts/RegistryContext';

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useUITranslation();
  const registry = useRegistry();
  const { dossier, current_scene, current_chapter, current_route } = useGameStore();

  // Get scene and chapter numbers
  let sceneNumber = 0;
  let chapterNumber = 0;

  try {
    if (current_route && current_chapter) {
      const route = registry.getRoute(current_route);
      chapterNumber = route.chapters.indexOf(current_chapter) + 1;
    }
    if (current_chapter && current_scene) {
      const chapter = registry.getChapter(current_chapter);
      sceneNumber = chapter.scenes.indexOf(current_scene) + 1;
    }
  } catch (error) {
    // If scene/chapter not found, leave numbers as 0
    console.error('Error getting scene/chapter info:', error);
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="fixed top-4 right-4 z-40">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="vn-button p-3 flex flex-col gap-1.5 items-center justify-center w-12 h-12 relative z-50"
        aria-label="Menu"
        aria-expanded={isOpen}
      >
        <span
          className={`vn-hamburger-line block w-6 ${isOpen ? 'rotate-45 translate-y-2' : ''}`}
        />
        <span className={`vn-hamburger-line block w-6 ${isOpen ? 'opacity-0' : ''}`} />
        <span
          className={`vn-hamburger-line block w-6 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}
        />
      </button>

      {/* Menu Panel with Dossier */}
      {isOpen && (
        <div className="absolute top-16 right-0 vn-menu p-6 min-w-[320px] max-w-md max-h-[80vh] overflow-y-auto transition-all duration-300 ease-out">
          <h2
            className="vn-heading text-lg md:text-xl mb-6"
            style={{ color: 'var(--color-primary)' }}
          >
            📋 {t('ui.dossier.title')}
          </h2>

          <div className="mb-6">
            <h3
              className="vn-heading text-sm md:text-base mb-3"
              style={{ color: 'var(--color-secondary)' }}
            >
              {t('ui.dossier.objectives')}
            </h3>
            {dossier.objectives.length === 0 ? (
              <p
                className="vn-text text-sm italic opacity-50"
                style={{ color: 'var(--color-text)' }}
              >
                {t('ui.dossier.no_objectives')}
              </p>
            ) : (
              <ul className="space-y-2">
                {dossier.objectives.map((obj, i) => (
                  <li
                    key={i}
                    className="vn-text text-sm flex items-start gap-2"
                    style={{ color: 'var(--color-text)' }}
                  >
                    <span style={{ color: 'var(--color-accent)' }}>▸</span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mb-6">
            <h3
              className="vn-heading text-sm md:text-base mb-3"
              style={{ color: 'var(--color-secondary)' }}
            >
              {t('ui.dossier.notes')}
            </h3>
            {dossier.notes.length === 0 ? (
              <p
                className="vn-text text-sm italic opacity-50"
                style={{ color: 'var(--color-text)' }}
              >
                {t('ui.dossier.no_notes')}
              </p>
            ) : (
              <ul className="space-y-2">
                {dossier.notes.map((note, i) => (
                  <li
                    key={i}
                    className="vn-text text-sm flex items-start gap-2"
                    style={{ color: 'var(--color-text)' }}
                  >
                    <span style={{ color: 'var(--color-success)' }}>▸</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Current Location */}
          {(chapterNumber > 0 || sceneNumber > 0) && (
            <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <h3
                className="vn-heading text-sm md:text-base mb-3"
                style={{ color: 'var(--color-secondary)' }}
              >
                📍 Current Location
              </h3>
              <div className="vn-text text-sm space-y-1" style={{ color: 'var(--color-text)' }}>
                {chapterNumber > 0 && (
                  <div className="flex items-start gap-2">
                    <span style={{ color: 'var(--color-primary)' }}>Chapter:</span>
                    <span className="font-semibold">{chapterNumber}</span>
                  </div>
                )}
                {sceneNumber > 0 && (
                  <div className="flex items-start gap-2">
                    <span style={{ color: 'var(--color-primary)' }}>Scene:</span>
                    <span className="font-semibold">{sceneNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
