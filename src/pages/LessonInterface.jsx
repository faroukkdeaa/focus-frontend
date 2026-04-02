import { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/api';
import { ArrowRight, Play, Pause, Volume2, Settings, ChevronLeft, ChevronRight, CheckCircle2, User, Loader2, Zap } from "lucide-react";
import { useLanguage } from '../context/LanguageContext';
import { MOCK_API, REAL_TO_MOCK_SUBJECT } from '../utils/subjectMapping';

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
const unwrapList = (res) => {
  const data = res?.data;
  return Array.isArray(data?.data) ? data.data
    : Array.isArray(data?.attempts) ? data.attempts
    : Array.isArray(data) ? data
    : [];
};

const unwrapItem = (res) => {
  const data = res?.data;
  return data?.data ?? data?.attempt ?? data?.quiz ?? data ?? null;
};

const LessonInterface = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLanguage();

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
  const [completingLesson, setCompletingLesson] = useState(false);
  const [lessonCompleteToast, setLessonCompleteToast] = useState(false);

  // بيانات من الـ API
  const [teachers, setTeachers] = useState([]);
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set()); // per-user
  const [studentAttempts, setStudentAttempts] = useState([]); // سجل الكويزات اللي الطالب ممتحنها
  const [currentVideo, setCurrentVideo]   = useState(null);     // فيديو الدرس الحالي من real API
  const [lessonQuizzes, setLessonQuizzes] = useState([]); // الكويزات المتاحة للدرس
  const [videoLoading, setVideoLoading]   = useState(false);
  const [lessonsLoading, setLessonsLoading] = useState(false); // حالة تحميل الدروس للمدرس

  // ── جلب محاولات الطالب للاختبارات بمجرد فتح واجهة الدورة ──
  useEffect(() => {
    const fetchAttempts = async () => {
      if (!isLoggedIn) return;
      try {
        const res = await api.get('/students/attempts');
        const attemptsList = res.data?.data || res.data || [];
        setStudentAttempts(attemptsList);
      } catch (err) {
        console.warn('Could not fetch student attempts in LessonInterface:', err);
      }
    };
    fetchAttempts();
  }, [isLoggedIn]);

  // جلب lessonId و subjectId و subjectName و teacherId من location.state
  // ✅ Clean lesson ID - remove any ":1" suffix from hasManyThrough
  const rawLessonId = location.state?.lesson?.id || 1;
  const lessonId = typeof rawLessonId === 'string' && rawLessonId.includes(':') 
    ? parseInt(rawLessonId.split(':')[0], 10) 
    : parseInt(rawLessonId, 10);
  const subjectId        = location.state?.subjectId   || 1;
  const stateSubjectName = location.state?.subjectName ?? ''; // للـ mock fallback
  const autoScrollToQuiz = location.state?.autoScrollToQuiz ?? false;
  const preSelectedTeacherId = location.state?.teacherId; // ✅ Get selected teacher ID from navigation

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Get subject-scoped lesson IDs (once)
        let subjectLessonIds = new Set();
        try {
          const unitsRes = await api.get(`/subjects/${subjectId}/units`);
          const unitsRaw = unitsRes.data?.data || unitsRes.data || [];
          const unitsList = Array.isArray(unitsRaw) ? unitsRaw : [];
          const subjectLessonsArr = await Promise.all(
            unitsList.map(async (unit) => {
              try {
                const lRes = await api.get(`/units/${unit.id}/lessons`);
                const lRaw = lRes.data?.data || lRes.data || [];
                return Array.isArray(lRaw) ? lRaw.map(l => l.id) : [];
              } catch { return []; }
            })
          );
          subjectLessonIds = new Set(subjectLessonsArr.flat());
        } catch { /* continue without scoping */ }

        // 2. Fetch teachers for this subject
        let mappedTeachers = [];
        try {
          const teachersResponse = await api.get(`/subjects/${subjectId}/teachers`);
          const rawTeachersData = teachersResponse.data?.teachers?.data || teachersResponse.data?.teachers || teachersResponse.data?.data || teachersResponse.data || [];
          const rawTeachers = Array.isArray(rawTeachersData) ? rawTeachersData : [];
          mappedTeachers = rawTeachers.map(t => ({
            id: t.teacher_id || t.id,
            name: t.teacher_name || t.name || t.user?.name || `مدرس ${t.teacher_id || t.id}`,
            rating: t.rating ?? null,
            url: t.url ?? null,
            subject: t.subject_name ?? ''
          }));
        } catch (err) {
          console.error('Failed to fetch teachers:', err.message);
        }

        // 3. Load user progress
        const completionData = JSON.parse(localStorage.getItem('lessonCompletions') || '{}');
        const doneSet = new Set(
          Object.keys(completionData)
            .filter(k => completionData[k]?.subjectId === String(subjectId) && completionData[k]?.completed)
            .map(k => Number(k))
        );
        setCompletedIds(doneSet);

        // 4. Set teachers list (don't fetch lessons yet)
        setTeachers(mappedTeachers);
        
        // 5. Set active teacher: prioritize teacher from navigation, fallback to first teacher
        if (mappedTeachers.length > 0) {
          // ✅ Search for the intended target teacher
          let targetTeacher = preSelectedTeacherId
            ? mappedTeachers.find(t => String(t.id) === String(preSelectedTeacherId))
            : null;

          // If they came from page 2+ on SubjectPage, they won't be in mapping (which only fetches page 1)
          // Ensure we append them to the sidebar list so we can show their lessons
          if (!targetTeacher && preSelectedTeacherId) {
            targetTeacher = {
              id: preSelectedTeacherId,
              name: location.state?.teacherName || `مدرس ${preSelectedTeacherId}`,
              subject: stateSubjectName || '',
            };
            mappedTeachers.push(targetTeacher);
          }

          // Fallback to first loaded teacher if all else fails
          if (!targetTeacher) {
            targetTeacher = mappedTeachers[0];
          }
            
          setTeachers(mappedTeachers); // Re-set in case we appended
          setActiveTeacher(targetTeacher.id);
          setCourse({ subjectName: targetTeacher.subject || stateSubjectName, lessons: [] });
        }
      } catch (err) {
        console.error("LessonInterface init error:", err);
        setError("تعذر تحميل بيانات المادة.");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [subjectId, stateSubjectName, preSelectedTeacherId]); // ✅ Re-run if pre-selected teacher changes

  // ✅ OPTIMIZED: Fetch lessons ONLY for the active teacher (runs once per teacher change)
  useEffect(() => {
    // Guard: Don't fetch if no active teacher selected
    if (!activeTeacher || !subjectId) return;
    
    let cancelled = false;
    
    const fetchTeacherLessons = async () => {
      setLessonsLoading(true);
      try {
        console.log(`🔄 Fetching lessons for teacher ${activeTeacher}...`);
        
        // Get subject-scoped lesson IDs
        let subjectLessonIds = new Set();
        try {
          const unitsRes = await api.get(`/subjects/${subjectId}/units`);
          const unitsRaw = unitsRes.data?.data || unitsRes.data || [];
          const unitsList = Array.isArray(unitsRaw) ? unitsRaw : [];
          const subjectLessonsArr = await Promise.all(
            unitsList.map(async (unit) => {
              try {
                const lRes = await api.get(`/units/${unit.id}/lessons`);
                const lRaw = lRes.data?.data || lRes.data || [];
                return Array.isArray(lRaw) ? lRaw.map(l => l.id) : [];
              } catch { return []; }
            })
          );
          subjectLessonIds = new Set(subjectLessonsArr.flat());
        } catch { /* continue without scoping */ }

        // Fetch lessons for ONLY this teacher (single request)
        const res = await api.get(`/teachers/${activeTeacher}/lessons`);
        
        if (cancelled) return; // Prevent state updates if unmounted
        
        console.log(`✅ Teacher ${activeTeacher} lessons response:`, res.data);
        
        const rawLessonsData = res.data?.lessons?.data || res.data?.lessons || res.data?.data || res.data || [];
        let rawLessons = Array.isArray(rawLessonsData) ? rawLessonsData : [];
        
        console.log(`📊 Extracted ${rawLessons.length} lessons for teacher ${activeTeacher}`);
        
        // Filter by subject lessons if available
        if (subjectLessonIds.size > 0) {
          const beforeFilter = rawLessons.length;
          rawLessons = rawLessons.filter(l => subjectLessonIds.has(l.id));
          console.log(`🔍 Filtered: ${beforeFilter} → ${rawLessons.length} lessons`);
        }
        
        // Map lessons to display format
        const mappedLessons = rawLessons.map(l => ({
          id:          l.id,
          title:       l.title ?? l.name ?? `Lesson ${l.id}`,
          duration:    l.duration ?? '--',
          chapter:     l.chapter ?? '',
          description: l.description ?? '',
          completed:   completedIds.has(l.id),
        }));
        
        setLessons(mappedLessons);
        setCourse(prev => ({ ...prev, lessons: mappedLessons }));
        
        // Set current lesson (first one or matching lessonId)
        const target = mappedLessons.find(l => l.id === parseInt(lessonId)) || mappedLessons[0] || null;
        setCurrentLesson(target);
        
        console.log(`✅ Set ${mappedLessons.length} lessons for teacher ${activeTeacher}`);
      } catch (err) {
        if (!cancelled) {
          console.error(`❌ Failed to fetch lessons for teacher ${activeTeacher}:`, err);
          setLessons([]);
        }
      } finally {
        if (!cancelled) setLessonsLoading(false);
      }
    };
    
    fetchTeacherLessons();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => { cancelled = true; };
  }, [activeTeacher, subjectId, lessonId, completedIds]); // ✅ Only runs when active teacher changes

  // ✅ تغيير المدرس (simplified - fetching handled by useEffect)
  const handleTeacherChange = (teacherId) => {
    if (teacherId === activeTeacher) return;
    console.log(`🔄 Switching to teacher ${teacherId}`);
    setActiveTeacher(teacherId); // ✅ useEffect will automatically fetch lessons
  };

  // جلب فيديو والكويزات الخاصة بالدرس الحالي من real API
  useEffect(() => {
    if (!currentLesson?.id) return;
    let cancelled = false;
    
    const fetchLessonData = async () => {
      setVideoLoading(true);
      setCurrentVideo(null);
      setLessonQuizzes([]);
      
      try {
        const safeId = parseInt(String(currentLesson?.id).split(':')[0], 10);
        const lessonRes = await api.get(`/teachers/${activeTeacher}/lessons/${safeId}/content`);
        
        if (!cancelled) {
          // 1. استخراج الفيديوهات
          const videosData = lessonRes.data?.videos?.data || lessonRes.data?.videos || [];
          const videosList = Array.isArray(videosData) ? videosData : [];
          
          // ✅ Helper function to ensure absolute URL for local storage videos
          const ensureAbsoluteUrl = (url) => {
            if (!url) return null;
            // Already absolute URL
            if (url.startsWith('http://') || url.startsWith('https://')) {
              return url;
            }
            // Laravel storage base URL
            const LARAVEL_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://127.0.0.1:8000';
            // Handle different relative path formats
            if (url.startsWith('/storage/')) {
              return `${LARAVEL_BASE_URL}${url}`;
            }
            if (url.startsWith('storage/')) {
              return `${LARAVEL_BASE_URL}/${url}`;
            }
            if (url.startsWith('/')) {
              return `${LARAVEL_BASE_URL}${url}`;
            }
            // Default: prepend storage path
            return `${LARAVEL_BASE_URL}/storage/${url}`;
          };
          
          let selectedVideo = videosList.length > 0 ? { ...videosList[0] } : null;
          
          // ✅ Fix video URL if it's a relative path
          if (selectedVideo) {
            if (selectedVideo.url) {
              selectedVideo.url = ensureAbsoluteUrl(selectedVideo.url);
            }
            if (selectedVideo.video_url) {
              selectedVideo.video_url = ensureAbsoluteUrl(selectedVideo.video_url);
            }
          }
          
          setCurrentVideo(selectedVideo);
          
          // 2. استخراج الكويزات من جوه الفيديو المختار (زي ما شوفنا في بوستمان)
          let finalQuizzes = [];
          
          if (selectedVideo && Array.isArray(selectedVideo.quizzes)) {
            // الباك إند بيرجع أرقام (مثال: [1])، هنحولها لـ Objects عشان الزراير تشتغل
            const quizPromises = selectedVideo.quizzes.map(async q => {
              const actualId = typeof q === 'object' ? (q.quiz_id || q.id) : q;
              const quizObj = {
                id: actualId,
                quiz_id: actualId,
                teacher_id: activeTeacher,
                has_attempted: false,
                score: 0
              };
              
              // ✅ Fetch attempt data for this quiz if user is logged in
              if (isLoggedIn) {
                try {
                  const attemptRes = await api.get(`/students/attempts`, {
                    params: { quiz_id: actualId }
                  });
                  const attempts = attemptRes.data?.data || attemptRes.data || [];
                  if (attempts.length > 0) {
                    const latestAttempt = attempts[0];
                    quizObj.has_attempted = true;
                    quizObj.score = latestAttempt.score || 0;
                  }
                } catch (err) {
                  console.warn(`Failed to fetch attempts for quiz ${actualId}:`, err);
                }
              }
              
              return quizObj;
            });
            
            finalQuizzes = await Promise.all(quizPromises);
          }
          
          setLessonQuizzes(finalQuizzes);
          
          console.log(`[LessonInterface] Loaded content for lesson ${currentLesson.id}:`, {
            lessonId: safeId,
            videoFound: !!selectedVideo,
            quizzesFound: finalQuizzes.length,
            extractedQuizzes: finalQuizzes
          });
        }
      } catch (err) {
        console.error('[LessonInterface] Failed to fetch lesson data:', err);
        if (!cancelled) {
          setCurrentVideo(null);
          setLessonQuizzes([]);
        }
      } finally {
        if (!cancelled) setVideoLoading(false);
      }
    };
    
    fetchLessonData();
    return () => { cancelled = true; };
  }, [currentLesson?.id, activeTeacher]);

  // تأثير التمرير التلقائي لقسم الاختبارات
  useEffect(() => {
    if (autoScrollToQuiz && !videoLoading && lessonQuizzes.length > 0) {
      setTimeout(() => {
        const el = document.getElementById('quizzes-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [autoScrollToQuiz, videoLoading, lessonQuizzes.length]);

  const completedCount = completedIds.size;
  const totalCount = lessons.length;
  const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const mainQuiz = lessonQuizzes.length > 0 ? lessonQuizzes[0] : null;
  const matchingAttempt = mainQuiz && Array.isArray(studentAttempts)
    ? studentAttempts.find(a => String(a.quiz_id) === String(mainQuiz.id) || String(a.id) === String(mainQuiz.id))
    : null;

  const quizData = mainQuiz ? {
    ...mainQuiz,
    has_attempted: !!matchingAttempt,
    score: matchingAttempt?.score ?? null
  } : null;

  const routeLessonId = currentLesson?.id ?? lessonId;

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

  const handleCompleteLesson = async () => {
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

  if (loading || lessonsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-[#103B66] font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-lg font-bold">{t('loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-2xl text-center border border-red-200 dark:border-red-800 max-w-md">
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            {t('back_to_dashboard')}
          </button>
        </div>
      </div>
    );
  }

  if (!currentLesson || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow text-center border border-gray-200 dark:border-gray-700 max-w-md">
          <p className="text-4xl mb-4">📭</p>
          <h2 className="text-xl font-bold text-gray-700 dark:text-white mb-2">لا توجد دروس متاحة</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            {teachers.length === 0
              ? 'لا يوجد مدرسون مرتبطون بهذه المادة بعد.'
              : 'المدرس لم يرفع دروساً بعد. جرّب اختيار مدرس آخر.'}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-[#103B66] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#0c2d4d] transition"
          >
            {t('back_to_dashboard')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* Toast إتمام الدرس */}
      {lessonCompleteToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white font-bold px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          تمّ تسجيل إتمام الدرس بنجاح! ✅
        </div>
      )}

      {/* 1. الهيدر (Header) */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-[#103B66] transition"
            >
              <ArrowRight className={`w-5 h-5 ${lang === 'en' ? 'rotate-180' : ''}`} />
              <span className="font-bold">{t('back_to_dashboard')}</span>
            </button>
            
            <div className="text-center hidden md:block">
              <h1 className="text-lg font-bold text-[#103B66]">{course.subjectName} - {currentLesson.title}</h1>
              <p className="text-sm text-gray-500">{currentLesson.chapter}</p>
            </div>
            
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* 2. منطقة الفيديو (تاخد مساحة عمودين) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* معلومات المدرس الحالي */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* شريط معلومات المدرس */}
              <div className="bg-gradient-to-r from-[#103B66] to-[#1a5a99] dark:from-gray-700 dark:to-gray-600 p-4">
                {teachers.find(t => t.id === activeTeacher) ? (
                  <div className="flex items-center gap-4">
                    {/* أيقونة المدرس */}
                    <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm shrink-0">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* بيانات المدرس */}
                    <div className="flex-1 text-right">
                      <p className="text-xs text-white/80 mb-1">المدرس</p>
                      <h3 className="font-bold text-xl text-white mb-1">
                        {teachers.find(t => t.id === activeTeacher)?.name}
                      </h3>
                      {teachers.find(t => t.id === activeTeacher)?.rating != null && (
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-sm text-white/90">
                            ⭐ {teachers.find(t => t.id === activeTeacher)?.rating}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                    <p className="text-white">جاري تحميل بيانات المدرس...</p>
                  </div>
                )}
              </div>

              {/* مشغل الفيديو */}
              <div className="relative bg-black aspect-video group overflow-hidden">

                {/* جاري تحميل بيانات الفيديو */}
                {videoLoading ? (
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
                        {teachers.find(t => t.id === activeTeacher)?.name || 'غير محدد'}
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
                        <span className="text-xs font-mono">00:00 / {currentLesson.duration}</span>
                        <button><Volume2 className="w-5 h-5" /></button>
                        <button><Settings className="w-5 h-5" /></button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* أزرار التنقل والاختبار */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 w-full">
                <button
                  onClick={handlePreviousLesson}
                  disabled={currentIndex === 0}
                  className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ChevronRight className={`w-5 h-5 ${lang === 'en' ? 'rotate-180' : ''}`} />
                  {t('prev_lesson')}
                </button>

                {/* زر اختبار الدرس — مسار التطبيق: /quiz/:lessonId/:teacherId/:quizId */}
                {quizData?.has_attempted ? (
                  <div
                    role="status"
                    className="flex-1 text-white text-base font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 bg-green-600 cursor-default opacity-90 select-none"
                  >
                    <Zap className="w-5 h-5 text-green-200" />
                    تم الاختبار - النتيجة: {quizData.score != null ? `${quizData.score}%` : '—'}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (lessonQuizzes.length === 0 || !quizData) return;
                      if (!isLoggedIn) {
                        navigate('/login?redirect=' + encodeURIComponent(window.location.pathname), { replace: true });
                        return;
                      }
                      const qId = quizData.quiz_id ?? quizData.id;
                      navigate(`/quiz/${routeLessonId}/${activeTeacher}/${qId}`);
                    }}
                    disabled={lessonQuizzes.length === 0}
                    className={`flex-1 text-white text-base font-bold py-3 rounded-lg shadow-lg transition flex items-center justify-center gap-2 ${
                      lessonQuizzes.length > 0
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 hover:scale-105 transform cursor-pointer'
                        : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Zap className={`w-5 h-5 ${lessonQuizzes.length > 0 ? 'text-yellow-300' : 'text-gray-200'}`} />
                    {lessonQuizzes.length > 0 ? 'بدء الاختبار' : 'لا يوجد اختبار'}
                  </button>
                )}

                <button
                  onClick={handleNextLesson}
                  disabled={currentIndex === lessons.length - 1}
                  className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {t('next_lesson')}
                  <ChevronLeft className={`w-5 h-5 ${lang === 'en' ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* قسم الكويزات */}
              {lessonQuizzes.length > 0 && (
                <div id="quizzes-section" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full animate-fade-in-up">
                  {lessonQuizzes.map((quiz, qIdx) =>
                    quiz.has_attempted ? (
                      <div
                        key={quiz.quiz_id || quiz.id || qIdx}
                        role="status"
                        className="text-white text-base font-bold py-3 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 bg-green-600 cursor-default opacity-90 select-none"
                      >
                        <Zap className="w-5 h-5 text-green-200" />
                        تم الاختبار - النتيجة: {quiz.score != null ? `${quiz.score}%` : '—'}
                      </div>
                    ) : (
                      <button
                        type="button"
                        key={quiz.quiz_id || quiz.id || qIdx}
                        onClick={() => {
                          if (!isLoggedIn) {
                            navigate('/login?redirect=' + encodeURIComponent(window.location.pathname), { replace: true });
                            return;
                          }
                          const qId = quiz.quiz_id || quiz.id;
                          navigate(`/quiz/${routeLessonId}/${activeTeacher}/${qId}`);
                        }}
                        className="text-white text-base font-bold py-3 px-4 rounded-lg shadow-md transition flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 transform hover:-translate-y-0.5 cursor-pointer"
                      >
                        <Zap className="w-5 h-5 text-yellow-300" />
                        {lessonQuizzes.length > 1 ? `بدء اختبار ${qIdx + 1}` : 'بدء الاختبار'}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* وصف الدرس */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-700 pb-2">وصف الدرس</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                {currentLesson.description || 'لا يوجد وصف متاح لهذا الدرس.'}
              </p>
              
              {currentLesson.chapter && (
                <div className="bg-blue-50 border-r-4 border-[#103B66] p-4 rounded-lg mb-6">
                  <h4 className="font-bold text-[#103B66] mb-2">الفصل:</h4>
                  <p className="text-lg text-gray-800">{currentLesson.chapter}</p>
                </div>
              )}

              <div>
                <h4 className="font-bold text-gray-800 mb-3">معلومات الدرس:</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>المدة: {currentLesson.duration}</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>الحالة: {currentLesson.completed ? 'مكتمل' : 'قيد التنفيذ'}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 3. القائمة الجانبية (محتوى الكورس) */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 sticky top-24">
              <div className="p-4 border-b dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-white">محتويات الكورس</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{totalCount} {t('lessons_tab')} • {course.subjectName}</p>
              </div>
              
              <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {lessons.map((lesson) => {
                  const isCurrent = lesson.id === currentLesson.id;
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => setCurrentLesson(lesson)}
                      className={`p-3 rounded-lg border-2 transition-all cursor-pointer flex items-start gap-3 group ${
                        isCurrent
                          ? "border-[#103B66] bg-blue-50"
                          : lesson.completed
                          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                          : "border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 dark:bg-gray-700/30"
                      }`}
                    >
                      {/* رقم الدرس أو علامة الصح */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        lesson.completed ? "bg-green-500 text-white" : 
                        isCurrent ? "bg-[#103B66] text-white" : "bg-gray-200 text-gray-600"
                      }`}>
                        {lesson.completed ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-sm font-bold">{lesson.id}</span>}
                      </div>

                      <div className="flex-1">
                        <h4 className={`font-bold text-sm ${isCurrent ? "text-[#103B66]" : "text-gray-700 dark:text-gray-200"}`}>
                          {lesson.title}
                        </h4>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">{lesson.duration}</span>
                          {isCurrent && <span className="text-[10px] bg-[#103B66] text-white px-2 py-0.5 rounded-full">جاري المشاهدة</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* شريط التقدم */}
                <div className="mt-6 bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                     <span className="font-bold text-gray-600 dark:text-gray-300">{t('overall_progress')}</span>
                     <span className="font-bold text-[#103B66]">{progressPercent}%</span>
                  </div>
                  <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#103B66] rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
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
