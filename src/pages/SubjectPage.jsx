import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/api';
import {
  ArrowRight, BookOpen, PlayCircle, Loader2, CheckCircle2,
  ChevronDown, ChevronUp, Clock, AlertTriangle, RefreshCcw, Zap,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { MOCK_API, REAL_TO_MOCK_SUBJECT, SUBJECT_ICONS } from '../utils/subjectMapping';

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

// ── Unit card (self-contained, collapsible) ───────────────────────────────────

const UnitCard = ({ unit, subjectId, onStartLesson, onQuiz }) => {
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
                  className={`text-xs px-3 py-1 rounded-lg font-bold transition
                    ${lesson.completed
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      : 'bg-[#103B66] text-white hover:bg-[#0c2d4d]'}`}
                >
                  {lesson.completed ? 'إعادة' : 'ابدأ'}
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

  const [subject,        setSubject]        = useState(null);
  const [units,          setUnits]          = useState([]);
  const [activeTeacherId, setActiveTeacherId] = useState(null); // محتاجلـ Quiz
  const [loadingSubject, setLoadingSubject] = useState(true);
  const [loadingUnits,   setLoadingUnits]   = useState(true);
  const [errorSubject,   setErrorSubject]   = useState(null);
  const [errorUnits,     setErrorUnits]     = useState(null);

  // ── Fetch subject basic info from real backend ──────────────────────────
  const fetchSubject = useCallback(async () => {
    setLoadingSubject(true);
    setErrorSubject(null);
    try {
      const { data } = await api.get('/subjects');
      const found = data.find(s => String(s.id) === String(subjectId));
      if (!found) throw new Error('subject not found');
      setSubject({
        id:     found.id,
        name:   found.title,
        code:   found.code,
        icon:   SUBJECT_ICONS[found.code] ?? '📚',
        lessons: 0,
      });
    } catch {
      setErrorSubject('تعذّر تحميل بيانات المادة.');
    } finally {
      setLoadingSubject(false);
    }
  }, [subjectId]);

  // ── Fetch units from /subjects/{id}/subtopics ──────────────────────────
  const fetchUnits = useCallback(async () => {
    setLoadingUnits(true);
    setErrorUnits(null);
    try {
      let unitsData = [];
      let usedTeacherId = null;

      // 1. /subjects/{id}/subtopics — بيرجع subject مع units → lessons → subtopics
      try {
        const { data } = await api.get(`/subjects/${subjectId}/subtopics`);
        // الـ API بترجع الـ subject object مباشرة مع units كـ property
        const rawUnits = data?.units || data || [];
        if (Array.isArray(rawUnits) && rawUnits.length > 0) {
          unitsData = rawUnits.map((u, idx) => ({
            id:    u.id,
            title: u.title,
            order: idx + 1,
            lessons: (u.lessons || []).map(l => ({
              id:          l.id,
              title:       l.title,
              duration:    l.duration ?? '--',
              chapter:     u.title,
              description: l.description ?? '',
              completed:   false,
            })),
          }));
        }
      } catch (err) {
        console.log('subtopics API error:', err.message);
        /* fallback below */
      }

      // 2. fallback: /subjects/{id}/units → /units/{id}/lessons
      if (unitsData.length === 0) {
        try {
          const unitsRes = await api.get(`/subjects/${subjectId}/units`);
          const rawUnits = unitsRes.data?.units || unitsRes.data || [];
          if (Array.isArray(rawUnits) && rawUnits.length > 0) {
            // جلب الدروس لكل وحدة
            const unitsWithLessons = await Promise.all(
              rawUnits.map(async (u, idx) => {
                try {
                  const lessonsRes = await api.get(`/units/${u.id}/lessons`);
                  const lessons = lessonsRes.data?.lessons || lessonsRes.data || [];
                  return {
                    id: u.id,
                    title: u.title,
                    order: idx + 1,
                    lessons: lessons.map(l => ({
                      id: l.id,
                      title: l.title,
                      duration: l.duration ?? '--',
                      chapter: u.title,
                      description: l.description ?? '',
                      completed: false,
                    })),
                  };
                } catch {
                  return { id: u.id, title: u.title, order: idx + 1, lessons: [] };
                }
              })
            );
            unitsData = unitsWithLessons;
          }
        } catch (err) {
          console.log('units API error:', err.message);
        }
      }

      // 3. fallback: teachers → lessons (ابحث عن مدرس عنده دروس)
      if (unitsData.length === 0) {
        try {
          const teachersRes = await api.get(`/subjects/${subjectId}/teachers`);
          const allTeachers = teachersRes.data?.teachers || teachersRes.data || [];
          // جرّب أول 10 مدرسين لحد ما نلاقي واحد عنده دروس
          const teachersToTry = allTeachers.slice(0, 10);

          for (const teacher of teachersToTry) {
            const teacherId = teacher.teacher_id || teacher.id;
            try {
              const lessonsRes = await api.get(`/teachers/${teacherId}/lessons`);
              const rawLessons = lessonsRes.data?.lessons || lessonsRes.data || [];

              if (rawLessons.length > 0) {
                usedTeacherId = teacherId;
                console.log(`✅ Found teacher with lessons: ${teacherId} (${rawLessons.length} lessons)`);
                const chapterMap = {};
                rawLessons.forEach(l => {
                  const key = l.chapter || 'الوحدة الأولى';
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
                    title: l.title ?? l.name ?? `Lesson ${l.id}`,
                    duration: l.duration ?? '--',
                    chapter: l.chapter ?? '',
                    description: l.description ?? '',
                    completed: false,
                  });
                });
                unitsData = Object.values(chapterMap);
                break; // لقينا مدرس عنده دروس
              }
            } catch {
              // جرّب المدرس التالي
            }
          }
        } catch (err) {
          console.log('teachers API error:', err.message);
        }
      }

      // 4. جيب أول مدرس عنده دروس لصفحة الكويز
      if (!usedTeacherId) {
        try {
          const teachersRes = await api.get(`/subjects/${subjectId}/teachers`);
          const allTeachers = teachersRes.data?.teachers || teachersRes.data || [];
          // جرّب أول 10 مدرسين
          for (const teacher of allTeachers.slice(0, 10)) {
            const tid = teacher.teacher_id || teacher.id;
            try {
              const lessonsRes = await axios.get(`teachers/${tid}/lessons`);
              const lessons = lessonsRes.data?.lessons || lessonsRes.data || [];
              if (lessons.length > 0) {
                usedTeacherId = tid;
                break;
              }
            } catch { /* جرّب التالي */ }
          }
          // fallback لأول مدرس لو مفيش حد عنده دروس
          if (!usedTeacherId && allTeachers.length > 0) {
            usedTeacherId = allTeachers[0].teacher_id || allTeachers[0].id;
          }
        } catch { /* ignore */ }
      }
      setActiveTeacherId(usedTeacherId);

      // 5. لو مفيش data، الصفحة هتعرض "لا توجد دروس" (بدون mock fallback)

      // 6. دمج تقدم المستخدم من localStorage
      const completionData = JSON.parse(localStorage.getItem('lessonCompletions') || '{}');
      const completedSet = new Set(
        Object.keys(completionData)
          .filter(k => completionData[k]?.subjectId === String(subjectId) && completionData[k]?.completed)
          .map(k => Number(k))
      );

      const merged = unitsData.map(unit => ({
        ...unit,
        lessons: (unit.lessons || []).map(lesson => ({
          ...lesson,
          completed: completedSet.has(lesson.id),
        })),
      }));

      setUnits(merged);

      // حدّث عدد الدروس في subject
      const totalLessonCount = merged.reduce((s, u) => s + u.lessons.length, 0);
      setSubject(prev => prev ? { ...prev, lessons: totalLessonCount } : prev);
    } catch {
      setErrorUnits('تعذّر تحميل وحدات المادة.');
    } finally {
      setLoadingUnits(false);
    }
  }, [subjectId]);

  useEffect(() => {
    fetchSubject();
    fetchUnits();
  }, [fetchSubject, fetchUnits]);

  // ── Derived stats (computed from fetched units) ───────────────────────────
  const totalLessons     = units.reduce((s, u) => s + u.lessons.length, 0);
  const completedLessons = units.reduce((s, u) => s + u.lessons.filter(l => l.completed).length, 0);
  const overallProgress  = totalLessons
    ? Math.round((completedLessons / totalLessons) * 100)
    : (subject?.progress ?? 0);

  // ── Navigation helpers ────────────────────────────────────────────────────
  const handleStartLesson = (lesson, sid) =>
    navigate('/course-details', { state: { lesson, subjectId: sid, subjectName: subject?.name } });

  const handleQuiz = (lesson, sid) =>
    navigate('/quiz', { state: { lesson, subjectId: sid, teacherId: activeTeacherId, subjectName: subject?.name } });

  // ── Full-page loader (both sections loading simultaneously on first mount) ─
  if (loadingSubject && loadingUnits) {
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

      {/* ═══ HEADER ═══ */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-[#103B66] dark:hover:text-white transition font-bold"
            >
              <ArrowRight className={`w-5 h-5 ${lang === 'en' ? 'rotate-180' : ''}`} />
              {t('back_to_dashboard')}
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
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{subject.name}</h2>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {completedLessons}/{totalLessons || subject.lessons} {t('lessons_tab')}
                </span>
                <span className="font-bold text-[#103B66] dark:text-blue-400">{overallProgress}%</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-[#103B66] rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <div className="flex gap-5 mt-3 text-xs text-gray-400 dark:text-gray-500 font-medium">
              <span>✅ {completedLessons} درس مكتمل</span>
              <span>📚 {(totalLessons || subject.lessons) - completedLessons} درس متبقٍ</span>
              <span>📦 {units.length} وحدة</span>
            </div>
          </div>
        ) : null}

        {/* ═══ SECTION 2 — Units ═══ */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
            وحدات المادة
          </h3>

          {errorUnits ? (
            <SectionError message={errorUnits} onRetry={fetchUnits} />
          ) : loadingUnits ? (
            <SectionLoader rows={3} />
          ) : units.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-10 text-center">
              <PlayCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">{t('no_lessons')}</p>
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
                />
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default SubjectPage;