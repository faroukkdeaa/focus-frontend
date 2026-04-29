import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Bell,
  BellOff,
  Globe,
  Volume2,
  VolumeX,
  Monitor,
  Smartphone,
  Save,
  CheckCircle2,
  Loader2,
  Palette,
  Eye,
  Clock,
  Shield,
  Trash2,
  LogOut,
  ChevronLeft,
  LayoutDashboard,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

/* ════════════════════════════════════════════════════
   THEME FACTORY
════════════════════════════════════════════════════ */
function buildTheme(dark) {
  return dark
    ? {
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
        orangeDim:    "rgba(249,115,22,0.1)",
        orangeIcon:   "#F97316",
        purpleDim:    "rgba(168,85,247,0.1)",
        purpleIcon:   "#A855F7",
        indigoDim:    "rgba(99,102,241,0.1)",
        indigoIcon:   "#6366F1",
        tealDim:      "rgba(20,184,166,0.1)",
        tealIcon:     "#14B8A6",
      }
    : {
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
        orangeDim:    "rgba(217,119,6,0.08)",
        orangeIcon:   "#D97706",
        purpleDim:    "rgba(147,51,234,0.08)",
        purpleIcon:   "#9333EA",
        indigoDim:    "rgba(79,70,229,0.08)",
        indigoIcon:   "#4F46E5",
        tealDim:      "rgba(13,148,136,0.08)",
        tealIcon:     "#0D9488",
      };
}

const glass = (T, extra) => ({
  background:   T.bgCard,
  border:       `1px solid ${T.border}`,
  borderRadius: "16px",
  boxShadow:    T.shadowCard,
  ...extra,
});

const transition = {
  transition: "all 0.25s ease",
};

