import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { publicApi } from '../api/api';
import {
  ArrowRight, BookOpen, PlayCircle, Loader2, CheckCircle2,
  ChevronDown, ChevronUp, Clock, AlertTriangle, RefreshCcw, Zap,
  Home, LogIn, User, GraduationCap, ChevronLeft, Users,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SUBJECT_ICONS } from '../utils/subjectMapping';
import AuthModal from '../components/AuthModal';

// ── Sub-components ─────────────────────────────────────────────────────────────

const SectionLoader = ({ rows = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse" />
    ))}
  </div>
);

const SectionError = ({ message, onRetry }) => (
  <div className="py-8 flex flex-col items-center gap-3 text-center">
    <AlertTriangle className="w-7 h-7 text-amber-400" />
    <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    <button
      onClick={onRetry}
      className="flex items-center gap-1.5 text-sm font-bold text-[#103B66] dark:text-blue-400 hover:underline"
    >
      <RefreshCcw className="w-3.5 h-3.5" /> إعادة المحاولة
    </button>
  </div>
);

// ── Teacher Card ───────────────────────────────────────────────────────────────

const TeacherCard = ({ teacher, isSelected, onSelect }) => {
  const colors = [
    'from-blue-500 to-blue-700',
    'from-purple-500 to-purple-700',
    'from-green-500 to-green-700',
    'from-orange-500 to-orange-700',
    'from-pink-500 to-pink-700',
    'from-teal-500 to-teal-700',
  ];
  const colorIndex = (teacher.id || 0) % colors.length;
  
  return (
    <button
      onClick={() => onSelect(teacher)}
      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-right w-full
        ${isSelected 
          ? 'border-[#103B66] dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
        }`}
    >
      <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-black text-lg shrink-0 shadow-md`}>
        {(teacher.name || 'م').charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 dark:text-white text-base truncate">
          {teacher.name || `مدرس ${teacher.id}`}
        </p>
        {teacher.lessons_count !== undefined && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            📚 {teacher.lessons_count} درس
          </p>
        )}
      </div>
      <ChevronLeft className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
    </button>
  );
};

// ── Unit card (self-contained, collapsible) ───────────────────────────────────

