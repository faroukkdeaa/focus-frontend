import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../api/api';
import { isValidLoginIdentifier, isValidPassword } from '../utils/validation';
import { useLanguage } from '../context/LanguageContext';
import LangToggle from '../components/LangToggle';
import ThemeToggle from '../components/ThemeToggle';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, lang } = useLanguage();
  const [accountType, setAccountType] = useState('student'); // 'student' or 'teacher'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // const handleLogin = async (e) => {
  //   e.preventDefault();
  //   setError('');
  //   if (!isValidLoginIdentifier(email)) {
  //     setError('أدخل بريداً إلكترونياً أو رقم هاتف مصري صحيح.');
  //     return;
  //   }
  //   if (!isValidPassword(password)) {
  //     setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
  //     return;
  //   }
  //   setLoading(true);
  //   try {
  //     const response = await axios.post('http://localhost:8000/api/login', { email, password });
  //     if (response.data.token) {
  //       localStorage.setItem('token', response.data.token);
  //     }
  //     if (response.data.user) {
  //       localStorage.setItem('user', JSON.stringify(response.data.user));
  //     }
  //     navigate('/dashboard');
  //   } catch (err) {
  //     const message =
  //       err.response?.data?.message ||
  //       err.response?.data?.error ||
  //       err.message ||
  //       'فشل تسجيل الدخول. تحقق من الاتصال والمعلومات.';
  //     setError(message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidLoginIdentifier(email)) {
      setError('أدخل بريداً إلكترونياً أو رقم هاتف مصري صحيح.');
      return;
    }
    if (!isValidPassword(password)) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }

    setLoading(true);

    try {
      // POST /api/login — بيرجع { user: { role, student_name|teacher_name, student_id|teacher_id, user_id }, token }
      const response = await api.post('/login', { email, password });

      // الـ response ممكن يكون { user: {...}, token } أو { data: {...}, token }
      const user = response.data.user ?? response.data.data;
      const token = response.data.token;

      if (!user || !token) {
        setError('حدث خطأ في استلام بيانات تسجيل الدخول.');
        return;
      }

      // التحقق من نوع الحساب اللي اختاره المستخدم
      if (user.role !== accountType) {
        setError(`هذا الحساب ليس حساب ${accountType === 'student' ? 'طالب' : 'مدرس'}.`);
        return;
      }

      // تطبيع مفاتيح الـ API → مفاتيح موحدة تستخدمها كل صفحات الـ app
      // student_name/teacher_name → name  |  user_id → id
      const normalizedUser = {
        id:           String(user.user_id ?? user.id ?? user.student_id ?? user.teacher_id ?? ''),
        student_id:   user.student_id   ?? null,
        teacher_id:   user.teacher_id   ?? null,
        name:         user.student_name ?? user.teacher_name ?? user.name ?? email,
        email:        user.email ?? email,
        role:         user.role,
        subject_id:   user.subject_id   ?? null,
        subject_name: user.subject_name ?? null,
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));

      // التحقق من وجود مسار عودة محفوظ (من AuthModal)
      const authRedirect = sessionStorage.getItem('authRedirect');
      const pendingLesson = sessionStorage.getItem('pendingLesson');

      if (pendingLesson) {
        // المستخدم كان يحاول الدخول لدرس/كويز
        try {
          const pending = JSON.parse(pendingLesson);
          sessionStorage.removeItem('pendingLesson');
          sessionStorage.removeItem('authRedirect');
          
          if (pending.type === 'quiz') {
            navigate('/quiz', { 
              state: { 
                lesson: pending.lesson, 
                subjectId: pending.subjectId, 
                teacherId: pending.teacherId, 
                subjectName: pending.subjectName 
              } 
            });
          } else {
            navigate('/course-details', { 
              state: { 
                lesson: pending.lesson, 
                subjectId: pending.subjectId, 
                subjectName: pending.subjectName 
              } 
            });
          }
          return;
        } catch {
          // في حالة خطأ في parse، تجاهل وأكمل العادي
        }
      }

      if (authRedirect) {
        // عودة لمسار محدد من sessionStorage
        sessionStorage.removeItem('authRedirect');
        navigate(authRedirect);
        return;
      }

      // التحقق من query parameter: ?redirect=/path
      const redirectParam = searchParams.get('redirect');
      if (redirectParam) {
        navigate(redirectParam);
        return;
      }

      // المسار الافتراضي - التوجيه للرئيسية بدلاً من Dashboard
      if (normalizedUser.role === 'teacher') {
        navigate('/teacher-dashboard');
      } else {
        navigate('/'); // الطالب يذهب للرئيسية
      }
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'فشل تسجيل الدخول. تحقق من الاتصال والمعلومات.';
      setError(message);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* Language & Theme Toggles */}
      <div className="absolute top-4 end-4 flex items-center gap-3">
        <ThemeToggle />
        <LangToggle />
      </div>

      {/* 1. اللوجو والعنوان */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h1 className="text-4xl font-bold text-[#103B66]">{t('app_name')}</h1>
          {/* أيقونة المخ (SVG بسيط) */}
          <svg className="w-10 h-10 text-[#103B66]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-4A2.5 2.5 0 0 1 9.5 2Z" />
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-4A2.5 2.5 0 0 0 14.5 2Z" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">{t('tagline')}</p>
      </div>

      {/* 2. كارت تسجيل الدخول */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">{t('login_title')}</h2>
        <p className="text-center text-gray-400 dark:text-gray-500 mb-6 text-sm">{t('login_subtitle')}</p>

        {/* رسالة الخطأ */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* التبويب (Tabs: طالب / مدرس) */}
        <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-full flex mb-6">
          <button
            type="button"
            onClick={() => setAccountType('student')}
            className={`flex-1 py-2 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2
              ${accountType === 'student' ? 'bg-[#103B66] text-white shadow-md' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          >
            {/* أيقونة طالب */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            {t('student')}
          </button>
          <button
            type="button"
            onClick={() => setAccountType('teacher')}
            className={`flex-1 py-2 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2
              ${accountType === 'teacher' ? 'bg-[#103B66] text-white shadow-md' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          >
            {/* أيقونة مدرس */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path></svg>
            {t('teacher')}
          </button>
        </div>

        {/* الفورم */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2">{t('email_or_phone')}</label>
            <input
              type="text"
              placeholder="ahmed@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#103B66] text-left placeholder:text-right disabled:opacity-60 dark:text-white dark:placeholder:text-gray-400"
              dir="ltr" // عشان الايميل يتكتب انجليزي صح
            />
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
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#103B66] hover:bg-[#0c2d4d] disabled:bg-[#103B66] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition duration-300 shadow-lg mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t('logging_in')}
              </>
            ) : (
              t('enter')
            )}
          </button>
        </form>

        {/* روابط سفلية */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t('no_account')} <Link to={`/signup${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect'))}` : ''}`} className="text-[#103B66] font-bold hover:underline">{t('register_now')}</Link>
          </p>
          <Link to="/forgot-password" className="block text-gray-400 dark:text-gray-500 text-sm hover:text-gray-600 dark:hover:text-gray-300">{t('forgot_password')}</Link>
        </div>
      </div>

      {/* زر العودة */}
      <div className="mt-8" onClick={() => navigate('/')}>
        <button type="button" className="text-gray-500 flex items-center gap-2 hover:text-[#103B66] transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          {t('back_to_home')}
        </button>
      </div>

    </div>
  );
};

export default Login;