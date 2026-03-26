import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * Theme toggle button - switches between Light and Dark mode
 */
const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'التبديل للوضع النهاري' : 'Switch to Dark Mode'}
      className={`
        relative inline-flex items-center justify-center
        rounded-full border
        border-gray-300 dark:border-gray-600
        bg-white dark:bg-gray-800
        shadow-sm hover:shadow-md
        transition-all duration-200
        w-10 h-10
        ${className}
      `}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Moon className="w-5 h-5 text-blue-500" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-500" />
      )}
    </button>
  );
};

export default ThemeToggle;
