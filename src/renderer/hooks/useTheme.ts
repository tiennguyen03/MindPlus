import { useEffect } from 'react';

type UITheme = 'default' | 'soft-dark' | 'calm-light' | 'system';

/**
 * Hook to apply and manage theme switching
 * - Applies theme class to document root
 * - Handles system theme preference detection
 * - Listens for OS theme changes when using 'system' theme
 */
export function useTheme(uiTheme: UITheme) {
  useEffect(() => {
    const applyTheme = (theme: Exclude<UITheme, 'system'>) => {
      const root = document.documentElement;

      // Remove all theme classes
      root.classList.remove('theme-default', 'theme-soft-dark', 'theme-calm-light');

      // Apply selected theme
      root.classList.add(`theme-${theme}`);
    };

    if (uiTheme === 'system') {
      // Detect system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const applySystemTheme = () => {
        // Map system dark mode to soft-dark, light mode to default
        applyTheme(mediaQuery.matches ? 'soft-dark' : 'default');
      };

      // Apply initial theme based on system preference
      applySystemTheme();

      // Listen for OS theme changes
      mediaQuery.addEventListener('change', applySystemTheme);

      return () => mediaQuery.removeEventListener('change', applySystemTheme);
    } else {
      // Apply explicit theme selection
      applyTheme(uiTheme);
    }
  }, [uiTheme]);
}
