import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import api from '../api/api';
import { Loader2, GraduationCap, BookOpen } from 'lucide-react';
import { isValidEmail, isValidPassword, isValidFullName } from '../utils/validation';
import { useLanguage } from '../context/LanguageContext';
import LangToggle from '../components/LangToggle';
import ThemeToggle from '../components/ThemeToggle';

const SignUp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, lang } = useLanguage();
  const [accountType, setAccountType] = useState('student'); // 'student' or 'teacher'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // جلب المواد من الـ API عند اختيار تسجيل المدرس
  useEffect(() => {
    if (accountType === 'teacher' && subjects.length === 0) {
      // استخدام axios بدون headers أو token
      axios({
        method: 'get',
        url: 'http://localhost:8000/api/subjects',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      })
        .then(res => {
          console.log('Subjects API response:', res.data);
          // الـ API بيرجع paginated response: { data: [...], current_page, total }
          const subjectsData = res.data.data || res.data;
          console.log('Extracted subjects:', subjectsData);
          setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
        })
        .catch(err => {
          console.error('Failed to fetch subjects:', err);
          console.error('Error details:', err.response?.data);
          setError('فشل تحميل المواد الدراسية. تأكد من تشغيل الـ backend.');
        });
    }
  }, [accountType, subjects.length]);

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
    if (accountType === 'teacher' && !subjectId) {
      setError('يرجى اختيار المادة الدراسية.');
      return;
    }

    setLoading(true);
    try {
      const isStudent = accountType === 'student';
      
      // بناء الـ payload حسب نوع الحساب
      const payload = {
        name: fullName,
        email,
        password,
        password_confirmation: confirmPassword,
      };

      // إضافة الحقول حسب نوع الحساب
      if (isStudent) {
        payload.student = true;
      } else {
        payload.teacher = true;
        payload.subject_id = subjectId;
      }

      console.log('=== SignUp Request ===');
      console.log('Payload:', JSON.stringify(payload, null, 2));

      const response = await api.post('/register', payload);

      console.log('=== SignUp Response ===');
      console.log('Response data:', JSON.stringify(response.data, null, 2));

      // الـ response ممكن يكون { data: {...}, token } أو { user: {...}, token }
      const user  = response.data.data ?? response.data.user;
      const token = response.data.token;

      // تطبيع المفاتيح زي اللي في Login
      const normalizedUser = {
        id:           String(user.user_id ?? user.id),
        student_id:   user.student_id   ?? null,
        teacher_id:   user.teacher_id   ?? null,
        name:         user.student_name ?? user.teacher_name ?? user.name ?? fullName,
        email,
        role:         user.role ?? (isStudent ? 'student' : 'teacher'),
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
            const qId = pending.lesson?.quizId ?? pending.quizId;
            if (pending.lesson?.id != null && pending.teacherId != null && qId != null) {
              navigate(`/quiz/${pending.lesson.id}/${pending.teacherId}/${qId}`, {
                state: {
                  lesson: pending.lesson,
                  subjectId: pending.subjectId,
                  teacherId: pending.teacherId,
                  subjectName: pending.subjectName,
                },
              });
            } else {
              navigate('/dashboard');
            }
          } else {
            const pendingTeacherId =
              pending.teacherId ??
              pending.lesson?.teacher_id ??
              pending.lesson?.teacherId ??
              null;

            if (pending.lesson?.id != null && pendingTeacherId != null) {
              const courseDetailsPath = `/course-details?lessonId=${encodeURIComponent(String(pending.lesson.id))}&teacherId=${encodeURIComponent(String(pendingTeacherId))}&subjectId=${encodeURIComponent(String(pending.subjectId ?? ''))}`;
              navigate(courseDetailsPath, {
                state: {
                  lesson: pending.lesson,
                  subjectId: pending.subjectId,
                  subjectName: pending.subjectName,
                  teacherId: pendingTeacherId,
                },
              });
            } else {
              navigate('/dashboard');
            }
          }
          return;
        } catch {
          // في حالة خطأ في parse، تجاهل وأكمل العادي
        }
      }

      if (authRedirect) {
        // عودة لمسار محدد
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
      navigate(normalizedUser.role === 'teacher' ? '/teacher-dashboard' : '/');
    } catch (err) {
      console.error('SignUp error:', err);
      const msg = err.response?.data?.message
        ?? err.response?.data?.error
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
      {/* Language & Theme Toggles */}
      <div className="absolute top-4 end-4 flex items-center gap-3">
        <ThemeToggle />
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

        {/* تبويبات نوع الحساب */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => { setAccountType('student'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all duration-200 ${
              accountType === 'student'
                ? 'bg-[#103B66] text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            {t('student')}
          </button>
          <button
            type="button"
            onClick={() => { setAccountType('teacher'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all duration-200 ${
              accountType === 'teacher'
                ? 'bg-[#103B66] text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            {t('teacher')}
          </button>
        </div>

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

          {/* حقول خاصة بالمدرس */}
          {accountType === 'teacher' && (
            <div>
              <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2">{t('subject')}</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#103B66] disabled:opacity-60 dark:text-white"
                required
              >
                <option value="">{t('select_subject')}</option>
                {subjects.length > 0 ? (
                  subjects.map(sub => {
                    console.log('Rendering subject:', sub);
                    return (
                      <option key={sub.id} value={sub.id}>
                        {lang === 'ar' ? (sub.name || sub.title) : (sub.name_en || sub.title_en || sub.name || sub.title)}
                      </option>
                    );
                  })
                ) : (
                  <option disabled>جاري التحميل...</option>
                )}
              </select>
            </div>
          )}

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

          {accountType === 'teacher' && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm text-center">
              {t('teacher_signup_note')}
            </div>
          )}

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
            <Link to={`/login${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect'))}` : ''}`} className="text-[#103B66] font-bold hover:underline">
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

