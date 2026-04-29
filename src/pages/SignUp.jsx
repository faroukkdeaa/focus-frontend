import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import api from '../api/api';
import { Loader2, GraduationCap, BookOpen } from 'lucide-react';
import Logo from '../components/Logo';
import { isValidEmail, isValidPassword, isValidFullName } from '../utils/validation';
import { useLanguage } from '../context/LanguageContext';
import LangToggle from '../components/LangToggle';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';

/* ════════════════════════════════════════════════════
   DESIGN SYSTEM — Extracted from LandingPage.jsx
════════════════════════════════════════════════════ */
function buildTheme(dk){return dk?{bg:"#0B1120",bgPanel:"#0D1526",bgCard:"rgba(255,255,255,0.035)",border:"rgba(255,255,255,0.08)",borderAccent:"rgba(79,70,229,0.38)",accent:"#4F46E5",accentDim:"rgba(79,70,229,0.14)",iconA:"#38BDF8",iconBgA:"rgba(56,189,248,0.10)",iconBorderA:"rgba(56,189,248,0.22)",textPrimary:"#F8FAFC",textMuted:"#94A3B8",textDim:"#475569",shadowCard:"0 1px 1px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.35)",trackBg:"rgba(255,255,255,0.06)",green:"#34D399",greenDim:"rgba(52,211,153,0.12)",greenBorder:"rgba(52,211,153,0.22)",red:"#F87171",redDim:"rgba(248,113,113,0.10)",redBorder:"rgba(248,113,113,0.20)",yellow:"#FBBF24",yellowDim:"rgba(251,191,36,0.12)",yellowBorder:"rgba(251,191,36,0.22)",headerBg:"rgba(11,17,32,0.88)"}:{bg:"#F8FAFC",bgPanel:"#FFFFFF",bgCard:"#FFFFFF",border:"#E2E8F0",borderAccent:"rgba(15,76,129,0.28)",accent:"#0F4C81",accentDim:"rgba(15,76,129,0.08)",iconA:"#0F4C81",iconBgA:"rgba(15,76,129,0.08)",iconBorderA:"rgba(15,76,129,0.18)",textPrimary:"#0F172A",textMuted:"#64748B",textDim:"#94A3B8",shadowCard:"0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)",trackBg:"#E2E8F0",green:"#059669",greenDim:"rgba(5,150,105,0.08)",greenBorder:"rgba(5,150,105,0.18)",red:"#EF4444",redDim:"rgba(239,68,68,0.08)",redBorder:"rgba(239,68,68,0.18)",yellow:"#D97706",yellowDim:"rgba(217,119,6,0.08)",yellowBorder:"rgba(217,119,6,0.18)",headerBg:"rgba(248,250,252,0.90)"};}
const _c=(T,x)=>({background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:"16px",boxShadow:T.shadowCard,...x});
const _t={transition:"all 0.25s ease"};
const _input = (T) => ({..._t, width: "100%", background: T.bg, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "14px 16px", color: T.textPrimary, outline: "none", fontSize: "0.95rem"});

