import { useCallback, useEffect, useState } from 'react';
import { getTheme, setTheme, type ThemePref } from '@/src/lib/storage';

function systemPref(): ThemePref {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

function apply(theme: ThemePref): void {
  document.documentElement.setAttribute('data-theme', theme);
}

export function useTheme(): { theme: ThemePref; toggle: () => void } {
  // index.html paints data-theme="dark" first; reconcile to the real pref on mount.
  const [theme, setThemeState] = useState<ThemePref>('dark');

  useEffect(() => {
    void getTheme().then((stored) => {
      const next = stored ?? systemPref();
      setThemeState(next);
      apply(next);
    });
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: ThemePref = prev === 'dark' ? 'light' : 'dark';
      apply(next);
      void setTheme(next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
