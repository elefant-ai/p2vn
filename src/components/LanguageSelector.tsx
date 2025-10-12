import { useState } from 'react';
import { useRegistry } from '../contexts/RegistryContext';

export function LanguageSelector() {
  const registry = useRegistry();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(registry.getCurrentLanguage());
  const availableLanguages = registry.getAvailableLanguages();

  const languageNames: Record<string, string> = {
    en_US: '🇺🇸 English',

    fr_FR: '🇫🇷 Français',
    de_DE: '🇩🇪 Deutsch',
    it_IT: '🇮🇹 Italiano',
    pt_BR: '🇧🇷 Português',
    ru_RU: '🇷🇺 Русский',
    ja_JP: '🇯🇵 日本語',
    ko_KR: '🇰🇷 한국어',
    zh_CN: '🇨🇳 简体中文',
    zh_TW: '🇹🇼 繁體中文',
  };

  const handleLanguageChange = async (lang: string) => {
    try {
      await registry.switchLanguage(lang);
      setCurrentLanguage(lang);
      setIsOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch language:', error);
    }
  };

  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="vn-button vn-button-secondary text-sm py-2 px-4 w-full"
      >
        {languageNames[currentLanguage] || currentLanguage}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 vn-menu p-2 z-10">
          {availableLanguages.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`vn-menu-item vn-text block w-full text-base text-left ${lang === currentLanguage ? 'active' : ''}`}
            >
              {languageNames[lang] || lang}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
