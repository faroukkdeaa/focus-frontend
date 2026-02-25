import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Brain, Menu, X, LayoutDashboard, TrendingUp, MessageSquare,
  User, Settings, LogOut, BarChart2, Upload, ShieldCheck, Bell,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LangToggle from './LangToggle';
import NotificationBell from './NotificationBell';

// ── Navigation item definitions ──────────────────────────────────────────────

const STUDENT_NAV = [
  { path: '/dashboard',   icon: LayoutDashboard, labelKey: 'dashboard'    },
  { path: '/ai-chat',     icon: MessageSquare,   labelKey: 'ai_assistant' },
  { path: '/progress',    icon: TrendingUp,      labelKey: 'my_progress'  },
];

const TEACHER_NAV = [
  { path: '/teacher-dashboard', icon: LayoutDashboard, labelKey: 'teacher_dashboard' },
  { path: '/teacher-analytics', icon: BarChart2,       labelKey: 'content_analytics' },
  { path: '/upload-wizard',     icon: Upload,          labelKey: 'upload_lesson'     },
];

// ── NavItem — defined outside Layout to avoid remount on every render ─────────

const NavItem = ({ icon: Icon, label, active, onClick, large }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-all
      ${large ? 'w-full text-sm' : 'text-sm'}
      ${active
        ? 'bg-[#103B66] dark:bg-blue-600 text-white shadow-sm'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
  >
    <Icon className={`flex-shrink-0 ${large ? 'w-5 h-5' : 'w-4 h-4'}`} />
    <span className={large ? '' : 'hidden lg:inline whitespace-nowrap'}>{label}</span>
  </button>
);

// ── Layout ────────────────────────────────────────────────────────────────────

const Layout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Read current user from localStorage
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  const isTeacher = user.role === 'teacher';
  const isAdmin   = user.role === 'admin';
  const mainNav   = isTeacher ? TEACHER_NAV : STUDENT_NAV;
  const isRtl     = lang === 'ar';
  const homeRoute = isTeacher ? '/teacher-dashboard' : '/dashboard';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const closeDrawer = () => setDrawerOpen(false);

  // Common utility links shown in the drawer (after the main nav divider)
  const utilityNav = [
    { path: '/notifications', icon: Bell,       labelKey: 'notifications' },
    { path: '/profile',       icon: User,       labelKey: 'profile'       },
    { path: '/settings',      icon: Settings,   labelKey: 'settings'      },
    ...(isAdmin ? [{ path: '/admin-dashboard', icon: ShieldCheck, labelKey: 'admin_dashboard' }] : []),
  ];

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Cairo']"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ══════════════════════════════════════════════════════════════
          TOP NAVBAR
      ══════════════════════════════════════════════════════════════ */}
      <header className="h-16 sticky top-0 z-30 bg-white dark:bg-gray-800 border-b
        border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-3">

          {/* ── Left: Hamburger + Logo ── */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Mobile hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-500 dark:text-gray-400
                hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
            <button
              onClick={() => navigate(homeRoute)}
              className="flex items-center gap-2 group"
            >
              <div className="bg-[#103B66] dark:bg-blue-600 p-2 rounded-xl shadow-sm
                group-hover:shadow-md transition-shadow">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-[#103B66] dark:text-blue-400 text-lg
                tracking-tight hidden sm:block select-none">
                {t('app_name')}
              </span>
            </button>
          </div>

          {/* ── Center: Desktop nav links ── */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 mx-4">
            {mainNav.map(item => (
              <NavItem
                key={item.path}
                icon={item.icon}
                label={t(item.labelKey)}
                active={isActive(item.path)}
                onClick={() => navigate(item.path)}
                large={false}
              />
            ))}
          </nav>

          {/* ── Right: Action buttons ── */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <LangToggle />
            <NotificationBell />

            {/* User avatar → profile */}
            <button
              onClick={() => navigate('/profile')}
              title={t('profile')}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-[#103B66] to-blue-500
                dark:from-blue-600 dark:to-blue-400 flex items-center justify-center
                text-white font-black text-sm shadow-sm hover:shadow-md
                transition-shadow flex-shrink-0 select-none"
            >
              {(user.name || 'U').charAt(0).toUpperCase()}
            </button>

            {/* Settings (desktop) */}
            <button
              onClick={() => navigate('/settings')}
              title={t('settings')}
              className={`hidden md:flex p-2 rounded-xl transition-colors
                ${isActive('/settings')
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Logout (desktop) */}
            <button
              onClick={handleLogout}
              title={t('logout')}
              className="hidden md:flex p-2 rounded-xl text-red-500 dark:text-red-400
                hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          MOBILE DRAWER
      ══════════════════════════════════════════════════════════════ */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeDrawer}
          />

          {/* Drawer panel — slides in from the start side (right for RTL, left for LTR) */}
          <div
            className={`absolute top-0 ${isRtl ? 'right-0' : 'left-0'} h-full w-72
              bg-white dark:bg-gray-800 shadow-2xl flex flex-col`}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="bg-[#103B66] dark:bg-blue-600 p-2 rounded-lg">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <span className="font-black text-[#103B66] dark:text-blue-400 text-lg tracking-tight">
                  {t('app_name')}
                </span>
              </div>
              <button
                onClick={closeDrawer}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {/* Main role-based navigation */}
              {mainNav.map(item => (
                <NavItem
                  key={item.path}
                  icon={item.icon}
                  label={t(item.labelKey)}
                  active={isActive(item.path)}
                  onClick={() => { navigate(item.path); closeDrawer(); }}
                  large
                />
              ))}

              <div className="my-3 border-t dark:border-gray-700" />

              {/* Utility links */}
              {utilityNav.map(item => (
                <NavItem
                  key={item.path}
                  icon={item.icon}
                  label={t(item.labelKey)}
                  active={isActive(item.path)}
                  onClick={() => { navigate(item.path); closeDrawer(); }}
                  large
                />
              ))}
            </nav>

            {/* User card + logout at the bottom */}
            <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#103B66] to-blue-500
                  flex items-center justify-center text-white font-black text-base flex-shrink-0 select-none">
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 dark:text-white text-sm truncate">
                    {user.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user.role || 'student'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold
                  text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          PAGE CONTENT (nested route renders here)
      ══════════════════════════════════════════════════════════════ */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};

// ── ProtectedLayout — auth guard + Layout ─────────────────────────────────────
// Use this as the parent element for all protected nested routes in App.jsx.

export const ProtectedLayout = () => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <Layout />;
};

export default Layout;
