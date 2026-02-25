import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, BookOpen, AlertTriangle, Award, Info, CheckCheck, ArrowLeft,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../hooks/useNotifications';
import { relativeTime } from '../utils/time';

// ── Icon / color map per notification type ────────────────────────────────────
const TYPE_META = {
  lesson:   { Icon: BookOpen,      bg: 'bg-blue-100  dark:bg-blue-900/40',   icon: 'text-blue-600  dark:text-blue-400'   },
  weakness: { Icon: AlertTriangle, bg: 'bg-amber-100 dark:bg-amber-900/40',  icon: 'text-amber-500 dark:text-amber-400'  },
  quiz:     { Icon: Award,         bg: 'bg-purple-100 dark:bg-purple-900/40',icon: 'text-purple-600 dark:text-purple-400'},
  system:   { Icon: Info,          bg: 'bg-slate-100 dark:bg-slate-700/50',  icon: 'text-slate-500 dark:text-slate-400'  },
};

// ── Single notification row (used in both dropdown and full page) ─────────────
export const NotifItem = ({ notif, onRead, compact = false }) => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const meta = TYPE_META[notif.type] ?? TYPE_META.system;
  const { Icon } = meta;

  const handleClick = () => {
    onRead(notif.id);
    navigate(notif.link);
  };

  const title = lang === 'ar' ? notif.title_ar : notif.title_en;
  const body  = lang === 'ar' ? notif.body_ar  : notif.body_en;

  return (
    <button
      onClick={handleClick}
      className={`w-full text-start flex items-start gap-3 px-4 py-3 transition-colors
        ${notif.isRead
          ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
          : 'bg-blue-50/60 dark:bg-blue-900/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/30'
        }
        ${compact ? '' : 'rounded-xl'}
      `}
    >
      {/* Type icon */}
      <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${meta.bg}`}>
        <Icon className={`w-4 h-4 ${meta.icon}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-bold truncate leading-snug
            ${notif.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
            {title}
          </p>
          {!notif.isRead && (
            <span className="shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
          )}
        </div>
        {!compact && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
            {body}
          </p>
        )}
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
          {relativeTime(notif.ts, lang)}
        </p>
      </div>
    </button>
  );
};

// ── Bell button + dropdown ────────────────────────────────────────────────────
const NotificationBell = () => {
  const navigate   = useNavigate();
  const { t, lang } = useLanguage();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [open, setOpen] = useState(false);
  const containerRef    = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const preview = notifications.slice(0, 5);
  const isRtl   = lang === 'ar';

  return (
    <div ref={containerRef} className="relative" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={t('notifications')}
        className={`relative p-2 rounded-lg transition-colors
          ${open
            ? 'bg-blue-50 dark:bg-blue-900/30 text-[#103B66] dark:text-blue-400'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white
            text-[10px] font-black rounded-full flex items-center justify-center px-0.5 leading-none
            shadow-sm ring-2 ring-white dark:ring-gray-800">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className={`absolute top-full mt-2 w-80 bg-white dark:bg-gray-800
          rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700
          z-50 overflow-hidden
          ${isRtl ? 'right-0' : 'left-0'}
        `}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#103B66] dark:text-blue-400" />
              <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                {t('notifications')}
              </h3>
              {unreadCount > 0 && (
                <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400
                  text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[11px] font-bold text-[#103B66] dark:text-blue-400
                  hover:underline transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t('mark_all_read')}
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/60">
            {preview.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">{t('no_notifications')}</p>
              </div>
            ) : (
              preview.map(n => (
                <NotifItem
                  key={n.id}
                  notif={n}
                  onRead={(id) => { markAsRead(id); setOpen(false); }}
                  compact
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t dark:border-gray-700">
            <button
              onClick={() => { setOpen(false); navigate('/notifications'); }}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold
                text-[#103B66] dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
            >
              {t('view_all_activity')}
              <ArrowLeft className={`w-4 h-4 ${isRtl ? '' : 'rotate-180'}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
