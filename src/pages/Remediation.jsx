import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import {
  ArrowRight, BookOpen, PlayCircle, Target, Loader2, Zap,
  ChevronDown, ChevronUp, Video, HelpCircle, RefreshCcw, AlertTriangle,
  CheckCircle2, XCircle,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const API = 'http://localhost:3001';

// ── Sub-components ─────────────────────────────────────────────────────────────

const SectionLoader = () => (
  <div className="space-y-2 py-3">
    {[0, 1, 2].map(i => (
      <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700/50 rounded-lg animate-pulse" />
    ))}
  </div>
);

const SectionError = ({ message, onRetry }) => (
  <div className="py-6 flex flex-col items-center gap-2 text-center">
    <AlertTriangle className="w-6 h-6 text-amber-400" />
    <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    <button
      onClick={onRetry}
      className="flex items-center gap-1.5 text-sm font-bold text-[#103B66] dark:text-blue-400 hover:underline"
    >
      <RefreshCcw className="w-3.5 h-3.5" /> إعادة المحاولة
    </button>
  </div>
);

// ── Gap card with expandable content ──────────────────────────────────────────

const GapCard = ({ item, onStartLesson, onFocusedQuiz }) => {
  const { t } = useLanguage();
  const [open,           setOpen]           = useState(false);
  const [content,        setContent]        = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [errorContent,   setErrorContent]   = useState(null);

  // per-question answer tracking
  const [answers,   setAnswers]   = useState({});
  const [submitted, setSubmitted] = useState({});

  const fetchContent = useCallback(async () => {
    setLoadingContent(true);
    setErrorContent(null);
    try {
      const { data } = await api.get(
        `${API}/remediation_content?gap=${encodeURIComponent(item.gap)}`
      );
      setContent(data[0] ?? null);
    } catch {
      setErrorContent('تعذّر تحميل المحتوى العلاجي.');
    } finally {
      setLoadingContent(false);
    }
  }, [item.gap]);

  const handleToggle = () => {
    if (!open && !content && !errorContent) fetchContent();
    setOpen(prev => !prev);
  };

  const handleAnswer = (qId, idx) =>
    setAnswers(prev => ({ ...prev, [qId]: idx }));

  const handleSubmitQ = (qId) =>
    setSubmitted(prev => ({ ...prev, [qId]: true }));

  const difficultyBadge = {
    easy:   'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    medium: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
    hard:   'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  };
  const difficultyLabel = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all duration-200
      ${item.completed
        ? 'border-green-200 dark:border-green-800'
        : 'border-gray-100 dark:border-gray-700'}`}
    >
      {/* ── Card header ── */}
      <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-lg shrink-0 ${item.completed ? 'bg-green-50 dark:bg-green-900/30' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
            {item.completed
              ? <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              : <BookOpen className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
            }
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-800 dark:text-white truncate">
              {item.subject}: {item.gap}
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${difficultyBadge[item.difficulty] ?? difficultyBadge.medium}`}>
                {difficultyLabel[item.difficulty] ?? item.difficulty}
              </span>
              {item.completed && (
                <span className="text-xs text-green-600 dark:text-green-400 font-bold">{t('done_label')}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <button
            onClick={() => onStartLesson(item)}
            disabled={item.completed}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2
              bg-[#103B66] hover:bg-[#0c2d4d] disabled:bg-gray-300 dark:disabled:bg-gray-600
              disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold transition
              shadow-sm text-sm"
          >
            <PlayCircle className="w-4 h-4" />
            {item.completed ? t('done_label') : t('start_lesson')}
          </button>
          <button
            onClick={() => onFocusedQuiz(item)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2
              bg-violet-600 hover:bg-violet-700 active:scale-95 text-white px-4 py-2
              rounded-lg font-bold transition shadow-sm text-sm"
          >
            <Zap className="w-4 h-4" />
            {t('focused_quiz')}
          </button>
          <button
            onClick={handleToggle}
            aria-label="عرض المحتوى العلاجي"
            className="flex items-center justify-center gap-1.5 border border-gray-200
              dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50
              dark:hover:bg-gray-700 px-3 py-2 rounded-lg font-bold transition text-sm"
          >
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {open ? 'إخفاء' : 'محتوى علاجي'}
          </button>
        </div>
      </div>

      {/* ── Expandable content ── */}
      {open && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 pb-5 pt-4 space-y-6">
          {loadingContent ? (
            <SectionLoader />
          ) : errorContent ? (
            <SectionError message={errorContent} onRetry={fetchContent} />
          ) : !content ? (
            <p className="text-sm text-center text-gray-400 py-4">لا يوجد محتوى علاجي لهذا الموضوع.</p>
          ) : (
            <>
              {/* Videos */}
              <div>
                <h4 className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200 text-sm mb-3">
                  <Video className="w-4 h-4 text-[#103B66] dark:text-blue-400" />
                  فيديوهات موصى بها ({content.videos.length})
                </h4>
                <div className="space-y-2">
                  {content.videos.map(v => (
                    <div key={v.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40
                        border border-gray-100 dark:border-gray-700 hover:border-[#103B66]/30 transition"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#103B66]/10 dark:bg-blue-900/30 flex items-center
                        justify-center shrink-0">
                        <PlayCircle className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{v.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{v.teacher} · {v.duration}</p>
                      </div>
                      <button
                        onClick={() => {/* navigate to lesson */}}
                        className="shrink-0 text-xs font-bold text-[#103B66] dark:text-blue-400
                          hover:underline whitespace-nowrap"
                      >
                        مشاهدة
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Practice questions */}
              <div>
                <h4 className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200 text-sm mb-3">
                  <HelpCircle className="w-4 h-4 text-violet-500" />
                  أسئلة تدريبية ({content.questions.length})
                </h4>
                <div className="space-y-4">
                  {content.questions.map((q, qi) => {
                    const chosen    = answers[q.id];
                    const isSubmit  = submitted[q.id];
                    const isCorrect = chosen === q.correct;
                    return (
                      <div key={q.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700
                        bg-gray-50 dark:bg-gray-700/30 space-y-3">
                        <p className="text-sm font-bold text-gray-800 dark:text-white">
                          {qi + 1}. {q.text}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, oi) => {
                            let cls = 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300';
                            if (isSubmit) {
                              if (oi === q.correct) cls = 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-bold';
                              else if (oi === chosen) cls = 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400';
                            } else if (chosen === oi) {
                              cls = 'border-[#103B66] dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-[#103B66] dark:text-blue-300 font-bold';
                            }
                            return (
                              <button
                                key={oi}
                                disabled={isSubmit}
                                onClick={() => handleAnswer(q.id, oi)}
                                className={`text-right text-sm px-3 py-2 rounded-lg border transition ${cls}
                                  disabled:cursor-default hover:enabled:opacity-90`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {!isSubmit ? (
                          <button
                            disabled={chosen === undefined}
                            onClick={() => handleSubmitQ(q.id)}
                            className="text-xs font-bold text-white bg-[#103B66] dark:bg-blue-600
                              hover:bg-[#0c2d4d] disabled:bg-gray-300 dark:disabled:bg-gray-600
                              disabled:cursor-not-allowed px-4 py-1.5 rounded-lg transition"
                          >
                            تحقق من الإجابة
                          </button>
                        ) : (
                          <div className={`flex items-start gap-2 text-sm rounded-lg px-3 py-2 ${
                            isCorrect
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                          }`}>
                            {isCorrect
                              ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                              : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            }
                            <span><span className="font-bold">{isCorrect ? 'إجابة صحيحة! ' : 'إجابة خاطئة. '}</span>{q.explanation}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────

const Remediation = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [topics,  setTopics]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchGaps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = String(storedUser.id || '');
      if (!userId) {
        setTopics([]);
        return;
      }
      const { data } = await api.get(`${API}/user_remediation_gaps?userId=${userId}`);
      setTopics(data);
    } catch {
      setError('تعذّر تحميل خطة المعالجة. تأكد من تشغيل json-server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGaps(); }, [fetchGaps]);

  const completedCount = topics.filter((t) => t.completed).length;
  const totalCount = topics.length;
  const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleStartLesson = async (topic) => {
    try {
      // جلب بيانات الدرس من الكورس
      const coursesResponse = await api.get(`http://localhost:3001/courses?subjectId=${topic.subjectId}`);
      if (coursesResponse.data && coursesResponse.data.length > 0) {
        const course = coursesResponse.data[0];
        const lesson = course.lessons?.find(l => l.id === topic.lessonId) || course.lessons?.[0];
        
        if (lesson) {
          // تحديث حالة الموضوع كمكتمل
          setTopics((prev) =>
            prev.map((t) => (t.id === topic.id ? { ...t, completed: true } : t))
          );

          // الانتقال لصفحة الدرس مع البيانات
          navigate('/course-details', {
            state: {
              lesson: lesson,
              subjectId: topic.subjectId
            }
          });
        } else {
          setError('الدرس غير متوفر.');
        }
      } else {
        setError('المادة غير متوفرة.');
      }
    } catch (err) {
      console.error("Error loading lesson:", err);
      setError('تعذر تحميل الدرس.');
    }
  };

  const handleFocusedQuiz = (item) => {
    navigate('/focused-quiz', {
      state: {
        subtopic: item.gap,
        subject: item.subject,
        lesson: item.lessonTitle,
        teacherName: 'مستر محمد أحمد',
        subjectId: item.subjectId,
        lessonId: item.lessonId,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-[#103B66] font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-lg font-bold">{t('loading_remediation')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-2xl text-center border border-red-200 dark:border-red-800 max-w-md">
          <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            {t('back_to_dashboard')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-[#103B66] transition font-bold"
            >
              <ArrowRight className={`w-5 h-5 ${lang === 'en' ? 'rotate-180' : ''}`} />
              {t('back_to_dashboard')}
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-[#103B66] p-2 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-[#103B66] dark:text-white">{t('remediation_title')}</h1>
            </div>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[#103B66]" />
          {t('remediation_title')}
        </h2>

        {/* Progress bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600 dark:text-gray-300 font-bold">{t('overall_progress')}</span>
            <span className="text-[#103B66] dark:text-blue-400 font-bold">
              {completedCount} / {totalCount}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-[#103B66] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{progressPercent}% {t('topics_completed')}</p>
        </div>

        {/* Weak topics list */}
        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">{t('weak_subtopic')}</h3>
        <div className="space-y-4">
          {topics.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-bold">لا توجد نقاط ضعف مسجّلة</p>
            </div>
          ) : (
            topics.map((item) => (
              <GapCard
                key={item.id}
                item={item}
                onStartLesson={handleStartLesson}
                onFocusedQuiz={handleFocusedQuiz}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Remediation;
