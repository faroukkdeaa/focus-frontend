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
  ChevronDown, AlertTriangle, BarChart2, Eye, Loader2, RefreshCcw,
} from 'lucide-react';

const API = 'http://localhost:3001';

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

const scoreBadge = (pct) => {
  if (pct >= 80) return { dot: '🟢', cls: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' };
  if (pct >= 60) return { dot: '🟡', cls: 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700' };
  return           { dot: '🔴', cls: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' };
};

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
  const [content,   setContent]   = useState([]);
  const [kpi,       setKpi]       = useState(null);
  const [viewsData, setViewsData] = useState([]);

  // ── Per-section loading / error ───────────────────────────────────────────
  const [loadingContent, setLoadingContent] = useState(true);
  const [loadingKpi,     setLoadingKpi]     = useState(true);
  const [loadingViews,   setLoadingViews]   = useState(true);

  const [errorContent, setErrorContent] = useState(null);
  const [errorKpi,     setErrorKpi]     = useState(null);
  const [errorViews,   setErrorViews]   = useState(null);

  // ── Selected lesson (for drill-down charts) ───────────────────────────────
  const [selectedId, setSelectedId] = useState(null);

  // ── Fetch helpers ─────────────────────────────────────────────────────────

  const fetchContent = useCallback(async () => {
    setLoadingContent(true);
    setErrorContent(null);
    try {
      const { data } = await api.get(`${API}/teacher_content`);
      setContent(data);
      // Auto-select first lesson on first load
      setSelectedId(prev => prev ?? data[0]?.id ?? null);
    } catch {
      setErrorContent('تعذّر تحميل بيانات المحتوى.');
    } finally {
      setLoadingContent(false);
    }
  }, []);

  const fetchKpi = useCallback(async () => {
    setLoadingKpi(true);
    setErrorKpi(null);
    try {
      const { data } = await api.get(`${API}/teacher_kpi`);
      setKpi(data);
    } catch {
      setErrorKpi('تعذّر تحميل مؤشرات الأداء.');
    } finally {
      setLoadingKpi(false);
    }
  }, []);

  const fetchViews = useCallback(async () => {
    setLoadingViews(true);
    setErrorViews(null);
    try {
      const { data } = await api.get(`${API}/teacher_views_over_time`);
      setViewsData(data);
    } catch {
      setErrorViews('تعذّر تحميل بيانات المشاهدات.');
    } finally {
      setLoadingViews(false);
    }
  }, []);

  // ── Initial parallel fetch ────────────────────────────────────────────────
  useEffect(() => {
    fetchContent();
    fetchKpi();
    fetchViews();
  }, [fetchContent, fetchKpi, fetchViews]);

  // ── Derived values ────────────────────────────────────────────────────────
  const selected = content.find(c => c.id === selectedId) ?? content[0] ?? null;
  const distData = selected
    ? selected.scoreDistribution.map((count, i) => ({ bucket: SCORE_BUCKETS[i], طلاب: count }))
    : [];

  const totalViews   = viewsData.reduce((s, d) => s + d['مشاهدات'], 0);
  const peakViews    = viewsData.length ? Math.max(...viewsData.map(d => d['مشاهدات'])) : 0;
  const avgDailyView = viewsData.length ? Math.round(totalViews / viewsData.length) : 0;

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
          {errorKpi ? (
            <SectionError message={errorKpi} onRetry={fetchKpi} />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { labelKey: 'total_videos',   value: kpi?.totalVideos,   icon: Video,         border: 'border-t-blue-500',   iconBg: 'bg-blue-100 dark:bg-blue-900/40',     iconCls: 'text-blue-600 dark:text-blue-400'     },
                { labelKey: 'total_attempts', value: kpi?.totalAttempts, icon: ClipboardList, border: 'border-t-violet-500', iconBg: 'bg-violet-100 dark:bg-violet-900/40', iconCls: 'text-violet-600 dark:text-violet-400' },
                { labelKey: 'avg_score',      value: kpi ? `${kpi.avgScore}%` : null, icon: TrendingUp, border: 'border-t-green-500', iconBg: 'bg-green-100 dark:bg-green-900/40', iconCls: 'text-green-600 dark:text-green-400' },
                { labelKey: 'watch_hours',    value: kpi?.watchHours,    icon: Clock,         border: 'border-t-amber-500',  iconBg: 'bg-amber-100 dark:bg-amber-900/40',   iconCls: 'text-amber-600 dark:text-amber-400'   },
              ].map(({ labelKey, value, icon: Icon, border, iconBg, iconCls }) => (
                <div key={labelKey} className={`bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border-t-4 ${border}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-snug">{t(labelKey)}</p>
                    <div className={`p-2 rounded-full ${iconBg}`}>
                      <Icon className={`w-4 h-4 ${iconCls}`} />
                    </div>
                  </div>
                  {loadingKpi ? (
                    <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  ) : (
                    <p className="text-3xl font-bold text-gray-800 dark:text-white leading-none">
                      {value ?? '—'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ═══ SECTION 2 — Content Performance Table ═══ */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
            {t('content_performance')}
          </h2>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {loadingContent ? (
              <div className="p-6"><SectionLoader rows={5} /></div>
            ) : errorContent ? (
              <div className="p-6"><SectionError message={errorContent} onRetry={fetchContent} /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead className="bg-gray-50 dark:bg-gray-700/60">
                    <tr>
                      {[t('lessons_tab'), t('total_videos'), t('total_attempts'), t('avg_score'), t('weak_subtopic'), t('details_label')].map(h => (
                        <th key={h} className="px-5 py-3.5 text-right text-xs font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {content.map(c => {
                      const badge = scoreBadge(c.avgScore);
                      const subj  = SUBJECT_COLORS[c.subject] ?? {};
                      return (
                        <tr
                          key={c.id}
                          className={`transition ${selectedId === c.id ? 'bg-blue-50/40 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'}`}
                        >
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-gray-800 dark:text-white text-sm">{c.lesson}</p>
                            <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${subj.bg} ${subj.text}`}>
                              {SUBJECT_NAMES[c.subject]}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {c.views.toLocaleString()} 👁
                          </td>
                          <td className="px-5 py-3.5 text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {c.quizAttempts.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${badge.cls}`}>
                              {badge.dot} {c.avgScore}%
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-red-600 dark:text-red-400 font-medium max-w-[160px] truncate">
                            {c.topWeakSubtopic}
                          </td>
                          <td className="px-5 py-3.5">
                            <button
                              onClick={() => setSelectedId(c.id)}
                              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition whitespace-nowrap ${
                                selectedId === c.id
                                  ? 'bg-[#103B66] dark:bg-blue-600 text-white border-transparent'
                                  : 'text-[#103B66] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {selectedId === c.id ? t('selected_label') : t('details_label')}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
            {!loadingContent && content.length > 0 && (
              <div className="relative">
                <select
                  value={selectedId ?? ''}
                  onChange={e => setSelectedId(Number(e.target.value))}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#103B66] dark:focus:ring-blue-500 cursor-pointer"
                >
                  {content.map(c => (
                    <option key={c.id} value={c.id}>{c.lesson}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>

          {loadingContent ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[0, 1].map(i => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                  <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
                  <div className="h-[240px] bg-gray-100 dark:bg-gray-700/40 rounded-xl animate-pulse" />
                </div>
              ))}
            </div>
          ) : errorContent ? (
            <SectionError message={errorContent} onRetry={fetchContent} />
          ) : selected ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* SECTION 3 — Score Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="font-bold text-gray-800 dark:text-white text-base mb-1">{t('score_distribution')}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                  {selected.quizAttempts} — {selected.lesson}
                </p>
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
              </div>

              {/* SECTION 4 — Most Missed Questions */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="font-bold text-gray-800 dark:text-white text-base mb-1">{t('missed_questions')}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">{selected.lesson}</p>
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
            {loadingViews ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <Loader2 className="w-7 h-7 text-[#103B66] dark:text-blue-400 animate-spin" />
                <p className="text-sm text-gray-400">جارٍ تحميل بيانات المشاهدات…</p>
              </div>
            ) : errorViews ? (
              <SectionError message={errorViews} onRetry={fetchViews} />
            ) : (
              <>
                <div dir="ltr">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={viewsData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
            )}
          </div>
        </section>

      </main>
    </div>
  );
};

export default TeacherAnalytics;
