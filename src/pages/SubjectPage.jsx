import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { publicApi } from '../api/api';
import {
  ArrowRight, BookOpen, PlayCircle,
  ChevronDown, ChevronUp, Clock, AlertTriangle, RefreshCcw,
  Home, LogIn, User, GraduationCap, ChevronLeft, Users, Lock,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import i18n from '../i18n/i18n';
import { SUBJECT_ICONS } from '../utils/subjectMapping';
import AuthModal from '../components/AuthModal';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

/* ════════════════════════════════════════════════════
   DESIGN SYSTEM — Extracted from LandingPage.jsx
════════════════════════════════════════════════════ */
function buildTheme(dk){return dk?{bg:"#0B1120",bgCard:"rgba(255,255,255,0.035)",border:"rgba(255,255,255,0.08)",borderAccent:"rgba(79,70,229,0.38)",accent:"#4F46E5",accentDim:"rgba(79,70,229,0.14)",iconA:"#38BDF8",iconBgA:"rgba(56,189,248,0.10)",iconBorderA:"rgba(56,189,248,0.22)",iconB:"#818CF8",iconBgB:"rgba(129,140,248,0.11)",iconBorderB:"rgba(129,140,248,0.25)",textPrimary:"#F8FAFC",textMuted:"#94A3B8",textDim:"#475569",shadowCard:"0 1px 1px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.35)",trackBg:"rgba(255,255,255,0.06)",green:"#34D399",greenDim:"rgba(52,211,153,0.12)",greenBorder:"rgba(52,211,153,0.22)",red:"#F87171",redDim:"rgba(248,113,113,0.10)",redBorder:"rgba(248,113,113,0.20)",yellow:"#FBBF24",yellowDim:"rgba(251,191,36,0.12)",yellowBorder:"rgba(251,191,36,0.22)",headerBg:"rgba(11,17,32,0.88)"}:{bg:"#F8FAFC",bgCard:"#FFFFFF",border:"#E2E8F0",borderAccent:"rgba(15,76,129,0.28)",accent:"#0F4C81",accentDim:"rgba(15,76,129,0.08)",iconA:"#0F4C81",iconBgA:"rgba(15,76,129,0.08)",iconBorderA:"rgba(15,76,129,0.18)",iconB:"#2563EB",iconBgB:"rgba(37,99,235,0.07)",iconBorderB:"rgba(37,99,235,0.16)",textPrimary:"#0F172A",textMuted:"#64748B",textDim:"#94A3B8",shadowCard:"0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)",trackBg:"#E2E8F0",green:"#059669",greenDim:"rgba(5,150,105,0.08)",greenBorder:"rgba(5,150,105,0.18)",red:"#EF4444",redDim:"rgba(239,68,68,0.08)",redBorder:"rgba(239,68,68,0.18)",yellow:"#D97706",yellowDim:"rgba(217,119,6,0.08)",yellowBorder:"rgba(217,119,6,0.18)",headerBg:"rgba(248,250,252,0.90)"};}
const _c=(T,x)=>({background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:"16px",boxShadow:T.shadowCard,...x});
const _t={transition:"all 0.25s ease"};
const _iw=(bg,bd,sz="40px",r="10px")=>({..._t,width:sz,height:sz,borderRadius:r,background:bg,border:`1px solid ${bd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0});

// ── Sub-components ─────────────────────────────────────────────────────────────

const SectionLoader = ({ rows = 3, T }) => (
  <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonLoader key={i} type="card" height="68px" className="w-full" />
    ))}
  </div>
);

const SectionError = ({ message, onRetry, T, t }) => (
  <div style={{padding:"32px",display:"flex",flexDirection:"column",alignItems:"center",gap:"12px",textAlign:"center"}}>
    <AlertTriangle style={{width:"28px",height:"28px",color:T.yellow}} />
    <p style={{fontSize:"0.9rem",color:T.textDim}}>{message}</p>
    <button
      onClick={onRetry}
      style={{..._t,display:"flex",alignItems:"center",gap:"6px",fontSize:"0.9rem",fontWeight:700,color:T.accent,background:"transparent",border:"none",cursor:"pointer"}}
    >
      <RefreshCcw style={{width:"14px",height:"14px"}} /> {t('retry')}
    </button>
  </div>
);

// ── Teacher Card ───────────────────────────────────────────────────────────────

const TeacherCard = ({ teacher, isSelected, onSelect, T, t }) => {
  const colors = [
    {bg:T.iconBgA, color:T.iconA},
    {bg:T.iconBgB, color:T.iconB},
    {bg:T.greenDim, color:T.green},
    {bg:T.yellowDim, color:T.yellow},
    {bg:T.redDim, color:T.red},
    {bg:T.accentDim, color:T.accent},
  ];
  const colorIndex = (teacher.id || 0) % colors.length;
  const col = colors[colorIndex];
  
  return (
    <button
      onClick={() => onSelect(teacher)}
      style={{..._t,display:"flex",alignItems:"center",gap:"16px",padding:"16px",borderRadius:"16px",border:`2px solid ${isSelected ? T.borderAccent : T.border}`,background:isSelected ? T.accentDim : T.bgCard,width:"100%",textAlign:"right",cursor:"pointer"}}
      onMouseEnter={e=>{if(!isSelected) e.currentTarget.style.borderColor=T.borderAccent;}}
      onMouseLeave={e=>{if(!isSelected) e.currentTarget.style.borderColor=T.border;}}
    >
      <div style={{width:"56px",height:"56px",borderRadius:"50%",background:col.bg,color:col.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.125rem",fontWeight:900,flexShrink:0}}>
        {(teacher.name || t('subject_page_teacher_fallback', { id: teacher.id })).charAt(0)}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p className="truncate" title={teacher.name || t('subject_page_teacher_fallback', { id: teacher.id })} style={{fontWeight:700,color:T.textPrimary,fontSize:"1rem"}}>
          {teacher.name || t('subject_page_teacher_fallback', { id: teacher.id })}
        </p>
        {teacher.lessons_count !== undefined && (
          <p style={{fontSize:"0.875rem",color:T.textDim,marginTop:"4px"}}>
            {t('subject_page_lessons_count', { count: teacher.lessons_count })}
          </p>
        )}
      </div>
      <ChevronLeft style={{..._t,width:"20px",height:"20px",color:T.textDim,flexShrink:0,transform:isSelected?'rotate(90deg)':'none'}} />
    </button>
  );
};

// ── Unit card (self-contained, collapsible) ───────────────────────────────────

const UnitCard = ({ unit, subjectId, onStartLesson, isLoggedIn, T, t }) => {
  const [expanded, setExpanded] = useState(false);
  const totalCount = unit.lessons.length;

  return (
    <div style={{..._t,..._c(T),overflow:"hidden",marginBottom:"12px"}}>
      {/* ── Unit header ── */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        style={{..._t,width:"100%",display:"flex",alignItems:"center",gap:"16px",padding:"16px",textAlign:"right",background:"transparent",border:"none",cursor:"pointer"}}
        onMouseEnter={e=>e.currentTarget.style.background=T.bg}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}
      >
        <div style={_iw(T.iconBgA,T.iconBorderA,"36px","12px")}>
          <span style={{color:T.iconA,fontSize:"0.875rem",fontWeight:900}}>{unit.order}</span>
        </div>

        <div style={{flex:1,minWidth:0}}>
          <p className="truncate" title={unit.title} style={{fontWeight:700,color:T.textPrimary,fontSize:"0.875rem",lineHeight:1.4}}>{unit.title}</p>
          <span style={{fontSize:"0.75rem",color:T.textDim,marginTop:"6px",display:"block"}}>{t('subject_page_lessons_count', { count: totalCount })}</span>
        </div>

        {expanded
          ? <ChevronUp style={{width:"16px",height:"16px",color:T.textDim,flexShrink:0}} />
          : <ChevronDown style={{width:"16px",height:"16px",color:T.textDim,flexShrink:0}} />
        }
      </button>

      {/* ── Lesson rows ── */}
      {expanded && (
        <div style={{borderTop:`1px solid ${T.border}`,background:T.bg}}>
          {unit.lessons.map((lesson, idx) => {
            const isLocked = lesson.is_locked || (!isLoggedIn && idx > 0);
            const isActive = lesson.is_active || (isLoggedIn && !lesson.completed && idx === 0);
            return (
            <div
              key={lesson.id ?? idx}
              style={{
                display:"flex",alignItems:"center",gap:"16px",padding:"16px",
                borderBottom:idx<unit.lessons.length-1?`1px solid ${T.border}`:"none",
                transition:"all 0.2s ease",
                opacity: isLocked ? 0.6 : 1,
                background: isActive ? T.accentDim : "transparent",
                borderInlineStart: isActive ? `2px solid ${T.accent}` : "2px solid transparent",
              }}
              onMouseEnter={e=>{if(!isActive && !isLocked) e.currentTarget.style.background=T.bgCard;}}
              onMouseLeave={e=>{if(!isActive && !isLocked) e.currentTarget.style.background="transparent";}}
            >
              {/* Title + duration */}
              <div style={{flex:1,minWidth:0}}>
                <p className="truncate" title={lesson.title} style={{fontSize:"0.875rem",fontWeight:700,color: isLocked ? T.textMuted : T.textPrimary}}>{lesson.title}</p>
                {lesson.duration && (
                  <p style={{fontSize:"0.75rem",color:T.textDim,display:"flex",alignItems:"center",gap:"4px",marginTop:"4px"}}>
                    <Clock style={{width:"12px",height:"12px"}} /> {lesson.duration}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div style={{display:"flex",alignItems:"center",gap:"6px",flexShrink:0}}>
                {isLocked ? (
                  <div style={{display:"flex",alignItems:"center",gap:"6px",color:T.textMuted,fontSize:"0.75rem",fontWeight:700,padding:"6px 10px"}}>
                    <Lock style={{width:"14px",height:"14px"}} />
                    <span>{t('subject_page_locked')}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => onStartLesson(lesson, subjectId)}
                    style={{..._t,fontSize:"0.75rem",padding:"6px 14px",borderRadius:"8px",fontWeight:700,display:"flex",alignItems:"center",gap:"4px",background: isActive ? T.accent : T.bgCard, color: isActive ? "#FFF" : T.textPrimary, border: isActive ? "none" : `1px solid ${T.border}`,cursor:"pointer",boxShadow:isActive?T.shadowCard:"none"}}
                    onMouseEnter={e=>{if(isActive)e.currentTarget.style.filter="brightness(1.1)"; else e.currentTarget.style.borderColor=T.accent;}}
                    onMouseLeave={e=>{if(isActive)e.currentTarget.style.filter="none"; else e.currentTarget.style.borderColor=T.border;}}
                  >
                    {!isLoggedIn && <LogIn style={{width:"12px",height:"12px"}} />}
                    {isLoggedIn ? (isActive ? t('subject_page_continue') : t('subject_page_start')) : t('subject_page_login_to_start')}
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SubjectPageLoadingSkeleton = ({ lang, T, glass }) => (
  <div style={{..._t,background:T.bg,minHeight:"100vh",fontFamily:"'Cairo',sans-serif"}} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
    <main style={{maxWidth:"896px",margin:"0 auto",padding:"32px 16px",display:"flex",flexDirection:"column",gap:"18px"}}>
      <div style={glass({ padding: '24px' })}>
        <SkeletonLoader type="text" height="30px" width="45%" className="mb-4" />
        <SkeletonLoader type="text" height="14px" width="80%" className="mb-3" />
        <SkeletonLoader type="text" height="14px" width="62%" />
      </div>

      {Array.from({ length: 5 }).map((_, idx) => (
        <SkeletonLoader key={idx} type="card" height="72px" className="w-full" />
      ))}
    </main>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────

const SubjectPage = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const { lang } = useLanguage();
  const { t } = useTranslation();
  const { theme, C, glass } = useTheme();
  const isDark = theme === 'dark';
  const T = buildTheme(isDark);

  // ── State ──
  const [subject,         setSubject]         = useState(null);
  const [allTeachers,     setAllTeachers]     = useState([]); // المدرسين المحملين حتى الآن
  const [teachersApiPage, setTeachersApiPage] = useState(1);  // صفحة الـ API الحالية
  const [teachersLastPage,setTeachersLastPage]= useState(1);  // آخر صفحة في الـ API
  const [loadingMoreTeachers, setLoadingMoreTeachers] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [units,           setUnits]           = useState([]);
  const [loadingSubject,  setLoadingSubject]  = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingLessons,  setLoadingLessons]  = useState(false);
  const [errorSubject,    setErrorSubject]    = useState(null);
  const [errorTeachers,   setErrorTeachers]   = useState(null);
  const [errorLessons,    setErrorLessons]    = useState(null);

  // هل في مدرسين كمان في الـ API؟
  const hasMoreTeachers = teachersApiPage < teachersLastPage;

  // ── Auth Modal State ──
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    type: 'lesson', // 'lesson'
    lessonTitle: '',
    pendingAction: null, // { lesson, subjectId, type: 'lesson' }
  });

  const isLoggedIn = !!localStorage.getItem('token');

  // ── Fetch subject basic info ──
  const fetchSubject = useCallback(async () => {
    setLoadingSubject(true);
    setErrorSubject(null);
    try {
      const { data } = await publicApi.get('/subjects');
      // API response is paginated: { data: [...], current_page, total }
      const list = Array.isArray(data) ? data : (data.data || []);
      const found = list.find(s => String(s.id) === String(subjectId));
      if (!found) throw new Error('subject not found');
      setSubject({
        id:     found.id,
        name:   found.name || found.title,
        code:   found.code,
        icon:   SUBJECT_ICONS[found.code] ?? '📚',
      });
    } catch {
      // Fallback minimal: استخدم الـ ID كاسم
      setSubject({ id: subjectId, name: i18n.t('subject_page_subject_fallback', { id: subjectId }), code: 'DEFAULT', icon: '📚' });
    } finally {
      setLoadingSubject(false);
    }
  }, [subjectId]);

  // ── Fetch teachers for this subject (paginated) ──
  const fetchTeachers = useCallback(async (page = 1) => {
    if (page === 1) {
      setLoadingTeachers(true);
      setErrorTeachers(null);
      setAllTeachers([]);
    } else {
      setLoadingMoreTeachers(true);
    }
    try {
      const { data } = await publicApi.get(`/subjects/${subjectId}/teachers?page=${page}`);
      // API response: { teachers: { data: [...], meta: { last_page } } }
      const teachersRaw = data?.teachers?.data || data?.teachers || data?.data || data || [];
      const teachersList = Array.isArray(teachersRaw) ? teachersRaw : [];
      const lastPage = data?.teachers?.meta?.last_page || data?.teachers?.last_page || data?.last_page || 1;

      const mapped = teachersList.map((teacher) => ({
        id: teacher.teacher_id || teacher.id,
        name: teacher.teacher_name || teacher.name || i18n.t('subject_page_teacher_fallback', { id: teacher.teacher_id || teacher.id }),
        image: teacher.image || teacher.avatar || null,
      }));

      setAllTeachers(prev => page === 1 ? mapped : [...prev, ...mapped]);
      setTeachersApiPage(page);
      setTeachersLastPage(lastPage);
    } catch {
      setErrorTeachers(i18n.t('subject_page_error_teachers'));
    } finally {
      setLoadingTeachers(false);
      setLoadingMoreTeachers(false);
    }
  }, [subjectId]);

  // ── Fetch lessons for selected teacher ──
  // ✅ يجلب دروس المدرس فقط عند اختياره
  const fetchTeacherLessons = useCallback(async (teacherId) => {
    setLoadingLessons(true);
    setErrorLessons(null);
    setUnits([]);
    
    try {
      // 1. جلب وحدات المادة أولاً
      const unitsRes = await publicApi.get(`/subjects/${subjectId}/units`);
      const unitsRaw = unitsRes.data?.data || unitsRes.data || [];
      const unitsList = Array.isArray(unitsRaw) ? unitsRaw : [];
      
      // 2. جلب الدروس من كل وحدة
      const allSubjectLessons = [];
      for (const unit of unitsList) {
        try {
          const lessonsRes = await publicApi.get(`/units/${unit.id}/lessons`);
          const lessonsRaw = lessonsRes.data?.data || lessonsRes.data || [];
          const lessons = Array.isArray(lessonsRaw) ? lessonsRaw : [];
          lessons.forEach(l => {
            allSubjectLessons.push({ ...l, _unitTitle: unit.title || unit.name });
          });
        } catch {
          // تجاهل الخطأ والمتابعة
        }
      }
      
      // 3. جلب الدروس عبر فيديوهات المدرس
      const teacherLessonsRes = await publicApi.get(`/teachers/${teacherId}/lessons`);

      // ✅ Extract lessons with proper fallback chaining
      const teacherLessonsRaw = 
        teacherLessonsRes.data?.lessons?.data ||  // Paginated Laravel: { lessons: { data: [...] } }
        teacherLessonsRes.data?.lessons ||        // Direct nested: { lessons: [...] }
        teacherLessonsRes.data?.data ||           // Paginated direct: { data: [...] }
        teacherLessonsRes.data ||                 // Direct array: [...]
        [];
      
      const teacherLessonsList = Array.isArray(teacherLessonsRaw) ? teacherLessonsRaw : [];

      // ✅ Use teacher's lessons directly (backend already filters by teacher+video relationship)
      // Match them with unit info from allSubjectLessons for enrichment
      const enrichedLessons = teacherLessonsList.map(teacherLesson => {
        // Try to find matching lesson in allSubjectLessons to get unit info
        const subjectLesson = allSubjectLessons.find(sl => sl.id === teacherLesson.id);
        
        return {
          ...teacherLesson,
          _unitTitle: subjectLesson?._unitTitle || teacherLesson.unit_title || teacherLesson.chapter || i18n.t('subject_page_general_lessons'),
        };
      });

      // Group lessons by unit (chapter)
      const chapterMap = {};
      enrichedLessons.forEach(l => {
        const key = l._unitTitle || l.unit_title || l.chapter || i18n.t('subject_page_general_lessons');
        if (!chapterMap[key]) {
          chapterMap[key] = {
            id: Object.keys(chapterMap).length + 1,
            title: key,
            order: Object.keys(chapterMap).length + 1,
            lessons: []
          };
        }
        chapterMap[key].lessons.push({
          id: l.id,
          title: l.title ?? l.name ?? i18n.t('subject_page_lesson_fallback', { id: l.id }),
          duration: l.duration ?? '--',
          chapter: key,
          description: l.description ?? '',
        });
      });
      setUnits(Object.values(chapterMap));
    } catch {
      setErrorLessons(i18n.t('subject_page_error_lessons'));
    } finally {
      setLoadingLessons(false);
    }
  }, [subjectId]);

  // ── Effects ──
  useEffect(() => {
    fetchSubject();
    fetchTeachers();
  }, [fetchSubject, fetchTeachers]);

  useEffect(() => {
    if (selectedTeacher) {
      fetchTeacherLessons(selectedTeacher.id);
    }
  }, [selectedTeacher, fetchTeacherLessons]);

  // ── Handle teacher selection ──
  const handleSelectTeacher = (teacher) => {
    if (selectedTeacher?.id === teacher.id) {
      // Deselect
      setSelectedTeacher(null);
      setUnits([]);
    } else {
      setSelectedTeacher(teacher);
    }
  };

  // ── Derived stats ──
  const totalLessons = units.reduce((s, u) => s + u.lessons.length, 0);

  // ── Auth Modal helpers ──
  const openAuthModal = (type, lesson) => {
    setAuthModal({
      isOpen: true,
      type,
      lessonTitle: lesson?.title || '',
      pendingAction: { lesson, subjectId, type },
    });
  };

  const closeAuthModal = () => {
    setAuthModal(prev => ({ ...prev, isOpen: false }));
  };

  // ── Navigation helpers ──
  const handleStartLesson = (lesson, sid) => {
    if (!isLoggedIn) {
      // عرض Modal بدلاً من التوجيه المباشر
      openAuthModal('lesson', lesson);
      // حفظ البيانات في sessionStorage للعودة بعد تسجيل الدخول
      sessionStorage.setItem('pendingLesson', JSON.stringify({
        type: 'lesson',
        lesson,
        subjectId: sid,
        subjectName: subject?.name,
        teacherId: selectedTeacher?.id,
      }));
      return;
    }
    const courseDetailsPath = `/course-details?lessonId=${encodeURIComponent(String(lesson?.id ?? ''))}&teacherId=${encodeURIComponent(String(selectedTeacher?.id ?? ''))}&subjectId=${encodeURIComponent(String(sid))}`;
    navigate(courseDetailsPath, {
      state: { 
        lesson, 
        subjectId: sid, 
        subjectName: subject?.name,
        teacherId: selectedTeacher?.id  // ✅ Pass teacher ID
      } 
    });
  };

  const handleBack = () => {
    if (selectedTeacher) {
      setSelectedTeacher(null);
      setUnits([]);
    } else if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  // ── Full-page loader ──
  if (loadingSubject && loadingTeachers) {
    return <SubjectPageLoadingSkeleton lang={lang} T={T} glass={glass} />;
  }

  return (
    <div style={{..._t,background:T.bg,minHeight:"100vh",fontFamily:"'Cairo',sans-serif"}} dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* ═══ GUEST BANNER ═══ */}
      {!isLoggedIn && (
        <div style={{background:T.accentDim,borderBottom:`1px solid ${T.borderAccent}`}}>
          <div style={{maxWidth:"896px",margin:"0 auto",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px",flexWrap:"wrap"}}>
            <p style={{fontSize:"0.875rem",color:T.accent,fontWeight:600}}>
              👋 {t('subject_page_guest_banner')}
            </p>
            <button
              onClick={() => navigate('/login?redirect=' + encodeURIComponent(window.location.pathname))}
              style={{..._t,display:"flex",alignItems:"center",gap:"8px",padding:"6px 16px",borderRadius:"8px",fontSize:"0.875rem",fontWeight:700,background:T.accent,color:"#FFF",border:"none",cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.filter="brightness(1.1)"}
              onMouseLeave={e=>e.currentTarget.style.filter="none"}
            >
              <LogIn style={{width:"16px",height:"16px"}} />
              {t('login')}
            </button>
          </div>
        </div>
      )}

      {/* ═══ SUB-HEADER ═══ */}
      <header style={{background:T.headerBg,borderBottom:`1px solid ${T.border}`,backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:40}}>
        <div style={{maxWidth:"896px",margin:"0 auto",padding:"16px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <button
              onClick={handleBack}
              style={{..._t,display:"flex",alignItems:"center",gap:"8px",color:T.textMuted,fontWeight:700,background:"transparent",border:"none",cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.color=T.accent}
              onMouseLeave={e=>e.currentTarget.style.color=T.textMuted}
            >
              <ArrowRight style={{width:"20px",height:"20px",...(lang==='en'?{transform:"rotate(180deg)"}:{})}} />
              {selectedTeacher 
                ? t('subject_page_back_to_teachers')
                : (isLoggedIn ? t('back_to_dashboard') : t('back_to_home'))
              }
            </button>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <div style={_iw(T.accentDim,T.borderAccent,"32px","8px")}>
                <BookOpen style={{width:"16px",height:"16px",color:T.accent}} />
              </div>
              <h1 style={{fontSize:"1.25rem",fontWeight:800,color:T.textPrimary}}>
                {loadingSubject ? '…' : (subject?.name ?? subjectId)}
              </h1>
            </div>
            <div style={{width:"128px"}} />
          </div>
        </div>
      </header>

      <main style={{maxWidth:"896px",margin:"0 auto",padding:"32px 16px",display:"flex",flexDirection:"column",gap:"24px"}}>

        {/* ═══ SECTION 1 — Subject info card ═══ */}
        {errorSubject ? (
          <SectionError message={errorSubject} onRetry={fetchSubject} T={T} t={t} />
        ) : loadingSubject ? (
          <div style={glass({ padding: '24px' })}>
            <SkeletonLoader type="text" height="30px" width="42%" className="mb-4" />
            <SkeletonLoader type="text" height="12px" width="72%" />
          </div>
        ) : subject ? (
          <div style={{..._c(T),padding:"24px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
                <span style={{fontSize:"2.5rem"}}>{subject.icon}</span>
                <div>
                  <h2 style={{fontSize:"1.5rem",fontWeight:800,color:T.textPrimary}}>{subject.name}</h2>
                  <p style={{fontSize:"0.875rem",color:T.textDim,marginTop:"4px"}}>
                    {loadingTeachers 
                      ? t('subject_page_loading_teachers')
                      : t('subject_page_available_teachers', { count: allTeachers.length })
                    }
                  </p>
                </div>
              </div>
              {selectedTeacher && totalLessons > 0 && (
                <div style={{display:"flex",alignItems:"center",gap:"16px",fontSize:"0.875rem"}}>
                  <span style={{color:T.textDim}}>
                    {t('subject_page_lessons_count', { count: totalLessons })}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* ═══ SECTION 2 — Teachers List (when no teacher selected) ═══ */}
        {!selectedTeacher && (
          <div>
            <h3 style={{fontSize:"1.125rem",fontWeight:800,color:T.textPrimary,marginBottom:"16px",display:"flex",alignItems:"center",gap:"8px"}}>
              <Users style={{width:"20px",height:"20px",color:T.accent}} />
              {t('subject_page_choose_teacher')}
              {allTeachers.length > 0 && (
                <span style={{fontSize:"0.875rem",fontWeight:400,color:T.textDim}}>
                  ({t('subject_page_teachers_count', { count: allTeachers.length })})
                </span>
              )}
            </h3>

            {errorTeachers ? (
              <SectionError message={errorTeachers} onRetry={fetchTeachers} T={T} t={t} />
            ) : loadingTeachers ? (
              <SectionLoader rows={4} T={T} />
            ) : allTeachers.length === 0 ? (
              <div style={glass({ padding: '8px' })}>
                <EmptyState
                  icon={GraduationCap}
                  title={t('subject_page_no_teachers_title')}
                  description={t('subject_page_no_teachers_desc')}
                />
              </div>
            ) : (
              <>
                <div style={{display:"grid",gap:"12px",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))"}}>
                  {allTeachers.map(teacher => (
                    <TeacherCard
                      key={teacher.id}
                      teacher={teacher}
                      isSelected={false}
                      onSelect={handleSelectTeacher}
                      T={T}
                      t={t}
                    />
                  ))}
                </div>
                
                {/* زر عرض المزيد */}
                {hasMoreTeachers && (
                  <button
                    onClick={() => fetchTeachers(teachersApiPage + 1)}
                    disabled={loadingMoreTeachers}
                    style={{..._t,marginTop:"16px",width:"100%",padding:"12px",borderRadius:"12px",border:`2px dashed ${T.border}`,color:T.textMuted,fontWeight:700,background:"transparent",cursor:loadingMoreTeachers?"not-allowed":"pointer",opacity:loadingMoreTeachers?0.5:1}}
                    onMouseEnter={e=>{if(!loadingMoreTeachers){e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color=T.accent}}}
                    onMouseLeave={e=>{if(!loadingMoreTeachers){e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.textMuted}}}
                  >
                    {loadingMoreTeachers ? t('subject_page_loading_more_teachers') : t('subject_page_load_more_teachers')}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══ SECTION 3 — Selected Teacher's Lessons ═══ */}
        {selectedTeacher && (
          <div>
            {/* Selected teacher info */}
            <div style={{..._c(T),padding:"16px",marginBottom:"24px",background:T.accent,border:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
                <div style={{width:"56px",height:"56px",borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.5rem",fontWeight:900,color:"#FFF",flexShrink:0}}>
                  {selectedTeacher.name.charAt(0)}
                </div>
                <div style={{flex:1}}>
                  <p style={{fontWeight:700,fontSize:"1.125rem",color:"#FFF"}}>{selectedTeacher.name}</p>
                  <p style={{color:"rgba(255,255,255,0.8)",fontSize:"0.875rem"}}>
                    {loadingLessons 
                      ? t('subject_page_loading_lessons')
                      : t('subject_page_available_lessons', { count: totalLessons })
                    }
                  </p>
                </div>
                <button
                  onClick={() => handleSelectTeacher(selectedTeacher)}
                  style={{..._t,padding:"8px 16px",borderRadius:"8px",background:"rgba(255,255,255,0.2)",color:"#FFF",border:"none",fontWeight:700,fontSize:"0.875rem",cursor:"pointer"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.3)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.2)"}
                >
                  {t('subject_page_change_teacher')}
                </button>
              </div>
            </div>

            {/* Lessons */}
            <h3 style={{fontSize:"1.125rem",fontWeight:800,color:T.textPrimary,marginBottom:"16px",display:"flex",alignItems:"center",gap:"8px"}}>
              <BookOpen style={{width:"20px",height:"20px",color:T.accent}} />
              {t('subject_page_lessons_catalog')}
            </h3>

            {errorLessons ? (
              <SectionError message={errorLessons} onRetry={() => fetchTeacherLessons(selectedTeacher.id)} T={T} t={t} />
            ) : loadingLessons ? (
              <SectionLoader rows={5} T={T} />
            ) : units.length === 0 ? (
              <div style={glass({ padding: '8px' })}>
                <EmptyState
                  icon={PlayCircle}
                  title={t('subject_page_no_lessons_title')}
                  description={t('subject_page_no_lessons_desc')}
                />
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                {units.map(unit => (
                  <UnitCard
                    key={unit.id}
                    unit={unit}
                    subjectId={subjectId}
                    onStartLesson={handleStartLesson}
                    isLoggedIn={isLoggedIn}
                    T={T}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ═══ AUTH MODAL ═══ */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={closeAuthModal}
        type={authModal.type}
        lessonTitle={authModal.lessonTitle}
        redirectPath={`/subject/${subjectId}`}
      />
    </div>
  );
};

export default SubjectPage;
