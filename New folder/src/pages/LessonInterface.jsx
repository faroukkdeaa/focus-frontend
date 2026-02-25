import { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Play, Pause, Volume2, Settings, ChevronLeft, ChevronRight, CheckCircle2, User, Loader2 } from "lucide-react";
import { useLanguage } from '../context/LanguageContext';

const LessonInterface = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLanguage();
  
  // 1. حالات التحكم (State)
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTeacher, setActiveTeacher] = useState("teacher1");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // بيانات من الـ API
  const [teachers, setTeachers] = useState([]);
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  
  // جلب lessonId و subjectId من location.state أو من URL
  const lessonId = location.state?.lesson?.id || 1;
  const subjectId = location.state?.subjectId || 1;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // جلب بيانات المدرسين
        const teachersResponse = await axios.get('http://localhost:3001/teachers');
        setTeachers(teachersResponse.data || []);

        // جلب بيانات الكورس والدروس
        const coursesResponse = await axios.get(`http://localhost:3001/courses?subjectId=${subjectId}`);
        if (coursesResponse.data && coursesResponse.data.length > 0) {
          const courseData = coursesResponse.data[0];
          setCourse(courseData);
          setLessons(courseData.lessons || []);
          
          // تحديد الدرس الحالي
          const lesson = courseData.lessons?.find(l => l.id === parseInt(lessonId)) || courseData.lessons?.[0];
          setCurrentLesson(lesson);
        }
      } catch (err) {
        console.error("LessonInterface error:", err);
        setError("تعذر تحميل بيانات الدرس. تأكد من تشغيل json-server.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [subjectId, lessonId]);

  // حساب التقدم
  const completedCount = lessons.filter(l => l.completed).length;
  const totalCount = lessons.length;
  const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  // التنقل بين الدروس
  const currentIndex = lessons.findIndex(l => l.id === currentLesson?.id);
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
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
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
            
            {/* التبديل بين المدرسين (Custom Tabs) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* شريط التابات */}
              <div className="bg-gray-50 dark:bg-gray-700 p-2 flex gap-2">
                {teachers.map((teacher) => (
                  <button
                    key={teacher.id}
                    onClick={() => setActiveTeacher(teacher.id)}
                    className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-lg transition-all duration-200 ${
                      activeTeacher === teacher.id 
                      ? "bg-[#103B66] text-white shadow-md" 
                      : "bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
                    }`}
                  >
                    <div className={`p-2 rounded-full ${activeTeacher === teacher.id ? "bg-white/20" : "bg-gray-100"}`}>
                        <User className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{teacher.name}</p>
                      <p className={`text-xs ${activeTeacher === teacher.id ? "text-blue-200" : "text-gray-400"}`}>
                        ⭐ {teacher.rating}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* مشغل الفيديو */}
              <div className="relative bg-black aspect-video group">
                {/* المحتوى الوهمي للفيديو */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="bg-white/20 backdrop-blur-sm rounded-full p-6 mb-4 inline-block hover:scale-110 transition hover:bg-white/30"
                    >
                      {isPlaying ? <Pause className="w-12 h-12" /> : <Play className="w-12 h-12 ml-1" />}
                    </button>
                    <p className="text-lg font-bold">الدرس: {currentLesson.title}</p>
                    <p className="text-sm opacity-75">المدرس: {teachers.find(t => t.id === activeTeacher)?.name || 'غير محدد'}</p>
                  </div>
                </div>

                {/* شريط التحكم السفلي (يظهر عند الهوفر) */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity opacity-100 md:opacity-0 md:group-hover:opacity-100">
                  <div className="flex items-center gap-4 text-white">
                    <button onClick={() => setIsPlaying(!isPlaying)}>
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    
                    {/* شريط الوقت */}
                    <div className="flex-1 h-1.5 bg-gray-600 rounded-full cursor-pointer">
                      <div className="h-full w-1/3 bg-[#103B66] rounded-full relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow"></div>
                      </div>
                    </div>
                    
                    <span className="text-xs font-mono">00:00 / {currentLesson.duration}</span>
                    <button><Volume2 className="w-5 h-5" /></button>
                    <button><Settings className="w-5 h-5" /></button>
                  </div>
                </div>
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
              
              <button 
                onClick={() => navigate('/quiz', { state: { lesson: currentLesson, subjectId } })}
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