import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Brain, ArrowRight, Video, ClipboardList, TrendingUp, Clock,
  ChevronDown, AlertTriangle, BarChart2, Eye,
} from 'lucide-react';

// ── Mock data ─────────────────────────────────────────────────────────────────

const SUBJECT_COLORS = {
  Physics:     { bg: 'bg-blue-100 dark:bg-blue-900/40',   text: 'text-blue-700 dark:text-blue-300'   },
  Chemistry:   { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-300' },
  Mathematics: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300' },
  Biology:     { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300' },
};

const SUBJECT_NAMES = {
  Physics: 'الفيزياء', Chemistry: 'الكيمياء',
  Mathematics: 'الرياضيات', Biology: 'الأحياء',
};

const SCORE_BUCKETS = ['0–20%', '21–40%', '41–60%', '61–80%', '81–100%'];

const TEACHER_CONTENT = [
  {
    id: 1,
    lesson: 'قانون نيوتن الثاني',
    subject: 'Physics',
    views: 340,
    quizAttempts: 210,
    avgScore: 58,
    topWeakSubtopic: 'قانون نيوتن الثاني',
    scoreDistribution: [8, 22, 55, 80, 45],
    missedQuestions: [
      { text: 'جسم كتلته 5 كجم يتسارع بتأثير قوة محصلة مقدارها...', wrongRate: 72, topWrongOption: '10 نيوتن' },
      { text: 'إذا كانت القوة المؤثرة على جسم 20 نيوتن والكتلة...', wrongRate: 65, topWrongOption: '2 م/ث²' },
      { text: 'ما العلاقة بين التسارع والكتلة عند ثبات القوة؟',   wrongRate: 58, topWrongOption: 'طردية' },
    ],
  },
  {
    id: 2,
    lesson: 'قانون أوم والدارات الكهربائية',
    subject: 'Physics',
    views: 285,
    quizAttempts: 178,
    avgScore: 74,
    topWeakSubtopic: 'الكهرومغناطيسية',
    scoreDistribution: [3, 10, 30, 85, 50],
    missedQuestions: [
      { text: 'دارة كهربائية فيها مقاومة 4 أوم وفولتية 12 فولت...', wrongRate: 55, topWrongOption: '48 أمبير' },
      { text: 'مقاومتان على التوازي كل منهما 6 أوم، المقاومة المكافئة...', wrongRate: 48, topWrongOption: '12 أوم' },
      { text: 'القدرة المستهلكة في مقاومة 5 أوم بتيار 2 أمبير...', wrongRate: 40, topWrongOption: '10 واط' },
    ],
  },
  {
    id: 3,
    lesson: 'الاتزان الكيميائي',
    subject: 'Chemistry',
    views: 198,
    quizAttempts: 145,
    avgScore: 49,
    topWeakSubtopic: 'تأثير التركيز على الاتزان',
    scoreDistribution: [15, 38, 50, 30, 12],
    missedQuestions: [
      { text: 'عند رفع ضغط منظومة متزنة تحتوي على غازات، الاتزان...', wrongRate: 78, topWrongOption: 'لا يتأثر' },
      { text: 'مبدأ لو شاتيليه ينص على أن المنظومة المتزنة...', wrongRate: 70, topWrongOption: 'تتحرك نحو المواد المتفاعلة دائماً' },
      { text: 'ثابت الاتزان Kc يعتمد على...', wrongRate: 62, topWrongOption: 'الضغط والتركيز' },
    ],
  },
  {
    id: 4,
    lesson: 'المعادلات التربيعية',
    subject: 'Mathematics',
    views: 420,
    quizAttempts: 312,
    avgScore: 83,
    topWeakSubtopic: 'المعادلات ذات الجذر المتكرر',
    scoreDistribution: [2, 8, 20, 95, 187],
    missedQuestions: [
      { text: 'معادلة تربيعية جذراها متساويان وثابتها الحر 9، المعادلة...', wrongRate: 42, topWrongOption: 'x² - 6x + 9 = 0' },
      { text: 'مجموع جذري المعادلة x² - 5x + 6 = 0 يساوي...', wrongRate: 35, topWrongOption: '6' },
      { text: 'حاصل ضرب جذري x² + 3x - 10 = 0 يساوي...', wrongRate: 30, topWrongOption: '3' },
    ],
  },
  {
    id: 5,
    lesson: 'الوراثة والجينات',
    subject: 'Biology',
    views: 156,
    quizAttempts: 98,
    avgScore: 66,
    topWeakSubtopic: 'الصفات المرتبطة بالجنس',
    scoreDistribution: [5, 12, 28, 38, 15],
    missedQuestions: [
      { text: 'الصفة المرتبطة بالجنس X تنتقل من الأب إلى...', wrongRate: 68, topWrongOption: 'الأبناء الذكور فقط' },
      { text: 'نسبة ظهور الصفة المتنحية في الجيل F2 هي...', wrongRate: 55, topWrongOption: '1/2' },
      { text: 'عبور الكروموسومات يحدث أثناء...', wrongRate: 48, topWrongOption: 'الطور البيني' },
    ],
  },
];

// Build KPI totals
const KPI = {
  totalVideos:   TEACHER_CONTENT.length,
  totalAttempts: TEACHER_CONTENT.reduce((s, c) => s + c.quizAttempts, 0),
  avgScore:      Math.round(TEACHER_CONTENT.reduce((s, c) => s + c.avgScore, 0) / TEACHER_CONTENT.length),
  watchHours:    Math.round(TEACHER_CONTENT.reduce((s, c) => s + c.views, 0) * 6.4 / 60), // ~6.4 min avg
};

// Views-over-time: 30 days ending Feb 21, 2026
const VIEWS_OVER_TIME = (() => {
  const base = [12,8,15,20,9,18,25,14,30,22,17,28,35,20,15,42,38,25,30,18,45,50,35,28,40,55,48,38,52,60];
  return base.map((v, i) => ({
    day: `${i + 1}/2`,
    مشاهدات: v,
  }));
})();

// ── Helpers ───────────────────────────────────────────────────────────────────

const scoreBadge = (pct) => {
  if (pct >= 80) return { dot: '🟢', cls: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' };
  if (pct >= 60) return { dot: '🟡', cls: 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700' };
  return            { dot: '🔴', cls: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' };
};

const distBarColor = (idx) =>
  ['#dc2626', '#f97316', '#d97706', '#16a34a', '#2563eb'][idx] || '#6b7280';

// ── Custom Tooltip ────────────────────────────────────────────────────────────

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
  const [selectedId, setSelectedId] = useState(TEACHER_CONTENT[0].id);

  const selected = TEACHER_CONTENT.find(c => c.id === selectedId) ?? TEACHER_CONTENT[0];
  const distData = selected.scoreDistribution.map((count, i) => ({
    bucket: SCORE_BUCKETS[i],
    طلاب: count,
  }));

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
              { label: t('total_videos'),   value: KPI.totalVideos,   unit: '',      icon: Video,         border: 'border-t-blue-500',   iconBg: 'bg-blue-100 dark:bg-blue-900/40',   iconCls: 'text-blue-600 dark:text-blue-400'   },
              { label: t('total_attempts'), value: KPI.totalAttempts, unit: '',     icon: ClipboardList, border: 'border-t-violet-500', iconBg: 'bg-violet-100 dark:bg-violet-900/40', iconCls: 'text-violet-600 dark:text-violet-400' },
              { label: t('avg_score'),      value: `${KPI.avgScore}%`,unit: '',           icon: TrendingUp,    border: 'border-t-green-500',  iconBg: 'bg-green-100 dark:bg-green-900/40',  iconCls: 'text-green-600 dark:text-green-400'  },
              { label: t('watch_hours'),    value: KPI.watchHours,   unit: '',      icon: Clock,         border: 'border-t-amber-500',  iconBg: 'bg-amber-100 dark:bg-amber-900/40',  iconCls: 'text-amber-600 dark:text-amber-400'  },
            ].map(({ label, value, unit, icon: Icon, border, iconBg, iconCls }) => (
              <div key={label} className={`bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border-t-4 ${border}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-snug">{label}</p>
                  <div className={`p-2 rounded-full ${iconBg}`}>
                    <Icon className={`w-4 h-4 ${iconCls}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-800 dark:text-white leading-none">
                  {value}
                </p>
                {unit && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{unit}</p>}
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
                  {TEACHER_CONTENT.map(c => {
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
            <div className="relative">
              <select
                value={selectedId}
                onChange={e => setSelectedId(Number(e.target.value))}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#103B66] dark:focus:ring-blue-500 cursor-pointer"
              >
                {TEACHER_CONTENT.map(c => (
                  <option key={c.id} value={c.id}>{c.lesson}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

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
              {/* Color legend */}
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                {selected.lesson}
              </p>

              <div className="space-y-4">
                {selected.missedQuestions.map((q, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10"
                  >
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
                        {/* Wrong rate bar */}
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
        </section>

        {/* ═══ SECTION 5 — Views Over Time ═══ */}
        <section className="pb-12">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
            {t('views_over_time')}
          </h2>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <div dir="ltr">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={VIEWS_OVER_TIME} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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

            {/* Aggregate stats strip */}
            <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t dark:border-gray-700">
              {[
                { label: 'إجمالي المشاهدات',  value: VIEWS_OVER_TIME.reduce((s, d) => s + d.مشاهدات, 0).toLocaleString() },
                { label: 'أعلى يوم',          value: `${Math.max(...VIEWS_OVER_TIME.map(d => d.مشاهدات))} مشاهدة` },
                { label: 'متوسط يومي',        value: `${Math.round(VIEWS_OVER_TIME.reduce((s, d) => s + d.مشاهدات, 0) / VIEWS_OVER_TIME.length)} مشاهدة` },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</p>
                  <p className="font-bold text-gray-800 dark:text-white text-base">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default TeacherAnalytics;
