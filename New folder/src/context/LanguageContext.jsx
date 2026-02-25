import { createContext, useContext, useState, useCallback } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext(null);

// ── Helpers ──────────────────────────────────────────────────────────────────

const readSavedLang = () => {
  try {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.language === 'en' || parsed.language === 'ar') return parsed.language;
    }
    // fallback: standalone key
    const standalone = localStorage.getItem('lang');
    if (standalone === 'en' || standalone === 'ar') return standalone;
  } catch {}
  return 'ar';
};

const applyDOMDirection = (lang) => {
  const root = document.documentElement;
  root.setAttribute('lang', lang);
  root.setAttribute('dir', lang === 'en' ? 'ltr' : 'rtl');
};

const persistLang = (lang) => {
  try {
    // update inside userSettings object (used by Settings page)
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.language = lang;
      localStorage.setItem('userSettings', JSON.stringify(parsed));
    }
    // also write standalone key for fast init reads
    localStorage.setItem('lang', lang);
  } catch {}
};

// ── Provider ──────────────────────────────────────────────────────────────────

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    const saved = readSavedLang();
    // Apply immediately so there's no flash before first render
    applyDOMDirection(saved);
    return saved;
  });

  const setLang = useCallback((newLang) => {
    if (newLang !== 'ar' && newLang !== 'en') return;
    applyDOMDirection(newLang);
    persistLang(newLang);
    setLangState(newLang);
  }, []);

  /** Translate key → string for current language, falls back to Arabic */
  const t = useCallback(
    (key) => translations[lang]?.[key] ?? translations['ar']?.[key] ?? key,
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used inside <LanguageProvider>');
  }
  return ctx;
};
