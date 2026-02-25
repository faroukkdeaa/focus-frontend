import { createContext, useState, useCallback } from 'react';

// ── Mock Notification Data ────────────────────────────────────────────────────
// Timestamps are relative to "now" so they always show sensible relative times.

const NOW = Date.now();
const h  = (n) => NOW - n * 3600 * 1000;   // n hours ago
const d  = (n) => NOW - n * 86400 * 1000;  // n days ago

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: 'lesson',
    title_ar: 'درس فيزياء جديد',
    title_en: "New Physics Lesson",
    body_ar:  "أ. أحمد رفع درس «القانون الثاني لنيوتن». شاهده الآن!",
    body_en:  "Mr. Ahmed uploaded 'Newton's 2nd Law'. Watch it now!",
    link:     '/course-details',
    isRead:   false,
    ts:       h(2),
    group:    'today',
  },
  {
    id: 2,
    type: 'weakness',
    title_ar: 'تنبيه نقطة ضعف',
    title_en: 'Weakness Alert',
    body_ar:  'رصد الذكاء الاصطناعي ضعفاً في «الاحتمالات». راجع التقرير.',
    body_en:  'AI detected a weakness in "Probability". Check your report.',
    link:     '/weakness-report',
    isRead:   false,
    ts:       h(5),
    group:    'today',
  },
  {
    id: 3,
    type: 'quiz',
    title_ar: 'نتيجة اختبارك جاهزة',
    title_en: 'Quiz Result Ready',
    body_ar:  'حصلت على 85% في اختبار الكيمياء العضوية. عمل رائع! 🎉',
    body_en:  'You scored 85% in Organic Chemistry quiz. Great job! 🎉',
    link:     '/quiz-results',
    isRead:   false,
    ts:       d(1),
    group:    'yesterday',
  },
  {
    id: 4,
    type: 'lesson',
    title_ar: 'فيديو جديد في الرياضيات',
    title_en: 'New Math Video',
    body_ar:  'أ. سارة رفعت درس «التفاضل والتكامل — الجزء الثاني».',
    body_en:  "Ms. Sara uploaded 'Calculus — Part 2'. Watch it now!",
    link:     '/course-details',
    isRead:   true,
    ts:       d(2),
    group:    'last_week',
  },
  {
    id: 5,
    type: 'system',
    title_ar: 'تحديث جدول الامتحانات',
    title_en: 'Exam Schedule Updated',
    body_ar:  'تم تحديث جدول امتحانات الثانوية العامة. تحقق من الجدول الجديد.',
    body_en:  'The Thanaweya Amma exam schedule has been updated.',
    link:     '/dashboard',
    isRead:   true,
    ts:       d(3),
    group:    'last_week',
  },
  {
    id: 6,
    type: 'quiz',
    title_ar: 'تذكير: اختبار الأحياء',
    title_en: 'Reminder: Biology Quiz',
    body_ar:  'لا تنسَ أداء اختبار الأحياء الخاص بك — ينتهي قريباً!',
    body_en:  "Don't forget your Biology quiz — it expires soon!",
    link:     '/quiz',
    isRead:   false,
    ts:       d(5),
    group:    'last_week',
  },
];

// ── Context ───────────────────────────────────────────────────────────────────
const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

// ── Internal hook (re-exported from hooks/useNotifications.js) ───────────────
export const NotificationContext_internal = NotificationContext;
