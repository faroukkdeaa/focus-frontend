import { useState, useEffect, useMemo } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  TrendingUp, ArrowRight, Eye, Brain, Activity, BookOpen, BarChart2, Calendar,
} from 'lucide-react';

// ── Static meta ───────────────────────────────────────────────────────────────

const SUBJECTS_META = [
  { key: 'Physics',     id: '1', name: 'الفيزياء',   emoji: '⚡', color: '#103B66' },
  { key: 'Mathematics', id: '2', name: 'الرياضيات',  emoji: '📐', color: '#7C3AED' },
  { key: 'Chemistry',   id: '3', name: 'الكيمياء',   emoji: '🧪', color: '#059669' },
  { key: 'Biology',     id: '4', name: 'الأحياء',    emoji: '🌿', color: '#D97706' },
];


// ── Helpers ───────────────────────────────────────────────────────────────────

const getMasteryBadge = (pct) => {
  if (pct >= 80) return { dot: '🟢', label: 'قوي',         textCls: 'text-green-700 dark:text-green-400',  bgCls: 'bg-green-100 dark:bg-green-900/30'  };
  if (pct >= 60) return { dot: '🟡', label: 'متوسط',       textCls: 'text-yellow-700 dark:text-yellow-400', bgCls: 'bg-yellow-100 dark:bg-yellow-900/30' };
  return           { dot: '🔴', label: 'يحتاج مراجعة', textCls: 'text-red-700 dark:text-red-400',       bgCls: 'bg-red-100 dark:bg-red-900/30'      };
};

const barColor = (acc) => acc >= 80 ? '#16a34a' : acc >= 60 ? '#d97706' : '#dc2626';



// ── Subcomponents ─────────────────────────────────────────────────────────────