const Settings = () => {
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const T = buildTheme(isDark);
  
  // حالة الإعدادات
  const [settings, setSettings] = useState({
    // المظهر
    theme: 'light', // light, dark, system
    fontSize: 'medium', // small, medium, large
    
    // الإشعارات
    notifications: {
      enabled: true,
      email: true,
      push: true,
      quizReminders: true,
      lessonUpdates: true,
      weeklyReport: true,
    },
    
    // الصوت
    sound: {
      enabled: true,
      volume: 80,
    },
    
    // اللغة
    language: 'ar', // ar, en
    
    // الخصوصية
    privacy: {
      showProgress: true,
      showOnLeaderboard: true,
    },
    
    // التعلم
    learning: {
      autoPlayVideos: true,
      videoQuality: 'auto', // auto, 720p, 480p, 360p
      downloadOverWifi: true,
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [autoSaveMessage, setAutoSaveMessage] = useState('');

  // تطبيق الثيم
  const applyTheme = useCallback((theme) => {
    console.log('Applying theme:', theme);
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      console.log('Dark mode activated');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      console.log('Light mode activated');
    } else {
      // system theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
      localStorage.setItem('theme', 'system');
      console.log('System theme activated, prefersDark:', prefersDark);
    }
    
    console.log('HTML classes after theme change:', document.documentElement.className);
  }, []);

  // تطبيق حجم الخط
  const applyFontSize = useCallback((fontSize) => {
    const root = document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    
    if (fontSize === 'small') {
      root.classList.add('text-sm');
    } else if (fontSize === 'large') {
      root.classList.add('text-lg');
    } else {
      root.classList.add('text-base');
    }
    
    localStorage.setItem('fontSize', fontSize);
  }, []);

  // تطبيق اللغة
  const applyLanguage = useCallback((language) => {
    const root = document.documentElement;
    if (language === 'en') {
      root.setAttribute('dir', 'ltr');
      root.setAttribute('lang', 'en');
    } else {
      root.setAttribute('dir', 'rtl');
      root.setAttribute('lang', 'ar');
    }
    localStorage.setItem('language', language);
  }, []);

  // تحميل الإعدادات من localStorage عند بدء الصفحة
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        
        // تطبيق الإعدادات المحفوظة
        applyTheme(parsedSettings.theme);
        applyFontSize(parsedSettings.fontSize);
        applyLanguage(parsedSettings.language);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, [applyTheme, applyFontSize, applyLanguage]);

  // حفظ الإعدادات
  const handleSaveSettings = async () => {
    setLoading(true);
    setSuccess('');
    
    try {
      // محاكاة حفظ في الباكند
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // حفظ في localStorage
      localStorage.setItem('userSettings', JSON.stringify(settings));
      
      setSuccess(t('settings_saved') + '!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // تغيير إعداد معين وتطبيقه مباشرة
  const updateSetting = useCallback((category, key, value) => {
    let newSettings;
    
    if (category) {
      newSettings = {
        ...settings,
        [category]: {
          ...settings[category],
          [key]: value
        }
      };
    } else {
      newSettings = {
        ...settings,
        [key]: value
      };
    }
    
    // تطبيق التغيير مباشرة حسب النوع - قبل تحديث الـ state
    if (key === 'theme') {
      applyTheme(value);
    } else if (key === 'fontSize') {
      applyFontSize(value);
    } else if (key === 'language') {
      applyLanguage(value);
      setLang(value); // sync LanguageContext state
    }
    
    // تحديث الـ state
    setSettings(newSettings);
    
    // تشغيل صوت تأكيد إذا كانت الأصوات مفعلة
    if (newSettings.sound.enabled && key !== 'enabled') {
      playClickSound(newSettings.sound.volume);
    }
    
    // حفظ تلقائياً
    localStorage.setItem('userSettings', JSON.stringify(newSettings));
    
    // إظهار رسالة حفظ تلقائي
    setAutoSaveMessage(t('settings_saved') + ' ✓');
    setTimeout(() => setAutoSaveMessage(''), 2000);
  }, [settings, applyTheme, applyFontSize, applyLanguage]);

  // تشغيل صوت بسيط
  const playClickSound = (volume = 80) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.value = (volume / 100) * 0.1;
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.05);
    } catch (error) {
      console.log('Audio not supported:', error);
    }
  };

  // تسجيل الخروج
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // حذف الحساب (محاكاة)
  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      localStorage.clear();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const navItems = [
    { id: 'appearance', icon: Palette, label: t('appearance') },
    { id: 'notifications', icon: Bell, label: t('notifications_title') },
    { id: 'sound', icon: Volume2, label: t('sound_title') },
    { id: 'language', icon: Globe, label: t('language_setting') },
    { id: 'learning', icon: Eye, label: t('learning_settings') },
    { id: 'privacy', icon: Shield, label: t('privacy_title') },
    { id: 'account', icon: Shield, label: t('account_actions') },
  ];

  return (
    <div style={{ ...transition, background: T.bg, minHeight: "100vh", fontFamily: "'Cairo', sans-serif" }} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header
        style={{
          ...transition,
          position: "sticky", top: 0, zIndex: 30,
          background: isDark ? "rgba(11,17,32,0.88)" : "rgba(248,250,252,0.90)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div style={{ maxWidth: "1152px", margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyItems: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                ...transition,
                display: "flex", alignItems: "center", gap: "6px",
                background: "transparent", border: "none", cursor: "pointer",
                color: T.textMuted, fontSize: "0.875rem", fontWeight: 700
              }}
              onMouseEnter={e => e.currentTarget.style.color = T.textPrimary}
              onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
            >
              <ArrowRight style={{ width: "16px", height: "16px", ...(lang === 'en' ? { transform: "rotate(180deg)" } : {}) }} />
            </button>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: T.iconBgA, border: `1px solid ${T.iconBorderA}`, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
              <SettingsIcon style={{ width: "16px", height: "16px", color: T.iconA }} />
            </div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: T.textPrimary }}>{t('settings_title')}</h1>
            
            {autoSaveMessage && (
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: T.green, opacity: 0.8 }} className="animate-pulse">
                {autoSaveMessage}
              </span>
            )}
          </div>
          

        </div>
      </header>

      {/* Success Message */}
      {success && (
        <div style={{ maxWidth: "1152px", margin: "16px auto 0", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: T.greenDim, border: `1px solid ${T.greenBorder}`, color: T.green, padding: "12px 16px", borderRadius: "12px", fontSize: "0.875rem", fontWeight: 700 }}>
            <CheckCircle2 style={{ width: "20px", height: "20px" }} />
            <span>{success}</span>
          </div>
        </div>
      )}

      <main style={{ maxWidth: "1152px", margin: "0 auto", padding: "32px 24px", display: "flex", gap: "32px", alignItems: "flex-start", flexWrap: "wrap" }}>
        
        {/* Sidebar Nav */}
        <aside style={{ flexShrink: 0, width: "100%", maxWidth: "260px", position: "sticky", top: "100px" }}>
          <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {navItems.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                style={{
                  ...transition,
                  display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "10px",
                  textDecoration: "none", color: T.textMuted, fontSize: "0.875rem", fontWeight: 700
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = T.bgPanel;
                  e.currentTarget.style.color = T.textPrimary;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = T.textMuted;
                }}
              >
                <item.icon style={{ width: "18px", height: "18px" }} />
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <div style={{ flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "32px", paddingBottom: "128px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", borderRadius: "12px", background: T.iconBgA, border: `1px solid ${T.iconBorderA}`, color: T.iconA, fontSize: "0.875rem" }}>
            <CheckCircle2 style={{ width: "16px", height: "16px", flexShrink: 0 }} />
            <p><strong>{t('auto_saved')}:</strong> {t('auto_save_desc')}</p>
          </div>

          {/* المظهر */}
          <section id="appearance" style={{ ...glass(T, { padding: "32px" }), scrollMarginTop: "100px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: T.purpleDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Palette style={{ width: "18px", height: "18px", color: T.purpleIcon }} />
              </div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: T.textPrimary }}>{t('appearance')}</h2>
            </div>
            
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: T.textMuted, marginBottom: "12px" }}>{t('theme')}</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "12px" }}>
                {[
                  { value: 'light', label: t('light_mode'), IconComponent: Sun },
                  { value: 'dark', label: t('dark_mode'), IconComponent: Moon },
                  { value: 'system', label: t('system_mode'), IconComponent: Monitor },
                ].map(({ value, label, IconComponent }) => (
                  <button
                    key={value}
                    onClick={() => updateSetting(null, 'theme', value)}
                    style={{
                      ...transition,
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "16px", borderRadius: "12px",
                      background: settings.theme === value ? T.iconBgA : T.bgPanel,
                      border: `1px solid ${settings.theme === value ? T.iconBorderA : T.border}`,
                      color: settings.theme === value ? T.iconA : T.textMuted, cursor: "pointer"
                    }}
                  >
                    <IconComponent style={{ width: "24px", height: "24px" }} />
                    <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: T.textMuted, marginBottom: "12px" }}>{t('font_size')}</label>
              <div style={{ display: "flex", gap: "12px" }}>
                {[
                  { value: 'small', label: t('small') },
                  { value: 'medium', label: t('medium_size') },
                  { value: 'large', label: t('large') },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => updateSetting(null, 'fontSize', value)}
                    style={{
                      ...transition,
                      flex: 1, padding: "10px", borderRadius: "8px",
                      background: settings.fontSize === value ? T.iconBgA : T.bgPanel,
                      border: `1px solid ${settings.fontSize === value ? T.iconBorderA : T.border}`,
                      color: settings.fontSize === value ? T.iconA : T.textMuted, fontSize: "0.875rem", fontWeight: 700, cursor: "pointer"
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* الإشعارات */}
          <section id="notifications" style={{ ...glass(T, { padding: "32px" }), scrollMarginTop: "100px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: T.iconBgA, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                <Bell style={{ width: "18px", height: "18px", color: T.iconA }} />
              </div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: T.textPrimary }}>{t('notifications_title')}</h2>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <ToggleItem
                T={T}
                label={t('enable_notifications')}
                description={t('enable_notifications_desc')}
                enabled={settings.notifications.enabled}
                onChange={(val) => updateSetting('notifications', 'enabled', val)}
                icon={settings.notifications.enabled ? Bell : BellOff}
              />
              
              {settings.notifications.enabled && (
                <div style={{ paddingLeft: lang === 'ar' ? 0 : "36px", paddingRight: lang === 'ar' ? "36px" : 0, display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
                  <ToggleItem T={T} label={t('email_notifications')} description={t('email_notifications_desc')} enabled={settings.notifications.email} onChange={(val) => updateSetting('notifications', 'email', val)} />
                  <ToggleItem T={T} label={t('quiz_reminders')} description={t('quiz_reminders_desc')} enabled={settings.notifications.quizReminders} onChange={(val) => updateSetting('notifications', 'quizReminders', val)} />
                  <ToggleItem T={T} label={t('lesson_updates')} description={t('lesson_updates_desc')} enabled={settings.notifications.lessonUpdates} onChange={(val) => updateSetting('notifications', 'lessonUpdates', val)} />
                  <ToggleItem T={T} label={t('weekly_report')} description={t('weekly_report_desc')} enabled={settings.notifications.weeklyReport} onChange={(val) => updateSetting('notifications', 'weeklyReport', val)} />
                </div>
              )}
            </div>
          </section>

          {/* الصوت */}
          <section id="sound" style={{ ...glass(T, { padding: "32px" }), scrollMarginTop: "100px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: T.greenDim, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                <Volume2 style={{ width: "18px", height: "18px", color: T.green }} />
              </div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: T.textPrimary }}>{t('sound_title')}</h2>
            </div>
            
            <ToggleItem
              T={T}
              label={t('enable_sound')}
              description={t('enable_sound_desc')}
              enabled={settings.sound.enabled}
              onChange={(val) => updateSetting('sound', 'enabled', val)}
              icon={settings.sound.enabled ? Volume2 : VolumeX}
            />
            
            {settings.sound.enabled && (
              <div style={{ marginTop: "16px", padding: "16px", background: T.bgPanel, border: `1px solid ${T.border}`, borderRadius: "12px" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: T.textMuted, marginBottom: "12px" }}>
                  {t('volume_level')}: {settings.sound.volume}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.sound.volume}
                  onChange={(e) => updateSetting('sound', 'volume', parseInt(e.target.value))}
                  style={{ width: "100%", cursor: "pointer", accentColor: T.green }}
                />
              </div>
            )}
          </section>

          {/* اللغة */}
          <section id="language" style={{ ...glass(T, { padding: "32px" }), scrollMarginTop: "100px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: T.orangeDim, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                <Globe style={{ width: "18px", height: "18px", color: T.orangeIcon }} />
              </div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: T.textPrimary }}>{t('language_setting')}</h2>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
              {[
                { value: 'ar', label: t('arabic_lang'), flag: '🇪🇬' },
                { value: 'en', label: t('english_lang'), flag: '🇺🇸' },
              ].map(({ value, label, flag }) => (
                <button
                  key={value}
                  onClick={() => updateSetting(null, 'language', value)}
                  style={{
                    ...transition,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "16px", borderRadius: "12px",
                    background: settings.language === value ? T.iconBgA : T.bgPanel,
                    border: `1px solid ${settings.language === value ? T.iconBorderA : T.border}`,
                    color: settings.language === value ? T.iconA : T.textMuted, cursor: "pointer"
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>{flag}</span>
                  <span style={{ fontSize: "1rem", fontWeight: 700 }}>{label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* إعدادات التعلم */}
          <section id="learning" style={{ ...glass(T, { padding: "32px" }), scrollMarginTop: "100px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: T.indigoDim, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                <Eye style={{ width: "18px", height: "18px", color: T.indigoIcon }} />
              </div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: T.textPrimary }}>{t('learning_settings')}</h2>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <ToggleItem
                T={T}
                label={t('auto_play_videos')}
                description={t('auto_play_videos_desc')}
                enabled={settings.learning.autoPlayVideos}
                onChange={(val) => updateSetting('learning', 'autoPlayVideos', val)}
              />
              
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: T.textMuted, marginBottom: "8px" }}>
                  {t('video_quality')}
                </label>
                <select
                  value={settings.learning.videoQuality}
                  onChange={(e) => updateSetting('learning', 'videoQuality', e.target.value)}
                  style={{
                    ...transition,
                    width: "100%", padding: "12px 16px", borderRadius: "8px", background: T.bgPanel,
                    border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: "0.875rem", fontWeight: 600, outline: "none"
                  }}
                >
                  <option value="auto">{t('quality_auto')}</option>
                  <option value="720p">720p HD</option>
                  <option value="480p">480p</option>
                  <option value="360p">360p ({t('save_data')})</option>
                </select>
              </div>
              
              <ToggleItem
                T={T}
                label={t('wifi_only')}
                description={t('wifi_only_desc')}
                enabled={settings.learning.downloadOverWifi}
                onChange={(val) => updateSetting('learning', 'downloadOverWifi', val)}
              />
            </div>
          </section>

          {/* الخصوصية */}
          <section id="privacy" style={{ ...glass(T, { padding: "32px" }), scrollMarginTop: "100px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: T.tealDim, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                <Shield style={{ width: "18px", height: "18px", color: T.tealIcon }} />
              </div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: T.textPrimary }}>{t('privacy_title')}</h2>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <ToggleItem
                T={T}
                label={t('show_progress')}
                description={t('show_progress_desc')}
                enabled={settings.privacy.showProgress}
                onChange={(val) => updateSetting('privacy', 'showProgress', val)}
              />
              <ToggleItem
                T={T}
                label={t('show_leaderboard')}
                description={t('show_leaderboard_desc')}
                enabled={settings.privacy.showOnLeaderboard}
                onChange={(val) => updateSetting('privacy', 'showOnLeaderboard', val)}
              />
            </div>
          </section>

          {/* إجراءات الحساب */}
          <section id="account" style={{ ...glass(T, { padding: "32px" }), scrollMarginTop: "100px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: T.redDim, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                <Shield style={{ width: "18px", height: "18px", color: T.redIcon }} />
              </div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: T.textPrimary }}>{t('account_actions')}</h2>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                onClick={() => navigate('/admin-dashboard')}
                style={{
                  ...transition,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", borderRadius: "10px",
                  background: "transparent", border: `1px solid ${T.borderAccent}`, color: T.accent, fontSize: "0.875rem", fontWeight: 700, cursor: "pointer"
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.accentDim}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <LayoutDashboard style={{ width: "18px", height: "18px" }} />
                <span>{t('admin_mode')}</span>
              </button>

              <button
                onClick={handleLogout}
                style={{
                  ...transition,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", borderRadius: "10px",
                  background: "transparent", border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: "0.875rem", fontWeight: 700, cursor: "pointer"
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.bgPanel}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <LogOut style={{ width: "18px", height: "18px" }} />
                <span>{t('logout')}</span>
              </button>
            </div>
          </section>

          {/* Danger Zone */}
          <section id="danger-zone" style={{ ...glass(T, { padding: "32px", borderColor: "rgba(244, 63, 94, 0.2)" }) }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: T.redIcon }}>منطقة الخطر (Danger Zone)</h2>
            </div>
            <p style={{ fontSize: "0.875rem", color: T.textMuted, marginBottom: "24px" }}>
              الإجراءات هنا لا يمكن التراجع عنها. يرجى توخي الحذر عند استخدامها.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{
                  ...transition,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", borderRadius: "10px",
                  background: T.redDim, border: `1px solid ${T.redBorder}`, color: T.redIcon, fontSize: "0.875rem", fontWeight: 700, cursor: "pointer"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(244, 63, 94, 0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.redDim; }}
              >
                <Trash2 style={{ width: "18px", height: "18px" }} />
                <span>{t('delete_account')}</span>
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "16px" }}>
          <div style={{ ...glass(T, { background: T.bg }), padding: "32px", maxWidth: "440px", width: "100%", borderRadius: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: T.redDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trash2 style={{ width: "24px", height: "24px", color: T.redIcon }} />
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: T.textPrimary }}>{t('delete_account')}</h3>
            </div>
            
            <p style={{ fontSize: "0.875rem", color: T.textMuted, lineHeight: 1.6, marginBottom: "32px" }}>
              {t('delete_account_confirm')}
            </p>
            
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  ...transition,
                  flex: 1, padding: "12px", borderRadius: "10px", background: "transparent", border: `1px solid ${T.border}`,
                  color: T.textPrimary, fontSize: "0.875rem", fontWeight: 700, cursor: "pointer"
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.bgPanel}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                style={{
                  ...transition,
                  flex: 1, padding: "12px", borderRadius: "10px", background: T.redIcon, border: "none",
                  color: "#FFF", fontSize: "0.875rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} /> : <Trash2 style={{ width: "18px", height: "18px" }} />}
                <span>{t('delete')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Toggle Component
const ToggleItem = ({ label, description, enabled, onChange, icon: Icon, T }) => {
  const isDark = T.bg === "#0B1120";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, paddingLeft: "16px" }}>
        {Icon && <Icon style={{ width: "20px", height: "20px", color: enabled ? T.accent : T.textMuted }} />}
        <div>
          <p style={{ fontWeight: 700, color: T.textPrimary, fontSize: "0.875rem" }}>{label}</p>
          {description && (
            <p style={{ fontSize: "0.75rem", color: T.textMuted, marginTop: "4px" }}>{description}</p>
          )}
        </div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        style={{
          ...transition,
          position: "relative", width: "44px", height: "24px", borderRadius: "999px",
          background: enabled ? T.accent : T.border,
          border: "none", cursor: "pointer", flexShrink: 0
        }}
      >
        <span
          style={{
            ...transition,
            position: "absolute", top: "2px", width: "20px", height: "20px",
            background: "#FFFFFF", borderRadius: "50%",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            insetInlineEnd: enabled ? "2px" : "calc(100% - 22px)"
          }}
        />
      </button>
    </div>
  );
};

export default Settings;
