import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../api/api';
import { isValidLoginIdentifier, isValidPassword } from '../utils/validation';
import { useLanguage } from '../context/LanguageContext';
import LangToggle from '../components/LangToggle';
import { useTheme } from '../context/ThemeContext';
import Logo from '../components/Logo';
import { Brain, Sun, Moon, ArrowRight, Loader2, User, GraduationCap } from 'lucide-react';

/* ════════════════════════════════════════════════════
   DESIGN SYSTEM — Extracted from LandingPage.jsx
════════════════════════════════════════════════════ */
function buildTheme(dark) {
  return dark
    ? {
        bg:           "#0B1120",
        bgPanel:      "#0D1526",
        bgCard:       "rgba(255,255,255,0.035)",
        border:       "rgba(255,255,255,0.08)",
        borderAccent: "rgba(79,70,229,0.38)",
        borderRed:    "rgba(239,68,68,0.22)",
        accent:       "#4F46E5",
        accentDim:    "rgba(79,70,229,0.14)",
        iconA:        "#38BDF8",
        iconBgA:      "rgba(56,189,248,0.10)",
        iconBorderA:  "rgba(56,189,248,0.22)",
        textPrimary:  "#F8FAFC",
        textMuted:    "#94A3B8",
        textDim:      "#475569",
        shadowCard:   "0 1px 1px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.35)",
        inputBg:      "rgba(255,255,255,0.04)",
        inputBorder:  "rgba(255,255,255,0.10)",
        tabBg:        "rgba(255,255,255,0.04)",
        redIcon:      "#F87171",
        redDim:       "rgba(248,113,113,0.10)",
        redBorder:    "rgba(248,113,113,0.20)",
      }
    : {
        bg:           "#F8FAFC",
        bgPanel:      "#FFFFFF",
        bgCard:       "#FFFFFF",
        border:       "#E2E8F0",
        borderAccent: "rgba(15,76,129,0.28)",
        borderRed:    "rgba(239,68,68,0.20)",
        accent:       "#0F4C81",
        accentDim:    "rgba(15,76,129,0.08)",
        iconA:        "#0F4C81",
        iconBgA:      "rgba(15,76,129,0.08)",
        iconBorderA:  "rgba(15,76,129,0.18)",
        textPrimary:  "#0F172A",
        textMuted:    "#64748B",
        textDim:      "#94A3B8",
        shadowCard:   "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)",
        inputBg:      "#F8FAFC",
        inputBorder:  "#E2E8F0",
        tabBg:        "#F1F5F9",
        redIcon:      "#EF4444",
        redDim:       "rgba(239,68,68,0.08)",
        redBorder:    "rgba(239,68,68,0.18)",
      };
}

const glass = (T) => ({
  background:   T.bgCard,
  border:       `1px solid ${T.border}`,
  borderRadius: "20px",
  boxShadow:    T.shadowCard,
});

