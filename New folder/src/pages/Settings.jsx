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

const Settings = () => {
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();
  
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <ArrowRight className={`w-5 h-5 text-gray-600 dark:text-gray-300 ${lang === 'en' ? 'rotate-180' : ''}`} />
            </button>
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('settings_title')}</h1>
            </div>
            {autoSaveMessage && (
              <span className="text-sm text-green-600 dark:text-green-400 animate-pulse">
                {autoSaveMessage}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{t('save_settings')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Success Message */}
      {success && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
            <span>{success}</span>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* ملاحظة الحفظ التلقائي */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3 flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-blue-700 dark:text-blue-300">
            <strong>{t('auto_saved')}:</strong> {t('auto_save_desc')}
          </p>
        </div>

        {/* المظهر */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('appearance')}</h2>
          </div>
          
          {/* اختيار الثيم */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('theme')}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'light', label: t('light_mode'), IconComponent: Sun },
                { value: 'dark', label: t('dark_mode'), IconComponent: Moon },
                { value: 'system', label: t('system_mode'), IconComponent: Monitor },
              ].map(({ value, label, IconComponent }) => (
                <button
                  key={value}
                  onClick={() => updateSetting(null, 'theme', value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    settings.theme === value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <IconComponent className={`w-6 h-6 ${
                    settings.theme === value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    settings.theme === value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* حجم الخط */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('font_size')}
            </label>
            <div className="flex gap-3">
              {[
                { value: 'small', label: t('small') },
                { value: 'medium', label: t('medium_size') },
                { value: 'large', label: t('large') },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateSetting(null, 'fontSize', value)}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                    settings.fontSize === value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* الإشعارات */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('notifications_title')}</h2>
          </div>
          
          <div className="space-y-4">
            {/* تفعيل الإشعارات */}
            <ToggleItem
              label={t('enable_notifications')}
              description={t('enable_notifications_desc')}
              enabled={settings.notifications.enabled}
              onChange={(val) => updateSetting('notifications', 'enabled', val)}
              icon={settings.notifications.enabled ? Bell : BellOff}
            />
            
            {settings.notifications.enabled && (
              <>
                <ToggleItem
                  label={t('email_notifications')}
                  description={t('email_notifications_desc')}
                  enabled={settings.notifications.email}
                  onChange={(val) => updateSetting('notifications', 'email', val)}
                />
                <ToggleItem
                  label={t('quiz_reminders')}
                  description={t('quiz_reminders_desc')}
                  enabled={settings.notifications.quizReminders}
                  onChange={(val) => updateSetting('notifications', 'quizReminders', val)}
                />
                <ToggleItem
                  label={t('lesson_updates')}
                  description={t('lesson_updates_desc')}
                  enabled={settings.notifications.lessonUpdates}
                  onChange={(val) => updateSetting('notifications', 'lessonUpdates', val)}
                />
                <ToggleItem
                  label={t('weekly_report')}
                  description={t('weekly_report_desc')}
                  enabled={settings.notifications.weeklyReport}
                  onChange={(val) => updateSetting('notifications', 'weeklyReport', val)}
                />
              </>
            )}
          </div>
        </section>

        {/* الصوت */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <Volume2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('sound_title')}</h2>
          </div>
          
          <ToggleItem
            label={t('enable_sound')}
            description={t('enable_sound_desc')}
            enabled={settings.sound.enabled}
            onChange={(val) => updateSetting('sound', 'enabled', val)}
            icon={settings.sound.enabled ? Volume2 : VolumeX}
          />
          
          {settings.sound.enabled && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('volume_level')}: {settings.sound.volume}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.sound.volume}
                onChange={(e) => updateSetting('sound', 'volume', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
            </div>
          )}
        </section>

        {/* اللغة */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
              <Globe className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('language_setting')}</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'ar', label: t('arabic_lang'), flag: '🇪🇬' },
              { value: 'en', label: t('english_lang'), flag: '🇺🇸' },
            ].map(({ value, label, flag }) => (
              <button
                key={value}
                onClick={() => updateSetting(null, 'language', value)}
                className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  settings.language === value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{flag}</span>
                <span className={`font-medium ${
                  settings.language === value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* إعدادات التعلم */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
              <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('learning_settings')}</h2>
          </div>
          
          <div className="space-y-4">
            <ToggleItem
              label={t('auto_play_videos')}
              description={t('auto_play_videos_desc')}
              enabled={settings.learning.autoPlayVideos}
              onChange={(val) => updateSetting('learning', 'autoPlayVideos', val)}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('video_quality')}
              </label>
              <select
                value={settings.learning.videoQuality}
                onChange={(e) => updateSetting('learning', 'videoQuality', e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="auto">{t('quality_auto')}</option>
                <option value="720p">720p HD</option>
                <option value="480p">480p</option>
                <option value="360p">360p ({t('save_data')})</option>
              </select>
            </div>
            
            <ToggleItem
              label={t('wifi_only')}
              description={t('wifi_only_desc')}
              enabled={settings.learning.downloadOverWifi}
              onChange={(val) => updateSetting('learning', 'downloadOverWifi', val)}
            />
          </div>
        </section>

        {/* الخصوصية */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/50 rounded-lg">
              <Shield className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('privacy_title')}</h2>
          </div>
          
          <div className="space-y-4">
            <ToggleItem
              label={t('show_progress')}
              description={t('show_progress_desc')}
              enabled={settings.privacy.showProgress}
              onChange={(val) => updateSetting('privacy', 'showProgress', val)}
            />
            <ToggleItem
              label={t('show_leaderboard')}
              description={t('show_leaderboard_desc')}
              enabled={settings.privacy.showOnLeaderboard}
              onChange={(val) => updateSetting('privacy', 'showOnLeaderboard', val)}
            />
          </div>
        </section>

        {/* إجراءات الحساب */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('account_actions')}</h2>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/admin-dashboard')}
              className="w-full flex items-center justify-center gap-2 p-3 border border-[#103B66]/30
                dark:border-blue-700 rounded-lg text-[#103B66] dark:text-blue-400
                hover:bg-[#103B66]/5 dark:hover:bg-blue-900/20 transition-colors font-medium"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>{t('admin_mode')}</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('logout')}</span>
            </button>
            
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center justify-center gap-2 p-3 border border-red-300 dark:border-red-700 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              <span>{t('delete_account')}</span>
            </button>
          </div>
        </section>
      </main>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t('delete_account')}</h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('delete_account_confirm')}
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    <span>{t('delete')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Toggle Component
const ToggleItem = ({ label, description, enabled, onChange, icon: Icon }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-3">
      {Icon && <Icon className={`w-5 h-5 ${enabled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />}
      <div>
        <p className="font-medium text-gray-800 dark:text-white">{label}</p>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
          enabled ? 'right-1' : 'left-1'
        }`}
      />
    </button>
  </div>
);

export default Settings;