const UnitCard = ({ unit, subjectId, onStartLesson, onQuiz, isLoggedIn }) => {
  const [expanded, setExpanded] = useState(false);

  const completedCount = unit.lessons.filter(l => l.completed).length;
  const totalCount     = unit.lessons.length;
  const unitProgress   = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllDone      = totalCount > 0 && completedCount === totalCount;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border transition-all
      ${isAllDone ? 'border-green-200 dark:border-green-800' : 'border-gray-100 dark:border-gray-700'}`}
    >
      {/* ── Unit header ── */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center gap-4 p-4 text-right hover:bg-gray-50 dark:hover:bg-gray-700/40 transition"
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0
          ${isAllDone
            ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
            : 'bg-blue-100 dark:bg-blue-900/40 text-[#103B66] dark:text-blue-400'}`}
        >
          {isAllDone ? <CheckCircle2 className="w-4 h-4" /> : unit.order}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 dark:text-white text-sm leading-snug">{unit.title}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {completedCount}/{totalCount} درس
            </span>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden max-w-[100px]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isAllDone ? 'bg-green-500' : 'bg-[#103B66]'}`}
                style={{ width: `${unitProgress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{unitProgress}%</span>
          </div>
        </div>

        {expanded
          ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        }
      </button>

      {/* ── Lesson rows ── */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700/40">
          {unit.lessons.map((lesson, idx) => (
            <div
              key={lesson.id ?? idx}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 dark:hover:bg-gray-700/20 transition"
            >
              {/* Status icon */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                ${lesson.completed
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-blue-50 dark:bg-blue-900/20 text-[#103B66] dark:text-blue-400'}`}
              >
                {lesson.completed
                  ? <CheckCircle2 className="w-3.5 h-3.5" />
                  : <PlayCircle className="w-3.5 h-3.5" />
                }
              </div>

              {/* Title + duration */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate
                  ${lesson.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-white'}`}
                >
                  {lesson.title}
                </p>
                {lesson.duration && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {lesson.duration}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {lesson.quizId && (
                  <button
                    onClick={() => onQuiz(lesson, subjectId)}
                    className="text-xs px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1
                      bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400
                      hover:bg-violet-200 dark:hover:bg-violet-900/50"
                  >
                    <Zap className="w-3 h-3" /> اختبار
                  </button>
                )}
                <button
                  onClick={() => onStartLesson(lesson, subjectId)}
                  className={`text-xs px-3 py-1 rounded-lg font-bold transition flex items-center gap-1
                    ${lesson.completed
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      : 'bg-[#103B66] text-white hover:bg-[#0c2d4d]'}`}
                >
                  {!isLoggedIn && <LogIn className="w-3 h-3" />}
                  {lesson.completed ? 'إعادة' : (isLoggedIn ? 'ابدأ' : 'سجّل للبدء')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const SubjectPage = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const { t, lang } = useLanguage();

  // ── State ──
  const [subject,         setSubject]         = useState(null);
  const [teachers,        setTeachers]        = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [units,           setUnits]           = useState([]);
  const [loadingSubject,  setLoadingSubject]  = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingLessons,  setLoadingLessons]  = useState(false);
  const [errorSubject,    setErrorSubject]    = useState(null);
  const [errorTeachers,   setErrorTeachers]   = useState(null);
  const [errorLessons,    setErrorLessons]    = useState(null);

  // ── Auth Modal State ──
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    type: 'lesson', // 'lesson' | 'quiz'
    lessonTitle: '',
    pendingAction: null, // { lesson, subjectId, type: 'lesson'|'quiz' }
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
      setSubject({ id: subjectId, name: `مادة ${subjectId}`, code: 'DEFAULT', icon: '📚' });
    } finally {
      setLoadingSubject(false);
    }
  }, [subjectId]);

  // ── Fetch teachers for this subject ──
  // ── Helper: fetch all lesson IDs that belong to the current subject ──
  const fetchSubjectLessonIds = useCallback(async () => {
    try {
      // 1. Fetch subject units
      const unitsRes = await publicApi.get(`/subjects/${subjectId}/units`);
      const unitsRaw = unitsRes.data?.data || unitsRes.data || [];
      const unitsList = Array.isArray(unitsRaw) ? unitsRaw : [];

      // 2. Fetch lessons for each unit
      const allLessons = await Promise.all(
        unitsList.map(async (unit) => {
          try {
            const lessonsRes = await publicApi.get(`/units/${unit.id}/lessons`);
            const lessonsRaw = lessonsRes.data?.data || lessonsRes.data || [];
            const lessons = Array.isArray(lessonsRaw) ? lessonsRaw : [];
            return lessons.map(l => ({ ...l, _unitTitle: unit.title }));
          } catch {
            return [];
          }
        })
      );

      return allLessons.flat();
    } catch {
      return [];
    }
  }, [subjectId]);

  const fetchTeachers = useCallback(async () => {
    setLoadingTeachers(true);
    setErrorTeachers(null);
    try {
      const { data } = await publicApi.get(`/subjects/${subjectId}/teachers`);
      // API response: { teachers: { data: [...] } } (paginated inside teachers key)
      const teachersRaw = data?.teachers?.data || data?.teachers || data?.data || data || [];
      const teachersList = Array.isArray(teachersRaw) ? teachersRaw : [];

      // Get subject-scoped lesson IDs
      const subjectLessons = await fetchSubjectLessonIds();
      const subjectLessonIds = new Set(subjectLessons.map(l => l.id));
      
      // Get lessons count for each teacher (only counting subject-scoped lessons)
      const teachersWithCount = await Promise.all(
        teachersList.map(async (teacher) => {
          const teacherId = teacher.teacher_id || teacher.id;
          try {
            const lessonsRes = await publicApi.get(`/teachers/${teacherId}/lessons`);
            // API response: { teacher: {...}, lessons: { data: [...] } }
            const lessonsRaw = lessonsRes.data?.lessons?.data || lessonsRes.data?.lessons || lessonsRes.data?.data || lessonsRes.data || [];
            const allLessons = Array.isArray(lessonsRaw) ? lessonsRaw : [];
            // فلترة: فقط الدروس التابعة لهذه المادة
            const scopedLessons = allLessons.filter(l => subjectLessonIds.has(l.id));
            return {
              id: teacherId,
              name: teacher.teacher_name || teacher.name || `مدرس ${teacherId}`,
              lessons_count: scopedLessons.length,
            };
          } catch {
            return {
              id: teacherId,
              name: teacher.teacher_name || teacher.name || `مدرس ${teacherId}`,
              lessons_count: 0,
            };
          }
        })
      );
      
      // Filter teachers with lessons and sort by lessons count
      const filtered = teachersWithCount.filter(t => t.lessons_count > 0);
      filtered.sort((a, b) => b.lessons_count - a.lessons_count);
      // لو مفيش مدرسين عندهم دروس، اعرض كلهم (حتى اللي بدون دروس)
      setTeachers(filtered.length > 0 ? filtered : teachersWithCount);
    } catch {
      setErrorTeachers('تعذّر تحميل قائمة المدرسين. تأكد من تشغيل السيرفر.');
    } finally {
      setLoadingTeachers(false);
    }
  }, [subjectId, fetchSubjectLessonIds]);

  // ── Fetch lessons for selected teacher (scoped to current subject) ──
  const fetchTeacherLessons = useCallback(async (teacherId) => {
    setLoadingLessons(true);
    setErrorLessons(null);
    setUnits([]);
    
    try {
      // 1. Get subject lessons (organized by unit/chapter)
      const subjectLessons = await fetchSubjectLessonIds();
      const subjectLessonIds = new Set(subjectLessons.map(l => l.id));

      // 2. Get teacher's lessons
      const { data } = await publicApi.get(`/teachers/${teacherId}/lessons`);
      const lessonsRaw = data?.lessons?.data || data?.lessons || data?.data || data || [];
      const teacherLessons = Array.isArray(lessonsRaw) ? lessonsRaw : [];

      // 3. Cross-reference: only keep lessons the teacher has AND that belong to this subject
      const teacherLessonIds = new Set(teacherLessons.map(l => l.id));
      const rawLessons = subjectLessons
        .filter(l => teacherLessonIds.has(l.id))
        .map(sl => {
          // Merge with any extra data from teacher's response
          const teacherData = teacherLessons.find(tl => tl.id === sl.id) || {};
          return { ...sl, ...teacherData, _unitTitle: sl._unitTitle };
        });
      
      // Group lessons by unit (chapter)
      const chapterMap = {};
      rawLessons.forEach(l => {
        const key = l._unitTitle || l.chapter || 'دروس عامة';
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
          title: l.title ?? l.name ?? `درس ${l.id}`,
          duration: l.duration ?? '--',
          chapter: key,
          description: l.description ?? '',
          completed: false,
          quizId: l.quiz_id || null,
        });
      });
      
      // Merge with localStorage completion data
      const completionData = JSON.parse(localStorage.getItem('lessonCompletions') || '{}');
      const completedSet = new Set(
        Object.keys(completionData)
          .filter(k => completionData[k]?.subjectId === String(subjectId) && completionData[k]?.completed)
          .map(k => Number(k))
      );
      
      const unitsData = Object.values(chapterMap).map(unit => ({
        ...unit,
        lessons: unit.lessons.map(lesson => ({
          ...lesson,
          completed: completedSet.has(lesson.id),
        })),
      }));
      
      setUnits(unitsData);
    } catch {
      setErrorLessons('تعذّر تحميل دروس المدرس.');
    } finally {
      setLoadingLessons(false);
    }
  }, [subjectId, fetchSubjectLessonIds]);

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
  const totalLessons     = units.reduce((s, u) => s + u.lessons.length, 0);
  const completedLessons = units.reduce((s, u) => s + u.lessons.filter(l => l.completed).length, 0);
  const overallProgress  = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;

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
    navigate('/course-details', { state: { lesson, subjectId: sid, subjectName: subject?.name } });
  };

  const handleQuiz = (lesson, sid) => {
    if (!isLoggedIn) {
      // عرض Modal بدلاً من التوجيه المباشر
      openAuthModal('quiz', lesson);
      // حفظ البيانات في sessionStorage للعودة بعد تسجيل الدخول
      sessionStorage.setItem('pendingLesson', JSON.stringify({
        type: 'quiz',
        lesson,
        subjectId: sid,
        subjectName: subject?.name,
        teacherId: selectedTeacher?.id,
      }));
      return;
    }
    navigate('/quiz', { state: { lesson, subjectId: sid, teacherId: selectedTeacher?.id, subjectName: subject?.name } });
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
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-[#103B66] font-['Cairo']"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-lg font-bold">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* ═══ GUEST BANNER ═══ */}
      {!isLoggedIn && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-b border-blue-200 dark:border-blue-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
              👋 {t('guest_banner_text') || 'سجّل دخولك لحفظ تقدمك ومتابعة الدروس'}
            </p>
            <button
              onClick={() => navigate('/login?redirect=' + encodeURIComponent(window.location.pathname))}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold
                bg-[#103B66] dark:bg-blue-600 text-white hover:bg-[#0c2d4d] 
                dark:hover:bg-blue-700 transition-colors shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              {t('login')}
            </button>
          </div>
        </div>
      )}

      {/* ═══ SUB-HEADER ═══ */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-[#103B66] dark:hover:text-white transition font-bold"
            >
              <ArrowRight className={`w-5 h-5 ${lang === 'en' ? 'rotate-180' : ''}`} />
              {selectedTeacher 
                ? (t('back_to_teachers') || 'اختر مدرس آخر')
                : (isLoggedIn ? t('back_to_dashboard') : (t('back_to_home') || 'الرئيسية'))
              }
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-[#103B66] dark:bg-blue-600 p-2 rounded-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-[#103B66] dark:text-white">
                {loadingSubject ? '…' : (subject?.name ?? subjectId)}
              </h1>
            </div>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ═══ SECTION 1 — Subject info card ═══ */}
        {errorSubject ? (
          <SectionError message={errorSubject} onRetry={fetchSubject} />
        ) : loadingSubject ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-4" />
            <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700/60 rounded-full animate-pulse" />
          </div>
        ) : subject ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{subject.icon}</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{subject.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {teachers.length > 0 
                      ? `${teachers.length} مدرس متاح`
                      : 'جاري تحميل المدرسين...'
                    }
                  </p>
                </div>
              </div>
              {selectedTeacher && totalLessons > 0 && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {completedLessons}/{totalLessons} {t('lessons_tab') || 'درس'}
                  </span>
                  <span className="font-bold text-[#103B66] dark:text-blue-400">{overallProgress}%</span>
                </div>
              )}
            </div>
            {selectedTeacher && totalLessons > 0 && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-[#103B66] rounded-full transition-all duration-500"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* ═══ SECTION 2 — Teachers List (when no teacher selected) ═══ */}
        {!selectedTeacher && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
              {t('choose_teacher') || 'اختر مدرساً لعرض دروسه'}
            </h3>

            {errorTeachers ? (
              <SectionError message={errorTeachers} onRetry={fetchTeachers} />
            ) : loadingTeachers ? (
              <SectionLoader rows={4} />
            ) : teachers.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-10 text-center">
                <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  {t('no_teachers') || 'لا يوجد مدرسون متاحون لهذه المادة حالياً'}
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {teachers.map(teacher => (
                  <TeacherCard
                    key={teacher.id}
                    teacher={teacher}
                    isSelected={false}
                    onSelect={handleSelectTeacher}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ SECTION 3 — Selected Teacher's Lessons ═══ */}
        {selectedTeacher && (
          <div>
            {/* Selected teacher info */}
            <div className="bg-gradient-to-r from-[#103B66] to-blue-600 dark:from-blue-700 dark:to-blue-500 rounded-xl p-4 mb-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-black shrink-0">
                  {selectedTeacher.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">{selectedTeacher.name}</p>
                  <p className="text-blue-100 text-sm">
                    📚 {selectedTeacher.lessons_count} درس متاح
                  </p>
                </div>
                <button
                  onClick={() => handleSelectTeacher(selectedTeacher)}
                  className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition text-sm font-bold"
                >
                  تغيير المدرس
                </button>
              </div>
            </div>

            {/* Lessons */}
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
              {t('lessons_catalog') || 'كتالوج الدروس'}
            </h3>

            {errorLessons ? (
              <SectionError message={errorLessons} onRetry={() => fetchTeacherLessons(selectedTeacher.id)} />
            ) : loadingLessons ? (
              <SectionLoader rows={3} />
            ) : units.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-10 text-center">
                <PlayCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">{t('no_lessons') || 'لا توجد دروس متاحة'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {units.map(unit => (
                  <UnitCard
                    key={unit.id}
                    unit={unit}
                    subjectId={subjectId}
                    onStartLesson={handleStartLesson}
                    onQuiz={handleQuiz}
                    isLoggedIn={isLoggedIn}
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