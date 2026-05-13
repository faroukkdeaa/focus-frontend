import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/api';
import { ArrowRight, Play, Pause, Volume2, Settings, ChevronLeft, ChevronRight, CheckCircle2, User, Loader2, Zap } from "lucide-react";
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

function buildTheme(dark) {
  return dark ? {
    bg:"#0B1120", bgPanel:"#0D1526", bgCard:"rgba(255,255,255,0.035)", border:"rgba(255,255,255,0.08)",
    borderAccent:"rgba(79,70,229,0.38)", accent:"#4F46E5", accentDim:"rgba(79,70,229,0.14)",
    iconA:"#38BDF8", iconBgA:"rgba(56,189,248,0.10)", iconBorderA:"rgba(56,189,248,0.22)",
    iconB:"#818CF8", iconBgB:"rgba(129,140,248,0.11)", iconBorderB:"rgba(129,140,248,0.25)",
    textPrimary:"#F8FAFC", textMuted:"#94A3B8", textDim:"#475569",
    shadowCard:"0 1px 1px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.35)",
    green:"#34D399", greenDim:"rgba(52,211,153,0.12)", greenBorder:"rgba(52,211,153,0.22)",
    purple:"#A78BFA", purpleDim:"rgba(167,139,250,0.12)", purpleBorder:"rgba(167,139,250,0.22)",
    redDim:"rgba(248,113,113,0.10)", redBorder:"rgba(248,113,113,0.20)", redIcon:"#F87171",
    trackBg:"rgba(255,255,255,0.06)",
  } : {
    bg:"#F8FAFC", bgPanel:"#FFFFFF", bgCard:"#FFFFFF", border:"#E2E8F0",
    borderAccent:"rgba(15,76,129,0.28)", accent:"#0F4C81", accentDim:"rgba(15,76,129,0.08)",
    iconA:"#0F4C81", iconBgA:"rgba(15,76,129,0.08)", iconBorderA:"rgba(15,76,129,0.18)",
    iconB:"#2563EB", iconBgB:"rgba(37,99,235,0.07)", iconBorderB:"rgba(37,99,235,0.16)",
    textPrimary:"#0F172A", textMuted:"#64748B", textDim:"#94A3B8",
    shadowCard:"0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)",
    green:"#059669", greenDim:"rgba(5,150,105,0.08)", greenBorder:"rgba(5,150,105,0.18)",
    purple:"#7C3AED", purpleDim:"rgba(124,58,237,0.08)", purpleBorder:"rgba(124,58,237,0.18)",
    redDim:"rgba(239,68,68,0.08)", redBorder:"rgba(239,68,68,0.18)", redIcon:"#EF4444",
    trackBg:"#E2E8F0",
  };
}
const card=(T,x)=>({background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:"16px",boxShadow:T.shadowCard,...x});
const tr={transition:"background 0.25s ease, border-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease"};
const iw=(bg,bd,sz="48px",r="8px")=>({...tr,width:sz,height:sz,borderRadius:r,background:bg,border:`1px solid ${bd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0});

// يحلل رابط الفيديو ويحدد نوعه (youtube / vimeo / direct / generic)
const parseVideoUrl = (url) => {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0` };
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return { type: 'direct' };
  // ✅ Fallback: attempt to render any URL as generic iframe
  return { type: 'generic', embedUrl: url };
};

