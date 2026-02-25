import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'

// تطبيق الإعدادات المحفوظة عند بدء التطبيق
const applyInitialSettings = () => {
  try {
    const savedSettings = localStorage.getItem('userSettings');
    
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      
      // تطبيق الثيم
      const theme = settings.theme || 'light';
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
      }
      
      // تطبيق حجم الخط
      const fontSize = settings.fontSize || 'medium';
      document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg');
      if (fontSize === 'small') {
        document.documentElement.classList.add('text-sm');
      } else if (fontSize === 'large') {
        document.documentElement.classList.add('text-lg');
      } else {
        document.documentElement.classList.add('text-base');
      }
      
      // تطبيق اللغة
      const language = settings.language || 'ar';
      if (language === 'en') {
        document.documentElement.setAttribute('dir', 'ltr');
        document.documentElement.setAttribute('lang', 'en');
      } else {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.setAttribute('lang', 'ar');
      }
    } else {
      // الإعدادات الافتراضية
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
      document.documentElement.classList.add('text-base');
    }
  } catch (e) {
    console.error('Error applying initial settings:', e);
  }
};

// تطبيق الإعدادات قبل رندر التطبيق
applyInitialSettings();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </LanguageProvider>
  </StrictMode>,
)
