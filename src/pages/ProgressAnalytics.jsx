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

const API = 'http://localhost:3001';

// ── Static meta ───────────────────────────────────────────────────────────────

const SUBJECTS_META = [
  { key: 'Physics',     id: '1', name: 'الفيزياء',   emoji: '⚡', color: '#103B66' },
  { key: 'Mathematics', id: '2', name: 'الرياضيات',  emoji: '📐', color: '#7C3AED' },
  { key: 'Chemistry',   id: '3', name: 'الكيمياء',   emoji: '🧪', color: '#059669' },
  { key: 'Biology',     id: '4', name: 'الأحياء',    emoji: '🌿', color: '#D97706' },
];



const DAYS_AR = ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'];

// ── Helpers ───────────────────────────────────────────────────────────────────

const getMasteryBadge = (pct) => {
  if (pct >= 80) return { dot: '🟢', label: 'قوي',         textCls: 'text-green-700 dark:text-green-400',  bgCls: 'bg-green-100 dark:bg-green-900/30'  };
  if (pct >= 60) return { dot: '🟡', label: 'متوسط',       textCls: 'text-yellow-700 dark:text-yellow-400', bgCls: 'bg-yellow-100 dark:bg-yellow-900/30' };
  return           { dot: '🔴', label: 'يحتاج مراجعة', textCls: 'text-red-700 dark:text-red-400',       bgCls: 'bg-red-100 dark:bg-red-900/30'      };
};

const barColor = (acc) => acc >= 80 ? '#16a34a' : acc >= 60 ? '#d97706' : '#dc2626';

const activityCls = (i) => {
  switch (i) {
    case 1:  return 'bg-purple-200 dark:bg-purple-900/70';
    case 2:  return 'bg-purple-400 dark:bg-purple-600';
    case 3:  return 'bg-purple-700 dark:bg-purple-400';
    default: return 'bg-gray-100 dark:bg-gray-700';
  }
};



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

