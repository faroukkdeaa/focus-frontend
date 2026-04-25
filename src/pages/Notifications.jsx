import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, ArrowRight, CheckCheck, BookOpen, AlertTriangle, Award, Info,
  Inbox,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../hooks/useNotifications';
import { relativeTime } from '../utils/time';

// ── Type meta (mirrors NotificationBell) ─────────────────────────────────────
const TYPE_META = {
  lesson:   { Icon: BookOpen,      bg: 'bg-blue-100  dark:bg-blue-900/40',    icon: 'text-blue-600  dark:text-blue-400'    },
  weakness: { Icon: AlertTriangle, bg: 'bg-amber-100 dark:bg-amber-900/40',   icon: 'text-amber-500 dark:text-amber-400'   },
  quiz:     { Icon: Award,         bg: 'bg-purple-100 dark:bg-purple-900/40', icon: 'text-purple-600 dark:text-purple-400' },
  system:   { Icon: Info,          bg: 'bg-slate-100 dark:bg-slate-700/50',   icon: 'text-slate-500 dark:text-slate-400'   },
};

// ── Filter definitions ────────────────────────────────────────────────────────
const FILTER_KEYS = ['all', 'unread', 'lessons', 'system_actions'];

const filterFn = (filter) => (n) => {
  if (filter === 'all')            return true;
  if (filter === 'unread')         return !n.isRead;
  if (filter === 'lessons')        return n.type === 'lesson';
  if (filter === 'system_actions') return n.type === 'system' || n.type === 'quiz' || n.type === 'weakness';
  return true;
};

// ── Group label keys ──────────────────────────────────────────────────────────
const GROUP_ORDER  = ['today', 'yesterday', 'last_week'];

// ── Single Notification Item ──────────────────────────────────────────────────
const NotifRow = ({ notif, onRead }) => {
  const navigate  = useNavigate();
  const { lang }  = useLanguage();
  const meta      = TYPE_META[notif.type] ?? TYPE_META.system;
  const { Icon }  = meta;

  const title = lang === 'ar' ? notif.title_ar : notif.title_en;
  const body  = lang === 'ar' ? notif.body_ar  : notif.body_en;

  const handleClick = () => {
    onRead(notif.id);

    if (notif.link === '/course-details') {
      const lessonId = notif.lesson?.id ?? notif.lessonId ?? null;
      const teacherId = notif.teacherId ?? notif.lesson?.teacher_id ?? notif.lesson?.teacherId ?? null;

      if (lessonId != null && teacherId != null) {
        const courseDetailsPath = `/course-details?lessonId=${encodeURIComponent(String(lessonId))}&teacherId=${encodeURIComponent(String(teacherId))}&subjectId=${encodeURIComponent(String(notif.subjectId ?? ''))}`;
        navigate(courseDetailsPath, {
          state: {
            lesson: notif.lesson ?? null,
            subjectId: notif.subjectId ?? null,
            subjectName: notif.subjectName ?? '',
            teacherId,
          },
        });
      } else {
        navigate('/dashboard');
      }
      return;
    }

    navigate(notif.link);
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-start flex items-start gap-4 px-5 py-4 rounded-2xl
        transition-all group border
        ${notif.isRead
          ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700/50 hover:shadow-sm'
          : 'bg-blue-50/70 dark:bg-blue-900/20 border-blue-200/60 dark:border-blue-700/40 hover:bg-blue-100/60 dark:hover:bg-blue-900/30'
        }`}
    >
      {/* Icon circle */}
      <div className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center
        shadow-sm ${meta.bg} group-hover:scale-105 transition-transform`}>
        <Icon className={`w-5 h-5 ${meta.icon}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className={`text-sm font-bold leading-snug
            ${notif.isRead ? 'text-gray-700 dark:text-gray-200' : 'text-gray-900 dark:text-white'}`}>
            {title}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
              {relativeTime(notif.ts, lang)}
            </span>
            {!notif.isRead && (
              <span className="w-2 h-2 rounded-full bg-blue-500 mt-0.5" />
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
          {body}
        </p>
      </div>
    </button>
  );
};

// ── Notifications Page ────────────────────────────────────────────────────────
const Notifications = () => {
  const navigate  = useNavigate();
  const { t, lang } = useLanguage();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [activeFilter, setActiveFilter] = useState('all');
  const isRtl = lang === 'ar';

  const filtered = notifications.filter(filterFn(activeFilter));

  // Group filtered notifications by date group, preserving order
  const grouped = GROUP_ORDER.reduce((acc, grp) => {
    const items = filtered.filter(n => n.group === grp);
    if (items.length) acc[grp] = items;
    return acc;
  }, {});

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Cairo']"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ═══════════ HEADER ═══════════ */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowRight className={`w-5 h-5 text-gray-500 dark:text-gray-400 ${isRtl ? '' : 'rotate-180'}`} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-[#103B66] dark:text-blue-400 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                {t('notif_page_title')}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('notif_page_subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#103B66]
                  dark:text-blue-400 hover:underline transition"
              >
                <CheckCheck className="w-4 h-4" />
                {t('mark_all_read')}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ═══════════ FILTER TABS ═══════════ */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100
          dark:border-gray-700 p-2 flex gap-1 overflow-x-auto shadow-sm">
          {FILTER_KEYS.map(key => {
            const isActive = activeFilter === key;
            // Compute badge count per filter
            const count = key === 'unread'
              ? notifications.filter(n => !n.isRead).length
              : notifications.filter(filterFn(key)).length;

            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-xl text-sm
                  font-bold transition-all flex-shrink-0
                  ${isActive
                    ? 'bg-[#103B66] dark:bg-blue-600 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                {t(`notif_filter_${key}`)}
                {count > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full
                    ${isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile mark-all button */}
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="sm:hidden flex items-center gap-2 text-sm font-bold text-[#103B66]
              dark:text-blue-400 hover:underline transition"
          >
            <CheckCheck className="w-4 h-4" />
            {t('mark_all_read')}
          </button>
        )}

        {/* ═══════════ EMPTY STATE ═══════════ */}
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center
              justify-center mx-auto mb-4 shadow-inner">
              <Inbox className="w-9 h-9 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-base font-bold text-gray-400 dark:text-gray-500">
              {t('no_notifications')}
            </p>
          </div>
        )}

        {/* ═══════════ DATE GROUPS ═══════════ */}
        {Object.entries(grouped).map(([grp, items]) => (
          <div key={grp} className="space-y-2">
            {/* Group label */}
            <div className="flex items-center gap-3 px-1">
              <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">
                {t(`notif_${grp}`)}
              </span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Items */}
            <div className="space-y-2">
              {items.map(n => (
                <NotifRow key={n.id} notif={n} onRead={markAsRead} />
              ))}
            </div>
          </div>
        ))}

        {/* Bottom spacer */}
        <div className="h-6" />
      </main>
    </div>
  );
};

export default Notifications;
