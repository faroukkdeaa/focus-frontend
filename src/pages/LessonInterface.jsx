import { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/api';
import { ArrowRight, Play, Pause, Volume2, Settings, ChevronLeft, ChevronRight, CheckCircle2, User, Loader2, Zap } from "lucide-react";
import { useLanguage } from '../context/LanguageContext';

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

  // بيانات من الـ API (single source: /teachers/{teacher}/lessons/{lesson}/content)
  const [teachers, setTeachers] = useState([]);
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set()); // per-user
  const [currentVideo, setCurrentVideo] = useState(null);
  const [lessonQuizzes, setLessonQuizzes] = useState([]);

  // جلب lessonId و subjectId و subjectName و teacherId من location.state
  // ✅ Clean lesson ID - remove any ":1" suffix from hasManyThrough
  const rawLessonId = location.state?.lesson?.id || 1;
  const lessonId = typeof rawLessonId === 'string' && rawLessonId.includes(':') 
    ? parseInt(rawLessonId.split(':')[0], 10) 
    : parseInt(rawLessonId, 10);
  const subjectId        = location.state?.subjectId   || 1;
  const stateSubjectName = location.state?.subjectName ?? ''; // للـ mock fallback
  const stateTeacherName = location.state?.teacherName ?? '';
  const autoScrollToQuiz = location.state?.autoScrollToQuiz ?? false;
  const preSelectedTeacherId = location.state?.teacherId;
  const stateLesson = location.state?.lesson || null;
  const rawTeacherId =
    preSelectedTeacherId ??
    stateLesson?.teacher_id ??
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

  // ✅ Single source of truth fetch
  useEffect(() => {
    let cancelled = false;

    const loadLessonContent = async () => {
      if (!lessonId || !teacherIdForRequest) {
        setError('تعذر تحديد الدرس أو المدرس.');
        setLoading(false);
        return;
      }

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
        const payload = res.data?.data ?? res.data ?? {};
        const teacherPayload = payload?.teacher ?? {};
        const videosData = payload?.videos?.data ?? payload?.videos ?? [];
        const videosList = Array.isArray(videosData) ? videosData : [];

        const firstVideoRaw = videosList?.[0] ? { ...videosList[0] } : null;
        if (firstVideoRaw?.url) firstVideoRaw.url = ensureAbsoluteUrl(firstVideoRaw.url);
        if (firstVideoRaw?.video_url) firstVideoRaw.video_url = ensureAbsoluteUrl(firstVideoRaw.video_url);

        const rawQuizzes = Array.isArray(firstVideoRaw?.quizzes) ? firstVideoRaw.quizzes : [];
        const mappedQuizzes = rawQuizzes.map((quiz, idx) => {
          const q = typeof quiz === 'object' ? quiz : { quiz_id: quiz };
          const qId = q?.quiz_id ?? q?.id ?? idx + 1;
          return {
            id: qId,
            quiz_id: qId,
            teacher_id: teacherPayload?.teacher_id ?? teacherIdForRequest,
            has_attempted: Boolean(q?.attempted ?? q?.has_attempted ?? q?.quiz_attempt),
            score: q?.score ?? null,
          };
        });

        const mappedTeacher = {
          id: teacherPayload?.teacher_id ?? teacherIdForRequest,
          name: teacherPayload?.teacher_name || stateTeacherName || `مدرس ${teacherIdForRequest}`,
          rating: teacherPayload?.rating ?? null,
          subject: teacherPayload?.subject_name || stateSubjectName || '',
        };

        const mappedLesson = {
          id: lessonId,
          title: firstVideoRaw?.lesson_title || stateLesson?.title || `الدرس ${lessonId}`,
          duration: stateLesson?.duration ?? '--',
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
        setCurrentVideo(firstVideoRaw);
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
  const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const mainQuiz = lessonQuizzes?.[0] ?? null;
  const quizData = mainQuiz ? {
    ...mainQuiz,
    has_attempted: Boolean(mainQuiz?.has_attempted),
    score: mainQuiz?.score ?? null
  } : null;

  const routeLessonId = currentLesson?.id ?? lessonId;
  const activeTeacherInfo = teachers.find((t) => String(t.id) === String(activeTeacher));

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

  if (loading) {
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
                {activeTeacherInfo ? (
                  <div className="flex items-center gap-4">
                    {/* أيقونة المدرس */}
                    <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm shrink-0">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* بيانات المدرس */}
                    <div className="flex-1 text-right">
                       <p className="text-xs text-white/80 mb-1">المدرس</p>
                       <h3 className="font-bold text-xl text-white mb-1">
                         {activeTeacherInfo?.name}
                       </h3>
                       {activeTeacherInfo?.rating != null && (
                         <div className="flex items-center gap-2 justify-end">
                           <span className="text-sm text-white/90">
                             ⭐ {activeTeacherInfo?.rating}
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
