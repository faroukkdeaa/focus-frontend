import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Edit,
  Download,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  UserCircle2,
  CalendarDays,
  ClipboardList,
  RefreshCcw,
} from 'lucide-react';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

/* ════════════════════════════════════════════════════
   THEME FACTORY
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
        iconB:        "#818CF8",
        iconBgB:      "rgba(129,140,248,0.11)",
        iconBorderB:  "rgba(129,140,248,0.25)",
        textPrimary:  "#F8FAFC",
        textMuted:    "#94A3B8",
        textDim:      "#475569",
        shadowCard:   "0 1px 1px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.35)",
        redIcon:      "#F87171",
        redDim:       "rgba(248,113,113,0.10)",
        redBorder:    "rgba(248,113,113,0.20)",
        green:        "#34D399",
        greenDim:     "rgba(52,211,153,0.12)",
        greenBorder:  "rgba(52,211,153,0.22)",
        warningDim:   "rgba(245,158,11,0.10)",
        warningBorder:"rgba(245,158,11,0.20)",
        warningIcon:  "#FBBF24",
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
        iconB:        "#2563EB",
        iconBgB:      "rgba(37,99,235,0.07)",
        iconBorderB:  "rgba(37,99,235,0.16)",
        textPrimary:  "#0F172A",
        textMuted:    "#64748B",
        textDim:      "#94A3B8",
        shadowCard:   "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)",
        redIcon:      "#EF4444",
        redDim:       "rgba(239,68,68,0.08)",
        redBorder:    "rgba(239,68,68,0.18)",
        green:        "#059669",
        greenDim:     "rgba(5,150,105,0.08)",
        greenBorder:  "rgba(5,150,105,0.18)",
        warningDim:   "rgba(245,158,11,0.08)",
        warningBorder:"rgba(245,158,11,0.18)",
        warningIcon:  "#F59E0B",
      };
}

const glass = (T, extra) => ({
  background:   T.bgCard,
  border:       `1px solid ${T.border}`,
  borderRadius: "16px",
  boxShadow:    T.shadowCard,
  ...extra,
});

const transition = {
  transition: "all 0.25s ease",
};

const iw = (T, type = 'accent') => {
  let bg, bd;
  if (type === 'red') { bg = T.redDim; bd = T.redBorder; }
  else if (type === 'warning') { bg = T.warningDim; bd = T.warningBorder; }
  else if (type === 'green') { bg = T.greenDim; bd = T.greenBorder; }
  else if (type === 'secondary') { bg = T.iconBgB; bd = T.iconBorderB; }
  else { bg = T.iconBgA; bd = T.iconBorderA; }
  return {
    ...transition,
    width: "42px", height: "42px", borderRadius: "12px",
    background: bg, border: `1px solid ${bd}`,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
  };
};

const extractDataList = (resData) => {
  if (!resData) return [];
  const target = resData.data || resData;
  if (Array.isArray(target)) return target;
  if (typeof target === 'object' && target !== null) return Object.values(target);
  return [];
};

const pickFirstList = (...candidates) => {
  for (const candidate of candidates) {
    const list = extractDataList(candidate);
    if (list.length > 0) return list;
  }
  return [];
};

const formatDate = (dateValue, lang) => {
  if (!dateValue) return '—';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return String(dateValue);
  try {
    return parsed.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(dateValue);
  }
};

const ErrorState = ({ message, onRetry, T }) => (
  <div style={{ padding: "40px 0", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
    <AlertTriangle style={{ color: T.warningIcon, width: "32px", height: "32px" }} />
    <p style={{ fontSize: "0.875rem", color: T.textMuted, fontWeight: 600 }}>{message}</p>
    <button
      onClick={onRetry}
      style={{
        ...transition,
        display: "flex", alignItems: "center", gap: "6px",
        fontSize: "0.875rem", fontWeight: 700, color: T.accent,
        background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline"
      }}
    >
      <RefreshCcw style={{ width: "16px", height: "16px" }} />
      إعادة المحاولة
    </button>
  </div>
);

const QuizDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const T = buildTheme(isDark);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizInfo, setQuizInfo] = useState({
    title: 'جاري التحميل...',
    totalAttempts: 0,
    avgScore: 0,
    passRate: 0,
  });
  const [actualQuizId, setActualQuizId] = useState(null);
  const [students, setStudents] = useState([]);
  const [weakPoints, setWeakPoints] = useState([]);
  const [hasQuestionData, setHasQuestionData] = useState(false);

  const fetchQuizDetails = useCallback(async () => {
    if (!id) {
      setError('معرّف الاختبار غير متوفر.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/teachers/dashboard');
      const payload = data?.data || data || {};
      const attempts = Array.isArray(payload.student_attempts) ? payload.student_attempts : [];
      const quizId = Number(id);

      const currentQuizAttempts = attempts.filter((attempt) => (
        Number(attempt.lesson_id) === quizId || Number(attempt.quiz_id) === quizId
      ));

      const totalAttemptsCount = currentQuizAttempts.length;
      const avgRaw = totalAttemptsCount
        ? currentQuizAttempts.reduce((sum, attempt) => {
            const total = Number(attempt.total_marks || 0);
            const score = Number(attempt.score || 0);
            if (!total) return sum;
            return sum + (score / total);
          }, 0) / totalAttemptsCount
        : 0;

      const passedCount = currentQuizAttempts.filter((attempt) => {
        const total = Number(attempt.total_marks || 0);
        const score = Number(attempt.score || 0);
        if (!total) return false;
        return (score / total) >= 0.5;
      }).length;

      const passRateCalc = totalAttemptsCount > 0 ? Math.round((passedCount / totalAttemptsCount) * 100) : 0;

      const mappedStudents = currentQuizAttempts.map((attempt, index) => {
        const score = Number(attempt.score ?? 0);
        const totalMarks = Number(attempt.total_marks ?? 0);
        const percentage = totalMarks ? Math.round((score / totalMarks) * 100) : 0;
        const rawDate = attempt.created_at || attempt.date || attempt.attempted_at || attempt.quiz_date || null;

        return {
          id: attempt.id || attempt.attempt_id || `attempt-${index}`,
          studentName: attempt.student_name || attempt.student?.name || attempt.user?.name || 'طالب غير معروف',
          studentEmail: attempt.student_email || attempt.student?.email || attempt.user?.email || '—',
          scoreText: `${score} من ${totalMarks}`,
          percentage,
          quizDate: rawDate,
          isPass: percentage >= 50,
        };
      });

      setQuizInfo({
        title: currentQuizAttempts[0]?.lesson_title || currentQuizAttempts[0]?.quiz_title || 'تفاصيل الاختبار',
        totalAttempts: totalAttemptsCount,
        avgScore: Math.round(avgRaw * 100),
        passRate: passRateCalc,
      });
      setActualQuizId(currentQuizAttempts[0]?.quiz_id || currentQuizAttempts[0]?.id || null);

      setStudents(mappedStudents);
      setWeakPoints([]);
      setHasQuestionData(false);
    } catch (err) {
      console.error('Total failure in fetching quiz details:', err);
      setError('تعذّر تحميل تفاصيل الاختبار والطلاب.');
      setStudents([]);
      setWeakPoints([]);
      setHasQuestionData(false);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuizDetails();
  }, [fetchQuizDetails]);

  const kpiCards = [
    {
      label: 'إجمالي الطلاب الذين أدّوا الاختبار',
      value: quizInfo.totalAttempts,
      icon: Users,
      type: 'accent'
    },
    {
      label: 'متوسط الدرجة',
      value: `${quizInfo.avgScore}%`,
      icon: TrendingUp,
      type: 'secondary'
    },
    {
      label: 'معدل النجاح (≥ 50%)',
      value: `${quizInfo.passRate}%`,
      icon: CheckCircle2,
      type: 'green'
    },
  ];

  return (
    <div
      style={{ ...transition, background: T.bg, minHeight: "100vh", fontFamily: "'Cairo', sans-serif" }}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <header
        style={{
          ...transition,
          position: "sticky", top: 0, zIndex: 20,
          background: isDark ? "rgba(11,17,32,0.88)" : "rgba(248,250,252,0.90)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div style={{ maxWidth: "1152px", margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <button
              onClick={() => navigate('/teacher-analytics')}
              style={{
                ...transition,
                display: "flex", alignItems: "center", gap: "6px",
                background: "transparent", border: "none", cursor: "pointer",
                color: T.textMuted, fontSize: "0.875rem", fontWeight: 700, flexShrink: 0
              }}
              onMouseEnter={e => e.currentTarget.style.color = T.textPrimary}
              onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
            >
              <ArrowRight style={{ width: "16px", height: "16px", ...(lang === 'en' ? { transform: "rotate(180deg)" } : {}) }} />
              العودة للتحليلات
            </button>
            <button
              onClick={() => actualQuizId && navigate(`/edit-quiz/${actualQuizId}`)}
              style={{
                ...transition,
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 16px", borderRadius: "8px",
                background: T.iconBgA, border: `1px solid ${T.iconBorderA}`,
                color: T.iconA, fontSize: "0.875rem", fontWeight: 700, flexShrink: 0, cursor: actualQuizId ? "pointer" : "not-allowed",
                opacity: actualQuizId ? 1 : 0.6
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={e => e.currentTarget.style.opacity = actualQuizId ? "1" : "0.6"}
            >
              <Edit style={{ width: "16px", height: "16px" }} />
              تعديل الاختبار
            </button>
            <div style={{ minWidth: 0, marginLeft: "12px" }}>
              <h1 style={{ ...transition, fontSize: "1.1rem", fontWeight: 800, color: T.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {quizInfo.title}
              </h1>
              <p style={{ ...transition, fontSize: "0.75rem", color: T.textMuted }}>تحليل أداء الطلاب في الاختبار</p>
            </div>
          </div>

          <button
            type="button"
            style={{
              ...transition,
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 16px", borderRadius: "8px",
              background: T.bgPanel, border: `1px solid ${T.border}`,
              color: T.textMuted, fontSize: "0.875rem", fontWeight: 700, cursor: "default"
            }}
          >
            <Download style={{ width: "16px", height: "16px" }} />
            تصدير Excel (قريباً)
          </button>
        </div>
      </header>

      <main style={{ maxWidth: "1152px", margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: "32px" }}>
        {error && !loading ? (
          <section style={glass(T)}>
            <ErrorState message={error} onRetry={fetchQuizDetails} T={T} />
          </section>
        ) : (
          <>
            <section>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                {kpiCards.map(({ label, value, icon: Icon, type }) => {
                  let valColor = T.textPrimary;
                  if (type === 'green') valColor = T.green;
                  return (
                    <div key={label} style={{ ...glass(T), padding: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                        <p style={{ fontSize: "0.8rem", color: T.textMuted, fontWeight: 600 }}>{label}</p>
                        <div style={iw(T, type)}>
                          <Icon style={{ width: "20px", height: "20px", color: type === 'green' ? T.green : type === 'secondary' ? T.iconB : T.iconA }} />
                        </div>
                      </div>
                      {loading ? (
                        <div style={{ height: "36px", width: "80px", background: T.bg, borderRadius: "8px" }} className="animate-pulse" />
                      ) : (
                        <p style={{ fontSize: "1.875rem", fontWeight: 800, color: valColor, lineHeight: 1 }}>{value}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: T.textPrimary, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Users style={{ width: "20px", height: "20px", color: T.accent }} />
                أداء الطلاب
              </h2>

              <div style={{ ...glass(T), overflow: "hidden" }}>
                {loading ? (
                  <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} style={{ height: "56px", borderRadius: "12px", background: T.bg }} className="animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ minWidth: "760px", width: "100%", borderCollapse: "collapse" }}>
                      <thead style={{ background: T.bgPanel }}>
                        <tr>
                          {['الطالب', 'البريد الإلكتروني', 'تاريخ الاختبار', 'الدرجة', 'النسبة المئوية', 'الحالة'].map((th, i) => (
                            <th key={i} style={{ textAlign: "right", padding: "16px", fontSize: "0.75rem", fontWeight: 800, color: T.textMuted }}>{th}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student.id} style={{ ...transition, borderTop: `1px solid ${T.border}` }} onMouseEnter={e => e.currentTarget.style.background = T.bgPanel} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <td style={{ padding: "16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <UserCircle2 style={{ width: "20px", height: "20px", color: T.textMuted }} />
                                <span style={{ fontSize: "0.875rem", fontWeight: 800, color: T.textPrimary }}>{student.studentName}</span>
                              </div>
                            </td>
                            <td style={{ padding: "16px", fontSize: "0.875rem", fontWeight: 700, color: T.textDim }}>
                              {student.studentEmail}
                            </td>
                            <td style={{ padding: "16px" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", color: T.textDim, fontWeight: 600 }}>
                                <CalendarDays style={{ width: "16px", height: "16px" }} />
                                {formatDate(student.quizDate, lang)}
                              </span>
                            </td>
                            <td style={{ padding: "16px", fontSize: "0.875rem", fontWeight: 800, color: T.textPrimary }}>
                              {student.scoreText}
                            </td>
                            <td style={{ padding: "16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ width: "80px", height: "8px", background: T.bg, borderRadius: "999px", overflow: "hidden" }}>
                                  <div
                                    style={{
                                      height: "100%", borderRadius: "999px",
                                      background: student.percentage < 50 ? T.redIcon : student.percentage < 75 ? T.warningIcon : T.green,
                                      width: `${student.percentage}%`
                                    }}
                                  />
                                </div>
                                <span style={{ fontSize: "0.875rem", fontWeight: 800, color: T.textPrimary }}>{student.percentage}%</span>
                              </div>
                            </td>
                            <td style={{ padding: "16px" }}>
                              <span
                                style={{
                                  display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 800,
                                  background: student.isPass ? T.greenDim : T.redDim,
                                  color: student.isPass ? T.green : T.redIcon,
                                  border: `1px solid ${student.isPass ? T.greenBorder : T.redBorder}`
                                }}
                              >
                                {student.isPass ? 'ناجح' : 'راسب'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: T.textPrimary, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <ClipboardList style={{ width: "20px", height: "20px", color: T.accent }} />
                تحليل نقاط الضعف
              </h2>

              <div style={{ ...glass(T), padding: "20px" }}>
                {loading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} style={{ height: "64px", borderRadius: "12px", background: T.bg }} className="animate-pulse" />
                    ))}
                  </div>
                ) : !hasQuestionData ? (
                  <div style={{ height: "176px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", color: T.textMuted }}>
                    <AlertTriangle style={{ width: "40px", height: "40px", marginBottom: "8px", opacity: 0.5 }} />
                    <p style={{ fontWeight: 800, marginBottom: "4px" }}>Analysis Coming Soon</p>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>سيظهر تحليل الأسئلة الضعيفة بمجرد توفر بيانات تفصيلية للأسئلة.</p>
                  </div>
                ) : weakPoints.length === 0 ? (
                  <div style={{ height: "176px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", color: T.textMuted }}>
                    <CheckCircle2 style={{ width: "40px", height: "40px", marginBottom: "8px", color: T.green, opacity: 0.7 }} />
                    <p style={{ fontWeight: 800 }}>لا توجد نقاط ضعف تتجاوز 50% حالياً</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {weakPoints.map((point) => (
                      <div
                        key={point.id}
                        style={{ padding: "16px", borderRadius: "12px", border: `1px solid ${T.redBorder}`, background: T.redDim }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
                          <p style={{ fontWeight: 800, color: T.textPrimary, lineHeight: 1.4 }}>{point.label}</p>
                          <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 800, background: T.redDim, color: T.redIcon, border: `1px solid ${T.redBorder}` }}>
                            نسبة الفشل: {point.failRate}%
                          </span>
                        </div>

                        <div style={{ width: "100%", height: "8px", background: T.bgCard, borderRadius: "999px", overflow: "hidden", marginBottom: "8px" }}>
                          <div style={{ height: "100%", background: T.redIcon, borderRadius: "999px", width: `${point.failRate}%` }} />
                        </div>

                        <p style={{ fontSize: "0.75rem", color: T.textMuted, fontWeight: 600 }}>
                          {point.failedStudents !== null && point.totalAttempts !== null
                            ? `${point.failedStudents} من ${point.totalAttempts} طلاب أخفقوا في هذا السؤال/الموضوع`
                            : 'مؤشر فشل مرتفع بناءً على بيانات التحليل'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default QuizDetails;
