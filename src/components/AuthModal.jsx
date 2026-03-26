import { useNavigate } from 'react-router-dom';
import { X, LogIn, UserPlus, BookOpen, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * AuthModal — Modal منبثقة تظهر للزوار عند محاولة الدخول لدرس أو كويز
 * تعرض خيارين: تسجيل الدخول أو إنشاء حساب جديد
 */
const AuthModal = ({ 
  isOpen, 
  onClose, 
  type = 'lesson', // 'lesson' | 'quiz'
  redirectPath,    // المسار للعودة إليه بعد تسجيل الدخول
  lessonTitle,     // عنوان الدرس/الكويز
}) => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const isRtl = lang === 'ar';

  if (!isOpen) return null;

  const handleLogin = () => {
    // حفظ مسار العودة في sessionStorage
    if (redirectPath) {
      sessionStorage.setItem('authRedirect', redirectPath);
    }
    navigate('/login');
    onClose();
  };

  const handleSignup = () => {
    // حفظ مسار العودة في sessionStorage
    if (redirectPath) {
      sessionStorage.setItem('authRedirect', redirectPath);
    }
    navigate('/signup');
    onClose();
  };

  const isQuiz = type === 'quiz';
  const Icon = isQuiz ? Zap : BookOpen;
  const iconBg = isQuiz ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-blue-100 dark:bg-blue-900/30';
  const iconColor = isQuiz ? 'text-violet-600 dark:text-violet-400' : 'text-[#103B66] dark:text-blue-400';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 
            dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 pb-4 text-center">
          <div className={`w-16 h-16 ${iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-8 h-8 ${iconColor}`} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            {isQuiz 
              ? (t('auth_modal_quiz_title') || 'سجّل دخولك لبدء الاختبار')
              : (t('auth_modal_lesson_title') || 'سجّل دخولك لمشاهدة الدرس')
            }
          </h2>
          {lessonTitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              {lessonTitle}
            </p>
          )}
        </div>

        {/* Body */}
        <div className="px-6 pb-2">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
              {t('auth_modal_benefits') || 'بتسجيل دخولك، ستتمكن من:'}
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-blue-700 dark:text-blue-300">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                {t('auth_modal_benefit_1') || 'حفظ تقدمك ومتابعة من حيث توقفت'}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                {t('auth_modal_benefit_2') || 'تتبع نتائج اختباراتك وأدائك'}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                {t('auth_modal_benefit_3') || 'الحصول على توصيات مخصصة لك'}
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-2 space-y-3">
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 bg-[#103B66] dark:bg-blue-600 
              text-white font-bold py-3 px-6 rounded-xl hover:bg-[#0c2d4d] dark:hover:bg-blue-700 
              transition-colors shadow-lg shadow-blue-900/20"
          >
            <LogIn className="w-5 h-5" />
            {t('login') || 'تسجيل الدخول'}
          </button>

          <button
            onClick={handleSignup}
            className="w-full flex items-center justify-center gap-2 border-2 border-[#103B66] 
              dark:border-blue-500 text-[#103B66] dark:text-blue-400 font-bold py-3 px-6 rounded-xl 
              hover:bg-[#103B66] hover:text-white dark:hover:bg-blue-600 dark:hover:text-white 
              transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            {t('create_account') || 'إنشاء حساب جديد'}
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <button 
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            {t('continue_browsing') || 'أكمل التصفح بدون تسجيل'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
