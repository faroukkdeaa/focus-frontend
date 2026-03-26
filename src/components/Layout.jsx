import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Brain, Menu, X, LayoutDashboard, TrendingUp, MessageSquare,
  User, Settings, LogOut, BarChart2, Upload, ShieldCheck, Bell, LogIn, ChevronDown,
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

// ── PublicLayout — Simple navbar for public pages ────────────────────────────
// Use this for pages that should be accessible without authentication.

export const PublicLayout = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const isRtl = lang === 'ar';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Check if user is logged in and get user data
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Cairo']"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ══════════════════════════════════════════════════════════════
          SIMPLE TOP NAVBAR FOR PUBLIC PAGES
      ══════════════════════════════════════════════════════════════ */}
      <header className="h-16 sticky top-0 z-30 bg-white dark:bg-gray-800 border-b
        border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-3">
          
          {/* ── Left: Logo ── */}
          <button
            onClick={() => navigate('/')}
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

          {/* ── Right: Action buttons ── */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <LangToggle />
            
            {isLoggedIn ? (
              <div className="relative">
                {/* User Avatar Button */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 
                    dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#103B66] to-blue-500
                    dark:from-blue-600 dark:to-blue-400 flex items-center justify-center
                    text-white font-black text-sm shadow-sm">
                    {(user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform
                    ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setDropdownOpen(false)} 
                    />
                    
                    {/* Menu */}
                    <div className={`absolute top-full mt-2 ${isRtl ? 'left-0' : 'right-0'} 
                      w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border 
                      border-gray-200 dark:border-gray-700 py-2 z-20`}>
                      
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="font-bold text-gray-800 dark:text-white text-sm truncate">
                          {user.name || 'المستخدم'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {user.role === 'teacher' ? t('teacher') || 'مدرس' : t('student') || 'طالب'}
                        </p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={() => { navigate(user.role === 'teacher' ? '/teacher-dashboard' : '/dashboard'); setDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium
                            text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          {t('dashboard') || 'لوحة التحكم'}
                        </button>
                        
                        <button
                          onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium
                            text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                          <User className="w-4 h-4" />
                          {t('profile') || 'الملف الشخصي'}
                        </button>

                        <button
                          onClick={() => { navigate('/settings'); setDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium
                            text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                          <Settings className="w-4 h-4" />
                          {t('settings') || 'الإعدادات'}
                        </button>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 dark:border-gray-700 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium
                            text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('logout') || 'تسجيل الخروج'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/login?redirect=' + encodeURIComponent(window.location.pathname))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold
                  bg-[#103B66] dark:bg-blue-600 text-white hover:bg-[#0c2d4d] 
                  dark:hover:bg-blue-700 transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">{t('login')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          PAGE CONTENT (nested route renders here)
      ══════════════════════════════════════════════════════════════ */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