const transition = {
  transition: "background 0.25s ease, border-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease",
};

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, lang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const T = buildTheme(isDark);
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
      // POST /api/login — بيرجع { user: { data: { ...userFields }, videos_count, quizzes_count, average_score }, token }
      const response = await api.post('/login', { email, password });

      const userData = response.data?.user ?? {};
      const token = response.data?.token;

      if (!userData || !token) {
        setError('حدث خطأ في استلام بيانات تسجيل الدخول.');
        return;
      }

      // التحقق من نوع الحساب اللي اختاره المستخدم
      if (userData?.role !== accountType) {
        setError(`هذا الحساب ليس حساب ${accountType === 'student' ? 'طالب' : 'مدرس'}.`);
        return;
      }

      // تطبيع مفاتيح الـ API → مفاتيح موحدة تستخدمها كل صفحات الـ app
      // student_name/teacher_name → name  |  user_id → id
      const normalizedUser = {
        id:           String(userData.user_id ?? userData.id ?? userData.student_id ?? userData.teacher_id ?? ''),
        student_id:   userData.student_id   ?? null,
        teacher_id:   userData.teacher_id   ?? null,
        name:         userData.student_name ?? userData.teacher_name ?? userData.name ?? email,
        email:        userData.email ?? email,
        role:         userData.role,
        subject_id:   userData.subject_id   ?? null,
        subject_name: userData.subject_name ?? null,
        videos_count: Number(userData?.videos_count ?? 0) || 0,
        quizzes_count: Number(userData?.quizzes_count ?? 0) || 0,
        average_score: userData?.average_score ?? null,
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
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'فشل تسجيل الدخول. تحقق من الاتصال والمعلومات.';
      setError(message);
      console.error('Login Details Error:', error.response || error);
    } finally {
      setLoading(false);
    }
  };

  /* ── inline input style ── */
  const inputStyle = {
    ...transition,
    width:        "100%",
    background:   T.inputBg,
    border:       `1px solid ${T.inputBorder}`,
    borderRadius: "12px",
    padding:      "13px 16px",
    fontSize:     "0.9rem",
    color:        T.textPrimary,
    outline:      "none",
    boxSizing:    "border-box",
  };

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={{
        ...transition,
        background:   T.bg,
        minHeight:    "100vh",
        display:      "flex",
        flexDirection:"column",
        alignItems:   "center",
        justifyContent:"center",
        padding:      "24px",
        fontFamily:   "'Cairo', sans-serif",
        position:     "relative",
      }}
    >

      {/* ── Top-right controls ── */}
      <div style={{ position: "absolute", top: "20px", right: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
        <LangToggle />
        <button
          onClick={toggleTheme}
          title={isDark ? "Light Mode" : "Dark Mode"}
          style={{
            ...transition,
            width: "38px", height: "38px", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: T.bgCard,
            border: `1px solid ${T.border}`,
            cursor: "pointer", color: T.textMuted,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderAccent; e.currentTarget.style.color = T.accent; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
        >
          {isDark
            ? <Sun style={{ width: "16px", height: "16px" }} strokeWidth={1.5} />
            : <Moon style={{ width: "16px", height: "16px" }} strokeWidth={1.5} />
          }
        </button>
      </div>

      {/* ── Logo & Tagline ── */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <Logo className="justify-center mb-6 scale-110" />
        <p style={{ ...transition, color: T.textMuted, fontSize: "0.9rem" }}>{t('tagline')}</p>
      </div>

      {/* ── Auth Card (glass) ── */}
      <div
        style={{
          ...transition,
          ...glass(T),
          width:    "100%",
          maxWidth: "420px",
          padding:  "36px 32px",
        }}
      >
        <h2 style={{ ...transition, color: T.textPrimary, fontSize: "1.35rem", fontWeight: 800, textAlign: "center", marginBottom: "6px" }}>
          {t('login_title')}
        </h2>
        <p style={{ ...transition, color: T.textDim, fontSize: "0.82rem", textAlign: "center", marginBottom: "24px" }}>
          {t('login_subtitle')}
        </p>

        {/* ── Error Message ── */}
        {error && (
          <div
            style={{
              ...transition,
              marginBottom: "18px",
              padding: "12px 16px",
              borderRadius: "12px",
              background: T.redDim,
              border: `1px solid ${T.redBorder}`,
              color: T.redIcon,
              fontSize: "0.82rem",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {/* ── Account Type Tabs ── */}
        <div
          style={{
            ...transition,
            background: T.tabBg,
            border: `1px solid ${T.border}`,
            borderRadius: "14px",
            padding: "4px",
            display: "flex",
            marginBottom: "24px",
          }}
        >
          {[
            { key: 'student', label: t('student'), Icon: User },
            { key: 'teacher', label: t('teacher'), Icon: GraduationCap },
          ].map(tab => {
            const active = accountType === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setAccountType(tab.key)}
                style={{
                  ...transition,
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: "11px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  border: "none",
                  cursor: "pointer",
                  background: active ? T.accent : "transparent",
                  color: active ? "#FFFFFF" : T.textMuted,
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = T.textPrimary; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = T.textMuted; }}
              >
                <tab.Icon style={{ width: "15px", height: "15px" }} strokeWidth={2} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleLogin}>
          {/* Email / Phone */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ ...transition, display: "block", color: T.textMuted, fontSize: "0.8rem", fontWeight: 700, marginBottom: "8px" }}>
              {t('email_or_phone')}
            </label>
            <input
              type="text"
              placeholder="ahmed@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              dir="ltr"
              style={{
                ...inputStyle,
                opacity: loading ? 0.6 : 1,
                textAlign: "left",
              }}
              onFocus={e => { e.target.style.borderColor = T.borderAccent; }}
              onBlur={e => { e.target.style.borderColor = T.inputBorder; }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ ...transition, display: "block", color: T.textMuted, fontSize: "0.8rem", fontWeight: 700, marginBottom: "8px" }}>
              {t('password')}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              dir="ltr"
              style={{
                ...inputStyle,
                opacity: loading ? 0.6 : 1,
                textAlign: "left",
              }}
              onFocus={e => { e.target.style.borderColor = T.borderAccent; }}
              onBlur={e => { e.target.style.borderColor = T.inputBorder; }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...transition,
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              fontSize: "0.95rem",
              fontWeight: 700,
              background: T.accent,
              color: "#FFFFFF",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.opacity = loading ? "0.7" : "1"; }}
          >
            {loading ? (
              <>
                <Loader2 style={{ width: "18px", height: "18px" }} className="animate-spin" />
                {t('logging_in')}
              </>
            ) : (
              t('enter')
            )}
          </button>
        </form>

        {/* ── Bottom Links ── */}
        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <p style={{ ...transition, color: T.textMuted, fontSize: "0.82rem", marginBottom: "8px" }}>
            {t('no_account')}{' '}
            <Link
              to={`/signup${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect'))}` : ''}`}
              style={{ color: T.accent, fontWeight: 700, textDecoration: "none" }}
              onMouseEnter={e => { e.currentTarget.style.textDecoration = "underline"; }}
              onMouseLeave={e => { e.currentTarget.style.textDecoration = "none"; }}
            >
              {t('register_now')}
            </Link>
          </p>
          <Link
            to="/forgot-password"
            style={{ ...transition, color: T.textDim, fontSize: "0.8rem", textDecoration: "none" }}
            onMouseEnter={e => { e.currentTarget.style.color = T.textMuted; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.textDim; }}
          >
            {t('forgot_password')}
          </Link>
        </div>
      </div>

      {/* ── Back to Home ── */}
      <div style={{ marginTop: "28px" }}>
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            ...transition,
            display: "flex", alignItems: "center", gap: "6px",
            background: "transparent", border: "none",
            color: T.textDim, fontSize: "0.82rem",
            cursor: "pointer",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = T.accent; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.textDim; }}
        >
          <ArrowRight style={{ width: "14px", height: "14px" }} />
          {t('back_to_home')}
        </button>
      </div>

    </div>
  );
};

export default Login;
