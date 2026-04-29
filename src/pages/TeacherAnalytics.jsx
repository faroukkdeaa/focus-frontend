import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Brain, ArrowRight, Video, ClipboardList, TrendingUp, Clock,
  ChevronDown, AlertTriangle, BarChart2, Eye, RefreshCcw, Play, FileText, Edit3,
} from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

/* ════════════════════════════════════════════════════
   DESIGN SYSTEM — Extracted from LandingPage.jsx
════════════════════════════════════════════════════ */
function buildTheme(dk){return dk?{bg:"#0B1120",bgPanel:"#0D1526",bgCard:"rgba(255,255,255,0.035)",border:"rgba(255,255,255,0.08)",borderAccent:"rgba(79,70,229,0.38)",accent:"#4F46E5",accentDim:"rgba(79,70,229,0.14)",iconA:"#38BDF8",iconBgA:"rgba(56,189,248,0.10)",iconBorderA:"rgba(56,189,248,0.22)",iconB:"#818CF8",iconBgB:"rgba(129,140,248,0.11)",iconBorderB:"rgba(129,140,248,0.25)",textPrimary:"#F8FAFC",textMuted:"#94A3B8",textDim:"#475569",shadowCard:"0 1px 1px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.35)",trackBg:"rgba(255,255,255,0.06)",green:"#34D399",greenDim:"rgba(52,211,153,0.12)",greenBorder:"rgba(52,211,153,0.22)",red:"#F87171",redDim:"rgba(248,113,113,0.10)",redBorder:"rgba(248,113,113,0.20)",yellow:"#FBBF24",yellowDim:"rgba(251,191,36,0.12)",yellowBorder:"rgba(251,191,36,0.22)",headerBg:"rgba(11,17,32,0.88)"}:{bg:"#F8FAFC",bgPanel:"#FFFFFF",bgCard:"#FFFFFF",border:"#E2E8F0",borderAccent:"rgba(15,76,129,0.28)",accent:"#0F4C81",accentDim:"rgba(15,76,129,0.08)",iconA:"#0F4C81",iconBgA:"rgba(15,76,129,0.08)",iconBorderA:"rgba(15,76,129,0.18)",iconB:"#2563EB",iconBgB:"rgba(37,99,235,0.07)",iconBorderB:"rgba(37,99,235,0.16)",textPrimary:"#0F172A",textMuted:"#64748B",textDim:"#94A3B8",shadowCard:"0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)",trackBg:"#E2E8F0",green:"#059669",greenDim:"rgba(5,150,105,0.08)",greenBorder:"rgba(5,150,105,0.18)",red:"#EF4444",redDim:"rgba(239,68,68,0.08)",redBorder:"rgba(239,68,68,0.18)",yellow:"#D97706",yellowDim:"rgba(217,119,6,0.08)",yellowBorder:"rgba(217,119,6,0.18)",headerBg:"rgba(248,250,252,0.90)"};}
const _c=(T,x)=>({background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:"16px",boxShadow:T.shadowCard,...x});
const _t={transition:"all 0.25s ease"};
const _iw=(bg,bd,sz="40px",r="10px")=>({..._t,width:sz,height:sz,borderRadius:r,background:bg,border:`1px solid ${bd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0});
const _input = (T) => ({..._t, width: "100%", background: T.bg, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "14px 16px", color: T.textPrimary, outline: "none", fontSize: "0.95rem"});

// ── Static lookup maps ────────────────────────────
const getSubjectStyle = (subject, T) => {
  const map = {
    Physics:     { bg: T.iconBgA,   text: T.iconA },
    Chemistry:   { bg: T.greenDim,  text: T.green },
    Mathematics: { bg: T.iconBgB,   text: T.iconB },
    Biology:     { bg: T.yellowDim, text: T.yellow },
  };
  return map[subject] || { bg: T.bgCard, text: T.textMuted };
};

const SUBJECT_NAME_KEYS = {
  Physics: 'subject_physics', Chemistry: 'subject_chemistry',
  Mathematics: 'subject_math', Biology: 'subject_biology',
};

const getSubjectLabel = (t, subject) => {
  const key = SUBJECT_NAME_KEYS[subject];
  return key ? t(key) : subject;
};

const SCORE_BUCKETS = ['0–20%', '21–40%', '41–60%', '61–80%', '81–100%'];

// ── Helpers ───────────────────────────────────────────────────────────────────

const getDistBarColor = (idx, T) =>
  [T.red, T.yellow, T.iconA, T.green, T.iconB][idx] || T.textMuted;

// ── Sub-components ────────────────────────────────────────────────────────────

const SectionLoader = ({ rows = 3, T }) => (
  <div style={{display:"flex",flexDirection:"column",gap:"12px",padding:"16px 0"}}>
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonLoader key={i} type="card" height="52px" className="w-full" />
    ))}
  </div>
);

const TeacherAnalyticsLoadingSkeleton = ({ T, lang, glass }) => (
  <div style={{..._t,background:T.bg,minHeight:"100vh",fontFamily:"'Cairo',sans-serif"}} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
    <main style={{maxWidth:"1152px",margin:"0 auto",padding:"32px 24px",display:"flex",flexDirection:"column",gap:"28px"}}>
      <section>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",gap:"16px"}}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} style={glass({ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' })}>
              <SkeletonLoader type="card" width="44px" height="44px" />
              <div style={{display:"flex",flexDirection:"column",gap:"8px",flex:1}}>
                <SkeletonLoader type="text" width="62%" height="10px" />
                <SkeletonLoader type="text" width="40%" height="16px" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(340px, 1fr))",gap:"18px"}}>
          <div style={glass({ padding: '20px' })}>
            <SkeletonLoader type="text" width="42%" height="12px" className="mb-4" />
            <SkeletonLoader type="card" height="320px" className="w-full" />
          </div>
          <div style={glass({ padding: '20px' })}>
            <SkeletonLoader type="text" width="36%" height="12px" className="mb-4" />
            <SkeletonLoader type="card" height="320px" className="w-full" />
          </div>
        </div>
      </section>
    </main>
  </div>
);

const SectionError = ({ message, onRetry, T, retryLabel }) => (
  <div style={{padding:"40px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:"12px",textAlign:"center"}}>
    <AlertTriangle style={{width:"32px",height:"32px",color:T.yellow}} />
    <p style={{fontSize:"0.9rem",color:T.textDim,fontWeight:600}}>{message}</p>
    <button
      onClick={onRetry}
      style={{..._t,display:"flex",alignItems:"center",gap:"6px",fontSize:"0.9rem",fontWeight:700,color:T.accent,background:"transparent",border:"none",cursor:"pointer"}}
    >
      <RefreshCcw style={{width:"16px",height:"16px"}} />
      {retryLabel}
    </button>
  </div>
);

// ── Custom Tooltips ───────────────────────────────────────────────────────────

const ViewsTooltip = ({ active, payload, label, T, viewsLabel }) => {
  if (!active || !payload?.length || !T) return null;
  return (
    <div style={{..._c(T),padding:"12px",fontSize:"0.875rem"}} dir="rtl">
      <p style={{fontSize:"0.75rem",color:T.textMuted,marginBottom:"4px",fontWeight:700}}>{label}</p>
      <p style={{fontWeight:800,color:T.accent}}>{payload[0].value} {viewsLabel}</p>
    </div>
  );
};

const DistTooltip = ({ active, payload, label, T, studentsLabel }) => {
  if (!active || !payload?.length || !T) return null;
  return (
    <div style={{..._c(T),padding:"12px",fontSize:"0.875rem"}} dir="rtl">
      <p style={{fontSize:"0.75rem",color:T.textMuted,marginBottom:"4px",fontWeight:700}}>{label}</p>
      <p style={{fontWeight:800,color:T.textPrimary}}>{payload[0].value} {studentsLabel}</p>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const TeacherAnalytics = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { t } = useTranslation();
  const { theme, C, glass } = useTheme();
  const toast = useToast();
  const isDark = theme === 'dark';
  const T = buildTheme(isDark);

  // ── Data state ────────────────────────────────────────────────────────────
  const [videos, setVideos] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [studentAttempts, setStudentAttempts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Live KPI stats from /api/teachers/dashboard (replaces stale localStorage reads)
  const [dashboardStats, setDashboardStats] = useState(null);


  // ── Selected lesson (for drill-down charts) ───────────────────────────────
  const [selectedId, setSelectedId] = useState(null);

  const openVideoDetails = useCallback((videoId) => {
    if (videoId) {
      navigate(`/video-details/${videoId}`);
      return;
    }
    toast.error(t('teacher_analytics_error_video_id_unavailable'));
  }, [navigate, t, toast]);

  const openQuizDetails = useCallback((quizId) => {
    if (quizId) {
      navigate(`/quizzes-details/${quizId}`);
      return;
    }
    toast.error(t('teacher_analytics_error_quiz_id_unavailable'));
  }, [navigate, t, toast]);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/teachers/dashboard');
      const payload = res.data ?? {};
      const studentAttempts = Array.isArray(payload.student_attempts) ? payload.student_attempts : [];
      const quizAttemptsCount = Array.isArray(payload.quiz_attempts_count) ? payload.quiz_attempts_count : [];

      setDashboardStats({
        videos_count: Number(payload.videos_count ?? 0),
        quizzes_count: Number(payload.quizzes_count ?? 0),
        average_score: payload.average_score ?? null,
      });

      setStudentAttempts(studentAttempts);

      const formattedVideos = studentAttempts.map((attempt, idx) => {
        const lessonTitle = attempt.lesson_title || attempt.video_title || 'درس بدون عنوان';
        const videoId = attempt.video_id ?? null;
        const lessonId = attempt.lesson_id ?? null;
        return {
          id: videoId ?? lessonId ?? `attempt-${idx + 1}`,
          videoId,
          selectionKey: `video:attempt-${idx + 1}`,
          contentType: 'video',
          lessonId,
          lessonTitle,
          videoTitle: attempt.video_title || lessonTitle,
          lesson: lessonTitle,
          subject: payload.teacher?.subject_name || 'Physics',
          views: null,
          quizAttempts: null,
          avgScore: null,
          score: attempt.score ?? 0,
          totalMarks: attempt.total_marks ?? 0,
          topWeakSubtopic: null,
          scoreDistribution: [],
          missedQuestions: [],
        };
      });

      const formattedQuizzes = quizAttemptsCount.map((quiz, idx) => {
        const quizId = quiz.quiz_id ?? null;
        const lessonId = quiz.lesson_id ?? null;
        return {
          id: quizId ?? lessonId ?? `quiz-${idx + 1}`,
          quizId,
          selectionKey: `quiz:attempt-${idx + 1}`,
          contentType: 'quiz',
          title: quiz.title || 'اختبار',
          lessonId,
          lesson: quiz.title || 'اختبار',
          subject: payload.teacher?.subject_name || 'Physics',
          views: null,
          quizAttempts: Number(quiz.quizzes_attempt_count ?? 0) || 0,
          avgScore: null,
          topWeakSubtopic: null,
          scoreDistribution: [],
          missedQuestions: [],
        };
      });

      setVideos(formattedVideos);
      setQuizzes(formattedQuizzes);

      const mergedContent = [...formattedVideos, ...formattedQuizzes];
      setSelectedId((prev) => {
        if (prev != null && mergedContent.some((item) => String(item.selectionKey) === String(prev))) {
          return prev;
        }
        return mergedContent[0]?.selectionKey ?? null;
      });
    } catch (err) {
      console.error('Failed to fetch teacher analytics', err);
      setError(t('teacher_analytics_error_loading_data'));
      setVideos([]);
      setQuizzes([]);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Fetch live KPI stats from the teacher dashboard endpoint
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
    dashboardStats?.average_score != null
      ? (typeof dashboardStats.average_score === 'string'
        ? dashboardStats.average_score
        : `${dashboardStats.average_score}%`)
      : '0%';

  if (!dashboardStats) {
    return <TeacherAnalyticsLoadingSkeleton T={T} lang={lang} glass={glass} />;
  }

  return (
    <div style={{..._t,background:T.bg,minHeight:"100vh",fontFamily:"'Cairo',sans-serif"}} dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* ═══ HEADER ═══ */}
      <header style={{position:"sticky",top:0,zIndex:20,background:T.headerBg,backdropFilter:"blur(12px)",borderBottom:`1px solid ${T.border}`}}>
        <div style={{maxWidth:"1152px",margin:"0 auto",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <div style={_iw(T.iconBgB,T.iconBorderB,"40px","10px")}>
              <Brain style={{width:"20px",height:"20px",color:T.iconB}} />
            </div>
            <div>
              <h1 style={{fontSize:"1.125rem",fontWeight:800,color:T.textPrimary}}>{t('content_analytics')}</h1>
              <p style={{fontSize:"0.75rem",color:T.textMuted}}>{t('analytics_subtitle')}</p>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <button
              onClick={() => navigate('/teacher-dashboard')}
              style={{..._t,background:"transparent",border:"none",display:"flex",alignItems:"center",gap:"6px",fontSize:"0.875rem",fontWeight:600,color:T.textMuted,cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.color=T.textPrimary}
              onMouseLeave={e=>e.currentTarget.style.color=T.textMuted}
            >
              <ArrowRight style={{width:"16px",height:"16px",transform:lang==='en'?'rotate(180deg)':'none'}} />
              {t('teacher_control')}
            </button>
          </div>
        </div>
      </header>

      <main style={{maxWidth:"1152px",margin:"0 auto",padding:"32px 24px",display:"flex",flexDirection:"column",gap:"40px"}}>

        {/* ═══ SECTION 1 — KPI Cards ═══ */}
        <section>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))",gap:"16px"}}>
            {[
              { labelKey: 'total_videos', value: totalVideosCount, icon: Video, iconBg: T.iconBgB, iconBorder: T.iconBorderB, iconCls: T.iconB },
              { labelKey: 'total_quizzes', label: 'إجمالي الاختبارات', value: totalQuizzesCount, icon: ClipboardList, iconBg: T.iconBgA, iconBorder: T.iconBorderA, iconCls: T.iconA },
              { labelKey: 'avg_score', value: averageScoreDisplay, icon: TrendingUp, iconBg: T.greenDim, iconBorder: T.greenBorder, iconCls: T.green },
              { labelKey: 'watch_hours', value: dashboardStats?.watch_hours || 0, icon: Clock, iconBg: T.yellowDim, iconBorder: T.yellowBorder, iconCls: T.yellow },
            ].map(({ labelKey, label, value, icon: Icon, iconBg, iconBorder, iconCls }) => (
              <div key={labelKey} style={{..._c(T),padding:"20px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
                  <p style={{fontSize:"0.8rem",color:T.textMuted,fontWeight:600,lineHeight:1.4}}>{label || t(labelKey)}</p>
                  <div style={_iw(iconBg,iconBorder,"36px","10px")}>
                    <Icon style={{width:"18px",height:"18px",color:iconCls}} />
                  </div>
                </div>
                {isLoading ? (
                  <SkeletonLoader type="text" width="80px" height="30px" />
                ) : (
                  <p style={{fontSize:"1.875rem",fontWeight:800,color:T.textPrimary,lineHeight:1}}>
                    {value ?? '—'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ═══ SECTION 2 — Content Performance Table ═══ */}
        <section>
          <h2 style={{fontSize:"1.25rem",fontWeight:800,color:T.textPrimary,marginBottom:"20px",display:"flex",alignItems:"center",gap:"8px"}}>
            <BarChart2 style={{width:"20px",height:"20px",color:T.accent}} />
            {t('content_performance')}
          </h2>

          <div style={{..._c(T),overflow:"hidden"}}>
            {isLoading ? (
              <div style={{padding:"24px"}}><SectionLoader rows={5} T={T} /></div>
            ) : error ? (
              <div style={{padding:"24px"}}><SectionError message={error} onRetry={fetchAnalytics} T={T} retryLabel={t('retry')} /></div>
            ) : (
              <div style={{padding:"24px",display:"flex",flexDirection:"column",gap:"28px"}}>
                <div>
                  <h3 style={{fontSize:"1rem",fontWeight:800,color:T.textPrimary,marginBottom:"16px"}}>فيديوهات المادة</h3>
                  {videos.length > 0 ? (
                    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                      {videos.map(v => {
                        const subj = getSubjectStyle(v.subject, T);
                        const isSelected = String(selectedId) === String(v.selectionKey);
                        const viewsCount = studentAttempts.filter((a) => String(a.video_id ?? a.videoId) === String(v.videoId)).length || 0;
                        let barColor = T.textDim;
                        if (v.avgScore !== null) {
                          if (v.avgScore < 50) barColor = T.red;
                          else if (v.avgScore < 75) barColor = T.yellow;
                          else barColor = T.green;
                        }

                        return (
                          <div
                            key={v.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => openVideoDetails(v.videoId ?? v.lessonId)}
                            onKeyDown={(e) => {
                              if (e.target !== e.currentTarget) return;
                              if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                                e.preventDefault();
                                openVideoDetails(v.id);
                              }
                            }}
                            style={{..._t,display:"flex",flexDirection:"column",gap:"16px",padding:"16px",borderRadius:"12px",border:`1px solid ${isSelected?T.borderAccent:T.border}`,background:isSelected?T.accentDim:T.bgPanel,cursor:"pointer"}}
                            onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.borderColor=T.textMuted}}
                            onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.borderColor=T.border}}
                          >
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"16px"}}>
                              
                              {/* Left Side */}
                              <div style={{flex:1,minWidth:0,display:"flex",alignItems:"center",gap:"16px"}}>
                                <div style={_iw(subj.bg,subj.text,"48px","12px")}>
                                  <Play style={{width:"24px",height:"24px",color:subj.text}} />
                                </div>
                                <div>
                                  <h4 style={{fontWeight:800,color:T.textPrimary,fontSize:"1rem",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.lesson}</h4>
                                  <div style={{display:"flex",alignItems:"center",gap:"12px",marginTop:"4px",fontSize:"0.75rem"}}>
                                    <span style={{fontWeight:700,padding:"2px 8px",borderRadius:"12px",background:subj.bg,color:subj.text}}>
                                      {getSubjectLabel(t, v.subject) || '—'}
                                    </span>
                                    <span style={{color:T.textDim,fontWeight:600}}>
                                      <Eye style={{width:"14px",height:"14px",display:"inline",marginRight:"4px",color:T.textMuted}} /> {viewsCount} مشاهدة
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Right Side */}
                              <div style={{display:"flex",alignItems:"center",gap:"24px",width:"100%",maxWidth:"350px",flexWrap:"wrap",minWidth:0}}>
                                <div style={{flex:1}}>
                                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.75rem",fontWeight:800,marginBottom:"6px"}}>
                                    <span style={{color:T.textMuted}}>متوسط الدرجات</span>
                                    <span style={{color:T.textPrimary}}>
                                      {v.totalMarks ? `${v.score ?? 0} من ${v.totalMarks}` : '—'}
                                    </span>
                                  </div>
                                  <div style={{width:"100%",background:T.bg,borderRadius:"4px",height:"8px",overflow:"hidden"}}>
                                    <div
                                      style={{height:"100%",borderRadius:"4px",background:barColor,transition:"width 1s ease",width:`${v.avgScore||0}%`}}
                                    />
                                  </div>
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedId(v.selectionKey);
                                  }}
                                  style={{..._t,flexShrink:0,display:"flex",alignItems:"center",gap:"6px",fontSize:"0.75rem",fontWeight:700,padding:"8px 16px",borderRadius:"8px",background:isSelected?T.accent:T.bg,color:isSelected?"#FFF":T.textPrimary,border:`1px solid ${isSelected?T.accent:T.border}`}}
                                  onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.background=T.bgCard}}
                                  onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.background=T.bg}}
                                >
                                  <BarChart2 style={{width:"16px",height:"16px"}} />
                                  {isSelected ? t('selected_label') : t('details_label')}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={glass({ padding: '8px' })}>
                      <EmptyState
                        icon={Video}
                        title={t('teacher_analytics_no_videos_title')}
                        description={t('teacher_analytics_no_videos_description')}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <h3 style={{fontSize:"1rem",fontWeight:800,color:T.textPrimary,marginBottom:"16px"}}>اختبارات المادة</h3>
                  {quizzes.length > 0 ? (
                    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                      {quizzes.map(q => {
                        const subj = getSubjectStyle(q.subject, T);
                        const isSelected = String(selectedId) === String(q.selectionKey);
                        const rawQuizTitle = typeof q.title === 'string' ? q.title.trim() : '';
                        const resolvedQuizTitle = rawQuizTitle || 'اختبار';
                        const attemptsForQuiz = studentAttempts.filter((a) => String(a.lesson_id ?? a.lessonId) === String(q.lessonId));
                        const validAttempts = attemptsForQuiz.filter((a) => Number(a.total_marks ?? 0) > 0);
                        const avgScore = validAttempts.length
                          ? Math.round(validAttempts.reduce((sum, a) => sum + (Number(a.score ?? 0) / Number(a.total_marks)) * 100, 0) / validAttempts.length)
                          : 0;
                        let barColor = T.textDim;
                        if (avgScore !== null) {
                          if (avgScore < 50) barColor = T.red;
                          else if (avgScore < 75) barColor = T.yellow;
                          else barColor = T.green;
                        }

                        return (
                          <div
                            key={q.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => openQuizDetails(q.quizId ?? q.lessonId)}
                            onKeyDown={(e) => {
                              if (e.target !== e.currentTarget) return;
                              if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                                e.preventDefault();
                                openQuizDetails(q.id);
                              }
                            }}
                            style={{..._t,display:"flex",flexDirection:"column",gap:"16px",padding:"16px",borderRadius:"12px",border:`1px solid ${isSelected?T.borderAccent:T.border}`,background:isSelected?T.accentDim:T.bgPanel,cursor:"pointer"}}
                            onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.borderColor=T.textMuted}}
                            onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.borderColor=T.border}}
                          >
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"16px"}}>
                              
                              <div style={{flex:1,minWidth:0,display:"flex",alignItems:"center",gap:"16px"}}>
                                <div style={_iw(subj.bg,subj.text,"48px","12px")}>
                                  <FileText style={{width:"24px",height:"24px",color:subj.text}} />
                                </div>
                                <div>
                                  <h4 style={{fontWeight:800,color:T.textPrimary,fontSize:"1rem",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{resolvedQuizTitle}</h4>
                                  <div style={{display:"flex",alignItems:"center",gap:"12px",marginTop:"4px",fontSize:"0.75rem"}}>
                                    <span style={{fontWeight:700,padding:"2px 8px",borderRadius:"12px",background:subj.bg,color:subj.text}}>
                                      {getSubjectLabel(t, q.subject) || '—'}
                                    </span>
                                    <span style={{color:T.textDim,fontWeight:600}}>
                                      <ClipboardList style={{width:"14px",height:"14px",display:"inline",marginRight:"4px",color:T.textMuted}} /> {q.quizAttempts !== null ? q.quizAttempts.toLocaleString() : '—'} محاولة
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div style={{display:"flex",alignItems:"center",gap:"24px",width:"100%",maxWidth:"400px",flexWrap:"wrap",minWidth:0}}>
                                <div style={{flex:1}}>
                                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.75rem",fontWeight:800,marginBottom:"6px"}}>
                                    <span style={{color:T.textMuted}}>متوسط الدرجات</span>
                                    <span style={{color:avgScore < 50 ? T.red : T.textPrimary}}>
                                      {`${avgScore}%`}
                                    </span>
                                  </div>
                                  <div style={{width:"100%",background:T.bg,borderRadius:"4px",height:"8px",overflow:"hidden"}}>
                                    <div
                                      style={{height:"100%",borderRadius:"4px",background:barColor,transition:"width 1s ease",width:`${avgScore}%`}}
                                    />
                                  </div>
                                </div>

                                <div style={{flexShrink:0,display:"flex",alignItems:"center",gap:"8px"}}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/edit-quiz/${q.id}`);
                                    }}
                                    style={{..._t,flexShrink:0,display:"flex",alignItems:"center",gap:"6px",fontSize:"0.75rem",fontWeight:700,padding:"8px 16px",borderRadius:"8px",border:`1px solid ${T.iconBorderB}`,background:T.iconBgB,color:T.iconB}}
                                  >
                                    <Edit3 style={{width:"16px",height:"16px"}} />
                                    تعديل
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedId(q.selectionKey);
                                    }}
                                    style={{..._t,flexShrink:0,display:"flex",alignItems:"center",gap:"6px",fontSize:"0.75rem",fontWeight:700,padding:"8px 16px",borderRadius:"8px",background:isSelected?T.accent:T.bg,color:isSelected?"#FFF":T.textPrimary,border:`1px solid ${isSelected?T.accent:T.border}`}}
                                    onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.background=T.bgCard}}
                                    onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.background=T.bg}}
                                  >
                                    <BarChart2 style={{width:"16px",height:"16px"}} />
                                    {isSelected ? t('selected_label') : t('details_label')}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={glass({ padding: '8px' })}>
                      <EmptyState
                        icon={ClipboardList}
                        title={t('teacher_analytics_no_quizzes_title')}
                        description={t('teacher_analytics_no_quizzes_description')}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ═══ SECTIONS 3 & 4 side-by-side ═══ */}
        <section>
          {/* Lesson selector */}
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"20px"}}>
            <h2 style={{fontSize:"1.25rem",fontWeight:800,color:T.textPrimary,display:"flex",alignItems:"center",gap:"8px",flex:1}}>
              <BarChart2 style={{width:"20px",height:"20px",color:T.accent}} />
              {t('selected_lesson_analysis')}
            </h2>
            {!isLoading && content.length > 0 && (
              <div style={{position:"relative"}}>
                <select
                  value={selectedId ?? ''}
                  onChange={e => setSelectedId(e.target.value)}
                  style={{..._input(T),paddingRight:"32px",paddingLeft:"16px",paddingTop:"8px",paddingBottom:"8px",fontWeight:700,cursor:"pointer",appearance:"none"}}
                  onFocus={e=>{e.target.style.borderColor=T.accent}}
                  onBlur={e=>{e.target.style.borderColor=T.border}}
                >
                  {content.map(c => (
                    <option key={c.selectionKey} value={c.selectionKey} style={{color:T.textPrimary,background:T.bgPanel}}>{c.lesson}</option>
                  ))}
                </select>
                <ChevronDown style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",width:"16px",height:"16px",color:T.textMuted,pointerEvents:"none"}} />
              </div>
            )}
          </div>

          {isLoading ? (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))",gap:"24px"}}>
              {[0, 1].map(i => (
                <div key={i} style={{..._c(T),padding:"24px"}}>
                  <div style={{height:"20px",width:"160px",background:T.bg,borderRadius:"4px",marginBottom:"16px"}} className="animate-pulse" />
                  <div style={{height:"240px",background:T.bg,borderRadius:"12px"}} className="animate-pulse" />
                </div>
              ))}
            </div>
          ) : error ? (
            <SectionError message={error} onRetry={fetchAnalytics} T={T} retryLabel={t('retry')} />
          ) : selected ? (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))",gap:"24px"}}>

              {/* SECTION 3 — Score Distribution */}
              <div style={{..._c(T),padding:"24px"}}>
                <h3 style={{fontWeight:800,color:T.textPrimary,fontSize:"1rem",marginBottom:"4px"}}>{t('score_distribution')}</h3>
                <p style={{fontSize:"0.75rem",color:T.textMuted,marginBottom:"20px"}}>
                  {selected.quizAttempts !== null ? selected.quizAttempts : '—'} — {selected.lesson}
                </p>
                {distData.length > 0 ? (
                  <>
                    <div dir="ltr">
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={distData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.border} />
                          <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: T.textMuted }} />
                          <YAxis tick={{ fontSize: 10, fill: T.textMuted }} />
                          <Tooltip content={(props) => <DistTooltip {...props} T={T} studentsLabel={t('teacher_analytics_students_unit')} />} cursor={{ fill: T.trackBg }} />
                          <Bar dataKey="طلاب" radius={[6, 6, 0, 0]} maxBarSize={52}>
                            {distData.map((_, i) => (
                              <Cell key={i} fill={getDistBarColor(i, T)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"12px",marginTop:"12px",fontSize:"11px",fontWeight:800,justifyContent:"center"}}>
                      {SCORE_BUCKETS.map((b, i) => (
                        <span key={b} style={{display:"flex",alignItems:"center",gap:"4px",color:T.textDim}}>
                          <span style={{width:"10px",height:"10px",borderRadius:"2px",display:"inline-block",background:getDistBarColor(i, T)}} />
                          {b}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon={BarChart2}
                    title={t('teacher_analytics_no_distribution_title')}
                    description={t('teacher_analytics_no_distribution_description')}
                  />
                )}
              </div>

              {/* SECTION 4 — Most Missed Questions */}
              <div style={{..._c(T),padding:"24px"}}>
                <h3 style={{fontWeight:800,color:T.textPrimary,fontSize:"1rem",marginBottom:"4px"}}>{t('missed_questions')}</h3>
                <p style={{fontSize:"0.75rem",color:T.textMuted,marginBottom:"20px"}}>{selected.lesson}</p>
                {selected.missedQuestions && selected.missedQuestions.length > 0 ? (
                  <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
                    {selected.missedQuestions.map((q, i) => (
                      <div key={i} style={{padding:"16px",borderRadius:"12px",border:`1px solid ${T.redBorder}`,background:T.redDim}}>
                        <div style={{display:"flex",alignItems:"flex-start",gap:"12px"}}>
                          <span style={{flexShrink:0,width:"24px",height:"24px",borderRadius:"50%",background:T.red,color:"#FFF",fontSize:"0.75rem",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",marginTop:"2px"}}>
                            {i + 1}
                          </span>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontSize:"0.875rem",fontWeight:800,color:T.textPrimary,lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                              {q.text}
                            </p>
                            <div style={{marginTop:"8px",display:"flex",flexWrap:"wrap",gap:"12px",fontSize:"0.75rem"}}>
                              <span style={{color:T.red,fontWeight:800,display:"flex",alignItems:"center",gap:"4px"}}>
                                <AlertTriangle style={{width:"12px",height:"12px"}} />
                                {t('teacher_analytics_error_rate')}: {q.wrongRate}%
                              </span>
                              <span style={{color:T.textMuted}}>
                                {t('teacher_analytics_top_wrong_answer')}:{' '}
                                <span style={{fontWeight:800,color:T.yellow}}>{q.topWrongOption}</span>
                              </span>
                            </div>
                            <div style={{marginTop:"8px",width:"100%",background:T.bgCard,borderRadius:"4px",height:"6px",overflow:"hidden"}}>
                              <div
                                style={{height:"100%",borderRadius:"4px",background:T.red,transition:"all 0.5s ease",width:`${q.wrongRate}%`}}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={ClipboardList}
                    title={t('teacher_analytics_no_missed_title')}
                    description={t('teacher_analytics_no_missed_description')}
                  />
                )}
              </div>
            </div>
          ) : null}
        </section>

        {/* ═══ SECTION 5 — Views Over Time ═══ */}
        <section style={{paddingBottom:"48px"}}>
          <h2 style={{fontSize:"1.25rem",fontWeight:800,color:T.textPrimary,marginBottom:"20px",display:"flex",alignItems:"center",gap:"8px"}}>
            <TrendingUp style={{width:"20px",height:"20px",color:T.accent}} />
            {t('views_over_time')}
          </h2>

          <div style={{..._c(T),padding:"24px"}}>
            {isLoading ? (
              <div style={{display:"flex",flexDirection:"column",gap:"12px",padding:"8px 0"}}>
                <SkeletonLoader type="text" width="180px" height="12px" />
                <SkeletonLoader type="card" height="240px" className="w-full" />
              </div>
            ) : error ? (
              <SectionError message={error} onRetry={fetchAnalytics} T={T} retryLabel={t('retry')} />
            ) : (
              safeViewsData.length > 0 ? (
                <>
                  <div dir="ltr">
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={safeViewsData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                        <XAxis
                          dataKey="day"
                          tick={{ fontSize: 10, fill: T.textMuted }}
                          interval={4}
                        />
                        <YAxis tick={{ fontSize: 10, fill: T.textMuted }} width={32} />
                        <Tooltip content={(props) => <ViewsTooltip {...props} T={T} viewsLabel="مشاهدة" />} />
                        <Line
                          type="monotone"
                          dataKey="مشاهدات"
                          stroke={T.accent}
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 5, fill: T.accent }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:"16px",marginTop:"20px",paddingTop:"20px",borderTop:`1px solid ${T.border}`}}>
                    {[
                      { label: t('teacher_analytics_total_views'), value: totalViews.toLocaleString() },
                      { label: t('teacher_analytics_peak_day'), value: `${peakViews} مشاهدة` },
                      { label: t('teacher_analytics_daily_average'), value: `${avgDailyView} مشاهدة` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{textAlign:"center"}}>
                        <p style={{fontSize:"0.75rem",color:T.textMuted,marginBottom:"4px"}}>{label}</p>
                        <p style={{fontWeight:800,color:T.textPrimary,fontSize:"1rem"}}>{value}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={TrendingUp}
                  title={t('teacher_analytics_no_views_title')}
                  description={t('teacher_analytics_no_views_description')}
                />
              )
            )}
          </div>
        </section>

      </main>
    </div>
  );
};

export default TeacherAnalytics;
