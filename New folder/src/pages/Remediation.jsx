import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, BookOpen, PlayCircle, Target, Loader2, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Remediation = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // جلب بيانات نقاط الضعف من json-server
  useEffect(() => {
    const loadRemediationData = async () => {
      try {
        setLoading(true);
        setError(null);

        // جلب بيانات خطة المعالجة من json-server
        const response = await axios.get('http://localhost:3001/remediation');
        if (response.data && response.data.weakTopics) {
          setTopics(response.data.weakTopics);
        }
      } catch (err) {
        console.error("Remediation loading error:", err);
        setError("تعذر تحميل خطة المعالجة. تأكد من تشغيل json-server.");
      } finally {
        setLoading(false);
      }
    };

    loadRemediationData();
  }, []);

  const completedCount = topics.filter((t) => t.completed).length;
  const totalCount = topics.length;
  const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleStartLesson = async (topic) => {
    try {
      // جلب بيانات الدرس من الكورس
      const coursesResponse = await axios.get(`http://localhost:3001/courses?subjectId=${topic.subjectId}`);
      if (coursesResponse.data && coursesResponse.data.length > 0) {
        const course = coursesResponse.data[0];
        const lesson = course.lessons?.find(l => l.id === topic.lessonId) || course.lessons?.[0];
        
        if (lesson) {
          // تحديث حالة الموضوع كمكتمل
          setTopics((prev) =>
            prev.map((t) => (t.id === topic.id ? { ...t, completed: true } : t))
          );

          // الانتقال لصفحة الدرس مع البيانات
          navigate('/course-details', {
            state: {
              lesson: lesson,
              subjectId: topic.subjectId
            }
          });
        } else {
          setError('الدرس غير متوفر.');
        }
      } else {
        setError('المادة غير متوفرة.');
      }
    } catch (err) {
      console.error("Error loading lesson:", err);
      setError('تعذر تحميل الدرس.');
    }
  };

  const handleFocusedQuiz = (item) => {
    navigate('/focused-quiz', {
      state: {
        subtopic: item.topic,
        subject: item.subject,
        lesson: item.lessonTitle,
        teacherName: 'مستر محمد أحمد',
        subjectId: item.subjectId,
        lessonId: item.lessonId,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-[#103B66] font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-lg font-bold">{t('loading_remediation')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-2xl text-center border border-red-200 dark:border-red-800 max-w-md">
          <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
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
                <Target className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-[#103B66] dark:text-white">{t('remediation_title')}</h1>
            </div>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[#103B66]" />
          {t('remediation_title')}
        </h2>

        {/* Progress bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600 dark:text-gray-300 font-bold">{t('overall_progress')}</span>
            <span className="text-[#103B66] dark:text-blue-400 font-bold">
              {completedCount} / {totalCount}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-[#103B66] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{progressPercent}% {t('topics_completed')}</p>
        </div>

        {/* Weak topics list */}
        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">{t('weak_subtopic')}</h3>
        <div className="space-y-4">
          {topics.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-lg shrink-0">
                  <BookOpen className="w-5 h-5 text-[#103B66]" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white">{item.subject}: {item.topic}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {item.completed ? t('done_label') : t('difficulty_' + (item.difficulty || 'medium'))}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleStartLesson(item)}
                  disabled={item.completed}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#103B66] hover:bg-[#0c2d4d] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold transition shadow-md text-sm"
                >
                  <PlayCircle className="w-4 h-4" />
                  {item.completed ? t('done_label') : t('start_lesson')}
                </button>
                <button
                  onClick={() => handleFocusedQuiz(item)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white px-4 py-2 rounded-lg font-bold transition shadow-md text-sm"
                >
                  <Zap className="w-4 h-4" />
                  {t('focused_quiz')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Remediation;
