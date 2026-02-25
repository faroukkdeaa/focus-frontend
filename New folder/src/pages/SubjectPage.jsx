import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, BookOpen, PlayCircle, Loader2, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Subject page: يستخدم db.json (json-server) كمحاكاة للـ API.
 * عندما يكون الباكند جاهزاً، غيّر الرابط فقط إلى: http://localhost:8000/api/subjects/:subjectId
 */
const SubjectPage = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const { t, lang } = useLanguage();
  const [subject, setSubject] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // الاتصال بـ json-server (db.json) - جلب بيانات المادة والدروس
        // عندما يكون الباكند جاهزاً، غيّر الروابط فقط
        // const token = localStorage.getItem('token');
        
        // جلب بيانات المادة من /subjects
        const subjectResponse = await axios.get(`http://localhost:3001/subjects/${subjectId}`, {
          headers: {
            // Authorization: `Bearer ${token}` // فعّل هذا عندما يكون الباكند جاهزاً
          }
        });

        // جلب الدروس من /courses بناءً على subjectId
        const coursesResponse = await axios.get(`http://localhost:3001/courses?subjectId=${subjectId}`, {
          headers: {
            // Authorization: `Bearer ${token}` // فعّل هذا عندما يكون الباكند جاهزاً
          }
        });

        if (cancelled) return;

        const subjectData = subjectResponse.data;
        const courseData = coursesResponse.data && coursesResponse.data.length > 0 
          ? coursesResponse.data[0] 
          : null;

        setSubject({
          id: subjectData.id,
          name: subjectData.name,
          progress: subjectData.progress,
          totalLessons: courseData?.totalLessons || subjectData.lessons || 0,
        });
        setLessons(courseData?.lessons || []);
      } catch (err) {
        if (!cancelled) {
          const message = err.response?.data?.message || err.message || 'تعذر تحميل المادة.';
          setError(message);
          console.error("SubjectPage error:", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [subjectId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-[#103B66] font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-lg font-bold">{t('loading')}</p>
      </div>
    );
  }

  const displayName = subject?.name || subjectId || 'المادة';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-[#103B66] transition font-bold"
            >
              <ArrowRight className={`w-5 h-5 ${lang === 'en' ? 'rotate-180' : ''}`} />
              {t('back_to_dashboard')}
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-[#103B66] p-2 rounded-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-[#103B66]">{displayName}</h1>
            </div>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-center">
            {error}
          </div>
        )}

        {subject && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{displayName}</h2>
              {subject.totalLessons != null && (
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {subject.totalLessons} {t('lessons_tab')}
                </span>
              )}
            </div>
            {subject.progress != null && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <span>{t('subject_progress')}</span>
                  <span>{subject.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-[#103B66] rounded-full transition-all"
                    style={{ width: `${subject.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#103B66]" />
          {t('lessons_tab')}
        </h3>

        {lessons.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
            <PlayCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">{t('no_lessons')}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {lessons.map((lesson, idx) => (
              <li key={lesson.id ?? idx}>
                <button
                  onClick={() => navigate('/course-details', { state: { lesson, subjectId } })}
                  className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4 text-right hover:shadow-md dark:hover:bg-gray-700 transition"
                >
                  <span className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                    <PlayCircle className="w-5 h-5 text-[#103B66]" />
                  </span>
                  <span className="flex-1 font-bold text-gray-800 dark:text-white">{lesson.title ?? `${t('lessons_tab')} ${idx + 1}`}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};

export default SubjectPage;