/** Recharts custom tooltip for line chart */
const LineTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg p-3 text-sm" dir="rtl">
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 font-bold">{label}</p>
      {payload.map(p => {
        const m = SUBJECTS_META.find(s => s.key === p.dataKey);
        return (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span>{m?.emoji}</span>
            <span className="text-gray-600 dark:text-gray-300">{m?.name}:</span>
            <span className="font-bold" style={{ color: p.color }}>{p.value}%</span>
          </div>
        );
      })}
    </div>
  );
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
  const [userSubjects, setUserSubjects]      = useState([]);
  const [quizResults, setQuizResults]        = useState([]);
  const [lessonProgress, setLessonProgress]  = useState([]);
  const [remGaps, setRemGaps]                = useState([]);
  const [subjectStats, setSubjectStats]      = useState([]); // ✅ NEW: For dynamic subject cards
  const [visibleSubjects, setVisibleSubjects] = useState(
    new Set(['Physics', 'Mathematics', 'Chemistry', 'Biology'])
  );
  const [activeTab, setActiveTab] = useState('Physics');

  // ── Fetch real data from Laravel backend ────────────────────────────────────────────────
  useEffect(() => {
    const fetchRealData = async () => {
      setLoading(true);
      try {
        // ✅ Fetch subjects and student attempts from real API
        const [subjectsRes, attemptsRes] = await Promise.all([
          api.get('/subjects'),
          api.get('/students/attempts'),
        ]);

        console.log('📥 Subjects Response:', subjectsRes.data);
        console.log('📥 Attempts Response:', attemptsRes.data);

        // Extract subjects array
        const subjectsList = Array.isArray(subjectsRes.data)
          ? subjectsRes.data
          : (subjectsRes.data?.data || []);

        // ✅ FIX: Extract attempts from quizzesAttempt key
        let rawAttempts = attemptsRes.data?.quizzesAttempt?.data || 
                          attemptsRes.data?.quizzesAttempt || 
                          attemptsRes.data?.data || 
                          attemptsRes.data?.attempts || 
                          attemptsRes.data || 
                          [];
        
        // ✅ Handle if quizzesAttempt is an object instead of array
        if (typeof rawAttempts === 'object' && !Array.isArray(rawAttempts)) {
          rawAttempts = Object.values(rawAttempts);
        }
        
        const attemptsList = Array.isArray(rawAttempts) ? rawAttempts : [];

        console.log('✅ Extracted Subjects:', subjectsList);
        console.log('✅ Extracted Attempts:', attemptsList);
        console.log('🔍 Sample Attempt Data:', attemptsList[0]); // ← Check exact structure

        // ✅ Process data: Calculate stats for each subject
        const stats = subjectsList.map((subject) => {
          // ✅ FIX: Support multiple name field formats
          const subjName = subject.name || subject.subject_name || subject.title || 'مادة غير معروفة';
          const subjId = subject.id || subject.subject_id;
          
          console.log(`\n🔍 Processing subject: ${subjName} (ID: ${subjId})`);
          
          // ✅ Forcefully match IDs using String() to avoid type mismatch
          const subjectAttempts = attemptsList.filter((attempt) => {
            const match = String(attempt.subject_id) === String(subjId);
            if (match) {
              console.log(`  ✅ Match found: attempt ${attempt.id} for subject ${subjId}`);
            }
            return match;
          });

          const attemptsCount = subjectAttempts.length;
          console.log(`  📊 Total attempts for ${subjName}: ${attemptsCount}`);

          // Calculate latest score or average score
          let latestScore = 0;
          let avgScore = 0;
          
          if (attemptsCount > 0) {
            latestScore = subjectAttempts[subjectAttempts.length - 1]?.score ?? 0;
            avgScore = Math.round(
              subjectAttempts.reduce((sum, att) => sum + (att.score || 0), 0) / attemptsCount
            );
            console.log(`  💯 Latest: ${latestScore}%, Average: ${avgScore}%`);
          }

          // Map to format compatible with SUBJECTS_META
          const meta = SUBJECTS_META.find(
            (m) => m.name === subjName || m.key === subject.code || String(m.id) === String(subjId)
          );

          return {
            id: subjId,
            key: meta?.key || subject.code || `subject_${subjId}`,
            name: subjName,  // ✅ Use safely extracted name
            emoji: meta?.emoji || '📚',
            color: meta?.color || '#103B66',
            mastery: avgScore, // Use average score as mastery percentage
            latestScore,
            attemptsCount,  // ✅ Add this for JSX
            quizzesTaken: attemptsCount,  // ✅ Keep this for compatibility
            quizzes: subjectAttempts
              .slice(-10) // Last 10 attempts
              .map((att) => ({
                date: att.created_at || att.date || new Date().toISOString(),
                score: att.score || 0,
              })),
          };
        });

        console.log('\n✅ Final Subject Stats:', stats);
        setSubjectStats(stats);
      } catch (err) {
        console.error('❌ Failed to fetch subject stats:', err);
        console.error('❌ Error details:', err.response?.data);
        // Fallback to empty stats
        setSubjectStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, []);

  // ── OLD: Fetch per-user data (keeping for other sections) ────────────────────────────────────────────────
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = String(storedUser.id || '');
    // Protected route — user always exists; if somehow empty, stop spinner via promise
    const noop = !userId ? Promise.resolve([{data:[]},{data:[]},{data:[]},{data:[]}]) : Promise.all([
      api.get(`${API}/user_subjects?userId=${userId}`),
      api.get(`${API}/user_quiz_results?userId=${userId}`),
      api.get(`${API}/user_lesson_progress?userId=${userId}`),
      api.get(`${API}/user_remediation_gaps?userId=${userId}`),
    ]);

    noop.then(([subRes, quizRes, lpRes, remRes]) => {
      setUserSubjects(subRes.data);
      setQuizResults(quizRes.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setLessonProgress(lpRes.data);
      setRemGaps(remRes.data);
    }).finally(() => setLoading(false));
  }, []);

  // ── Derived: subject summary cards ────────────────────────────────────
  const subjectsData = useMemo(() =>
    SUBJECTS_META.map(meta => {
      const us      = userSubjects.find(s => s.subjectId === meta.id);
      const mastery = us?.progress ?? 0;
      const quizzes = quizResults
        .filter(q => q.subjectId === meta.id)
        .slice(0, 10)      // newest 10
        .reverse()         // oldest → newest for sparkline
        .map(q => ({
          date:  q.date.slice(5).replace('-', '/'),
          score: q.percentage,
        }));
      return { key: meta.key, mastery, quizzes, completed: us?.completed ?? 0 };
    }), [userSubjects, quizResults]
  );

  // ── Derived: line chart data ───────────────────────────────────────────
  const lineData = useMemo(() => {
    const map = {};
    [...quizResults].reverse().forEach(q => {
      const meta = SUBJECTS_META.find(m => m.id === q.subjectId);
      if (!meta) return;
      const dateKey = q.date.slice(5).replace('-', '/');
      if (!map[q.date]) map[q.date] = { date: dateKey, _raw: q.date };
      map[q.date][meta.key] = q.percentage;
    });
    return Object.values(map)
      .sort((a, b) => new Date(a._raw) - new Date(b._raw))
      .map(({ _raw, ...rest }) => rest);
  }, [quizResults]);

  // ── Derived: subtopic bar data from remediation gaps ──────────────────
  const subtopicData = useMemo(() => {
    const meta = SUBJECTS_META.find(m => m.key === activeTab);
    if (!meta) return [];
    return remGaps
      .filter(g => String(g.subjectId) === meta.id)
      .map(g => ({
        name:     g.lessonTitle || g.gap,
        accuracy: g.completed ? 70 : g.difficulty === 'hard' ? 25 : 40,
      }));
  }, [remGaps, activeTab]);

  // ── Derived: activity heatmap (last 28 days) ──────────────────────────
  const { activityGrid, weekLabels } = useMemo(() => {
    const today    = new Date();
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - 27);
    const grid = [], labels = [];
    for (let week = 0; week < 4; week++) {
      const ws = new Date(startDay);
      ws.setDate(startDay.getDate() + week * 7);
      labels.push(ws.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }));
      for (let day = 0; day < 7; day++) {
        const d = new Date(ws);
        d.setDate(ws.getDate() + day);
        const dateStr = d.toISOString().split('T')[0];
        const count   = lessonProgress.filter(lp => lp.completedAt === dateStr).length;
        grid.push(count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : 3);
      }
    }
    return { activityGrid: grid, weekLabels: labels };
  }, [lessonProgress]);

  const toggleLine = (key) => {
    setVisibleSubjects(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const barData       = subtopicData;
  const activeTabMeta = SUBJECTS_META.find(s => s.key === activeTab);

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
            {/* ✅ DYNAMIC: Map over subjectStats from real API */}
            {subjectStats.map(({ id, key, name, emoji, color, mastery, quizzes, quizzesTaken, attemptsCount }) => {
              const badge = getMasteryBadge(mastery);
              const r = 16, C = 2 * Math.PI * r;
              const arc = (mastery / 100) * C;
              return (
                <div key={id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex flex-col gap-3 hover:shadow-md transition">
                  {/* Top row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{emoji}</span>
                      <span className="font-bold text-gray-800 dark:text-white text-sm">{name}</span>
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
                          stroke={color}
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
                          fill={color}
                        >
                          {mastery}%
                        </text>
                      </svg>
                    </div>
                    {/* Sparkline trend */}
                    <Sparkline quizzes={quizzes} color={color} />
                  </div>

                  {/* Footer stat */}
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    آخر درجة:{' '}
                    <span className="font-bold text-gray-700 dark:text-gray-300">
                      {quizzes.length > 0 ? `${quizzes[quizzes.length - 1]?.score}%` : '—'}
                    </span>
                    {'  ·  '}{attemptsCount || quizzes.length} اختبار
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
              {SUBJECTS_META.map(({ key, name, emoji, color }) => (
                <button
                  key={key}
                  onClick={() => toggleLine(key)}
                  style={visibleSubjects.has(key) ? { backgroundColor: color, borderColor: color } : {}}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    visibleSubjects.has(key)
                      ? 'text-white shadow-sm'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {emoji} {name}
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
                  <Tooltip content={<LineTooltip />} />
                  {SUBJECTS_META.map(({ key, color }) =>
                    visibleSubjects.has(key) ? (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={color}
                        strokeWidth={2.5}
                        dot={{ fill: color, r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                    ) : null
                  )}
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
            {SUBJECTS_META.map(({ key, name, emoji }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                  activeTab === key
                    ? 'bg-[#103B66] dark:bg-blue-600 text-white border-transparent shadow-md'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-[#103B66] dark:hover:border-blue-400'
                }`}
              >
                {emoji} {name}
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
            <div className="max-w-md mx-auto" dir="ltr">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2 pr-16">
                {DAYS_AR.map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-gray-400 dark:text-gray-500">
                    {d}
                  </div>
                ))}
              </div>

              {/* Week rows */}
              <div className="space-y-2">
                {[0, 1, 2, 3].map(week => (
                  <div key={week} className="flex items-center gap-3">
                    <span
                      className="text-[10px] text-gray-400 dark:text-gray-500 font-medium w-14 text-left flex-shrink-0 leading-tight"
                    >
                      {weekLabels[week]}
                    </span>
                    <div className="grid grid-cols-7 gap-2 flex-1">
                      {activityGrid.slice(week * 7, week * 7 + 7).map((intensity, day) => (
                        <div
                          key={day}
                          title={
                            intensity === 0 ? 'لا يوجد نشاط'  :
                            intensity === 1 ? 'نشاط منخفض'   :
                            intensity === 2 ? 'نشاط متوسط'   : 'نشاط مرتفع'
                          }
                          className={`w-full aspect-square rounded-md transition-all hover:opacity-80 cursor-default ${activityCls(intensity)}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-2 mt-5 justify-center text-xs text-gray-500 dark:text-gray-400 font-medium">
                <span>{t('less_label')}</span>
                <div className="flex gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-sm bg-gray-100 dark:bg-gray-700" />
                  <div className="w-3.5 h-3.5 rounded-sm bg-purple-200 dark:bg-purple-900/70" />
                  <div className="w-3.5 h-3.5 rounded-sm bg-purple-400 dark:bg-purple-600" />
                  <div className="w-3.5 h-3.5 rounded-sm bg-purple-700 dark:bg-purple-400" />
                </div>
                <span>{t('more_label')}</span>
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
                  ) : quizResults.map((row, i) => {
                    const pct   = row.percentage;
                    const badge = getMasteryBadge(pct);
                    const meta  = SUBJECTS_META.find(s => s.id === row.subjectId);
                    return (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition">
                        <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {row.date}
                        </td>
                        <td className="px-5 py-3.5 text-sm font-bold text-gray-800 dark:text-white whitespace-nowrap">
                          {meta?.emoji} {row.subjectName || meta?.name}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300 max-w-[160px] truncate">
                          {row.lessonTitle}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${badge.bgCls} ${badge.textCls}`}>
                            {row.score}/{row.total} ({pct}%)
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                            {pct < 50
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
                          {pct < 50 && (
                            <button
                              onClick={() =>
                                navigate('/weakness-report', {
                                  state: {
                                    score: row.score,
                                    total: row.total,
                                    subjectName: row.subjectName,
                                    lesson: { title: row.lessonTitle },
                                  },
                                })
                              }
                              className="flex items-center gap-1.5 text-xs font-bold text-[#103B66] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg transition whitespace-nowrap"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {t('view_report')}
                            </button>
                          )}
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
