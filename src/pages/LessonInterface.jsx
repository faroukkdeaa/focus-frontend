import { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/api';
import { ArrowRight, Play, Pause, Volume2, Settings, ChevronLeft, ChevronRight, CheckCircle2, User, Loader2 } from "lucide-react";
import { useLanguage } from '../context/LanguageContext';
import { MOCK_API, REAL_TO_MOCK_SUBJECT } from '../utils/subjectMapping';

// يحلل رابط الفيديو ويحدد نوعه (youtube / vimeo / direct / null)
const parseVideoUrl = (url) => {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0` };
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return { type: 'direct' };
  return null; // رابط غير معروف
};

const LessonInterface = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLanguage();
  
  // 1. حالات التحكم (State)
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTeacher, setActiveTeacher] = useState("teacher1");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completingLesson, setCompletingLesson] = useState(false);
  const [lessonCompleteToast, setLessonCompleteToast] = useState(false);

  // بيانات من الـ API
  const [teachers, setTeachers] = useState([]);
  const [teacherPage, setTeacherPage] = useState(0); // للـ slider
  const TEACHERS_PER_PAGE = 3;
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set()); // per-user
  const [currentVideo, setCurrentVideo]   = useState(null);     // فيديو الدرس الحالي من real API
  const [videoLoading, setVideoLoading]   = useState(false);

  // جلب lessonId و subjectId و subjectName من location.state
  const lessonId         = location.state?.lesson?.id  || 1;
  const subjectId        = location.state?.subjectId   || 1;
  const stateSubjectName = location.state?.subjectName ?? ''; // للـ mock fallback

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // ── helper: يحوّل درس real API لشكل موحد ──────────────────────────
        const mapLesson = (l, done) => ({
          id:          l.id,
          title:       l.title ?? l.name ?? `Lesson ${l.id}`,
          duration:    l.duration ?? '--',
          chapter:     l.chapter ?? '',
          description: l.description ?? '',
          completed:   done.has(l.id),
        });

        // 1. مدرسو المادة — real API
        let mappedTeachers = [];
        try {
          const teachersResponse = await api.get(`/subjects/${subjectId}/teachers`);
          const rawTeachers = teachersResponse.data?.teachers || teachersResponse.data || [];
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

        // 2. تقدم المستخدم — من localStorage
        const completionData = JSON.parse(localStorage.getItem('lessonCompletions') || '{}');
        const doneSet = new Set(
          Object.keys(completionData)
            .filter(k => completionData[k]?.subjectId === String(subjectId) && completionData[k]?.completed)
            .map(k => Number(k))
        );
        setCompletedIds(doneSet);

        // 3. ابحث عن أول مدرس عنده دروس (جرّب أول 10 مدرسين)
        let finalLessons = [];
        let activeTeacherData = null;
        let subjectDisplayName = stateSubjectName;
        const teachersToTry = mappedTeachers.slice(0, 10);

        for (const teacher of teachersToTry) {
          try {
            const lessonsRes = await api.get(`/teachers/${teacher.id}/lessons`);
            const rawLessons = lessonsRes.data?.lessons || lessonsRes.data || [];
            if (rawLessons.length > 0) {
              finalLessons = rawLessons.map(l => mapLesson(l, doneSet));
              activeTeacherData = teacher;
              subjectDisplayName = teacher.subject || stateSubjectName;
              console.log(`✅ Found teacher with lessons: ${teacher.id} (${rawLessons.length} lessons)`);
              break;
            }
          } catch {
            // جرّب المدرس التالي
          }
        }

        // لو مفيش مدرس عنده دروس، استخدم أول مدرس
        if (!activeTeacherData && mappedTeachers.length > 0) {
          activeTeacherData = mappedTeachers[0];
        }

        setTeachers(mappedTeachers);
        setActiveTeacher(activeTeacherData?.id ?? null);

        // لو مفيش دروس، الصفحة هتعرض رسالة "لا توجد دروس"

        setLessons(finalLessons);
        setCourse({ subjectName: subjectDisplayName, lessons: finalLessons });
        const target = finalLessons.find(l => l.id === parseInt(lessonId)) || finalLessons[0] || null;
        setCurrentLesson(target);
      } catch (err) {
        console.error("LessonInterface error:", err);
        setError("تعذر تحميل بيانات الدرس.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [subjectId, lessonId, stateSubjectName]);

  // تغيير المدرس وإعادة جلب دروسه — real API أولاً، fallback لـ mock
  const handleTeacherChange = async (teacherId) => {
    if (teacherId === activeTeacher) return;
    setActiveTeacher(teacherId);
    try {
      let newLessons = [];

      // حاول real API
      try {
        const res = await api.get(`/teachers/${teacherId}/lessons`);
        newLessons = (res.data?.lessons || res.data || []).map(l => ({
          id:          l.id,
          title:       l.title ?? l.name ?? `Lesson ${l.id}`,
          duration:    l.duration ?? '--',
          chapter:     l.chapter ?? '',
          description: l.description ?? '',
          completed:   completedIds.has(l.id),
        }));
      } catch (err) {
        console.log('Failed to fetch teacher lessons:', err.message);
      }

      // لو مفيش دروس، الصفحة هتعرض حالة فارغة

      setLessons(newLessons);
      setCourse(prev => ({ ...prev, lessons: newLessons }));
      const target = newLessons.find(l => l.id === parseInt(lessonId)) || newLessons[0] || null;
      setCurrentLesson(target);
    } catch (err) {
      console.error('handleTeacherChange error:', err);
    }
  };

  // جلب فيديو الدرس الحالي من real API
  useEffect(() => {
    if (!currentLesson?.id || !activeTeacher || !subjectId) return;
    let cancelled = false;
    const fetchVideo = async () => {
      setVideoLoading(true);
      setCurrentVideo(null);
      try {
        const res = await api.get(
          `/teachers/${activeTeacher}/lessons/${currentLesson.id}/content`
        );
        if (!cancelled) setCurrentVideo((res.data?.videos || [])[0] ?? null);
      } catch {
        if (!cancelled) setCurrentVideo(null);
      } finally {
        if (!cancelled) setVideoLoading(false);
      }
    };
    fetchVideo();
    return () => { cancelled = true; };
  }, [currentLesson?.id, activeTeacher, subjectId]);

  // حساب التقدم (من بيانات المستخدم)
  const completedCount = completedIds.size;
  const totalCount = lessons.length;
  const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  // التنقل بين الدروس
  const currentIndex    = lessons.findIndex(l => l.id === currentLesson?.id);
  const parsedVideoUrl  = currentVideo ? parseVideoUrl(currentVideo.video_url) : null;

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
            
            {/* التبديل بين المدرسين — Slider */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* شريط السلايدر */}
              <div className="bg-gray-50 dark:bg-gray-700 p-2">
                <div className="flex items-center gap-2">
                  {/* سهم للخلف */}
                  <button
                    onClick={() => setTeacherPage(p => Math.max(0, p - 1))}
                    disabled={teacherPage === 0}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* المدرسون المعروضون في الصفحة الحالية */}
                  <div className="flex flex-1 gap-2 overflow-hidden">
                    {teachers
                      .slice(teacherPage * TEACHERS_PER_PAGE, (teacherPage + 1) * TEACHERS_PER_PAGE)
                      .map((teacher) => (
                        <button
                          key={teacher.id}
                          onClick={() => handleTeacherChange(teacher.id)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg transition-all duration-200 min-w-0 ${
                            activeTeacher === teacher.id
                              ? 'bg-[#103B66] text-white shadow-md'
                              : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'
                          }`}
                        >
                          <div className={`p-1.5 rounded-full shrink-0 ${
                            activeTeacher === teacher.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-500'
                          }`}>
                            <User className="w-4 h-4" />
                          </div>
                          <div className="text-right min-w-0">
                            <p className="font-bold text-sm truncate">{teacher.name}</p>
                            {teacher.rating != null && (
                              <p className={`text-xs ${
                                activeTeacher === teacher.id ? 'text-blue-200' : 'text-gray-400'
                              }`}>⭐ {teacher.rating}</p>
                            )}
                          </div>
                        </button>
                      ))
                    }
                  </div>

                  {/* سهم للأمام */}
                  <button
                    onClick={() => setTeacherPage(p => Math.min(Math.ceil(teachers.length / TEACHERS_PER_PAGE) - 1, p + 1))}
                    disabled={teacherPage >= Math.ceil(teachers.length / TEACHERS_PER_PAGE) - 1}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                {/* مؤشر الصفحات (dots) */}
                {teachers.length > TEACHERS_PER_PAGE && (
                  <div className="flex justify-center gap-1.5 mt-2">
                    {Array.from({ length: Math.ceil(teachers.length / TEACHERS_PER_PAGE) }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setTeacherPage(i)}
                        className={`rounded-full transition-all ${
                          i === teacherPage
                            ? 'w-4 h-1.5 bg-[#103B66] dark:bg-blue-400'
                            : 'w-1.5 h-1.5 bg-gray-300 dark:bg-gray-500 hover:bg-gray-400'
                        }`}
                      />
                    ))}
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
                    src={currentVideo.video_url}
                    className="absolute inset-0 w-full h-full"
                    controls
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
                      {currentVideo?.video_url && (
                        <a
                          href={currentVideo.video_url}
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
            <div className="flex items-center gap-4">
              <button 
                onClick={handlePreviousLesson}
                disabled={currentIndex === 0}
                className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ChevronRight className={`w-5 h-5 ${lang === 'en' ? 'rotate-180' : ''}`} />
                {t('prev_lesson')}
              </button>
              
              {/* زر إتمام الدرس */}
              {completedIds.has(currentLesson?.id) ? (
                <div className="flex-[2] bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 py-3 rounded-lg text-center font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  تمّ الإتمام
                </div>
              ) : (
                <button
                  onClick={handleCompleteLesson}
                  disabled={completingLesson}
                  className="flex-[2] bg-[#103B66] hover:bg-[#0c2d4d] disabled:bg-gray-400 text-white text-base font-bold py-3 rounded-lg shadow-md transition flex items-center justify-center gap-2"
                >
                  {completingLesson ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {completingLesson ? 'جاري الحفظ...' : 'إتمام الدرس'}
                </button>
              )}

              <button 
                onClick={() => navigate('/quiz', { state: { lesson: currentLesson, subjectId, teacherId: activeTeacher, videoId: currentVideo?.video_id } })}
                className="flex-[2] bg-green-600 hover:bg-green-700 text-white text-lg font-bold py-3 rounded-lg shadow-md transition transform hover:-translate-y-0.5"
              >
                {t('start_quiz')}
              </button>
              
              <button 
                onClick={handleNextLesson}
                disabled={currentIndex === lessons.length - 1}
                className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {t('next_lesson')}
                <ChevronLeft className={`w-5 h-5 ${lang === 'en' ? 'rotate-180' : ''}`} />
              </button>
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
