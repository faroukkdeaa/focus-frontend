import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import { Loader2 } from 'lucide-react';
import { isValidEmail, isValidPassword, isValidFullName } from '../utils/validation';
import { useLanguage } from '../context/LanguageContext';
import LangToggle from '../components/LangToggle';

const ACADEMIC_YEARS = [
  { value: '1st', label: 'الأول الثانوي' },
  { value: '2nd', label: 'الثاني الثانوي' },
  { value: '3rd', label: 'الثالث الثانوي' },
];

const SignUp = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidFullName(fullName)) {
      setError('الاسم الكامل يجب أن يكون حرفين على الأقل (عربي أو إنجليزي).');
      return;
    }
    if (!isValidEmail(email)) {
      setError('أدخل بريداً إلكترونياً صحيحاً.');
      return;
    }
    if (!isValidPassword(password)) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمة المرور وتأكيدها غير متطابقتين.');
      return;
    }

    setLoading(true);
    try {
      // POST /api/register — بيرجع { data: { role, student_name, student_id, user_id }, token }
      const response = await api.post(
        '/register',
        {
          name:                  fullName,
          email,
          password,
          password_confirmation: confirmPassword,
          student:               true,
        }
      );

      // register بيلف الـ user في data key (مختلف عن login اللي بيستخدم user key)
      const user  = response.data.data  ?? response.data.user;
      const token = response.data.token;

      // تطبيع المفاتيح — student_name → name  |  user_id → id
      const normalizedUser = {
        id:         String(user.user_id),
        student_id: user.student_id ?? null,
        name:       user.student_name ?? fullName,
        email,
        role:       'student',
        grade:      academicYear,
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));

      navigate('/dashboard');
    } catch (err) {
      console.error('SignUp error:', err);
      const msg = err.response?.data?.message
        ?? err.response?.data?.errors
        ?? err.message
        ?? 'حدث خطأ أثناء إنشاء الحساب.';
      setError(typeof msg === 'object' ? Object.values(msg).flat().join(' — ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Language Toggle */}
      <div className="absolute top-4 end-4">
        <LangToggle />
      </div>
      {/* 1. اللوجو والعنوان */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h1 className="text-4xl font-bold text-[#103B66]">{t('app_name')}</h1>
          <svg className="w-10 h-10 text-[#103B66]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-4A2.5 2.5 0 0 1 9.5 2Z" />
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-4A2.5 2.5 0 0 0 14.5 2Z" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">{t('tagline')}</p>
      </div>

      {/* 2. كارت إنشاء الحساب */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">{t('signup_title')}</h2>
        <p className="text-center text-gray-400 dark:text-gray-500 mb-6 text-sm">{t('signup_subtitle')}</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2">{t('full_name')}</label>
            <input
              type="text"
              placeholder="أحمد محمد"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#103B66] placeholder:text-right disabled:opacity-60 dark:text-white dark:placeholder:text-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2">{t('email')}</label>
            <input
              type="email"
              placeholder="ahmed@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#103B66] text-left placeholder:text-right disabled:opacity-60 dark:text-white dark:placeholder:text-gray-400"
              dir="ltr"
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2">{t('grade')}</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              disabled={loading}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#103B66] disabled:opacity-60 dark:text-white"
              required
            >
              <option value="">{t('select_grade')}</option>
              <option value="1st">{t('grade_1')}</option>
              <option value="2nd">{t('grade_2')}</option>
              <option value="3rd">{t('grade_3')}</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2">{t('password')}</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#103B66] text-left placeholder:text-right disabled:opacity-60 dark:text-white dark:placeholder:text-gray-400"
              dir="ltr"
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2">{t('confirm_password')}</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#103B66] text-left placeholder:text-right disabled:opacity-60 dark:text-white dark:placeholder:text-gray-400"
              dir="ltr"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#103B66] hover:bg-[#0c2d4d] disabled:bg-[#103B66] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition duration-300 shadow-lg mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('creating_account')}
              </>
            ) : (
              t('create_account')
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t('already_have_account')}{' '}
            <Link to="/login" className="text-[#103B66] font-bold hover:underline">
              {t('login_link')}
            </Link>
          </p>
        </div>
      </div>

      {/* زر العودة */}
      <div className="mt-8" onClick={() => navigate('/')}>
        <button type="button" className="text-gray-500 flex items-center gap-2 hover:text-[#103B66] transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          {t('back_to_home')}
        </button>
      </div>
    </div>
  );
};

export default SignUp;

