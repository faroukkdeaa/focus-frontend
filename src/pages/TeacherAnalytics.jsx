import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Brain, ArrowRight, Video, ClipboardList, TrendingUp, Clock,
  ChevronDown, AlertTriangle, BarChart2, Eye, Loader2, RefreshCcw, Play, FileText, Edit3,
} from 'lucide-react';
// ── Static lookup maps (UI-only, no need to fetch) ────────────────────────────

const SUBJECT_COLORS = {
  Physics:     { bg: 'bg-blue-100 dark:bg-blue-900/40',     text: 'text-blue-700 dark:text-blue-300'     },
  Chemistry:   { bg: 'bg-green-100 dark:bg-green-900/40',   text: 'text-green-700 dark:text-green-300'   },
  Mathematics: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300' },
  Biology:     { bg: 'bg-amber-100 dark:bg-amber-900/40',   text: 'text-amber-700 dark:text-amber-300'   },
};

const SUBJECT_NAMES = {
  Physics: 'الفيزياء', Chemistry: 'الكيمياء',
  Mathematics: 'الرياضيات', Biology: 'الأحياء',
};

const SCORE_BUCKETS = ['0–20%', '21–40%', '41–60%', '61–80%', '81–100%'];

// ── Helpers ───────────────────────────────────────────────────────────────────

const distBarColor = (idx) =>
  ['#dc2626', '#f97316', '#d97706', '#16a34a', '#2563eb'][idx] || '#6b7280';

// ── Sub-components ────────────────────────────────────────────────────────────

const SectionLoader = ({ rows = 3 }) => (
  <div className="space-y-3 py-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse" />
    ))}
  </div>
);

const SectionError = ({ message, onRetry }) => (
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

// ── Custom Tooltips ───────────────────────────────────────────────────────────

const ViewsTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg p-3 text-sm" dir="rtl">
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 font-bold">{label} فبراير</p>
      <p className="font-bold text-[#103B66] dark:text-blue-400">{payload[0].value} مشاهدة</p>
    </div>
  );
};

const DistTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg p-3 text-sm" dir="rtl">
      <p className="text-xs text-gray-400 mb-1 font-bold">{label}</p>
      <p className="font-bold text-gray-800 dark:text-white">{payload[0].value} طالب</p>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const TeacherAnalytics = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  // ── Data state ────────────────────────────────────────────────────────────
  const [videos, setVideos] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Live KPI stats from /api/teachers/dashboard (replaces stale localStorage reads)
  const [dashboardStats, setDashboardStats] = useState(null);


  // ── Selected lesson (for drill-down charts) ───────────────────────────────
  const [selectedId, setSelectedId] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [videosRes, quizzesRes] = await Promise.all([
        api.get('/videos'),
        api.get('/quizzes'),
      ]);

      const videosPayload = videosRes.data?.videos ?? {};
      const quizzesPayload = quizzesRes.data?.quizzes ?? {};

      const rawVideosData = videosPayload?.data ?? videosRes.data?.data ?? videosPayload ?? [];
      const rawQuizzesData = quizzesPayload?.data ?? quizzesRes.data?.data ?? quizzesPayload ?? [];

      const videosList = Array.isArray(rawVideosData)
        ? rawVideosData
        : (rawVideosData && typeof rawVideosData === 'object' ? Object.values(rawVideosData) : []);
      const quizzesList = Array.isArray(rawQuizzesData)
        ? rawQuizzesData
        : (rawQuizzesData && typeof rawQuizzesData === 'object' ? Object.values(rawQuizzesData) : []);

      const formattedVideos = videosList.map((video, idx) => {
        const videoId = video.video_id ?? video.id ?? `vid-${idx + 1}`;
        const lessonId = video.lesson_id ?? video.lessonId ?? video.lesson?.id ?? null;
        const lessonTitle = video.lesson_title || '';
        const videoTitle = video.video_title || '';
        const resolvedVideoTitle = lessonTitle || videoTitle || video.title || 'درس بدون عنوان';

        return {
          id: videoId,
          selectionKey: `video:${videoId}`,
          contentType: 'video',
          lessonId,
          lessonTitle: lessonTitle || resolvedVideoTitle,
          videoTitle: videoTitle || resolvedVideoTitle,
          lesson: resolvedVideoTitle,
          subject: video.subject_name || video.subject || 'Physics',
          views: Number(video.views_count ?? video.views ?? 0) || 0,
          quizAttempts: null,
          avgScore: null,
          topWeakSubtopic: null,
          scoreDistribution: [],
          missedQuestions: [],
        };
      });

      const videosByLessonId = formattedVideos.reduce((acc, video) => {
        if (video.lessonId == null) return acc;
        const key = String(video.lessonId);
        if (!acc.has(key)) {
          acc.set(key, video.lessonTitle || video.videoTitle || video.lesson || null);
        }
        return acc;
      }, new Map());

      const formattedQuizzes = quizzesList.map((quiz, idx) => {
        const quizId = quiz.id ?? quiz.quiz_id ?? `quiz-${idx + 1}`;
        const lessonId = quiz.lesson_id ?? quiz.lessonId ?? quiz.lesson?.id ?? null;
        const rawTitle = typeof quiz.title === 'string' ? quiz.title.trim() : '';
        const linkedVideoTitle = lessonId != null ? videosByLessonId.get(String(lessonId)) : null;
        const resolvedQuizTitle =
          rawTitle && rawTitle !== 'Untitled Quiz'
            ? rawTitle
            : linkedVideoTitle
              ? `اختبار: ${linkedVideoTitle}`
              : 'اختبار الدرس';

        return {
          id: quizId,
          selectionKey: `quiz:${quizId}`,
          contentType: 'quiz',
          title: rawTitle || 'Untitled Quiz',
          lessonId,
          lesson: resolvedQuizTitle,
          subject: quiz.subject_name || quiz.subject || 'Physics',
          views: null,
          quizAttempts: Number(quiz.attempts_count ?? quiz.attempts ?? 0) || 0,
          avgScore: null,
          topWeakSubtopic: null,
          scoreDistribution: [],
          missedQuestions: [],
        };
      });

      const uniqueById = (items) => {
        const seen = new Map();
        items.forEach((item) => {
          const key = String(item.id);
          if (!seen.has(key)) seen.set(key, item);
        });
        return Array.from(seen.values());
      };

      const uniqueVideos = uniqueById(formattedVideos);
      const uniqueQuizzes = uniqueById(formattedQuizzes);

      setVideos(uniqueVideos);
      setQuizzes(uniqueQuizzes);

      const mergedContent = [...uniqueVideos, ...uniqueQuizzes];
      setSelectedId((prev) => {
        if (prev != null && mergedContent.some((item) => String(item.selectionKey) === String(prev))) {
          return prev;
        }
        return mergedContent[0]?.selectionKey ?? null;
      });
    } catch (err) {
      console.error('Failed to fetch teacher analytics', err);
      setError('تعذّر تحميل البيانات.');
      setVideos([]);
      setQuizzes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Fetch live KPI stats from the teacher dashboard endpoint
  useEffect(() => {
    api.get('/teachers/dashboard')
      .then((res) => {
        const payload = res.data ?? {};
        setDashboardStats({
          videos_count: Number(payload.videos_count ?? 0),
          quizzes_count: Number(payload.quizzes_count ?? 0),
          average_score: payload.average_score ?? null,
        });
      })
      .catch((err) => console.error('Failed to fetch teacher dashboard KPIs', err));
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const content = [...videos, ...quizzes];
  const selected = content.find(c => String(c.selectionKey) === String(selectedId)) ?? content[0] ?? null;
  const distData = Array.isArray(selected?.scoreDistribution)
    ? selected.scoreDistribution.map((count, i) => ({ bucket: SCORE_BUCKETS[i], طلاب: count }))
    : [];
  const safeViewsData = videos
    .filter((video) => Number(video.views) > 0)
    .map((video, idx) => ({
      day: video.lesson || `#${idx + 1}`,
      'مشاهدات': Number(video.views) || 0,
    }));

  const totalViews   = safeViewsData.reduce((s, d) => s + d['مشاهدات'], 0);
  const peakViews    = safeViewsData.length ? Math.max(...safeViewsData.map(d => d['مشاهدات'])) : 0;
  const avgDailyView = safeViewsData.length ? Math.round(totalViews / safeViewsData.length) : 0;

  // KPI values — bound to live /api/teachers/dashboard response
  const totalVideosCount   = dashboardStats?.videos_count ?? 0;
  const totalQuizzesCount  = dashboardStats?.quizzes_count ?? 0;
  const averageScoreDisplay =
    dashboardStats?.average_score != null && Number.isFinite(Number(dashboardStats.average_score))
      ? `${Math.round(Number(dashboardStats.average_score) * 100)}%`
      : '0%';

  if (!dashboardStats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-[#103B66] dark:text-blue-400 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-lg font-bold">{t('loading') || 'جاري التحميل...'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* ═══ HEADER ═══ */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#103B66] dark:bg-blue-600 p-2 rounded-lg shadow">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#103B66] dark:text-blue-400">{t('content_analytics')}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('analytics_subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/teacher-dashboard')}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-[#103B66] dark:hover:text-white transition"
            >
              <ArrowRight className={`w-4 h-4 ${lang === 'en' ? 'rotate-180' : ''}`} />
              {t('teacher_control')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">

        {/* ═══ SECTION 1 — KPI Cards ═══ */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { labelKey: 'total_videos', value: totalVideosCount, icon: Video, border: 'border-t-blue-500', iconBg: 'bg-blue-100 dark:bg-blue-900/40', iconCls: 'text-blue-600 dark:text-blue-400' },
              { labelKey: 'total_quizzes', label: 'إجمالي الاختبارات', value: totalQuizzesCount, icon: ClipboardList, border: 'border-t-violet-500', iconBg: 'bg-violet-100 dark:bg-violet-900/40', iconCls: 'text-violet-600 dark:text-violet-400' },
              { labelKey: 'avg_score', value: averageScoreDisplay, icon: TrendingUp, border: 'border-t-green-500', iconBg: 'bg-green-100 dark:bg-green-900/40', iconCls: 'text-green-600 dark:text-green-400' },
              { labelKey: 'watch_hours', value: dashboardStats?.watch_hours || 0, icon: Clock, border: 'border-t-amber-500', iconBg: 'bg-amber-100 dark:bg-amber-900/40', iconCls: 'text-amber-600 dark:text-amber-400' },
            ].map(({ labelKey, label, value, icon: Icon, border, iconBg, iconCls }) => (
              <div key={labelKey} className={`bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border-t-4 ${border}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-snug">{label || t(labelKey)}</p>
                  <div className={`p-2 rounded-full ${iconBg}`}>
                    <Icon className={`w-4 h-4 ${iconCls}`} />
                  </div>
                </div>
                {isLoading ? (
                  <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                ) : (
                  <p className="text-3xl font-bold text-gray-800 dark:text-white leading-none">
                    {value ?? '—'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ═══ SECTION 2 — Content Performance Table ═══ */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
            {t('content_performance')}
          </h2>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {isLoading ? (
              <div className="p-6"><SectionLoader rows={5} /></div>
            ) : error ? (
              <div className="p-6"><SectionError message={error} onRetry={fetchAnalytics} /></div>
            ) : (
              <div className="p-4 space-y-7">
                <div>
                  <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">فيديوهات المادة</h3>
                  {videos.length > 0 ? (
                    <div className="space-y-4">
                      {videos.map(v => {
                        const subj = SUBJECT_COLORS[v.subject] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };
                        const isSelected = String(selectedId) === String(v.selectionKey);
                        let barColor = 'bg-gray-300 dark:bg-gray-600';
                        if (v.avgScore !== null) {
                          if (v.avgScore < 50) barColor = 'bg-red-500';
                          else if (v.avgScore < 75) barColor = 'bg-yellow-500';
                          else barColor = 'bg-green-500';
                        }

                        return (
                          <div
                            key={v.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              if (v.id) navigate(`/video-details/${v.id}`);
                              else alert('عذراً، معرف الفيديو غير متوفر.');
                            }}
                            onKeyDown={(e) => {
                              if (e.target !== e.currentTarget) return;
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                if (v.id) navigate(`/video-details/${v.id}`);
                                else alert('عذراً، معرف الفيديو غير متوفر.');
                              }
                            }}
                            className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm'
                                : 'bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                            }`}
                          >
                            <div className="flex-1 min-w-0 flex items-center gap-4 mb-4 md:mb-0">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${subj.bg} ${subj.text}`}>
                                <Play className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-800 dark:text-white text-base line-clamp-1">{v.lesson}</h4>
                                <div className="flex items-center gap-3 mt-1 text-xs">
                                  <span className={`font-bold px-2 py-0.5 rounded-full ${subj.bg} ${subj.text}`}>
                                    {SUBJECT_NAMES[v.subject] || v.subject || '—'}
                                  </span>
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                                    <Eye className="w-3.5 h-3.5 inline mr-1 text-gray-400" /> {v.views !== null ? v.views.toLocaleString() : '—'} مشاهدة
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-6 w-full md:w-auto">
                              <div className="flex-1 md:w-48">
                                <div className="flex justify-between text-xs font-bold mb-1.5">
                                  <span className="text-gray-600 dark:text-gray-300">متوسط الدرجات</span>
                                  <span className={v.avgScore !== null && v.avgScore < 50 ? 'text-red-500' : 'text-gray-800 dark:text-white'}>
                                    {v.avgScore !== null ? `${v.avgScore}%` : 'N/A'}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${barColor} transition-all duration-1000`}
                                    style={{ width: `${v.avgScore || 0}%` }}
                                  />
                                </div>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedId(v.selectionKey);
                                }}
                                className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition ${
                                  isSelected
                                    ? 'bg-[#103B66] dark:bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                              >
                                <BarChart2 className="w-4 h-4" />
                                {isSelected ? t('selected_label') : t('details_label')}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">لا يوجد محتوى متاح حالياً</p>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4">اختبارات المادة</h3>
                  {quizzes.length > 0 ? (
                    <div className="space-y-4">
                      {quizzes.map(q => {
                        const subj = SUBJECT_COLORS[q.subject] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };
                        const isSelected = String(selectedId) === String(q.selectionKey);
                        const rawQuizTitle = typeof q.title === 'string' ? q.title.trim() : '';
                        const linkedVideo = videos.find(
                          (video) =>
                            video.lessonId != null &&
                            q.lessonId != null &&
                            String(video.lessonId) === String(q.lessonId)
                        );
                        const linkedVideoTitle = linkedVideo?.lessonTitle || linkedVideo?.videoTitle || linkedVideo?.lesson || '';
                        const resolvedQuizTitle =
                          rawQuizTitle && rawQuizTitle !== 'Untitled Quiz'
                            ? rawQuizTitle
                            : linkedVideoTitle
                              ? `اختبار: ${linkedVideoTitle}`
                              : 'اختبار الدرس';
                        let barColor = 'bg-gray-300 dark:bg-gray-600';
                        if (q.avgScore !== null) {
                          if (q.avgScore < 50) barColor = 'bg-red-500';
                          else if (q.avgScore < 75) barColor = 'bg-yellow-500';
                          else barColor = 'bg-green-500';
                        }

                        return (
                          <div
                            key={q.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              if (q.id) navigate(`/quizzes-details/${q.id}`);
                              else alert('عذراً، معرف الاختبار غير متوفر.');
                            }}
                            onKeyDown={(e) => {
                              if (e.target !== e.currentTarget) return;
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                if (q.id) navigate(`/quizzes-details/${q.id}`);
                                else alert('عذراً، معرف الاختبار غير متوفر.');
                              }
                            }}
                            className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm'
                                : 'bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                            }`}
                          >
                            <div className="flex-1 min-w-0 flex items-center gap-4 mb-4 md:mb-0">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${subj.bg} ${subj.text}`}>
                                <FileText className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-800 dark:text-white text-base line-clamp-1">{resolvedQuizTitle}</h4>
                                <div className="flex items-center gap-3 mt-1 text-xs">
                                  <span className={`font-bold px-2 py-0.5 rounded-full ${subj.bg} ${subj.text}`}>
                                    {SUBJECT_NAMES[q.subject] || q.subject || '—'}
                                  </span>
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                                    <ClipboardList className="w-3.5 h-3.5 inline mr-1 text-gray-400" /> {q.quizAttempts !== null ? q.quizAttempts.toLocaleString() : '—'} محاولة
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-6 w-full md:w-auto">
                              <div className="flex-1 md:w-48">
                                <div className="flex justify-between text-xs font-bold mb-1.5">
                                  <span className="text-gray-600 dark:text-gray-300">متوسط الدرجات</span>
                                  <span className={q.avgScore !== null && q.avgScore < 50 ? 'text-red-500' : 'text-gray-800 dark:text-white'}>
                                    {q.avgScore !== null ? `${q.avgScore}%` : 'N/A'}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${barColor} transition-all duration-1000`}
                                    style={{ width: `${q.avgScore || 0}%` }}
                                  />
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/edit-quiz/${q.id}`);
                                  }}
                                  className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition border border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40"
                                >
                                  <Edit3 className="w-4 h-4" />
                                  تعديل
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedId(q.selectionKey);
                                  }}
                                  className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition ${
                                    isSelected
                                      ? 'bg-[#103B66] dark:bg-blue-600 text-white'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                                  }`}
                                >
                                  <BarChart2 className="w-4 h-4" />
                                  {isSelected ? t('selected_label') : t('details_label')}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">لا يوجد محتوى متاح حالياً</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ═══ SECTIONS 3 & 4 side-by-side ═══ */}
        <section>
          {/* Lesson selector */}
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 flex-1">
              <BarChart2 className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
              {t('selected_lesson_analysis')}
            </h2>
            {!isLoading && content.length > 0 && (
              <div className="relative">
                <select
                  value={selectedId ?? ''}
                  onChange={e => setSelectedId(e.target.value)}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#103B66] dark:focus:ring-blue-500 cursor-pointer"
                >
                  {content.map(c => (
                    <option key={c.selectionKey} value={c.selectionKey}>{c.lesson}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[0, 1].map(i => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                  <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
                  <div className="h-[240px] bg-gray-100 dark:bg-gray-700/40 rounded-xl animate-pulse" />
                </div>
              ))}
            </div>
          ) : error ? (
            <SectionError message={error} onRetry={fetchAnalytics} />
          ) : selected ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* SECTION 3 — Score Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="font-bold text-gray-800 dark:text-white text-base mb-1">{t('score_distribution')}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                  {selected.quizAttempts !== null ? selected.quizAttempts : '—'} — {selected.lesson}
                </p>
                {distData.length > 0 ? (
                  <>
                    <div dir="ltr">
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={distData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                          <Tooltip content={<DistTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                          <Bar dataKey="طلاب" radius={[6, 6, 0, 0]} maxBarSize={52}>
                            {distData.map((_, i) => (
                              <Cell key={i} fill={distBarColor(i)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-3 text-[11px] font-bold justify-center">
                      {SCORE_BUCKETS.map((b, i) => (
                        <span key={b} className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: distBarColor(i) }} />
                          {b}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[240px] text-gray-400 dark:text-gray-500">
                    <BarChart2 className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-sm font-medium">لا توجد بيانات كافية لعرض توزيع الدرجات</p>
                  </div>
                )}
              </div>

              {/* SECTION 4 — Most Missed Questions */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="font-bold text-gray-800 dark:text-white text-base mb-1">{t('missed_questions')}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">{selected.lesson}</p>
                {selected.missedQuestions && selected.missedQuestions.length > 0 ? (
                  <div className="space-y-4">
                    {selected.missedQuestions.map((q, i) => (
                      <div key={i} className="p-4 rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10">
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 dark:text-white leading-snug line-clamp-2">
                              {q.text}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-3 text-xs">
                              <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                نسبة الخطأ: {q.wrongRate}%
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">
                                أكثر إجابة خاطئة:{' '}
                                <span className="font-bold text-orange-600 dark:text-orange-400">{q.topWrongOption}</span>
                              </span>
                            </div>
                            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-red-500 transition-all duration-500"
                                style={{ width: `${q.wrongRate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[240px] text-gray-400 dark:text-gray-500">
                    <ClipboardList className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-sm font-medium">لا توجد أخطاء مسجلة للطلاب حتى الآن</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </section>

        {/* ═══ SECTION 5 — Views Over Time ═══ */}
        <section className="pb-12">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
            {t('views_over_time')}
          </h2>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <Loader2 className="w-7 h-7 text-[#103B66] dark:text-blue-400 animate-spin" />
                <p className="text-sm text-gray-400">جارٍ تحميل بيانات المشاهدات…</p>
              </div>
            ) : error ? (
              <SectionError message={error} onRetry={fetchAnalytics} />
            ) : (
              safeViewsData.length > 0 ? (
                <>
                  <div dir="ltr">
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={safeViewsData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="day"
                          tick={{ fontSize: 10, fill: '#9ca3af' }}
                          interval={4}
                        />
                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} width={32} />
                        <Tooltip content={<ViewsTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="مشاهدات"
                          stroke="#103B66"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 5, fill: '#103B66' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t dark:border-gray-700">
                    {[
                      { label: 'إجمالي المشاهدات', value: totalViews.toLocaleString() },
                      { label: 'أعلى يوم',          value: `${peakViews} مشاهدة`       },
                      { label: 'متوسط يومي',        value: `${avgDailyView} مشاهدة`    },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center">
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</p>
                        <p className="font-bold text-gray-800 dark:text-white text-base">{value}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[260px] text-gray-400 dark:text-gray-500">
                  <TrendingUp className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-base font-medium mb-1">لا توجد بيانات مشاهدات متاحة</p>
                  <p className="text-xs">بمجرد تفاعل الطلاب مع المحتوى، ستظهر الإحصائيات هنا.</p>
                </div>
              )
            )}
          </div>
        </section>

      </main>
    </div>
  );
};

export default TeacherAnalytics;
