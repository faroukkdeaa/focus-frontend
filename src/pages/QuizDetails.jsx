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

const ErrorState = ({ message, onRetry }) => (
  <div className="py-10 text-center flex flex-col items-center gap-3">
    <AlertTriangle className="w-8 h-8 text-amber-400" />
    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{message}</p>
    <button
      onClick={onRetry}
      className="flex items-center gap-1.5 text-sm font-bold text-[#103B66] dark:text-blue-400 hover:underline"
    >
      <RefreshCcw className="w-4 h-4" />
      إعادة المحاولة
    </button>
  </div>
);

const QuizDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizInfo, setQuizInfo] = useState({
    title: 'جاري التحميل...',
    totalAttempts: 0,
    avgScore: 0,
    passRate: 0,
  });
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
      let attemptsList = [];
      let quizPayload = {};
      let responseData = {};

      // 1. Try Primary Teacher Endpoint
      try {
        const { data } = await api.get(`/quizzes-details/${id}`);
        responseData = data?.data || data || {};
        quizPayload = responseData.quiz || responseData;

        let primaryAttempts = responseData.student_attempts || responseData.attempts || (Array.isArray(responseData.quiz_attempts_count) ? responseData.quiz_attempts_count : null) || responseData.students || quizPayload.attempts || quizPayload.quiz_attempts || [];
        if (typeof primaryAttempts === 'object' && primaryAttempts !== null && !Array.isArray(primaryAttempts)) {
          primaryAttempts = Object.values(primaryAttempts);
        }
        if (!Array.isArray(primaryAttempts)) primaryAttempts = [];
        attemptsList = primaryAttempts;
      } catch (err) {
        console.warn('Primary endpoint failed.');
      }

      // 2. Fallback: If no attempts found, hunt in the standard resource endpoint
      if ((!attemptsList || attemptsList.length === 0) && id) {
        console.log(`No attempts in primary endpoint. Hunting in /quizzes/${id}`);
        try {
          const fallbackRes = await api.get(`/quizzes/${id}`);
          const fallbackData = fallbackRes.data?.data || fallbackRes.data || {};
          const fallbackQuiz = fallbackData.quiz || fallbackData;

          // Merge missing quiz details if any
          if (!quizPayload.title && !quizPayload.lesson_name) {
            quizPayload = fallbackQuiz;
          }

          let fallbackAttempts = fallbackData.student_attempts || fallbackData.attempts || fallbackData.students || fallbackQuiz.attempts || fallbackQuiz.quiz_attempts || [];
          if (typeof fallbackAttempts === 'object' && fallbackAttempts !== null && !Array.isArray(fallbackAttempts)) {
            fallbackAttempts = Object.values(fallbackAttempts);
          }
          if (!Array.isArray(fallbackAttempts)) fallbackAttempts = [];

          if (fallbackAttempts.length > 0) {
            attemptsList = fallbackAttempts;
          }
        } catch (fallbackErr) {
          console.warn('Fallback endpoint also missing attempts.');
        }
      }

      // 3. Calculate KPIs safely
      // Prefer server-provided aggregate fields; fall back to local calculation
      const totalAttemptsCount =
        // quiz_attempts_count may be a number OR an array — handle both
        typeof responseData.quiz_attempts_count === 'number'
          ? responseData.quiz_attempts_count
          : Array.isArray(responseData.quiz_attempts_count)
            ? responseData.quiz_attempts_count.length
            : Array.isArray(responseData.student_attempts)
              ? responseData.student_attempts.length
              : attemptsList.length;

      let totalScorePercent = 0;
      let passedCount = 0;

      const mappedStudents = attemptsList.map((attempt, index) => {
        // score is a 0–1 decimal fraction from the API (e.g. 0.8 = 80%)
        const score = Number(attempt.score ?? 0);
        const percentage = Math.round(score * 100);

        totalScorePercent += percentage;
        if (percentage >= 50) passedCount++;

        const rawDate = attempt.created_at || attempt.date || attempt.attempted_at || attempt.quiz_date || null;

        return {
          id: attempt.id || attempt.attempt_id || `attempt-${index}`,
          studentName: attempt.student?.name || attempt.user?.name || attempt.student_name || 'طالب غير معروف',
          score,
          percentage,
          quizDate: rawDate,
          date: rawDate ? new Date(rawDate).toLocaleDateString('ar-EG') : 'غير محدد',
          // Display score as a formatted percentage string
          rawScoreText: `${percentage}%`,
          isPass: percentage >= 50,
        };
      });

      // Bind average_score from API payload; score is a 0–1 fraction so multiply by 100
      const avgScoreCalc =
        responseData.average_score != null && Number.isFinite(Number(responseData.average_score))
          ? Math.round(Number(responseData.average_score) * 100)
          : attemptsList.length > 0
            ? Math.round(totalScorePercent / attemptsList.length)
            : 0;

      const passRateCalc = totalAttemptsCount > 0 ? Math.round((passedCount / totalAttemptsCount) * 100) : 0;

      // 4. Update State
      setQuizInfo({
        title: quizPayload.lesson_name || quizPayload.title || quizPayload.name || 'تفاصيل الاختبار',
        totalAttempts: totalAttemptsCount,
        avgScore: avgScoreCalc,
        passRate: passRateCalc,
      });

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
      border: 'border-t-blue-500',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'متوسط الدرجة',
      value: `${quizInfo.avgScore}%`,
      icon: TrendingUp,
      border: 'border-t-green-500',
      iconBg: 'bg-green-100 dark:bg-green-900/40',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'معدل النجاح (≥ 50%)',
      value: `${quizInfo.passRate}%`,
      icon: CheckCircle2,
      border: 'border-t-violet-500',
      iconBg: 'bg-violet-100 dark:bg-violet-900/40',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
  ];

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Cairo']"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/teacher-analytics')}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-[#103B66] dark:hover:text-white transition shrink-0"
            >
              <ArrowRight className={`w-4 h-4 ${lang === 'en' ? 'rotate-180' : ''}`} />
              العودة للتحليلات
            </button>
            <button
              onClick={() => navigate(`/edit-quiz/${id}`)}
              className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-lg border border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition shrink-0"
            >
              <Edit className="w-4 h-4" />
              تعديل الاختبار
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-[#103B66] dark:text-blue-400 truncate">
                {quizInfo.title}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">تحليل أداء الطلاب في الاختبار</p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-700/70 cursor-default"
          >
            <Download className="w-4 h-4" />
            تصدير Excel (قريباً)
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {error && !loading ? (
          <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <ErrorState message={error} onRetry={fetchQuizDetails} />
          </section>
        ) : (
          <>
            <section>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpiCards.map(({ label, value, icon: Icon, border, iconBg, iconColor }) => (
                  <div key={label} className={`bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border-t-4 ${border}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
                      <div className={`p-2 rounded-full ${iconBg}`}>
                        <Icon className={`w-4 h-4 ${iconColor}`} />
                      </div>
                    </div>
                    {loading ? (
                      <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-800 dark:text-white leading-none">{value}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
                أداء الطلاب
              </h2>

              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-700/60 animate-pulse" />
                    ))}
                  </div>
                ) : students.length === 0 ? (
                  <div className="py-16 text-center">
                    <Users className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">لا توجد محاولات طلاب لهذا الاختبار حتى الآن</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-[760px] w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700/60">
                        <tr>
                          <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-300">الطالب</th>
                          <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-300">تاريخ الاختبار</th>
                          <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-300">الدرجة الخام</th>
                          <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-300">النسبة المئوية</th>
                          <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-300">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr
                            key={student.id}
                            className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <UserCircle2 className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                <span className="text-sm font-bold text-gray-800 dark:text-white">{student.studentName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                                <CalendarDays className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                {formatDate(student.quizDate, lang)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-gray-800 dark:text-white">{student.rawScoreText}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      student.percentage < 50
                                        ? 'bg-red-500'
                                        : student.percentage < 75
                                          ? 'bg-yellow-500'
                                          : 'bg-green-500'
                                    }`}
                                    style={{ width: `${student.percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{student.percentage}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                  student.isPass
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                }`}
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
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
                تحليل نقاط الضعف
              </h2>

              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-700/60 animate-pulse" />
                    ))}
                  </div>
                ) : !hasQuestionData ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
                    <AlertTriangle className="w-10 h-10 mb-2 opacity-50" />
                    <p className="font-bold mb-1">Analysis Coming Soon</p>
                    <p className="text-sm">سيظهر تحليل الأسئلة الضعيفة بمجرد توفر بيانات تفصيلية للأسئلة.</p>
                  </div>
                ) : weakPoints.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
                    <CheckCircle2 className="w-10 h-10 mb-2 text-green-500/70" />
                    <p className="font-bold">لا توجد نقاط ضعف تتجاوز 50% حالياً</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {weakPoints.map((point) => (
                      <div
                        key={point.id}
                        className="p-4 rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50/40 dark:bg-red-900/10"
                      >
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <p className="font-bold text-gray-800 dark:text-white leading-snug">{point.label}</p>
                          <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                            نسبة الفشل: {point.failRate}%
                          </span>
                        </div>

                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${point.failRate}%` }} />
                        </div>

                        <p className="text-xs text-gray-600 dark:text-gray-300">
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
