import { ReactNode, useEffect } from 'react';
import { ThemeBlueprint } from '../types/blueprints';

interface ThemeProviderProps {
  theme: ThemeBlueprint;
  children: ReactNode;
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement;

    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    Object.entries(theme.fonts).forEach(([key, value]) => {
      root.style.setProperty(`--font-${key}`, value);
    });

    if (theme.ui) {
      Object.entries(theme.ui).forEach(([key, value]) => {
        if (value !== undefined) {
          root.style.setProperty(`--${key.replace(/_/g, '-')}`, value);
        }
      });
    }
  }, [theme]);

  return <>{children}</>;
}
