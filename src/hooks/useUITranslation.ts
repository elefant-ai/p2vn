import { useState, useEffect } from 'react';
import { useRegistry } from '../contexts/RegistryContext';

export function useUITranslation() {
  const registry = useRegistry();
  const [translations, setTranslations] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const lang = registry.getCurrentLanguage();
    fetch(`${import.meta.env.BASE_URL}locales/${lang}.json`)
      .then((r) => r.json())
      .then(setTranslations)
      .catch(() => {
        fetch(`${import.meta.env.BASE_URL}locales/en_US.json`)
          .then((r) => r.json())
          .then(setTranslations);
      });
  }, [registry]);

  const t = (key: string, fallback?: string) => {
    const keys = key.split('.');
    let value: unknown = translations;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
      if (value === undefined) return fallback || key;
    }
    return (value as string) || fallback || key;
  };

  return { t };
}