const LessonInterface = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const T = buildTheme(isDark);

  // ── Auth guard: إذا المستخدم مش مسجّل → وجّهه لتسجيل الدخول مع رابط العودة ──
  const isLoggedIn = !!localStorage.getItem('token');
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname), { replace: true });
    }
  }, [isLoggedIn, navigate]);
  
  // 1. حالات التحكم (State)
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTeacher, setActiveTeacher] = useState(null); // ✅ Start with null, set from API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [_completingLesson, setCompletingLesson] = useState(false);
  const [lessonCompleteToast, setLessonCompleteToast] = useState(false);

  // بيانات من الـ API (single source: /teachers/{teacher}/lessons/{lesson}/content)
  const [teachers, setTeachers] = useState([]);
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set()); // per-user
  const [currentVideo, setCurrentVideo] = useState(null);
  const [lessonQuizzes, setLessonQuizzes] = useState([]);
  const [teacherImageError, setTeacherImageError] = useState(false);

  // جلب lessonId و subjectId و subjectName و teacherId من location.state
  // مع fallback من query params لضمان الاستمرارية بعد refresh
  const queryParams = new URLSearchParams(location.search);
  const queryLessonId = queryParams.get('lessonId');
  const queryTeacherId = queryParams.get('teacherId');
  const querySubjectId = queryParams.get('subjectId');

  // ✅ Clean lesson ID - remove any ":1" suffix from hasManyThrough
  const rawLessonId = location.state?.lesson?.id ?? location.state?.lessonId ?? queryLessonId ?? null;
  const lessonId = rawLessonId != null
    ? (typeof rawLessonId === 'string' && rawLessonId.includes(':')
        ? parseInt(rawLessonId.split(':')[0], 10)
        : parseInt(rawLessonId, 10))
    : null;
  const subjectId        = location.state?.subjectId   ?? querySubjectId ?? 1;
  const stateSubjectName = location.state?.subjectName ?? ''; // للـ mock fallback
  const stateTeacherName = location.state?.teacherName ?? '';
  const autoScrollToQuiz = location.state?.autoScrollToQuiz ?? false;
  const preSelectedTeacherId = location.state?.teacherId ?? queryTeacherId;
  const stateLesson = location.state?.lesson || null;
  const rawTeacherId =
    preSelectedTeacherId ??
    stateLesson?.teacher_id ??
    stateLesson?.teacherId ??
    location.state?.teacher?.id ??
    null;
  const teacherIdForRequest =
    rawTeacherId != null && rawTeacherId !== ''
      ? parseInt(String(rawTeacherId).split(':')[0], 10)
      : null;

  const ensureAbsoluteUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;

    const laravelBaseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://127.0.0.1:8000';
    if (url.startsWith('/storage/')) return `${laravelBaseUrl}${url}`;
    if (url.startsWith('storage/')) return `${laravelBaseUrl}/${url}`;
    if (url.startsWith('/')) return `${laravelBaseUrl}${url}`;
    return `${laravelBaseUrl}/storage/${url}`;
  };

  const formatSecondsToMMSS = (val) => {
    if (val == null || val === '--') return val ?? '--';
    const secs = Number(val);
    if (!Number.isFinite(secs) || secs <= 0) return '00:00';
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ✅ Single source of truth fetch
  // Guard: prevents the view-increment side-effect on the backend from firing
  // twice under React 18 StrictMode double-mount or rapid re-renders.
  const hasTrackedView = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const loadLessonContent = async () => {
      if (!lessonId || !teacherIdForRequest) {
        console.error('[LessonInterface] Missing lesson/teacher IDs for course-details route.', {
          lessonId,
          teacherIdForRequest,
        });
        setError('تعذر تحديد الدرس أو المدرس.');
        setLoading(false);
        return;
      }

      // ── Deduplication guard ──────────────────────────────────────────
      // Set the flag BEFORE the await so a concurrent second call (StrictMode
      // unmount/remount) hits `true` and returns without firing the request again.
      if (hasTrackedView.current) return;
      hasTrackedView.current = true;
      // ────────────────────────────────────────────────────────────────────

      try {
        setLoading(true);
        setError(null);
        setCurrentVideo(null);
        setLessonQuizzes([]);

        // Keep local completion progress (local only, no API calls)
        const completionData = JSON.parse(localStorage.getItem('lessonCompletions') || '{}');
        const doneSet = new Set(
          Object.keys(completionData)
            .filter((k) => completionData[k]?.subjectId === String(subjectId) && completionData[k]?.completed)
            .map((k) => Number(k))
        );
        if (!cancelled) setCompletedIds(doneSet);

        const res = await api.get(`/teachers/${teacherIdForRequest}/lessons/${lessonId}/content`);
        // Bind directly to the documented payload shape: { teacher, videos: { lesson_title, video_url, quizzes_count, quizzes: [] } }
        const payload = res.data ?? {};
        const teacherPayload = payload.teacher ?? {};
        // videos is a direct object — NOT an array or paginated response (.data sub-key no longer exists)
        const videosObj = payload.videos ?? {};
        const videoRaw = Object.keys(videosObj).length > 0 ? { ...videosObj } : null;
        if (videoRaw?.video_url) videoRaw.video_url = ensureAbsoluteUrl(videoRaw.video_url);

        // hasQuiz is driven by quizzes_count from the payload
        const hasQuiz = (videosObj.quizzes_count ?? 0) > 0;
        // quizData is the first element of the quizzes array on the videos object
        const rawQuizzes = Array.isArray(videosObj.quizzes) ? videosObj.quizzes : [];
        const mappedQuizzes = hasQuiz
          ? rawQuizzes.map((quiz, idx) => {
              const q = typeof quiz === 'object' ? quiz : { quiz_id: quiz };
              const qId = q?.quiz_id ?? q?.id ?? idx + 1;
              const totalMarks = q?.total_marks ?? null;
              const rawScore = q?.score ?? null;
              const derivedPercentage =
                totalMarks && rawScore != null
                  ? Math.round((Number(rawScore) / Number(totalMarks)) * 100)
                  : null;
              return {
                id: qId,
                quiz_id: qId,
                teacher_id: teacherPayload?.teacher_id ?? teacherIdForRequest,
                // attempted flag comes from the quizzes array item per the new payload spec
                has_attempted: Boolean(q?.attempted ?? q?.has_attempted),
                score: rawScore,
                total_marks: totalMarks,
                percentage: q?.percentage ?? derivedPercentage,
              };
            })
          : [];

        const mappedTeacher = {
          id: teacherPayload?.teacher_id ?? teacherIdForRequest,
          name: teacherPayload?.teacher_name || stateTeacherName || `مدرس ${teacherIdForRequest}`,
          rating: teacherPayload?.rating ?? null,
          subject: teacherPayload?.subject_name || stateSubjectName || '',
          teacher_profile_picture: teacherPayload?.teacher_profile_picture ?? teacherPayload?.profile_picture ?? null,
        };

        const mappedLesson = {
          id: lessonId,
          // lesson_title lives on the videos object in the new payload
          title: videoRaw?.lesson_title || stateLesson?.title || `الدرس ${lessonId}`,
          // prefer backend-provided duration (seconds), fallback to stateLesson
          duration: videoRaw?.duration ?? stateLesson?.duration ?? '--',
          chapter: stateLesson?.chapter ?? '',
          description: stateLesson?.description ?? '',
          completed: doneSet.has(lessonId),
        };

        if (cancelled) return;

        setTeachers([mappedTeacher]);
        setActiveTeacher(mappedTeacher.id);
        setCourse({
          subjectName: mappedTeacher.subject || stateSubjectName || 'غير محدد',
          lessons: [mappedLesson],
        });
        setLessons([mappedLesson]);
        setCurrentLesson(mappedLesson);
        setCurrentVideo(videoRaw);
        setLessonQuizzes(mappedQuizzes);
      } catch (err) {
        console.error('[LessonInterface] Failed to load consolidated content:', err);
        if (!cancelled) {
          setError('تعذر تحميل بيانات الدرس.');
          setTeachers([]);
          setLessons([]);
          setCurrentLesson(null);
          setCourse(null);
          setCurrentVideo(null);
          setLessonQuizzes([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadLessonContent();
    return () => { cancelled = true; };
  }, [lessonId, teacherIdForRequest, subjectId, stateSubjectName, stateTeacherName, stateLesson?.title, stateLesson?.duration, stateLesson?.chapter, stateLesson?.description]);

  // تأثير التمرير التلقائي لقسم الاختبارات
  useEffect(() => {
    if (autoScrollToQuiz && !loading && lessonQuizzes.length > 0) {
      setTimeout(() => {
        const el = document.getElementById('quizzes-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [autoScrollToQuiz, loading, lessonQuizzes.length]);

  const completedCount = completedIds.size;
  const totalCount = lessons.length;
  const progressPercent = totalCount ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;

  const mainQuiz = lessonQuizzes?.[0] ?? null;
  const quizData = mainQuiz ? {
    ...mainQuiz,
    has_attempted: Boolean(mainQuiz?.has_attempted),
    score: mainQuiz?.score ?? null,
    percentage: mainQuiz?.percentage ?? null
  } : null;
  const scoreText = quizData?.total_marks
    ? `${quizData?.score} / ${quizData?.total_marks} (${quizData?.percentage ?? 0}%)`
    : `${quizData?.score ?? '-'}`;
  const buttonLabel = `تم الاختبار - درجتك: ${scoreText}`;

  const routeLessonId = currentLesson?.id ?? lessonId;
  const activeTeacherInfo = teachers.find((t) => String(t.id) === String(activeTeacher));
  const activeTeacherPictureUrl = activeTeacherInfo?.teacher_profile_picture
    ? (() => {
        const picturePath = activeTeacherInfo.teacher_profile_picture;
        if (picturePath.startsWith('http://') || picturePath.startsWith('https://')) return picturePath;
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace('/api', '');
        if (picturePath.startsWith('/storage/')) return `${baseUrl}${picturePath}`;
        if (picturePath.startsWith('storage/')) return `${baseUrl}/${picturePath}`;
        if (picturePath.startsWith('/')) return `${baseUrl}${picturePath}`;
        return `${baseUrl}/storage/${picturePath}`;
      })()
    : null;

  useEffect(() => {
    setTeacherImageError(false);
  }, [activeTeacherInfo?.id, activeTeacherInfo?.teacher_profile_picture]);

  // التنقل بين الدروس
  const currentIndex    = lessons.findIndex(l => l.id === currentLesson?.id);
  const parsedVideoUrl  = currentVideo ? parseVideoUrl(currentVideo.url || currentVideo.video_url) : null;

  const handlePreviousLesson = () => {
    if (currentIndex > 0) {
      setCurrentLesson(lessons[currentIndex - 1]);
    }
  };
  const handleNextLesson = () => {
    if (currentIndex < lessons.length - 1) {
      setCurrentLesson(lessons[currentIndex + 1]);
    }
  };

  const _handleCompleteLesson = async () => {
    if (!currentLesson || completedIds.has(currentLesson.id)) return;
    setCompletingLesson(true);
    try {
      // حفظ إتمام الدرس في localStorage
      const completionData = JSON.parse(localStorage.getItem('lessonCompletions') || '{}');
      completionData[currentLesson.id] = {
        subjectId: String(subjectId),
        completed: true,
        completedAt: new Date().toISOString().split('T')[0],
      };
      localStorage.setItem('lessonCompletions', JSON.stringify(completionData));

      // حدّث completedIds محلياً
      const newDone = new Set([...completedIds, currentLesson.id]);
      setCompletedIds(newDone);
      setLessons(prev => prev.map(l => l.id === currentLesson.id ? { ...l, completed: true } : l));
      setCurrentLesson(prev => ({ ...prev, completed: true }));

      setLessonCompleteToast(true);
      setTimeout(() => setLessonCompleteToast(false), 3000);
    } catch (err) {
      console.error('Complete lesson error:', err);
    } finally {
      setCompletingLesson(false);
    }
  };

  if (loading) {
    return (
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{...tr,background:T.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Cairo',sans-serif"}}>
        <Loader2 style={{color:T.accent,width:"48px",height:"48px",marginBottom:"16px"}} className="animate-spin" />
        <p style={{...tr,color:T.textPrimary,fontSize:"1.1rem",fontWeight:700}}>{t('loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{...tr,background:T.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Cairo',sans-serif"}}>
        <div style={{...tr,...card(T),border:`1px solid ${T.redBorder}`,padding:"40px",textAlign:"center",maxWidth:"420px",width:"100%"}}>
          <p style={{...tr,color:T.redIcon,fontSize:"0.9rem",marginBottom:"16px"}}>{error}</p>
          <button onClick={() => navigate('/dashboard')} style={{...tr,background:"transparent",border:"none",color:T.textDim,fontSize:"0.85rem",cursor:"pointer",textDecoration:"underline"}}>
            {t('back_to_dashboard')}
          </button>
        </div>
      </div>
    );
  }

  if (!currentLesson || !course) {
    return (
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{...tr,background:T.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Cairo',sans-serif"}}>
        <div style={{...tr,...card(T),padding:"48px",textAlign:"center",maxWidth:"420px",width:"100%"}}>
          <p style={{fontSize:"2.5rem",marginBottom:"16px"}}>📭</p>
          <h2 style={{...tr,color:T.textPrimary,fontSize:"1.2rem",fontWeight:700,marginBottom:"8px"}}>لا توجد دروس متاحة</h2>
          <p style={{...tr,color:T.textMuted,fontSize:"0.85rem",marginBottom:"24px"}}>
            {teachers.length === 0 ? 'لا يوجد مدرسون مرتبطون بهذه المادة بعد.' : 'المدرس لم يرفع دروساً بعد. جرّب اختيار مدرس آخر.'}
          </p>
          <button onClick={() => navigate('/dashboard')} style={{...tr,padding:"12px 28px",borderRadius:"12px",fontSize:"0.9rem",fontWeight:700,background:T.accent,color:"#FFF",border:"none",cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.opacity="0.88"}} onMouseLeave={e=>{e.currentTarget.style.opacity="1"}}>
            {t('back_to_dashboard')}
          </button>
        </div>
      </div>
    );
  }

  console.log("Current Lesson Attempt Data:", quizData);

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{...tr,background:T.bg,minHeight:"100vh",fontFamily:"'Cairo',sans-serif"}}>

      {/* Toast */}
      {lessonCompleteToast && (
        <div style={{position:"fixed",top:"20px",left:"50%",transform:"translateX(-50%)",zIndex:50,background:T.green,color:"#FFF",fontWeight:700,padding:"12px 24px",borderRadius:"14px",boxShadow:T.shadowCard,display:"flex",alignItems:"center",gap:"8px"}} className="animate-bounce">
          <CheckCircle2 style={{width:"18px",height:"18px"}} />
          تمّ تسجيل إتمام الدرس بنجاح! ✅
        </div>
      )}

      {/* Header */}
      <header style={{...tr,position:"sticky",top:0,zIndex:20,background:isDark?"rgba(11,17,32,0.88)":"rgba(248,250,252,0.90)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:`1px solid ${T.border}`}}>
        <div style={{maxWidth:"1280px",margin:"0 auto",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={() => navigate('/dashboard')} style={{...tr,display:"flex",alignItems:"center",gap:"8px",background:"transparent",border:"none",color:T.textMuted,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}} onMouseEnter={e=>{e.currentTarget.style.color=T.accent}} onMouseLeave={e=>{e.currentTarget.style.color=T.textMuted}}>
            <ArrowRight style={{width:"18px",height:"18px",...(lang==='en'?{transform:"rotate(180deg)"}:{})}} />
            {t('back_to_dashboard')}
          </button>
          <div style={{textAlign:"center",display:"none"}} className="md:!block">
            <h1 style={{...tr,color:T.accent,fontSize:"1rem",fontWeight:700}}>{course.subjectName} - {currentLesson.title}</h1>
            <p style={{...tr,color:T.textDim,fontSize:"0.78rem"}}>{currentLesson.chapter}</p>
          </div>
          <div style={{width:"128px"}} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* 2. منطقة الفيديو (تاخد مساحة عمودين) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Theater Mode — generous outer padding draws focus to the player */}
            <div style={{...tr,...card(T),overflow:"hidden",padding:"0"}}>

              {/* Teacher bar — upgraded to 24px padding for breathing room */}
              <div style={{...tr,padding:"20px 24px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:"16px"}}>
                {activeTeacherInfo ? (
                  <>
                    {activeTeacherPictureUrl && !teacherImageError ? (
                      <img
                        src={activeTeacherPictureUrl}
                        alt={activeTeacherInfo?.name || 'مدرس'}
                        onError={() => setTeacherImageError(true)}
                        style={{width:"48px",height:"48px",borderRadius:"8px",objectFit:"cover",flexShrink:0}}
                      />
                    ) : (
                      <div style={iw(T.iconBgA,T.iconBorderA,"48px","8px")}>
                        <User style={{color:T.iconA,width:"22px",height:"22px"}} strokeWidth={2} />
                      </div>
                    )}
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{...tr,color:T.textDim,fontSize:"0.75rem",fontWeight:500,marginBottom:"2px"}}>المدرس</p>
                      <h3 style={{...tr,color:T.textPrimary,fontWeight:700,fontSize:"1.05rem",lineHeight:1.3}}>{activeTeacherInfo?.name}</h3>
                      {activeTeacherInfo?.rating != null && (
                        <span style={{...tr,color:T.textMuted,fontSize:"0.78rem"}}>⭐ {activeTeacherInfo?.rating}</span>
                      )}
                    </div>
                    {/* Lesson title badge — helps users confirm context without scrolling */}
                    {currentLesson && (
                      <div style={{...tr,background:T.accentDim,border:`1px solid ${T.borderAccent}`,borderRadius:"8px",padding:"6px 12px",flexShrink:0}}>
                        <p style={{...tr,color:T.accent,fontSize:"0.75rem",fontWeight:700,maxWidth:"180px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={currentLesson.title}>
                          {currentLesson.title}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"8px 0"}}>
                    <Loader2 style={{color:T.accent,width:"18px",height:"18px"}} className="animate-spin" />
                    <p style={{...tr,color:T.textMuted,fontSize:"0.85rem"}}>جاري تحميل بيانات المدرس...</p>
                  </div>
                )}
              </div>

              {/* Video Player */}
              <div style={{position:"relative",background:"#000",aspectRatio:"16/9",overflow:"hidden"}} className="group">

                {/* جاري تحميل بيانات الفيديو */}
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  </div>

                ) : parsedVideoUrl?.type === 'youtube' ? (
                  /* ─── YouTube ─── */
                  <iframe
                    key={currentVideo.video_id}
                    src={parsedVideoUrl.embedUrl}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    title={currentVideo.video_title || currentLesson.title}
                  />

                ) : parsedVideoUrl?.type === 'vimeo' ? (
                  /* ─── Vimeo ─── */
                  <iframe
                    key={currentVideo.video_id}
                    src={parsedVideoUrl.embedUrl}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title={currentVideo.video_title || currentLesson.title}
                  />

                ) : parsedVideoUrl?.type === 'direct' ? (
                  /* ─── MP4 / Direct ─── */
                  <video
                    key={currentVideo.video_id}
                    src={currentVideo.url || currentVideo.video_url}
                    poster={ensureAbsoluteUrl(currentVideo?.thumbnail || currentVideo?.thumbnail_url || currentVideo?.poster || currentVideo?.thumb)}
                    className="absolute inset-0 w-full h-full"
                    controls
                  />

                ) : parsedVideoUrl?.type === 'generic' ? (
                  /* ─── Generic URL Fallback ─── */
                  <iframe
                    key={currentVideo.video_id}
                    src={parsedVideoUrl.embedUrl}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                    title={currentVideo.video_title || currentLesson.title}
                  />

                ) : (
                  /* ─── Placeholder (لا يوجد رابط صالح بعد) ─── */
                  <>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="bg-white/20 backdrop-blur-sm rounded-full p-6 hover:scale-110 transition hover:bg-white/30"
                      >
                        {isPlaying ? <Pause className="w-12 h-12 text-white" /> : <Play className="w-12 h-12 text-white ml-1" />}
                      </button>
                      <p className="text-white font-bold text-lg mt-2">
                        {currentVideo?.video_title || currentLesson.title}
                      </p>
                      <p className="text-white/60 text-sm">
                        {activeTeacherInfo?.name || 'غير محدد'}
                      </p>
                      {(currentVideo?.url || currentVideo?.video_url) && (
                        <a
                          href={currentVideo.url || currentVideo.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition"
                        >
                          <Play className="w-3 h-3" /> فتح الفيديو خارجياً
                        </a>
                      )}
                      {!currentVideo && (
                        <p className="text-white/40 text-xs mt-1">لم يُرفع فيديو لهذا الدرس بعد</p>
                      )}
                    </div>
                    {/* شريط التحكم */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-4 text-white">
                        <button onClick={() => setIsPlaying(!isPlaying)}>
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                        <div className="flex-1 h-1.5 bg-gray-600 rounded-full">
                          <div className="h-full w-0 bg-[#103B66] rounded-full" />
                        </div>
                        <span className="text-xs font-mono">00:00 / {formatSecondsToMMSS(currentLesson.duration)}</span>
                        <button><Volume2 className="w-5 h-5" /></button>
                        <button><Settings className="w-5 h-5" /></button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Action Bar (Rhythmic 8pt spacing, two logical zones) ── */}
            <div style={{...tr,...card(T),padding:"16px 24px"}}>

              {/* Zone 1: Primary navigation */}
              <div style={{display:"flex",alignItems:"center",gap:"16px",flexWrap:"wrap"}}>

                {/* Prev button */}
                <button
                  onClick={handlePreviousLesson}
                  disabled={currentIndex===0}
                  style={{...tr,height:"40px",padding:"0 16px",borderRadius:"8px",border:`1px solid ${T.border}`,background:"transparent",color:currentIndex===0?T.textDim:T.textMuted,cursor:currentIndex===0?"not-allowed":"pointer",opacity:currentIndex===0?0.45:1,display:"flex",alignItems:"center",gap:"6px",fontSize:"0.875rem",fontWeight:700,flexShrink:0}}
                  onMouseEnter={e=>{if(currentIndex!==0)e.currentTarget.style.borderColor=T.borderAccent;}}
                  onMouseLeave={e=>{if(currentIndex!==0)e.currentTarget.style.borderColor=T.border;}}
                >
                  <ChevronRight style={{width:"16px",height:"16px",...(lang==='en'?{transform:"rotate(180deg)"}:{})}} />
                  {t('prev_lesson')}
                </button>

                {/* Quiz CTA (primary action — centered, prominent) */}
                <div style={{flex:1,display:"flex",justifyContent:"center"}}>
                  {quizData?.has_attempted ? (
                    <div role="status" style={{...tr,height:"40px",padding:"0 20px",background:T.greenDim,border:`1px solid ${T.greenBorder}`,color:T.green,fontSize:"0.875rem",fontWeight:700,borderRadius:"8px",display:"flex",alignItems:"center",gap:"8px"}}>
                      <Zap style={{width:"16px",height:"16px"}} />
                      {buttonLabel}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { if (lessonQuizzes.length===0||!quizData) return; if (!isLoggedIn) { navigate('/login?redirect='+encodeURIComponent(window.location.pathname),{replace:true}); return; } const qId=quizData.quiz_id??quizData.id; navigate(`/quiz/${routeLessonId}/${activeTeacher}/${qId}`); }}
                      disabled={lessonQuizzes.length===0}
                      style={{...tr,height:"40px",padding:"0 20px",borderRadius:"8px",fontSize:"0.875rem",fontWeight:700,border:"none",display:"flex",alignItems:"center",gap:"8px",color:"#FFF",cursor:lessonQuizzes.length>0?"pointer":"not-allowed",opacity:lessonQuizzes.length>0?1:0.45,background:lessonQuizzes.length>0?T.purple:T.textDim}}
                      onMouseEnter={e=>{if(lessonQuizzes.length>0)e.currentTarget.style.filter="brightness(1.12)";}}
                      onMouseLeave={e=>{e.currentTarget.style.filter="none";}}
                    >
                      <Zap style={{width:"16px",height:"16px",color:lessonQuizzes.length>0?"#FDE68A":T.textMuted}} />
                      {lessonQuizzes.length > 0 ? 'بدء الاختبار' : 'لا يوجد اختبار'}
                    </button>
                  )}
                </div>

                {/* Next button */}
                <button
                  onClick={handleNextLesson}
                  disabled={currentIndex===lessons.length-1}
                  style={{...tr,height:"40px",padding:"0 16px",borderRadius:"8px",border:`1px solid ${T.border}`,background:"transparent",color:currentIndex===lessons.length-1?T.textDim:T.textMuted,cursor:currentIndex===lessons.length-1?"not-allowed":"pointer",opacity:currentIndex===lessons.length-1?0.45:1,display:"flex",alignItems:"center",gap:"6px",fontSize:"0.875rem",fontWeight:700,flexShrink:0}}
                  onMouseEnter={e=>{if(currentIndex!==lessons.length-1)e.currentTarget.style.borderColor=T.borderAccent;}}
                  onMouseLeave={e=>{if(currentIndex!==lessons.length-1)e.currentTarget.style.borderColor=T.border;}}
                >
                  {t('next_lesson')}
                  <ChevronLeft style={{width:"16px",height:"16px",...(lang==='en'?{transform:"rotate(180deg)"}:{})}} />
                </button>
              </div>

              {/* Zone 2: Extra quiz cards (only when multiple quizzes exist) */}
              {lessonQuizzes.length > 1 && (
                <div id="quizzes-section" style={{marginTop:"16px",paddingTop:"16px",borderTop:`1px solid ${T.border}`,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"12px"}}>
                  {lessonQuizzes.map((quiz, qIdx) =>
                    quiz.has_attempted ? (
                      <div key={quiz.quiz_id || quiz.id || qIdx} role="status" style={{...tr,background:T.greenDim,border:`1px solid ${T.greenBorder}`,color:T.green,fontSize:"0.8rem",fontWeight:700,height:"40px",padding:"0 16px",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>
                        <Zap style={{width:"14px",height:"14px"}} />
                        {quiz.percentage != null ? `اختبار ${qIdx+1} — ${quiz.percentage}%` : `اختبار ${qIdx+1} — تم`}
                      </div>
                    ) : (
                      <button type="button" key={quiz.quiz_id || quiz.id || qIdx} onClick={() => { if (!isLoggedIn) { navigate('/login?redirect='+encodeURIComponent(window.location.pathname),{replace:true}); return; } const qId=quiz.quiz_id||quiz.id; navigate(`/quiz/${routeLessonId}/${activeTeacher}/${qId}`); }} style={{...tr,background:T.purple,color:"#FFF",fontSize:"0.8rem",fontWeight:700,height:"40px",padding:"0 16px",borderRadius:"8px",border:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.opacity="0.88";}} onMouseLeave={e=>{e.currentTarget.style.opacity="1";}}>
                        <Zap style={{width:"14px",height:"14px",color:"#FDE68A"}} />
                        بدء اختبار {qIdx + 1}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* وصف الدرس */}
            <div style={{...tr,...card(T),padding:"28px"}}>
              <h3 style={{...tr,color:T.textPrimary,fontSize:"1.1rem",fontWeight:700,marginBottom:"16px",paddingBottom:"12px",borderBottom:`1px solid ${T.border}`}}>وصف الدرس</h3>
              <p style={{...tr,color:T.textMuted,fontSize:"0.9rem",lineHeight:1.8,marginBottom:"24px"}}>
                {currentLesson.description || 'لا يوجد وصف متاح لهذا الدرس.'}
              </p>
              
              {currentLesson.chapter && (
                <div style={{...tr,background:T.accentDim,borderRight:`3px solid ${T.accent}`,padding:"16px",borderRadius:"10px",marginBottom:"24px"}}>
                  <h4 style={{...tr,color:T.accent,fontWeight:700,fontSize:"0.85rem",marginBottom:"6px"}}>الفصل:</h4>
                  <p style={{...tr,color:T.textPrimary,fontSize:"1rem"}}>{currentLesson.chapter}</p>
                </div>
              )}

              <div>
                <h4 style={{...tr,color:T.textPrimary,fontWeight:700,fontSize:"0.9rem",marginBottom:"12px"}}>معلومات الدرس:</h4>
                <ul style={{listStyle:"none",padding:0,margin:0,display:"flex",flexDirection:"column",gap:"10px"}}>
                  <li style={{display:"flex",alignItems:"center",gap:"8px"}}>
                    <div style={iw(T.greenDim,T.greenBorder,"28px","8px")}><CheckCircle2 style={{color:T.green,width:"14px",height:"14px"}} /></div>
                          <span style={{...tr,color:T.textMuted,fontSize:"0.85rem"}}>المدة: {formatSecondsToMMSS(currentLesson.duration)}</span>
                  </li>
                  <li style={{display:"flex",alignItems:"center",gap:"8px"}}>
                    <div style={iw(T.greenDim,T.greenBorder,"28px","8px")}><CheckCircle2 style={{color:T.green,width:"14px",height:"14px"}} /></div>
                    <span style={{...tr,color:T.textMuted,fontSize:"0.85rem"}}>الحالة: {currentLesson.completed ? 'مكتمل' : 'قيد التنفيذ'}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 3. القائمة الجانبية (محتوى الكورس) */}
          <div className="lg:col-span-1">
            <div style={{...tr,...card(T),position:"sticky",top:"96px",overflow:"hidden"}}>
              <div style={{...tr,padding:"16px 20px",borderBottom:`1px solid ${T.border}`}}>
                <h3 style={{...tr,color:T.textPrimary,fontWeight:700,fontSize:"0.95rem"}}>محتويات الكورس</h3>
                <p style={{...tr,color:T.textDim,fontSize:"0.75rem",marginTop:"4px"}}>{totalCount} {t('lessons_tab')} • {course.subjectName}</p>
              </div>
              
              <div style={{padding:"16px",maxHeight:"500px",overflowY:"auto",display:"flex",flexDirection:"column",gap:"10px"}}>
                {lessons.map((lesson) => {
                  const isCurrent = lesson.id === currentLesson.id;
                  return (
                    <div key={lesson.id} onClick={() => setCurrentLesson(lesson)} style={{...tr,padding:"12px",borderRadius:"12px",cursor:"pointer",display:"flex",alignItems:"flex-start",gap:"12px",background:isCurrent?T.accentDim:lesson.completed?T.greenDim:"transparent",border:`1px solid ${isCurrent?T.borderAccent:lesson.completed?T.greenBorder:T.border}`}} onMouseEnter={e=>{if(!isCurrent&&!lesson.completed) e.currentTarget.style.borderColor=T.borderAccent}} onMouseLeave={e=>{if(!isCurrent&&!lesson.completed) e.currentTarget.style.borderColor=T.border}}>
                      <div style={iw(lesson.completed?T.greenDim:isCurrent?T.accentDim:T.bgCard, lesson.completed?T.greenBorder:isCurrent?T.borderAccent:T.border, "32px","10px")}>
                        {lesson.completed ? <CheckCircle2 style={{color:T.green,width:"16px",height:"16px"}} /> : <span style={{...tr,color:isCurrent?T.accent:T.textMuted,fontSize:"0.75rem",fontWeight:700}}>{lesson.id}</span>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <h4 style={{...tr,fontWeight:700,fontSize:"0.82rem",color:isCurrent?T.accent:T.textPrimary}}>{lesson.title}</h4>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"4px"}}>
                          <span style={{...tr,color:T.textDim,fontSize:"0.72rem"}}>{formatSecondsToMMSS(lesson.duration)}</span>
                          {isCurrent && <span style={{...tr,background:T.accent,color:"#FFF",fontSize:"0.6rem",padding:"2px 8px",borderRadius:"999px",fontWeight:700}}>جاري المشاهدة</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Progress bar */}
                <div style={{...tr,marginTop:"20px",background:T.accentDim,border:`1px solid ${T.borderAccent}`,padding:"16px",borderRadius:"12px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.82rem",marginBottom:"10px"}}>
                     <span style={{...tr,color:T.textMuted,fontWeight:700}}>{t('overall_progress')}</span>
                     <span style={{...tr,color:T.accent,fontWeight:700}}>{progressPercent}%</span>
                  </div>
                  <div style={{height:"6px",background:T.trackBg,borderRadius:"999px",overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${progressPercent}%`,background:T.accent,borderRadius:"999px",transition:"width 0.6s ease"}} />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default LessonInterface;
