import { useLanguage } from '../context/LanguageContext';

/**
 * Pill language toggle  ع | EN
 * Switches the app between Arabic (RTL) and English (LTR).
 */
const LangToggle = ({ className = '' }) => {
  const { lang, setLang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <button
      onClick={() => setLang(isAr ? 'en' : 'ar')}
      title={isAr ? 'Switch to English' : 'التبديل للعربية'}
      className={`
        relative inline-flex items-center rounded-full border
        border-gray-300 dark:border-gray-600
        bg-white dark:bg-gray-800
        shadow-sm hover:shadow-md
        transition-all duration-200 select-none
        text-xs font-bold overflow-hidden
        w-16 h-8
        ${className}
      `}
      dir="ltr"
    >
      {/* sliding highlight */}
      <span
        className={`
          absolute top-0.5 bottom-0.5 w-[44%] rounded-full
          bg-[#103B66] dark:bg-blue-500
          transition-transform duration-300 ease-in-out
          ${isAr ? 'translate-x-[2px]' : 'translate-x-[33px]'}
        `}
      />

      {/* AR label */}
      <span
        className={`relative z-10 flex-1 text-center transition-colors duration-200 ${
          isAr ? 'text-white' : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        ع
      </span>

      {/* EN label */}
      <span
        className={`relative z-10 flex-1 text-center transition-colors duration-200 ${
          !isAr ? 'text-white' : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        EN
      </span>
    </button>
  );
};

export default LangToggle;
