import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './translations';

const resources = {
  ar: { translation: translations.ar },
  en: { translation: translations.en },
};

i18n.use(initReactI18next).init({
  resources,
  lng: (() => {
    try {
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.language === 'ar' || parsed.language === 'en') return parsed.language;
      }
      const standalone = localStorage.getItem('lang');
      if (standalone === 'ar' || standalone === 'en') return standalone;
    } catch {}
    return 'ar';
  })(),
  fallbackLng: 'ar',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
