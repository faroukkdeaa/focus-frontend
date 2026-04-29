import { useState, useEffect, useMemo } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  TrendingUp, ArrowRight, Eye, Brain, Activity, BookOpen, BarChart2, Calendar,
} from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

const transition = { transition: "all 0.25s ease" };
const iw = (bg, bd, sz = "48px", r = "14px") => ({ ...transition, width: sz, height: sz, borderRadius: r, background: bg, border: `1px solid ${bd}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 });

// ── Static meta ───────────────────────────────────────────────────────────────

const SUBJECTS_META = [
  { key: 'Physics',     id: '1', name: 'الفيزياء',   emoji: '⚡', color: '#103B66' },
  { key: 'Mathematics', id: '2', name: 'الرياضيات',  emoji: '📐', color: '#7C3AED' },
  { key: 'Chemistry',   id: '3', name: 'الكيمياء',   emoji: '🧪', color: '#059669' },
  { key: 'Biology',     id: '4', name: 'الأحياء',    emoji: '🌿', color: '#D97706' },
];


// ── Helpers ───────────────────────────────────────────────────────────────────

const getMasteryBadge = (pct, C) => {
  if (pct >= 80) return { dot: '🟢', label: 'قوي', color: C.green, bg: C.greenDim, border: C.greenBorder };
  if (pct >= 60) return { dot: '🟡', label: 'متوسط', color: C.yellow, bg: C.yellowDim, border: C.yellowBorder };
  return { dot: '🔴', label: 'يحتاج مراجعة', color: C.redIcon, bg: C.redDim, border: C.redBorder };
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
const CustomTooltip = ({ active, payload, label, C, glass }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const plottedPercentage = payload[0].value || 0;
    const safeRawScore = data.score ?? 0;
    const maxScore = data.totalMarks ?? 0;
    const subjectName = data.subjectName || data.subject_name || data.subjectId || 'المادة الحالية';
    return (
      <div style={{...transition,...glass(),padding:"14px 18px",minWidth:"180px",textAlign:"right",direction:"rtl"}}>
        <p style={{...transition,fontWeight:700,marginBottom:"6px",color:C.textPrimary,fontSize:"0.82rem"}}>التاريخ: {label || data.displayDate}</p>
        <p style={{...transition,margin:0,color:C.textMuted,fontSize:"0.78rem"}}>المادة: {subjectName}</p>
        <p style={{...transition,margin:0,color:C.accent,fontWeight:700,fontSize:"0.82rem",marginTop:"4px"}}>
          الدرجة: {safeRawScore} / {maxScore} ({plottedPercentage}%)
        </p>
      </div>
    );
  }
  return null;
};

/** Recharts custom tooltip for bar chart */
const BarTooltip = ({ active, payload, C, glass }) => {
  if (!active || !payload?.length) return null;
  const { name, accuracy } = payload[0].payload;
  const badge = getMasteryBadge(accuracy, C);
  return (
    <div style={{...transition,...glass(),padding:"12px",minWidth:"160px",textAlign:"right",direction:"rtl"}}>
      <p style={{color:C.textPrimary,fontWeight:700,fontSize:"0.85rem",marginBottom:"4px"}}>{name}</p>
      <p style={{color:badge.color,fontWeight:700,fontSize:"0.8rem"}}>
        {accuracy}% — {badge.dot} {badge.label}
      </p>
    </div>
  );
};

const ProgressAnalyticsLoadingSkeleton = ({ C, lang, transition, glass }) => (
  <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{...transition,background:C.bg,minHeight:"100vh",fontFamily:"'Cairo',sans-serif"}}>
    <main style={{maxWidth:"1100px",margin:"0 auto",padding:"32px 24px",display:"flex",flexDirection:"column",gap:"28px"}}>
      <section>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))",gap:"16px"}}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} style={glass({ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' })}>
              <SkeletonLoader type="card" width="52px" height="52px" />
              <div style={{display:"flex",flexDirection:"column",gap:"8px",flex:1}}>
                <SkeletonLoader type="text" width="72%" height="11px" />
                <SkeletonLoader type="text" width="48%" height="16px" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(340px, 1fr))",gap:"18px"}}>
          <div style={glass({ padding: '20px' })}>
            <SkeletonLoader type="text" width="38%" height="14px" className="mb-4" />
            <SkeletonLoader type="card" height="320px" className="w-full" />
          </div>
          <div style={glass({ padding: '20px' })}>
            <SkeletonLoader type="text" width="44%" height="14px" className="mb-4" />
            <SkeletonLoader type="card" height="320px" className="w-full" />
          </div>
        </div>
      </section>
    </main>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────

const ProgressAnalytics = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { isDarkMode, C, glass } = useTheme();

  const [loading, setLoading]               = useState(true);
  const [overallProgress, setOverallProgress] = useState(null); // from overall_progress field
  const [quizResults, setQuizResults]        = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [remGaps, setRemGaps]                = useState([]);
  const [subjectStats, setSubjectStats]      = useState([]);
  const [selectedChartSubject, setSelectedChartSubject] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  // Activity colors: 0 (empty), 1, 2, 3, 4+ (highest)
  const activityColors = ['#2d333b', '#0e4429', '#006d32', '#26a641', '#39d353'];

  // ── Fetch from /student/dashboard → lesson_attempts ────────────────────────
  useEffect(() => {
    const fetchRealData = async () => {
      setLoading(true);
      try {
        const attemptsRes = await api.get('/student/dashboard');

        // ── overall_progress: bind directly, do NOT recalculate from attempts ──
        // Use optional chaining: field may not exist until backend deploys it.
        const rawOverall = attemptsRes.data?.overall_progress;
        setOverallProgress(rawOverall != null ? Number(rawOverall) : null);
        const rawAttempts = Array.isArray(attemptsRes.data?.lesson_attempts)
          ? attemptsRes.data.lesson_attempts
          : [];

        // Normalize ALL entries (null-score ones still count as heatmap activity)
        const allAttempts = rawAttempts.map((att, idx) => {
          const parsedDate = new Date(att.attempted_at ?? '');
          const createdMs = Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
          const score = att.score !== null && att.score !== undefined ? Number(att.score) : null;
          const totalMarks = att.total_marks !== null && att.total_marks !== undefined ? Number(att.total_marks) : null;
          const percentage = att.percentage !== null && att.percentage !== undefined ? Number(att.percentage) : null;
          return {
            attemptId:   idx + 1,
            createdAt:   att.attempted_at ?? '',
            createdMs,
            score,
            totalMarks,
            percentage,
            lessonTitle: att.lesson_title ?? 'درس بدون عنوان',
            subjectName: att.subject_name ?? null,
            subjectId:   att.subject_id  ?? null,
          };
        });

        // Scored-only, oldest→newest (drives chart & subject card)
        const scoredAsc = allAttempts
          .filter(a => a.percentage !== null)
          .sort((a, b) => a.createdMs - b.createdMs);

        setAttempts(allAttempts); // heatmap useMemo consumes ALL entries

        const last = scoredAsc[scoredAsc.length - 1];
        setSubjectStats([{
          id:             'all',
          key:            'all-attempts',
          name:           rawAttempts[0]?.subject_name ?? 'المادة',
          emoji:          '📊',
          color:          '#103B66',
          attemptsCount:  scoredAsc.length,
          lastRawScore:   last?.score ?? 0,
          lastPercentage: last?.percentage ?? 0,
          quizzes:        scoredAsc.slice(-5).map(a => ({ date: a.createdAt, score: a.percentage })),
        }]);
        setSelectedChartSubject('all');
        setActiveTab('all');

        // Recent quiz table: scored, newest-first
        const tableRows = [...scoredAsc]
          .sort((a, b) => b.createdMs - a.createdMs)
          .map(att => {
            const dateObj = new Date(att.createdAt);
            const formattedDate = Number.isNaN(dateObj.getTime())
              ? '—'
              : dateObj.toLocaleString('ar-EG', {
                  year: 'numeric', month: '2-digit', day: '2-digit',
                  hour: '2-digit', minute: '2-digit', hour12: false,
                });
            return {
              attemptId:   att.attemptId,
              date:        formattedDate,
              displayDate: att.createdAt,
              lessonTitle: att.lessonTitle,
              percentage:  att.percentage,
              score:       att.score,
              totalMarks:  att.totalMarks,
              subjectName: att.subjectName ?? '-',
              subjectId:   att.subjectId ? String(att.subjectId) : '',
              createdMs:   att.createdMs,
            };
          });

        setQuizResults(tableRows);
        setRemGaps([]);
      } catch (err) {
        console.error('❌ Failed to fetch student dashboard:', err);
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


  // ── Derived: line chart data — scored attempts only, oldest→newest ─────────
  const lineData = useMemo(() => {
    if (!attempts.length) return [];

    return [...attempts]
      .filter(att => att.percentage !== null)  // exclude activity-only (null-score) entries
      .sort((a, b) => a.createdMs - b.createdMs)
      .map((att) => {
        const d = new Date(att.createdAt);
        const dateLabel = Number.isNaN(d.getTime())
          ? '—'
          : `${d.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false })}`;

        return {
          date: dateLabel,
          percentage: att.percentage,
          score: att.score,
          totalMarks: att.totalMarks,
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
      } catch {
        // Ignore malformed date values in activity stream.
      }
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
  const _selectedChartMeta = subjectStats.find(s => String(s.id) === String(selectedChartSubject));
  const latestAttempt = attempts[0] ?? null;

  if (loading) return <ProgressAnalyticsLoadingSkeleton C={C} lang={lang} transition={transition} glass={glass} />;

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{...transition,background:C.bg,minHeight:"100vh",fontFamily:"'Cairo',sans-serif"}}>

      {/* Header */}
      <header style={{...transition,position:"sticky",top:0,zIndex:10,background:isDarkMode?"rgba(11,17,32,0.88)":"rgba(248,250,252,0.90)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:`1px solid ${C.border}`}}>
        <div style={{maxWidth:"1100px",margin:"0 auto",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <div style={iw(C.iconBgA,C.iconBorderA,"40px","12px")}>
              <Brain style={{color:C.iconA,width:"20px",height:"20px"}} strokeWidth={2} />
            </div>
            <div>
              <h1 style={{...transition,color:C.accent,fontSize:"1rem",fontWeight:700}}>{t('progress_title')}</h1>
              <p style={{...transition,color:C.textDim,fontSize:"0.72rem"}}>{t('progress_subtitle')}</p>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard')} style={{...transition,display:"flex",alignItems:"center",gap:"6px",background:"transparent",border:"none",color:C.textMuted,cursor:"pointer",fontWeight:700,fontSize:"0.82rem"}} onMouseEnter={e=>{e.currentTarget.style.color=C.accent}} onMouseLeave={e=>{e.currentTarget.style.color=C.textMuted}}>
            <ArrowRight style={{width:"16px",height:"16px",...(lang==='en'?{transform:"rotate(180deg)"}:{})}} />
            {t('back_to_dashboard')}
          </button>
        </div>
      </header>

      <main style={{maxWidth:"1100px",margin:"0 auto",padding:"32px 24px",display:"flex",flexDirection:"column",gap:"40px"}}>

        {/* Overall Progress Hero */}
        <section>
          <div style={{...transition,...glass(),borderColor:C.borderAccent,padding:"32px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"24px"}}>
            <div>
              <p style={{...transition,color:C.textMuted,fontSize:"0.82rem",fontWeight:600,marginBottom:"6px"}}>{latestAttempt?.subjectName || 'المادة'}</p>
              <p style={{...transition,color:C.textPrimary,fontSize:"3rem",fontWeight:900,lineHeight:1}}>
                {overallProgress != null ? `${overallProgress}%` : 'جاري التحديث...'}
              </p>
              <p style={{...transition,color:C.textDim,fontSize:"0.75rem",marginTop:"10px"}}>
                {latestAttempt
                  ? `${latestAttempt.score ?? 0} من ${latestAttempt.totalMarks ?? 0}`
                  : 'لا توجد اختبارات مكتملة بعد'}
              </p>
            </div>
            {overallProgress != null && (
              <div dir="ltr" style={{flexShrink:0}}>
                <svg width="80" height="80" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="16" fill="none" strokeWidth="4" stroke={C.trackBg} />
                  <circle
                    cx="22" cy="22" r="16" fill="none" strokeWidth="4" stroke={C.accent}
                    strokeDasharray={`${((overallProgress / 100) * (2 * Math.PI * 16)).toFixed(2)} ${(2 * Math.PI * 16).toFixed(2)}`}
                    strokeDashoffset={(2 * Math.PI * 16 / 4).toFixed(2)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}
                  />
                  <text x="22" y="26" textAnchor="middle" fontSize="9" fontWeight="bold" fill={C.accent}>
                    {overallProgress}%
                  </text>
                </svg>
              </div>
            )}
          </div>
        </section>

        {/* Subject Summary Cards */}
        <section>
          <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"20px"}}>
            <div style={iw(C.iconBgA,C.iconBorderA,"36px","10px")}>
              <BookOpen style={{color:C.iconA,width:"18px",height:"18px"}} strokeWidth={2} />
            </div>
            <h2 style={{...transition,color:C.textPrimary,fontSize:"1.2rem",fontWeight:800}}>{t('mastery_summary')}</h2>
          </div>

          {subjectStats.length === 0 ? (
            <div style={glass({ padding: '10px' })}>
              <EmptyState
                icon={BookOpen}
                title={'بداية ممتازة لرحلة التقدّم'}
                description={'لا توجد إحصاءات مواد بعد. ابدأ أول اختبارك وسيظهر ملخص الإتقان هنا تلقائيًا.'}
              />
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))",gap:"20px"}}>
              {subjectStats.map((subject) => {
              const badge = getMasteryBadge(subject.lastPercentage || 0, C);
              const r = 16, Circ = 2 * Math.PI * r;
              const arc = ((subject.lastPercentage || 0) / 100) * Circ;
              return (
                <div key={subject.id} style={{...transition,...glass(),padding:"24px",display:"flex",flexDirection:"column",gap:"12px"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.borderAccent;e.currentTarget.style.transform="translateY(-3px)"}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="translateY(0)"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                      <span style={{fontSize:"1.4rem"}}>{subject.emoji}</span>
                      <span style={{...transition,fontWeight:700,color:C.textPrimary,fontSize:"0.85rem"}}>{subject.name}</span>
                    </div>
                    <span style={{...transition,fontSize:"0.7rem",fontWeight:700,padding:"4px 10px",borderRadius:"999px",background:badge.bg,color:badge.color,border:`1px solid ${badge.border}`}}>
                      {badge.dot} {badge.label}
                    </span>
                  </div>

                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div dir="ltr" style={{flexShrink:0}}>
                      <svg width="48" height="48" viewBox="0 0 44 44">
                        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" stroke={C.trackBg} />
                        <circle
                          cx="22" cy="22" r={r} fill="none" strokeWidth="4"
                          stroke={subject.color}
                          strokeDasharray={`${arc.toFixed(2)} ${(Circ - arc).toFixed(2)}`}
                          strokeDashoffset={(Circ / 4).toFixed(2)}
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
                  <p style={{...transition,color:C.textDim,fontSize:"0.75rem"}}>
                    آخر درجة:{' '}
                    <span style={{fontWeight:700,color:C.textMuted}}>
                      {latestAttempt?.score ?? 0} من {latestAttempt?.totalMarks ?? 0}
                    </span>
                  </p>
                </div>
              );
              })}
            </div>
          )}
        </section>

        {/* Score Over Time (Area Chart) */}
        <section>
          <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:"12px",marginBottom:"20px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <div style={iw(C.iconBgB,C.iconBorderB,"36px","10px")}>
                <TrendingUp style={{color:C.iconB,width:"18px",height:"18px"}} strokeWidth={2} />
              </div>
              <h2 style={{...transition,color:C.textPrimary,fontSize:"1.2rem",fontWeight:800}}>{t('score_over_time_title')}</h2>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
              {subjectStats.map((sub) => {
                const isActive = String(selectedChartSubject) === String(sub.id);
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedChartSubject(sub.id)}
                    style={{...transition,display:"flex",alignItems:"center",gap:"6px",padding:"6px 14px",borderRadius:"999px",fontSize:"0.75rem",fontWeight:700,border:`1px solid ${isActive?C.borderAccent:C.border}`,background:isActive?C.accentDim:"transparent",color:isActive?C.accent:C.textMuted,cursor:"pointer"}}
                    onMouseEnter={e=>{if(!isActive) e.currentTarget.style.borderColor=C.borderAccent}}
                    onMouseLeave={e=>{if(!isActive) e.currentTarget.style.borderColor=C.border}}
                  >
                    {sub.emoji} {sub.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{...transition,...glass(),padding:"24px"}}>
            {lineData.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title={'لا توجد بيانات منحنى بعد'}
                description={'عند إكمال اختبارات أكثر، سنعرض هنا تطور درجاتك بمرور الوقت بشكل واضح.'}
              />
            ) : (
              <div dir="ltr">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={lineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.accent} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={C.gridLine} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: C.tickColor }} />
                    <YAxis
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: C.tickColor }}
                      tickFormatter={v => `${v}%`}
                      width={38}
                    />
                    <Tooltip content={<CustomTooltip C={C} glass={glass} />} cursor={{ stroke: C.borderAccent, strokeWidth: 1, strokeDasharray: '3 3' }} />
                    <Area
                      type="monotone"
                      dataKey="percentage"
                      stroke={C.accent}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorScore)"
                      activeDot={{ r: 6, fill: C.accent, stroke: C.bgPanel, strokeWidth: 2 }}
                      connectNulls
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        {/* ════════ SECTION 3 — Subtopic Mastery (Horizontal Bar Chart) ════════ */}
        <section>
          <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"20px"}}>
            <div style={iw(C.iconBgA,C.iconBorderA,"36px","10px")}>
              <BarChart2 style={{color:C.iconA,width:"18px",height:"18px"}} strokeWidth={2} />
            </div>
            <h2 style={{...transition,color:C.textPrimary,fontSize:"1.2rem",fontWeight:800}}>{t('subtopic_analysis_title')}</h2>
          </div>

          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"20px"}}>
            {subjectStats.map((sub) => {
              const isActive = String(activeTab) === String(sub.id);
              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveTab(sub.id)}
                  style={{...transition,display:"flex",alignItems:"center",gap:"6px",padding:"8px 16px",borderRadius:"12px",fontSize:"0.82rem",fontWeight:700,border:`1px solid ${isActive?"transparent":C.border}`,background:isActive?C.accent:"transparent",color:isActive?"#FFF":C.textMuted,cursor:"pointer"}}
                  onMouseEnter={e=>{if(!isActive) e.currentTarget.style.borderColor=C.borderAccent}}
                  onMouseLeave={e=>{if(!isActive) e.currentTarget.style.borderColor=C.border}}
                >
                  {sub.emoji} {sub.name}
                </button>
              );
            })}
          </div>

          <div style={{...transition,...glass(),padding:"24px"}}>
            <p style={{...transition,color:C.textDim,fontSize:"0.75rem",fontWeight:700,marginBottom:"16px"}}>
              {activeTabMeta?.emoji} {activeTabMeta?.name} — المواضيع التي تحتاج مراجعة
            </p>

            {barData.length === 0 ? (
              <EmptyState
                icon={BarChart2}
                title={'رائع، لا توجد نقاط ضعف حاليًا'}
                description={'أداءك ممتاز في هذه المادة. استمر بنفس الوتيرة للحفاظ على هذا المستوى.'}
              />
            ) : (
              <>
                <div dir="ltr">
                  <ResponsiveContainer width="100%" height={barData.length * 54}>
                    <BarChart
                      layout="vertical"
                      data={barData}
                      margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={false} stroke={C.gridLine} />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: C.tickColor }}
                        tickFormatter={v => `${v}%`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        width={155}
                        tick={{ fontSize: 11, fill: C.textMuted }}
                      />
                      <Tooltip content={<BarTooltip C={C} glass={glass} />} cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} />
                      <Bar dataKey="accuracy" radius={[0, 6, 6, 0]} barSize={24}>
                        {barData.map((entry, i) => (
                          <Cell key={i} fill={barColor(entry.accuracy)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{display:"flex",flexWrap:"wrap",gap:"20px",marginTop:"20px",paddingTop:"16px",borderTop:`1px solid ${C.border}`,fontSize:"0.75rem",fontWeight:700,justifyContent:"center"}}>
                  <span style={{display:"flex",alignItems:"center",gap:"6px",color:C.redIcon}}>
                    <span style={{width:"12px",height:"12px",borderRadius:"3px",background:"#dc2626",display:"inline-block"}} />
                    {t('accuracy_below60')}
                  </span>
                  <span style={{display:"flex",alignItems:"center",gap:"6px",color:C.yellow}}>
                    <span style={{width:"12px",height:"12px",borderRadius:"3px",background:"#d97706",display:"inline-block"}} />
                    {t('accuracy_60_80')}
                  </span>
                  <span style={{display:"flex",alignItems:"center",gap:"6px",color:C.green}}>
                    <span style={{width:"12px",height:"12px",borderRadius:"3px",background:"#16a34a",display:"inline-block"}} />
                    {t('accuracy_above80')}
                  </span>
                </div>
              </>
            )}
          </div>
        </section>

        <section>
          <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"20px"}}>
            <div style={iw(C.iconBgB,C.iconBorderB,"36px","10px")}>
              <Calendar style={{color:C.iconB,width:"18px",height:"18px"}} strokeWidth={2} />
            </div>
            <h2 style={{...transition,color:C.textPrimary,fontSize:"1.2rem",fontWeight:800}}>{t('activity_title')}</h2>
          </div>

          <div style={{...transition,...glass(),padding:"24px"}}>
            {activityDays.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title={'لا يوجد نشاط مسجل بعد'}
                description={'ابدأ بحل الاختبارات وسيظهر هنا تقويم نشاطك اليومي وتقدّمك بشكل مرئي.'}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
                <div style={{ display: 'flex', gap: '15px', direction: 'rtl', alignItems: 'flex-start' }}>
                  <div style={{ display: 'grid', gridTemplateRows: 'repeat(4, 36px)', gap: '8px', paddingTop: '28px', color: C.textDim, fontSize: '12px', textAlign: 'left', lineHeight: '36px' }}>
                    {[activityDays[0], activityDays[7], activityDays[14], activityDays[21]].map((day, i) => (
                      day && <div key={i} style={{ whiteSpace: 'nowrap' }}>{day.weekLabel}</div>
                    ))}
                  </div>

                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 36px)', gap: '8px', textAlign: 'center', color: C.textDim, fontSize: '11px', marginBottom: '10px', height: '18px' }}>
                      {activityDays.slice(0, 7).map((d, i) => <div key={i}>{d.dayName}</div>)}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 36px)', gridAutoRows: '36px', gap: '8px' }}>
                      {activityDays.map((d) => {
                        const colorIndex = Math.min(d.count, 4);
                        const bgColor = activityColors[colorIndex];
                        return (
                          <div
                            key={d.dateStr}
                            title={`التاريخ: ${d.dateStr} | الاختبارات: ${d.count}`}
                            style={{ backgroundColor: bgColor, width: '36px', height: '36px', borderRadius: '6px', cursor: 'pointer', transition: 'transform 0.1s', border: `1px solid ${C.border}` }}
                            onMouseEnter={(e) => { e.target.style.transform = 'scale(1.1)'; }}
                            onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '20px', fontSize: '12px', color: C.textDim, direction: 'rtl' }}>
                  <span>أقل نشاط</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {activityColors.map((color, i) => (
                      <div key={i} title={`مستوى ${i}`} style={{ width: '16px', height: '16px', backgroundColor: color, borderRadius: '4px', border: `1px solid ${C.border}` }} />
                    ))}
                  </div>
                  <span>أعلى نشاط</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Recent Quiz History Table */}
        <section style={{paddingBottom:"48px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"20px"}}>
            <div style={iw(C.iconBgA,C.iconBorderA,"36px","10px")}>
              <Activity style={{color:C.iconA,width:"18px",height:"18px"}} strokeWidth={2} />
            </div>
            <h2 style={{...transition,color:C.textPrimary,fontSize:"1.2rem",fontWeight:800}}>{t('recent_quiz_history')}</h2>
          </div>

          <div style={{...transition,...glass(),overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",minWidth:"700px",borderCollapse:"collapse"}}>
                <thead style={{background:C.accentDim,borderBottom:`1px solid ${C.border}`}}>
                  <tr>
                    {[t('date_label'), t('subject_label'), t('lessons_tab'), t('avg_score'), t('weak_subtopic'), t('view_report')].map(h => (
                      <th
                        key={h}
                        style={{padding:"14px 20px",textAlign:"right",fontSize:"0.75rem",fontWeight:700,color:C.textMuted,whiteSpace:"nowrap"}}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{...transition}}>
                  {quizResults.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{padding:"16px"}}>
                        <EmptyState
                          icon={Activity}
                          title={'لا يوجد سجل اختبارات بعد'}
                          description={'عند إنهاء أول اختبار، ستظهر هنا كل المحاولات الحديثة مع التفاصيل والتقارير.'}
                        />
                      </td>
                    </tr>
                  ) : quizResults.map((att, i) => {
                    const percentage = att.percentage ?? 0;
                    const scoreLabel = `${percentage}% (${att.score ?? 0} من ${att.totalMarks ?? 0})`;
                    const badge = getMasteryBadge(percentage, C);
                    return (
                      <tr key={i} style={{borderBottom:`1px solid ${C.border}`,transition:"background 0.2s ease"}} onMouseEnter={e=>{e.currentTarget.style.background=C.bgCard}} onMouseLeave={e=>{e.currentTarget.style.background="transparent"}}>
                        <td style={{padding:"14px 20px",fontSize:"0.85rem",color:C.textMuted,whiteSpace:"nowrap"}}>
                          {att.date}
                        </td>
                        <td style={{padding:"14px 20px",fontSize:"0.85rem",fontWeight:700,color:C.textPrimary,whiteSpace:"nowrap"}}>
                          {att.subjectName ?? '-'}
                        </td>
                        <td style={{padding:"14px 20px",fontSize:"0.85rem",color:C.textDim,maxWidth:"160px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                          {att.lessonTitle}
                        </td>
                        <td style={{padding:"14px 20px",whiteSpace:"nowrap"}}>
                          <span style={{display:"inline-flex",alignItems:"center",gap:"4px",fontSize:"0.7rem",fontWeight:700,padding:"4px 10px",borderRadius:"999px",background:badge.bg,color:badge.color,border:`1px solid ${badge.border}`}}>
                            {scoreLabel}
                          </span>
                        </td>
                        <td style={{padding:"14px 20px"}}>
                          <div style={{display:"flex",flexWrap:"wrap",gap:"6px",maxWidth:"220px"}}>
                            {att.score < 0.5
                              ? (
                                  <span style={{fontSize:"0.7rem",background:C.redDim,color:C.redIcon,border:`1px solid ${C.redBorder}`,padding:"4px 10px",borderRadius:"999px",fontWeight:700}}>
                                    {att.lessonTitle}
                                  </span>
                                )
                              : <span style={{fontSize:"0.75rem",color:C.green,fontWeight:700}}>—</span>
                            }
                          </div>
                        </td>
                        <td style={{padding:"14px 20px"}}>
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
                                  reportData: att,
                                },
                              });
                            }}
                            style={{...transition,display:"flex",alignItems:"center",gap:"6px",fontSize:"0.75rem",fontWeight:700,color:C.accent,background:C.accentDim,border:`1px solid ${C.borderAccent}`,padding:"6px 12px",borderRadius:"8px",cursor:"pointer",whiteSpace:"nowrap"}}
                            onMouseEnter={e=>{e.currentTarget.style.opacity="0.88"}}
                            onMouseLeave={e=>{e.currentTarget.style.opacity="1"}}
                          >
                            <Eye style={{width:"14px",height:"14px"}} />
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
