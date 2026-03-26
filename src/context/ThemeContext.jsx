import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ThemeContext = createContext(null);

// ── Helpers ──────────────────────────────────────────────────────────────────

const readSavedTheme = () => {
  try {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.theme === 'light' || parsed.theme === 'dark') return parsed.theme;
    }
    // fallback: standalone key
    const standalone = localStorage.getItem('theme');
    if (standalone === 'light' || standalone === 'dark') return standalone;
  } catch {}
  // Default: check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

const applyThemeClass = (theme) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

const persistTheme = (theme) => {
  try {
    // update inside userSettings object
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.theme = theme;
      localStorage.setItem('userSettings', JSON.stringify(parsed));
    }
    // also write standalone key
    localStorage.setItem('theme', theme);
  } catch {}
};

// ── Provider ──────────────────────────────────────────────────────────────────

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const saved = readSavedTheme();
    // Apply immediately so there's no flash before first render
    applyThemeClass(saved);
    return saved;
  });

  const setTheme = useCallback((newTheme) => {
    if (newTheme !== 'light' && newTheme !== 'dark') return;
    applyThemeClass(newTheme);
    persistTheme(newTheme);
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return ctx;
};
