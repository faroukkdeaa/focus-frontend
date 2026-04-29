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

const lightTokens = {
  bg:           "#F8FAFC",
  bgPanel:      "#FFFFFF",
  bgCard:       "#FFFFFF",
  border:       "#E2E8F0",
  borderAccent: "rgba(15,76,129,0.28)",
  borderRed:    "rgba(239,68,68,0.20)",
  accent:       "#0F4C81",
  accentDim:    "rgba(15,76,129,0.08)",
  iconA:        "#0F4C81",
  iconBgA:      "rgba(15,76,129,0.08)",
  iconBorderA:  "rgba(15,76,129,0.18)",
  textPrimary:  "#0F172A",
  textMuted:    "#64748B",
  textDim:      "#94A3B8",
  shadowCard:   "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)",
  redIcon:      "#EF4444",
  redDim:       "rgba(239,68,68,0.08)",
  redBorder:    "rgba(239,68,68,0.18)",
  green:        "#059669",
  greenDim:     "rgba(5,150,105,0.08)",
  greenBorder:  "rgba(5,150,105,0.18)",
  orangeIcon:   "#D97706",
  orangeDim:    "rgba(217,119,6,0.08)",
  orangeBorder: "rgba(217,119,6,0.18)",
  violetIcon:   "#9333EA",
  violetDim:    "rgba(147,51,234,0.08)",
  violetBorder: "rgba(147,51,234,0.18)"
};

const darkTokens = {
  bg:           "#0B1120",
  bgPanel:      "#0D1526",
  bgCard:       "rgba(255,255,255,0.035)",
  border:       "rgba(255,255,255,0.08)",
  borderAccent: "rgba(79,70,229,0.38)",
  borderRed:    "rgba(239,68,68,0.22)",
  accent:       "#4F46E5",
  accentDim:    "rgba(79,70,229,0.14)",
  iconA:        "#38BDF8",
  iconBgA:      "rgba(56,189,248,0.10)",
  iconBorderA:  "rgba(56,189,248,0.22)",
  textPrimary:  "#F8FAFC",
  textMuted:    "#94A3B8",
  textDim:      "#475569",
  shadowCard:   "0 1px 1px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.35)",
  redIcon:      "#F87171",
  redDim:       "rgba(248,113,113,0.10)",
  redBorder:    "rgba(248,113,113,0.20)",
  green:        "#34D399",
  greenDim:     "rgba(52,211,153,0.12)",
  greenBorder:  "rgba(52,211,153,0.22)",
  orangeIcon:   "#F97316",
  orangeDim:    "rgba(249,115,22,0.10)",
  orangeBorder: "rgba(249,115,22,0.20)",
  violetIcon:   "#A855F7",
  violetDim:    "rgba(168,85,247,0.10)",
  violetBorder: "rgba(168,85,247,0.20)"
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

  const isDarkMode = theme === 'dark';
  const C = isDarkMode ? darkTokens : lightTokens;

  const glass = useCallback((extra = {}) => ({
    background:   C.bgCard,
    border:       `1px solid ${C.border}`,
    borderRadius: "16px",
    boxShadow:    C.shadowCard,
    ...extra,
  }), [C]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDarkMode, C, glass }}>
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
