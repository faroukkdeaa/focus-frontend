import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  ArrowRight, AlertTriangle, CheckCircle2, XCircle,
  Brain, BookOpen, RefreshCcw, TrendingUp, Zap, Home, Target,
} from 'lucide-react';

// ─── Sub-components ─────────────────────────────────────────────────────────

const AccuracyPill = ({ correct, total }) => {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  if (pct < 60) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
        🔴 {pct}% ضعيف
      </span>
    );
  }
  if (pct <= 80) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
        🟡 {pct}% متوسط
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
      🟢 {pct}% قوي
    </span>
  );
};

const SkillTag = ({ skill }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
    <Brain className="w-3 h-3" />
    {skill}
  </span>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const WeaknessReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLanguage();

  const {
    score,
    total,
    questions,
    userAnswers,
    lesson,
    subjectId,
    subjectName,
  } = location.state || {};

  // Guard: no data → redirect
  if (!location.state) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-['Cairo']"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="bg-yellow-50 p-8 rounded-2xl text-center border border-yellow-200 max-w-md">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-yellow-700 mb-4">
            {t('no_quiz_data')}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-[#103B66] hover:underline font-bold"
          >
            {t('back_to_home')}
          </button>
        </div>
      </div>
    );
  }

  // ── Compute subtopics ────────────────────────────────────────────────────
  // Priority 1 → explicit `subtopics` array passed in state (pre-computed / from backend)
  // Priority 2 → derive from `questions` + `userAnswers` when questions carry subtopic/skill
  // Priority 3 → null (no subtopic data available for this quiz)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const subtopics = useMemo(() => {
    // 1. Explicit array from navigation state
    if (location.state?.subtopics?.length > 0) {
      return location.state.subtopics.map((s) => ({
        name: s.name,
        skill: s.skill || 'فهم',
        correct: s.correct,
        wrong: s.total - s.correct,
        total: s.total,
      }));
    }

    // 2. Derive from questions data
    if (questions?.length > 0 && questions.some((q) => q.subtopic)) {
      const map = {};
      questions.forEach((q, idx) => {
        const key = q.subtopic || 'عام';
        if (!map[key]) {
          map[key] = { name: key, skill: q.skill || 'فهم', correct: 0, wrong: 0, total: 0 };
        }
        map[key].total++;
        const userAns = userAnswers?.[idx] ?? null;
        if (userAns === q.correct) {
          map[key].correct++;
        } else {
          map[key].wrong++;
        }
      });
      return Object.values(map);
    }

    return null; // no subtopic data
  }, [location.state, questions, userAnswers]);

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = percentage >= 50;

  const weakSubtopics =
    subtopics?.filter(
      (s) => s.total > 0 && Math.round((s.correct / s.total) * 100) < 60
    ) || [];

  // ── Circular SVG params ──────────────────────────────────────────────────
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (circumference * percentage) / 100;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleGetRecommendations = (subtopic) => {
    navigate('/remediation', {
      state: {
        weakSubtopic: {
          name: subtopic.name,
          skill: subtopic.skill,
          subject: subjectName || lesson?.title || 'غير محدد',
          subjectId: subjectId,
          lessonId: lesson?.id,
          accuracy: Math.round((subtopic.correct / subtopic.total) * 100),
        },
      },
    });
  };

  const handleTryAgain = () => {
    navigate('/quiz', { state: { lesson, subjectId } });
  };

  const handleBackToLesson = () => {
    if (lesson && subjectId) {
      navigate('/course-details', { state: { lesson, subjectId } });
    } else {
      navigate('/dashboard');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 font-['Cairo']"
      dir="rtl"
    >
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#103B66] transition text-sm font-medium"
          >
            <ArrowRight className="w-4 h-4" />
            رجوع
          </button>

          <div className="flex flex-col items-center text-center">
            <h1 className="text-xl font-bold text-[#103B66] dark:text-white">
              تقرير الأداء التفصيلي
            </h1>
            {(subjectName || lesson?.title) && (
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {subjectName && <span>{subjectName}</span>}
                {subjectName && lesson?.title && <span> · </span>}
                {lesson?.title && <span>{lesson.title}</span>}
              </span>
            )}
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-400 hover:text-[#103B66] transition"
            title="الرئيسية"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>

        {/* ── Overall Score Card ──────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center relative overflow-hidden">
          {/* Color bar */}
          <div
            className={`absolute top-0 left-0 w-full h-2 ${
              passed ? 'bg-green-500' : 'bg-red-500'
            }`}
          />

          {/* Pass / Fail badge */}
          <div className="flex justify-center mb-5 mt-1">
            <span
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold ${
                passed
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {passed ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {passed ? t('passed_label') : t('failed_label')}
            </span>
          </div>

          {/* Circular progress */}
          <div className="w-36 h-36 mx-auto relative mb-6">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 144 144"
            >
              <circle
                cx="72"
                cy="72"
                r={radius}
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-gray-100 dark:text-gray-700"
              />
              <circle
                cx="72"
                cy="72"
                r={radius}
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                className={passed ? 'text-green-500' : 'text-red-500'}
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-extrabold text-[#103B66]">
                {percentage}%
              </span>
            </div>
          </div>

          <p className="text-gray-700 dark:text-gray-200 text-base">
            {t('correct_of_prefix')}{' '}
            <span className="font-extrabold text-[#103B66] text-lg">{score}</span>
            {' '}{t('correct_of_middle')}{' '}
            <span className="font-extrabold text-[#103B66] text-lg">{total}</span>
            {' '}{t('correct_of_suffix')}
          </p>

          {/* Stats strip */}
          <div className="mt-5 grid grid-cols-3 divide-x divide-x-reverse divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="py-3 px-4 text-center">
              <p className="text-2xl font-bold text-green-600">{score}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('correct_label')}</p>
            </div>
            <div className="py-3 px-4 text-center">
              <p className="text-2xl font-bold text-red-500">{total - score}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('wrong_label')}</p>
            </div>
            <div className="py-3 px-4 text-center">
              <p className="text-2xl font-bold text-orange-500">
                {weakSubtopics.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('weak_point_label')}</p>
            </div>
          </div>
        </div>

        {/* ── Subtopic Breakdown ──────────────────────────────────────────── */}
        {subtopics && subtopics.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#103B66]" />
              {t('subtopic_analysis')}
            </h2>

            <div className="space-y-3">
              {subtopics.map((s, idx) => {
                const acc =
                  s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                const barColor =
                  acc < 60
                    ? 'bg-red-400'
                    : acc <= 80
                    ? 'bg-yellow-400'
                    : 'bg-green-400';
                const trackColor =
                  acc < 60
                    ? 'bg-red-100'
                    : acc <= 80
                    ? 'bg-yellow-100'
                    : 'bg-green-100';

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-colors ${
                      acc < 60
                        ? 'border-red-200 bg-red-50/40 dark:border-red-800 dark:bg-red-900/10'
                        : 'border-gray-100 bg-gray-50/40 dark:border-gray-700 dark:bg-gray-700/20'
                    }`}
                  >
                    {/* Top row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#103B66] shrink-0" />
                        <span className="font-bold text-gray-800 dark:text-white text-sm">
                          {s.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <SkillTag skill={s.skill} />
                        <AccuracyPill correct={s.correct} total={s.total} />
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div
                      className={`h-2 rounded-full ${trackColor} overflow-hidden mb-3`}
                    >
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-700`}
                        style={{ width: `${acc}%` }}
                      />
                    </div>

                    {/* Correct / Wrong */}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-green-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="font-bold">{s.correct}</span> {t('correct_label')}
                      </span>
                      <span className="flex items-center gap-1.5 text-red-600">
                        <XCircle className="w-3.5 h-3.5" />
                        <span className="font-bold">{s.wrong}</span> {t('wrong_label')}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 text-xs">
                        {t('correct_of_middle')} {s.total} {t('quiz_question')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <Target className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">
              {t('no_subtopic_data')}
            </p>
          </div>
        )}

        {/* ── Detected Weaknesses ─────────────────────────────────────────── */}
        {weakSubtopics.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/50 p-6">
            <h2 className="text-lg font-bold text-red-700 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {t('weakness_detected_title')}
            </h2>
            <p className="text-sm text-red-500 mb-5">
              {t('weakness_detected_desc')}{' '}
              <span className="font-bold">{weakSubtopics.length}</span>{' '}
              {weakSubtopics.length > 1 ? t('topics_label') : t('topic_label')}{' '}
              {t('need_review')}
            </p>

            <div className="space-y-3">
              {weakSubtopics.map((s, idx) => {
                const acc = Math.round((s.correct / s.total) * 100);
                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white text-sm">
                          {s.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <SkillTag skill={s.skill} />
                          <span className="text-xs text-red-600 font-semibold">
                            {t('avg_score')} {acc}%
                          </span>
                          <span className="text-xs text-gray-400">
                            ({s.correct}/{s.total} {t('correct_label')})
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleGetRecommendations(s)}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-[#103B66] text-white text-sm font-bold rounded-xl hover:bg-[#0c2d4d] active:scale-95 transition-all shrink-0 w-full sm:w-auto justify-center shadow-md shadow-blue-900/15"
                    >
                      <Zap className="w-4 h-4" />
                      {t('get_recommendations')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── No Weaknesses — success banner ──────────────────────────────── */}
        {subtopics && weakSubtopics.length === 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="font-bold text-green-700 dark:text-green-400 text-base">
              {t('no_weakness_title')}
            </p>
            <p className="text-sm text-green-600 mt-1">
              {t('no_weakness_desc')}
            </p>
          </div>
        )}

        {/* ── Action Buttons ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-8">
          <button
            onClick={handleTryAgain}
            className="bg-[#103B66] text-white py-4 rounded-xl font-bold hover:bg-[#0c2d4d] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10"
          >
            <RefreshCcw className="w-5 h-5" />
            {t('try_again')}
          </button>
          <button
            onClick={handleBackToLesson}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-4 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ArrowRight className={`w-5 h-5 ${lang === 'en' ? 'rotate-180' : ''}`} />
            {t('back_to_lesson')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default WeaknessReport;