/** Tiny SVG sparkline from last ≤5 quiz scores */
const Sparkline = ({ quizzes, color }) => {
  const pts = quizzes.slice(-5);
  if (pts.length < 2) return null;
  const W = 64, H = 26, PAD = 3;
  const xs = pts.map((_, i) => PAD + (i / (pts.length - 1)) * (W - PAD * 2));
  const scores = pts.map(q => q.score);
  const lo = Math.min(...scores), hi = Math.max(...scores);
  const range = hi - lo || 1;
  const ys = scores.map(s => PAD + (1 - (s - lo) / range) * (H - PAD * 2));
  const d = pts.map((_, i) => `${i === 0 ? 'M' : 'L'}${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="flex-shrink-0">
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3" fill={color} />
    </svg>
  );
};

/** Recharts custom tooltip for score-over-time chart */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    // Safely get the plotted percentage directly from the chart's active value
    const plottedPercentage = payload[0].value || 0;

    // Try to get original score, otherwise calculate it from the percentage (assuming max 5)
    const maxScore = data.maxScore || 5;
    const safeRawScore = data.score ?? data.rawScore ?? Math.round((plottedPercentage / 100) * maxScore);

    // Fallback for Subject Name if missing
    const subjectName = data.subjectName || data.subject_name || data.subjectId || 'المادة الحالية';

    return (
      <div className="custom-tooltip" style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', textAlign: 'right', direction: 'rtl' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>التاريخ: {label || data.displayDate}</p>
        <p style={{ margin: 0, color: '#666' }}>المادة: {subjectName}</p>
        <p style={{ margin: 0, color: '#0056b3', fontWeight: 'bold' }}>
          الدرجة: {safeRawScore} / {maxScore} ({plottedPercentage}%)
        </p>
      </div>
    );
  }
  return null;
};

/** Recharts custom tooltip for bar chart */
const BarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, accuracy } = payload[0].payload;
  const badge = getMasteryBadge(accuracy);
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg p-3 min-w-[160px]" dir="rtl">
      <p className="font-bold text-gray-800 dark:text-white text-sm mb-1">{name}</p>
      <p className={`text-sm font-bold ${badge.textCls}`}>{accuracy}% — {badge.dot} {badge.label}</p>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const ProgressAnalytics = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  const [loading, setLoading]               = useState(true);
  const [quizResults, setQuizResults]        = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [remGaps, setRemGaps]                = useState([]);
  const [subjectStats, setSubjectStats]      = useState([]);
  const [selectedChartSubject, setSelectedChartSubject] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  // Activity colors: 0 (empty), 1, 2, 3, 4+ (highest)
  const activityColors = ['#2d333b', '#0e4429', '#006d32', '#26a641', '#39d353'];

  // ── Fetch attempts only (single backend source) ───────────────────────────
  useEffect(() => {
    const fetchRealData = async () => {
      setLoading(true);
      try {
        const attemptsRes = await api.get('/students/attempts');
        let rawAttempts =
          attemptsRes.data?.quizzesAttempt?.data ||
          attemptsRes.data?.quizzesAttempt ||
          attemptsRes.data?.data ||
          attemptsRes.data?.attempts ||
          attemptsRes.data ||
          [];

        if (!Array.isArray(rawAttempts) && rawAttempts && typeof rawAttempts === 'object') {
          rawAttempts = Object.values(rawAttempts);
        }

        const normalizeAttempt = (att, index) => {
          const attemptId = att?.id ?? att?.attempt_id ?? att?.result_id ?? index + 1;
          const createdAt = String(att?.created_at || att?.date || '');
          const parsedDate = new Date(createdAt);
          const createdMs = Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
          const rawScore = Number(att?.score ?? 0) || 0;
          const maxScore = Number(att?.total_questions ?? att?.max_score ?? attemptsRes.data?.quizzesAttempt?.meta?.total_questions ?? 5) || 5;
          const percentage = Math.round((rawScore / maxScore) * 100);
          const lessonTitle = att?.lesson_title || att?.lessonTitle || 'درس بدون عنوان';
          const subjectName =
            att?.subject_name ||
            att?.subjectName ||
            att?.subject?.name ||
            att?.subject?.title ||
            null;
          const subjectId = att?.subject_id ?? att?.subjectId ?? att?.subject?.id ?? null;

          return {
            ...att,
            attemptId,
            createdAt,
            createdMs,
            rawScore,
            maxScore,
            percentage,
            lessonTitle,
            subjectName,
            subjectId,
          };
        };

        const normalizedAttempts = (Array.isArray(rawAttempts) ? rawAttempts : [])
          .filter((att) => att && typeof att === 'object')
          .map(normalizeAttempt)
          .sort((a, b) => a.createdMs - b.createdMs);

        setAttempts(normalizedAttempts);

        const latestAttempt = normalizedAttempts[normalizedAttempts.length - 1];
        const latestSubjectMeta = [...normalizedAttempts]
          .reverse()
          .map((att) => {
            const meta = SUBJECTS_META.find((s) => String(s.id) === String(att.subjectId));
            return {
              name: att.subjectName || meta?.name || null,
              emoji: meta?.emoji || '📘',
              color: meta?.color || '#103B66',
            };
          })
          .find((subject) => subject.name);

        setSubjectStats([{
          id: 'all',
          key: 'all-attempts',
          name: latestSubjectMeta?.name || 'المادة الحالية',
          emoji: latestSubjectMeta?.emoji || '📘',
          color: latestSubjectMeta?.color || '#103B66',
          attemptsCount: normalizedAttempts.length,
          lastRawScore: latestAttempt?.rawScore || 0,
          lastPercentage: latestAttempt?.percentage || 0,
          quizzes: normalizedAttempts.slice(-10).map((att) => ({
            date: att.createdAt,
            score: att.percentage,
          })),
        }]);
        setSelectedChartSubject('all');
        setActiveTab('all');

        const normalizedQuizResults = [...normalizedAttempts]
          .sort((a, b) => b.createdMs - a.createdMs)
          .map((att) => {
            const dateObj = new Date(att.createdAt || Date.now());
            const formattedDate = Number.isNaN(dateObj.getTime())
              ? '—'
              : dateObj.toLocaleString('ar-EG', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              });

            return {
              subjectId: att.subjectId ? String(att.subjectId) : '',
              subjectName: att.subjectName || 'غير محدد',
              attemptId: att.attemptId,
              quizId: att.quiz_id ?? att.quizId ?? null,
              lessonId: att.lesson_id ?? att.lessonId ?? null,
              teacherId: att.teacher_id ?? att.teacherId ?? null,
              rawScore: att.rawScore,
              maxScore: att.maxScore,
              percentage: att.percentage,
              displayDate: att.createdAt,
              date: formattedDate,
              lessonTitle: att.lessonTitle,
              createdMs: att.createdMs,
            };
          });

        setQuizResults(normalizedQuizResults);
        setRemGaps([]);
      } catch (err) {
        console.error('❌ Failed to fetch attempts analytics:', err);
        console.error('❌ Error details:', err.response?.data);
        setAttempts([]);
        setSubjectStats([]);
        setQuizResults([]);
        setRemGaps([]);
        setSelectedChartSubject(null);
        setActiveTab(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, []);

  // ── Derived: line chart data (created_at vs score) ───────────────────────
  const lineData = useMemo(() => {
    if (!attempts.length) return [];

    return [...attempts]
      .sort((a, b) => a.createdMs - b.createdMs)
      .map((att) => {
        const d = new Date(att.createdAt);
        const dateLabel = Number.isNaN(d.getTime())
          ? '—'
          : `${d.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false })}`;

        return {
          date: dateLabel,
          score: att.percentage,
          percentage: att.percentage,
          rawScore: att.rawScore,
          maxScore: att.maxScore,
          displayDate: att.createdAt,
          subjectName: att.subjectName || 'المادة الحالية',
        };
      });
  }, [attempts]);

  // ── Derived: subtopic bar data from remediation gaps ──────────────────
  const subtopicData = useMemo(() => {
    if (!activeTab) return [];
    return remGaps
      .filter(g => String(g.subjectId) === String(activeTab))
      .map(g => ({
        name:     g.lessonTitle || g.gap,
        accuracy: g.completed ? 70 : g.difficulty === 'hard' ? 25 : 40,
      }));
  }, [remGaps, activeTab]);

  const activityDays = useMemo(() => {
    if (!attempts.length) return [];
    // Map attempts by date string (YYYY-MM-DD)
    const activityMap = {};
    attempts.forEach(att => {
      try {
        const d = new Date(att.createdAt || Date.now());
        const dateStr = d.toISOString().split('T')[0];
        activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
      } catch (e) {}
    });

    // Generate the last 28 days (4 weeks)
    const days = [];
    const today = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        dateStr,
        count: activityMap[dateStr] || 0,
        dayName: d.toLocaleDateString('ar-EG', { weekday: 'short' }),
        weekLabel: d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
      });
    }
    return days;
  }, [attempts]);

  const barData       = subtopicData;
  const activeTabMeta = subjectStats.find(s => String(s.id) === String(activeTab));
  const selectedChartMeta = subjectStats.find(s => String(s.id) === String(selectedChartSubject));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#103B66]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* ════════ HEADER ════════ */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#103B66] dark:bg-blue-600 p-2 rounded-lg shadow">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#103B66] dark:text-blue-400">{t('progress_title')}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('progress_subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-[#103B66] dark:hover:text-white transition"
            >
              <ArrowRight className={`w-4 h-4 ${lang === 'en' ? 'rotate-180' : ''}`} />
              {t('back_to_dashboard')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">

        {/* ════════ SECTION 1 — Subject Summary Cards ════════ */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
            {t('mastery_summary')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subjectStats.map((subject) => {
              const badge = getMasteryBadge(subject.lastPercentage || 0);
              const r = 16, C = 2 * Math.PI * r;
              const arc = ((subject.lastPercentage || 0) / 100) * C;
              return (
                <div key={subject.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex flex-col gap-3 hover:shadow-md transition">
                  {/* Top row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{subject.emoji}</span>
                      <span className="font-bold text-gray-800 dark:text-white text-sm">{subject.name}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${badge.bgCls} ${badge.textCls}`}>
                      {badge.dot} {badge.label}
                    </span>
                  </div>

                  {/* Ring + sparkline */}
                  <div className="flex items-center justify-between">
                    {/* Mini progress ring */}
                    <div dir="ltr" className="flex-shrink-0">
                      <svg width="48" height="48" viewBox="0 0 44 44">
                        <circle
                          cx="22" cy="22" r={r} fill="none" strokeWidth="4"
                          className="stroke-gray-200 dark:stroke-gray-700"
                        />
                        <circle
                          cx="22" cy="22" r={r} fill="none" strokeWidth="4"
                          stroke={subject.color}
                          strokeDasharray={`${arc.toFixed(2)} ${(C - arc).toFixed(2)}`}
                          strokeDashoffset={(C / 4).toFixed(2)}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dasharray 0.6s ease' }}
                        />
                        <text
                          x="22" y="26"
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="bold"
                          fill={subject.color}
                        >
                          {subject.lastPercentage || 0}%
                        </text>
                      </svg>
                    </div>
                    {/* Sparkline trend */}
                    <Sparkline quizzes={subject.quizzes} color={subject.color} />
                  </div>

                  {/* Footer stat */}
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    آخر درجة:{' '}
                    <span className="font-bold text-gray-700 dark:text-gray-300">
                      {subject.lastRawScore || 0} / 5
                    </span>
                    {'  ·  '}{subject.attemptsCount || 0} اختبار
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ════════ SECTION 2 — Score Over Time (Line Chart) ════════ */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
              {t('score_over_time_title')}
            </h2>
            {/* Subject toggle buttons */}
            <div className="flex flex-wrap gap-2">
              {subjectStats.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedChartSubject(sub.id)}
                  style={String(selectedChartSubject) === String(sub.id) ? { backgroundColor: sub.color, borderColor: sub.color } : {}}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    String(selectedChartSubject) === String(sub.id)
                      ? 'text-white shadow-sm'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {sub.emoji} {sub.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <div dir="ltr">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={lineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis
                    domain={[30, 100]}
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    tickFormatter={v => `${v}%`}
                    width={38}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke={selectedChartMeta?.color || '#103B66'}
                    strokeWidth={2.5}
                    dot={{ fill: selectedChartMeta?.color || '#103B66', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* ════════ SECTION 3 — Subtopic Mastery (Horizontal Bar Chart) ════════ */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
            {t('subtopic_analysis_title')}
          </h2>

          {/* Tab row */}
          <div className="flex gap-2 flex-wrap mb-5">
            {subjectStats.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setActiveTab(sub.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                  String(activeTab) === String(sub.id)
                    ? 'bg-[#103B66] dark:bg-blue-600 text-white border-transparent shadow-md'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-[#103B66] dark:hover:border-blue-400'
                }`}
              >
                {sub.emoji} {sub.name}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            {/* Subject context label */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-bold">
              {activeTabMeta?.emoji} {activeTabMeta?.name} — المواضيع التي تحتاج مراجعة
            </p>

            {barData.length === 0 ? (
              <div className="py-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                لا توجد مواضيع تحتاج مراجعة في هذه المادة 🎉
              </div>
            ) : (
              <>
                <div dir="ltr">
                  <ResponsiveContainer width="100%" height={barData.length * 54}>
                    <BarChart
                      layout="vertical"
                      data={barData}
                      margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        tickFormatter={v => `${v}%`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={155}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                      />
                      <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                      <Bar dataKey="accuracy" radius={[0, 6, 6, 0]} barSize={24}>
                        {barData.map((entry, i) => (
                          <Cell key={i} fill={barColor(entry.accuracy)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Color legend */}
                <div className="flex flex-wrap gap-5 mt-5 pt-4 border-t dark:border-gray-700 text-xs font-bold justify-center">
                  <span className="flex items-center gap-1.5 text-red-700 dark:text-red-400">
                    <span className="w-3 h-3 rounded-sm bg-red-600 inline-block" />
                    {t('accuracy_below60')}
                  </span>
                  <span className="flex items-center gap-1.5 text-yellow-700 dark:text-yellow-400">
                    <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
                    {t('accuracy_60_80')}
                  </span>
                  <span className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
                    <span className="w-3 h-3 rounded-sm bg-green-600 inline-block" />
                    {t('accuracy_above80')}
                  </span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ════════ SECTION 4 — Activity Heatmap ════════ */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
            {t('activity_title')}
          </h2>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
              <div style={{ display: 'flex', gap: '15px', direction: 'rtl', alignItems: 'flex-start' }}>
                {/* Y-Axis: Weeks (Aligned to 36px rows) */}
                <div style={{ display: 'grid', gridTemplateRows: 'repeat(4, 36px)', gap: '8px', paddingTop: '28px', color: '#aaa', fontSize: '12px', textAlign: 'left', lineHeight: '36px' }}>
                  {[activityDays[0], activityDays[7], activityDays[14], activityDays[21]].map((day, i) => (
                    day && <div key={i} style={{ whiteSpace: 'nowrap' }}>{day.weekLabel}</div>
                  ))}
                </div>

                {/* X-Axis & Squares Grid */}
                <div>
                  {/* X-Axis: Day Names (Fixed 36px columns to match squares) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 36px)', gap: '8px', textAlign: 'center', color: '#aaa', fontSize: '11px', marginBottom: '10px', height: '18px' }}>
                    {activityDays.slice(0, 7).map((d, i) => <div key={i}>{d.dayName}</div>)}
                  </div>

                  {/* Squares Grid (Fixed 36x36px cells) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 36px)', gridAutoRows: '36px', gap: '8px' }}>
                    {activityDays.map((d) => {
                      // Map count to color index (max index 4)
                      const colorIndex = Math.min(d.count, 4);
                      const bgColor = activityColors[colorIndex];

                      return (
                        <div
                          key={d.dateStr}
                          title={`التاريخ: ${d.dateStr} | الاختبارات: ${d.count}`}
                          style={{ backgroundColor: bgColor, width: '36px', height: '36px', borderRadius: '4px', cursor: 'pointer', transition: 'transform 0.1s' }}
                          onMouseEnter={(e) => { e.target.style.transform = 'scale(1.1)'; }}
                          onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Synced Color Legend */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '20px', fontSize: '12px', color: '#aaa', direction: 'rtl' }}>
                <span>أقل نشاط</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {activityColors.map((color, i) => (
                    <div key={i} title={`مستوى ${i}`} style={{ width: '16px', height: '16px', backgroundColor: color, borderRadius: '2px' }} />
                  ))}
                </div>
                <span>أعلى نشاط</span>
              </div>
            </div>
          </div>
        </section>

        {/* ════════ SECTION 5 — Recent Quiz History Table ════════ */}
        <section className="pb-12">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
            {t('recent_quiz_history')}
          </h2>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50 dark:bg-gray-700/60">
                  <tr>
                    {[t('date_label'), t('subject_label'), t('lessons_tab'), t('avg_score'), t('weak_subtopic'), t('view_report')].map(h => (
                      <th
                        key={h}
                        className="px-5 py-3.5 text-right text-xs font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {quizResults.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                        لا توجد اختبارات مسجّلة حتى الآن
                      </td>
                    </tr>
                  ) : quizResults.map((att, i) => {
                    const maxScore = Number(att.maxScore ?? 5) || 5;
                    const rawScore = Number(att.rawScore || att.score || 0);
                    const percentage = att.percentage || Math.round((rawScore / maxScore) * 100);
                    const badge = getMasteryBadge(percentage);
                    const meta  = SUBJECTS_META.find(s => s.id === att.subjectId);
                    return (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition">
                        <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {att.date}
                        </td>
                        <td className="px-5 py-3.5 text-sm font-bold text-gray-800 dark:text-white whitespace-nowrap">
                          {meta?.emoji} {att.subjectName || meta?.name}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300 max-w-[160px] truncate">
                          {att.lessonTitle}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${badge.bgCls} ${badge.textCls}`}>
                            {rawScore} / {maxScore} ({percentage}%)
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                            {percentage < 50
                              ? (
                                  <span className="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded-full font-medium">
                                    يحتاج مراجعة
                                  </span>
                                )
                              : <span className="text-xs text-green-600 dark:text-green-400 font-bold">{t('no_weakness_detected')}</span>
                            }
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => {
                              const attemptId = att.attemptId ?? att.id;
                              if (!attemptId) return;
                              const targetPath = `/weakness-report?attempt_id=${encodeURIComponent(String(attemptId))}`;

                              navigate(targetPath, {
                                state: {
                                  attempt_id: attemptId,
                                  attemptId: attemptId,
                                  lesson_id: att.lessonId,
                                  lessonId: att.lessonId,
                                  teacherId: att.teacherId,
                                  reportData: {
                                    subjectName: att.subjectName || 'غير محدد',
                                    date: att.displayDate || att.date,
                                    score: rawScore,
                                    total: maxScore,
                                    percentage: percentage,
                                  }
                                },
                              });
                            }}
                            className="flex items-center gap-1.5 text-xs font-bold text-[#103B66] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg transition whitespace-nowrap"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {t('view_report')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default ProgressAnalytics;
