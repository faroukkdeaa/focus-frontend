import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import {
  ArrowRight, User, Mail, Lock, Loader2, CheckCircle2, AlertCircle, Settings,
  Flame, Trophy, TrendingUp, BookOpen, Clock, Target, RefreshCcw, AlertTriangle,
} from 'lucide-react';
import { isValidEmail, isValidPassword, isValidFullName } from '../utils/validation';
import { useLanguage } from '../context/LanguageContext';

const Profile = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  
  // بيانات المستخدم من localStorage
  const [user, setUser] = useState(null);
  
  // حالات التعديل
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [grade, setGrade] = useState('');
  
  // حالات تغيير كلمة المرور
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // حالات التحميل والرسائل
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // إحصائيات وإنجازات
  const [stats,               setStats]               = useState(null);
  const [achievements,        setAchievements]        = useState([]);
  const [loadingStats,        setLoadingStats]        = useState(false);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [errorStats,          setErrorStats]          = useState(null);
  const [errorAchievements,   setErrorAchievements]   = useState(null);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    setErrorStats(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) { setStats(null); return; }
      const { data } = await api.get('/students/attempts');
      const attempts = data?.quizzesAttempt?.data || data?.quizzesAttempt || [];

      // حساب الإحصائيات من بيانات المحاولات
      const completedLessonsSet = new Set(attempts.map(a => a.lesson_title));
      const totalScore = attempts.reduce((s, a) => s + (a.score || 0), 0);
      const avgScore = attempts.length ? Math.round(totalScore / attempts.length) : 0;

      // حساب سلسلة الاستمرار (بناءً على أيام المحاولات الأخيرة)
      const dates = [...new Set(attempts.map(a => a.created_at?.split(' ')[0]).filter(Boolean))].sort().reverse();
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < dates.length; i++) {
        const d = new Date(dates[i]);
        const diff = Math.floor((today - d) / (1000 * 60 * 60 * 24));
        if (diff <= i + 1) streak++;
        else break;
      }

      setStats({
        streak,
        longestStreak: streak,
        completedLessons: completedLessonsSet.size,
        studyHours: 0,
        avgQuizScore: avgScore,
        totalQuizzes: attempts.length,
      });
    } catch {
      setErrorStats('تعذّر تحميل الإحصائيات.');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchAchievements = useCallback(async () => {
    setLoadingAchievements(true);
    setErrorAchievements(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) { setAchievements([]); return; }
      const { data } = await api.get('/students/attempts');
      const attempts = data?.quizzesAttempt?.data || data?.quizzesAttempt || [];

      // بناء إنجازات بسيطة من بيانات المحاولات
      const badges = [
        { id: 1, emoji: '🎯', title: 'أول اختبار', description: 'أكمل أول اختبار', earned: attempts.length >= 1, earnedDate: attempts[0]?.created_at },
        { id: 2, emoji: '🔥', title: '5 اختبارات', description: 'أكمل 5 اختبارات', earned: attempts.length >= 5 },
        { id: 3, emoji: '⭐', title: '10 اختبارات', description: 'أكمل 10 اختبارات', earned: attempts.length >= 10 },
        { id: 4, emoji: '🏆', title: 'درجة كاملة', description: 'احصل على درجة كاملة في اختبار', earned: attempts.some(a => a.score > 0) },
      ];
      setAchievements(badges.sort((a, b) => Number(b.earned) - Number(a.earned)));
    } catch {
      setErrorAchievements('تعذّر تحميل الإنجازات.');
    } finally {
      setLoadingAchievements(false);
    }
  }, []);

  // fire when user id becomes available
  useEffect(() => {
    if (user?.id) {
      fetchStats();
      fetchAchievements();
    }
  }, [user?.id, fetchStats, fetchAchievements]);

  useEffect(() => {
    const loadUserData = async () => {
      const userJson = localStorage.getItem('user');
      if (!userJson) { navigate('/login'); return; }

      const cached = JSON.parse(userJson);
      // سيّت البيانات المحلية فوراً عشان الصفحة متستناش
      setUser(cached);
      setName(cached.name   || '');
      setEmail(cached.email || '');
      setGrade(cached.grade || '');

      // جلب أحدث بيانات من GET /api/me باستخدام JWT token
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // GET /api/me بيرجع { id, name, email, email_verified_at, ... }
        const { data: fresh } = await api.get('/me');
        // دمج مع البيانات المحلية (grade, role, student_id مش موجودين في /me)
        const merged = { ...cached, name: fresh.name, email: fresh.email };
        setUser(merged);
        setName(fresh.name   || '');
        setEmail(fresh.email || '');
        localStorage.setItem('user', JSON.stringify(merged));
      } catch {
        // token منتهي أو خطأ في الشبكة — نفضل على البيانات المحلية
      }
    };

    loadUserData();
  }, [navigate]);

  // حفظ التغييرات (الاسم والبريد)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // التحقق من صحة البيانات
    if (!isValidFullName(name)) {
      setError('الاسم الكامل يجب أن يكون حرفين على الأقل (عربي أو إنجليزي).');
      return;
    }
    if (!isValidEmail(email)) {
      setError('أدخل بريداً إلكترونياً صحيحاً.');
      return;
    }

    setLoading(true);
    try {
      // تحديث localStorage مباشرة (endpoint تعديل بيانات المستخدم مش موجود في الـ backend لسه)
      const updated = { ...user, name, email };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setSuccess('تم حفظ التغييرات محلياً. (سيتم ربطها بالسيرفر قريباً)');
    } catch (err) {
      console.error('Profile update error:', err);
      setError('فشل حفظ التغييرات. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // تغيير كلمة المرور
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // التحقق من صحة البيانات
    if (!currentPassword) {
      setPasswordError('أدخل كلمة المرور الحالية.');
      return;
    }
    if (!isValidPassword(newPassword)) {
      setPasswordError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمة المرور وتأكيدها غير متطابقتين.');
      return;
    }

    // endpoint تغيير كلمة المرور مش موجود في الـ backend لسه
    setPasswordError('هذه الميزة غير متوفرة حالياً. سيتم إضافتها قريباً.');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-[#103B66] dark:text-blue-400 font-['Cairo'] transition-colors" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-lg font-bold dark:text-white transition-colors">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Cairo'] transition-colors" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-10 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-[#103B66] dark:hover:text-blue-400 transition-colors font-bold"
            >
              <ArrowRight className={`w-5 h-5 ${lang === 'en' ? 'rotate-180' : ''}`} />
              {t('back')}
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-[#103B66] dark:bg-blue-600 p-2 rounded-lg transition-colors">
                <User className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-[#103B66] dark:text-white transition-colors">{t('profile_title')}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
                title={t('settings')}
              >
                <Settings className="w-5 h-5" />
                <span className="hidden md:inline">{t('settings')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ══ SECTION 1 — Stats strip ══ */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
            إحصائياتك
          </h2>

          {errorStats ? (
            <div className="py-4 flex flex-col items-center gap-2 text-center">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{errorStats}</p>
              <button onClick={() => fetchStats()} className="flex items-center gap-1.5 text-sm font-bold text-[#103B66] dark:text-blue-400 hover:underline">
                <RefreshCcw className="w-3.5 h-3.5" /> إعادة المحاولة
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  icon: Flame,
                  label: 'سلسلة الاستمرار',
                  value: loadingStats ? null : stats ? `${stats.streak} يوم` : '—',
                  sub: loadingStats ? null : stats ? `أطول: ${stats.longestStreak} يوم` : null,
                  iconBg: 'bg-orange-100 dark:bg-orange-900/40',
                  iconCls: 'text-orange-500 dark:text-orange-400',
                  border: 'border-t-orange-400',
                },
                {
                  icon: BookOpen,
                  label: 'دروس مكتملة',
                  value: loadingStats ? null : stats ? stats.completedLessons : '—',
                  sub: null,
                  iconBg: 'bg-blue-100 dark:bg-blue-900/40',
                  iconCls: 'text-[#103B66] dark:text-blue-400',
                  border: 'border-t-blue-500',
                },
                {
                  icon: Clock,
                  label: 'ساعات الدراسة',
                  value: loadingStats ? null : stats ? `${stats.studyHours} س` : '—',
                  sub: null,
                  iconBg: 'bg-violet-100 dark:bg-violet-900/40',
                  iconCls: 'text-violet-600 dark:text-violet-400',
                  border: 'border-t-violet-500',
                },
                {
                  icon: Target,
                  label: 'متوسط الاختبارات',
                  value: loadingStats ? null : stats ? `${stats.avgQuizScore}%` : '—',
                  sub: loadingStats ? null : stats ? `${stats.totalQuizzes} اختبار` : null,
                  iconBg: 'bg-green-100 dark:bg-green-900/40',
                  iconCls: 'text-green-600 dark:text-green-400',
                  border: 'border-t-green-500',
                },
              ].map(({ icon: Icon, label, value, sub, iconBg, iconCls, border }) => (
                <div key={label} className={`rounded-xl border-t-4 ${border} bg-gray-50 dark:bg-gray-700/40 p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-tight">{label}</p>
                    <div className={`p-1.5 rounded-lg ${iconBg}`}>
                      <Icon className={`w-3.5 h-3.5 ${iconCls}`} />
                    </div>
                  </div>
                  {loadingStats ? (
                    <div className="h-7 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                  ) : (
                    <p className="text-2xl font-black text-gray-800 dark:text-white leading-none">{value}</p>
                  )}
                  {sub && !loadingStats && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══ SECTION 2 — Achievements / Badges ══ */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            الإنجازات والأوسمة
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
            {achievements.filter(a => a.earned).length} / {achievements.length} وسام محقق
          </p>

          {errorAchievements ? (
            <div className="py-4 flex flex-col items-center gap-2 text-center">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{errorAchievements}</p>
              <button onClick={() => fetchAchievements()} className="flex items-center gap-1.5 text-sm font-bold text-[#103B66] dark:text-blue-400 hover:underline">
                <RefreshCcw className="w-3.5 h-3.5" /> إعادة المحاولة
              </button>
            </div>
          ) : loadingAchievements ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-28 bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : achievements.length === 0 ? (
            <p className="text-center text-gray-400 py-6">لا توجد إنجازات بعد.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {achievements.map(badge => (
                <div
                  key={badge.id}
                  className={`relative rounded-xl border p-4 text-center flex flex-col items-center gap-2 transition-all
                    ${
                      badge.earned
                        ? 'border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 shadow-sm'
                        : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 opacity-50'
                    }`}
                >
                  {/* Lock overlay for unearned */}
                  {!badge.earned && (
                    <span className="absolute top-2 left-2 text-xs">🔒</span>
                  )}
                  <span className="text-3xl leading-none">{badge.emoji}</span>
                  <p className={`text-xs font-black leading-tight ${
                    badge.earned ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {badge.title}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight line-clamp-2">
                    {badge.description}
                  </p>
                  {badge.earned && badge.earnedDate && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                      {new Date(badge.earnedDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══ SECTION 3 — معلومات الحساب (existing) ══ */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2 transition-colors">
            <User className="w-6 h-6 text-[#103B66] dark:text-blue-400 transition-colors" />
            {t('edit_profile')}
          </h2>

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm flex items-center gap-2 transition-colors">
              <CheckCircle2 className="w-4 h-4" />
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-center gap-2 transition-colors">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2 flex items-center gap-2 transition-colors">
                <User className="w-4 h-4" />
                {t('full_name')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#103B66] dark:focus:ring-blue-500 disabled:opacity-60 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2 flex items-center gap-2 transition-colors">
                <Mail className="w-4 h-4" />
                {t('email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#103B66] dark:focus:ring-blue-500 text-left disabled:opacity-60 transition-colors"
                dir="ltr"
                required
              />
            </div>

            <div>
              <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2 transition-colors">{t('grade')}</label>
              <input
                type="text"
                value={grade}
                disabled
                className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-lg px-4 py-3 cursor-not-allowed transition-colors"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 transition-colors">الصف الدراسي لا يمكن تغييره</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#103B66] dark:bg-blue-600 hover:bg-[#0c2d4d] dark:hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors duration-300 shadow-lg mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                t('save_changes')
              )}
            </button>
          </form>
        </div>

        {/* تغيير كلمة المرور */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2 transition-colors">
            <Lock className="w-6 h-6 text-[#103B66] dark:text-blue-400 transition-colors" />
            {t('change_password')}
          </h2>

          {passwordSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm flex items-center gap-2 transition-colors">
              <CheckCircle2 className="w-4 h-4" />
              {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-center gap-2 transition-colors">
              <AlertCircle className="w-4 h-4" />
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2 transition-colors">{t('current_password')}</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={passwordLoading}
                placeholder="••••••••"
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#103B66] dark:focus:ring-blue-500 text-left placeholder:text-right dark:placeholder:text-gray-400 disabled:opacity-60 transition-colors"
                dir="ltr"
                required
              />
            </div>

            <div>
              <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2 transition-colors">{t('new_password')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={passwordLoading}
                placeholder="••••••••"
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#103B66] dark:focus:ring-blue-500 text-left placeholder:text-right dark:placeholder:text-gray-400 disabled:opacity-60 transition-colors"
                dir="ltr"
                required
              />
            </div>

            <div>
              <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2 transition-colors">{t('confirm_new_password')}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={passwordLoading}
                placeholder="••••••••"
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#103B66] dark:focus:ring-blue-500 text-left placeholder:text-right dark:placeholder:text-gray-400 disabled:opacity-60 transition-colors"
                dir="ltr"
                required
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full bg-[#103B66] dark:bg-blue-600 hover:bg-[#0c2d4d] dark:hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors duration-300 shadow-lg mt-4 flex items-center justify-center gap-2"
            >
              {passwordLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('updating')}
                </>
              ) : (
                t('update_password')
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Profile;