const SignUp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const T = buildTheme(isDark);
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
    <div dir={lang==='ar'?'rtl':'ltr'} style={{..._t,background:T.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"16px",fontFamily:"'Cairo',sans-serif"}}>
      {/* Language & Theme Toggles */}
      <div style={{position:"absolute",top:"16px",right:lang==='ar'?'auto':"16px",left:lang==='ar'?"16px":'auto',display:"flex",alignItems:"center",gap:"12px"}}>
        <ThemeToggle />
        <LangToggle />
      </div>

      {/* 1. اللوجو والعنوان */}
      <div style={{textAlign:"center",marginBottom:"32px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"12px",marginBottom:"8px"}}>
          <h1 style={{fontSize:"2.5rem",fontWeight:800,color:T.accent,letterSpacing:"-0.02em"}}>{t('app_name')}</h1>
          <Logo className="justify-center mb-6 scale-110" />
        </div>
        <p style={{color:T.textMuted,fontSize:"1.1rem",fontWeight:500}}>{t('tagline')}</p>
      </div>

      {/* 2. كارت إنشاء الحساب */}
      <div style={{..._t,..._c(T),width:"100%",maxWidth:"480px",padding:"40px"}}>
        <h2 style={{fontSize:"1.75rem",fontWeight:800,textAlign:"center",color:T.textPrimary,marginBottom:"8px"}}>{t('signup_title')}</h2>
        <p style={{textAlign:"center",color:T.textMuted,fontSize:"0.95rem",marginBottom:"32px"}}>{t('signup_subtitle')}</p>

        {/* تبويبات نوع الحساب */}
        <div style={{display:"flex",gap:"12px",marginBottom:"32px"}}>
          <button
            type="button"
            onClick={() => { setAccountType('student'); setError(''); }}
            style={{..._t,flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",padding:"14px",borderRadius:"12px",fontWeight:700,cursor:"pointer",border:accountType==='student'?`1px solid ${T.accent}`:`1px solid ${T.border}`,background:accountType==='student'?T.accent:T.bg,color:accountType==='student'?"#FFF":T.textMuted}}
          >
            <GraduationCap style={{width:"20px",height:"20px"}} />
            {t('student')}
          </button>
          <button
            type="button"
            onClick={() => { setAccountType('teacher'); setError(''); }}
            style={{..._t,flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",padding:"14px",borderRadius:"12px",fontWeight:700,cursor:"pointer",border:accountType==='teacher'?`1px solid ${T.accent}`:`1px solid ${T.border}`,background:accountType==='teacher'?T.accent:T.bg,color:accountType==='teacher'?"#FFF":T.textMuted}}
          >
            <BookOpen style={{width:"20px",height:"20px"}} />
            {t('teacher')}
          </button>
        </div>

        {error && (
          <div style={{..._t,marginBottom:"24px",padding:"14px",borderRadius:"12px",background:T.redDim,border:`1px solid ${T.redBorder}`,color:T.red,fontSize:"0.9rem",textAlign:"center",fontWeight:600}}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} style={{display:"flex",flexDirection:"column",gap:"20px"}}>
          <div>
            <label style={{display:"block",color:T.textDim,fontSize:"0.85rem",fontWeight:700,marginBottom:"8px"}}>{t('full_name')}</label>
            <input
              type="text"
              placeholder="أحمد محمد"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              style={_input(T)}
              onFocus={e=>{e.target.style.borderColor=T.accent}}
              onBlur={e=>{e.target.style.borderColor=T.border}}
              required
            />
          </div>

          <div>
            <label style={{display:"block",color:T.textDim,fontSize:"0.85rem",fontWeight:700,marginBottom:"8px"}}>{t('email')}</label>
            <input
              type="email"
              placeholder="ahmed@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={{..._input(T),textAlign:"left"}}
              onFocus={e=>{e.target.style.borderColor=T.accent}}
              onBlur={e=>{e.target.style.borderColor=T.border}}
              dir="ltr"
              required
            />
          </div>

          {/* حقول خاصة بالمدرس */}
          {accountType === 'teacher' && (
            <div>
              <label style={{display:"block",color:T.textDim,fontSize:"0.85rem",fontWeight:700,marginBottom:"8px"}}>{t('subject')}</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                disabled={loading}
                style={{..._input(T),appearance:"none",cursor:"pointer"}}
                onFocus={e=>{e.target.style.borderColor=T.accent}}
                onBlur={e=>{e.target.style.borderColor=T.border}}
                required
              >
                <option value="" disabled style={{color:T.textMuted}}>{t('select_subject')}</option>
                {subjects.length > 0 ? (
                  subjects.map(sub => (
                    <option key={sub.id} value={sub.id} style={{color:T.textPrimary,background:T.bgPanel}}>
                      {lang === 'ar' ? (sub.name || sub.title) : (sub.name_en || sub.title_en || sub.name || sub.title)}
                    </option>
                  ))
                ) : (
                  <option disabled style={{color:T.textMuted}}>جاري التحميل...</option>
                )}
              </select>
            </div>
          )}

          <div>
            <label style={{display:"block",color:T.textDim,fontSize:"0.85rem",fontWeight:700,marginBottom:"8px"}}>{t('password')}</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{..._input(T),textAlign:"left"}}
              onFocus={e=>{e.target.style.borderColor=T.accent}}
              onBlur={e=>{e.target.style.borderColor=T.border}}
              dir="ltr"
              required
            />
          </div>

          <div>
            <label style={{display:"block",color:T.textDim,fontSize:"0.85rem",fontWeight:700,marginBottom:"8px"}}>{t('confirm_password')}</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              style={{..._input(T),textAlign:"left"}}
              onFocus={e=>{e.target.style.borderColor=T.accent}}
              onBlur={e=>{e.target.style.borderColor=T.border}}
              dir="ltr"
              required
            />
          </div>

          {accountType === 'teacher' && (
            <div style={{..._t,padding:"14px",borderRadius:"12px",background:T.yellowDim,border:`1px solid ${T.yellowBorder}`,color:T.yellow,fontSize:"0.85rem",textAlign:"center",fontWeight:600}}>
              {t('teacher_signup_note')}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{..._t,width:"100%",background:T.accent,color:"#FFF",padding:"16px",borderRadius:"12px",fontWeight:800,border:"none",cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",marginTop:"12px",fontSize:"1rem",opacity:loading?0.7:1}}
            onMouseEnter={e=>{if(!loading)e.currentTarget.style.filter="brightness(1.1)"}}
            onMouseLeave={e=>{if(!loading)e.currentTarget.style.filter="none"}}
          >
            {loading ? (
              <>
                <Loader2 style={{width:"20px",height:"20px"}} className="animate-spin" />
                {t('creating_account')}
              </>
            ) : (
              t('create_account')
            )}
          </button>
        </form>

        <div style={{marginTop:"32px",textAlign:"center"}}>
          <p style={{color:T.textDim,fontSize:"0.9rem",fontWeight:500}}>
            {t('already_have_account')}{' '}
            <Link to={`/login${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect'))}` : ''}`} style={{color:T.accent,fontWeight:800,textDecoration:"none"}}>
              {t('login_link')}
            </Link>
          </p>
        </div>
      </div>

      {/* زر العودة */}
      <div style={{marginTop:"40px",cursor:"pointer"}} onClick={() => navigate('/')}>
        <button type="button" style={{..._t,background:"transparent",border:"none",color:T.textMuted,display:"flex",alignItems:"center",gap:"8px",fontWeight:600,fontSize:"0.9rem",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.color=T.accent} onMouseLeave={e=>e.currentTarget.style.color=T.textMuted}>
          <svg style={{width:"16px",height:"16px"}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          {t('back_to_home')}
        </button>
      </div>
    </div>
  );
};

export default SignUp;

