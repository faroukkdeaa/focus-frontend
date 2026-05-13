import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import {
  Brain, Menu, X, LayoutDashboard, TrendingUp, MessageSquare,
  User, Settings, LogOut, BarChart2, Upload, ShieldCheck, Bell, LogIn, ChevronDown, Search,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import NotificationBell from './NotificationBell';
import ErrorBoundary from './ErrorBoundary';
import FullLogo from './FullLogo';

// ── Navigation item definitions ──────────────────────────────────────────────

const STUDENT_NAV = [
  { path: '/dashboard',   icon: LayoutDashboard, labelKey: 'dashboard'    },
  { path: '/ai-chat',     icon: MessageSquare,   labelKey: 'ai_assistant' },
  { path: '/progress',    icon: TrendingUp,      labelKey: 'my_progress'  },
];

const TEACHER_NAV = [
  { path: '/teacher-dashboard', icon: LayoutDashboard, labelKey: 'teacher_dashboard' },
  { path: '/teacher-analytics', icon: BarChart2,       labelKey: 'content_analytics' },
  { path: '/upload-wizard',     icon: Upload,          labelKey: 'upload_lesson'     },
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
      } focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none`}
  >
    <Icon className={`flex-shrink-0 ${large ? 'w-5 h-5' : 'w-4 h-4'}`} />
    <span className={large ? '' : 'hidden lg:inline whitespace-nowrap'}>{label}</span>
  </button>
);

// ── Layout ────────────────────────────────────────────────────────────────────

const Layout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Read current user from localStorage
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  const isTeacher = user.role === 'teacher';
  const isAdmin   = user.role === 'admin';
  const mainNav   = isTeacher ? TEACHER_NAV : STUDENT_NAV;
  const isRtl     = lang === 'ar';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const closeDrawer = () => setDrawerOpen(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setDrawerOpen(false);
    }
  };

  // Common utility links shown in the drawer (after the main nav divider)
  const utilityNav = [
    { path: '/notifications', icon: Bell,       labelKey: 'notifications' },
    { path: '/profile',       icon: User,       labelKey: 'profile'       },
    { path: '/settings',      icon: Settings,   labelKey: 'settings'      },
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
      <header className="h-16 sticky top-0 z-30 bg-[rgba(248,250,252,0.90)] dark:bg-[rgba(11,17,32,0.88)] border-b
        border-gray-200 dark:border-gray-700 backdrop-blur-[20px] transition-colors">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-3">

          {/* ── Left: Hamburger + Logo ── */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Mobile hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400
                hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
              aria-label="Open menu"
              aria-haspopup="true"
              aria-expanded={drawerOpen}
              aria-controls="mobile-nav-drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
            <FullLogo className="text-3xl" theme="dark" />
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

          {/* ── Search Bar (Desktop) ── */}
          <form onSubmit={handleSearch} className="hidden md:flex relative items-center mx-2 flex-1 max-w-xs">
            <div className="relative w-full">
              <input
                type="text"
                placeholder={t('search') || 'بحث...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl py-2 px-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-[Cairo]"
              />
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>
          </form>

          {/* ── Right: Action buttons ── */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <NotificationBell />

            {/* User avatar → profile */}
            <button
              onClick={() => navigate('/profile')}
              title={t('profile')}
              className="w-11 h-11 rounded-full bg-gradient-to-br from-[#103B66] to-blue-500
                dark:from-blue-600 dark:to-blue-400 flex items-center justify-center
                text-white font-black text-sm shadow-sm hover:shadow-md
                transition-shadow flex-shrink-0 select-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
            >
              {(user.name || 'U').charAt(0).toUpperCase()}
            </button>

            {/* Settings (desktop) */}
            <button
              onClick={() => navigate('/settings')}
              title={t('settings')}
              className={`hidden md:flex min-w-[44px] min-h-[44px] items-center justify-center rounded-xl transition-colors
                ${isActive('/settings')
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                } focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none`}
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Logout (desktop) */}
            <button
              onClick={handleLogout}
              title={t('logout')}
              className="hidden md:flex min-w-[44px] min-h-[44px] items-center justify-center rounded-xl text-red-500 dark:text-red-400
                hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
            >
              <LogOut className="w-5 h-5 rtl:-scale-x-100" />
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
            id="mobile-nav-drawer"
            className={`absolute top-0 start-0 h-full w-72
              bg-white dark:bg-gray-800 shadow-2xl flex flex-col`}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <div onClick={closeDrawer}>
                <FullLogo className="text-3xl" theme="dark" />
              </div>
              <button
                onClick={closeDrawer}
                aria-label={t('close') || 'Close menu'}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">            
            {/* Mobile Search Bar */}
            <form onSubmit={handleSearch} className="relative items-center mb-4 block md:hidden">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder={t('search') || 'بحث...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl py-2.5 px-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-[Cairo]"
                />
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
            </form>
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
                  text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
              >
                <LogOut className="w-4 h-4 flex-shrink-0 rtl:-scale-x-100" />
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
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
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
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Cairo']"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ══════════════════════════════════════════════════════════════
          SIMPLE TOP NAVBAR FOR PUBLIC PAGES
      ══════════════════════════════════════════════════════════════ */}
      <header className="h-16 sticky top-0 z-30 bg-[rgba(248,250,252,0.90)] dark:bg-[rgba(11,17,32,0.88)] border-b
        border-gray-200 dark:border-gray-700 backdrop-blur-[20px] transition-colors">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-3">
          
          {/* ── Left: Logo ── */}
          <div className="flex items-center gap-2 group">
            <FullLogo className="text-3xl" theme="dark" />
          </div>

          {/* ── Search Bar (Desktop) ── */}
          <form onSubmit={handleSearch} className="hidden md:flex relative items-center mx-6 flex-1 max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder={t('search') || 'بحث...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl py-2 px-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-[Cairo]"
              />
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>
          </form>

          {/* ── Right: Action buttons ── */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isLoggedIn ? (
              <div className="relative">
                {/* User Avatar Button */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                  aria-controls="public-user-menu"
                  className="min-h-[44px] min-w-[44px] flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 
                    dark:hover:bg-gray-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
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
                    <div id="public-user-menu" className={`absolute top-full mt-2 end-0 
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
                            text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          {t('dashboard') || 'لوحة التحكم'}
                        </button>
                        
                        <button
                          onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium
                            text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
                        >
                          <User className="w-4 h-4" />
                          {t('profile') || 'الملف الشخصي'}
                        </button>

                        <button
                          onClick={() => { navigate('/settings'); setDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium
                            text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
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
                            text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
                        >
                          <LogOut className="w-4 h-4 rtl:-scale-x-100" />
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
                  dark:hover:bg-blue-700 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
              >
                <LogIn className="w-4 h-4 rtl:-scale-x-100" />
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
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default Layout;
