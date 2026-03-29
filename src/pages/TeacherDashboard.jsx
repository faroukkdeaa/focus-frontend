import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { Brain, Users, BookOpen, Star, Plus, Loader2, RefreshCcw, X, AlertCircle, Upload, BarChart2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  // بيانات المستخدم
  const [teacherName, setTeacherName] = useState('');

  // بيانات الداشبورد
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // حالة Modal إضافة درس
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonSubject, setLessonSubject] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    // جلب اسم المدرس من localStorage
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const userData = JSON.parse(userJson);
        setTeacherName(userData.name || 'مدرس');
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }

    // جلب بيانات الداشبورد
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Get teacher profile from localStorage
      const userJson = localStorage.getItem('user');
      let userData = null;
      if (userJson) {
        userData = JSON.parse(userJson);
      }

      if (!userData || !userData.teacher_id) {
        // Fallback if not standard TeacherResource
        const meRes = await api.get('/me');
        userData = meRes.data?.user || meRes.data;
      }

      const teacherId = userData?.teacher_id || userData?.id;
      const subjectId = userData?.subject_id;
      const subjectName = userData?.subject_name || 'المادة الخاصة بي';

      // 2. Fetch lessons count & stats from backend
      let lessonsCount = 0;
      if (teacherId) {
        try {
          const lessonsRes = await api.get(`/teachers/${teacherId}/lessons`);
          lessonsCount = lessonsRes.data?.lessons?.total || lessonsRes.data?.lessons?.data?.length || 0;
        } catch (err) {
          console.warn("Could not fetch teacher lessons:", err);
        }
      }

      // 3. Update dashboard data
      setData({
        stats: {
          totalStudents: 0,
          totalLessons: lessonsCount,
          averageRating: userData?.rating || 'N/A'
        },
        my_courses: subjectId ? [{
          id: subjectId,
          subjectId: subjectId,
          title: subjectName,
          grade: 'الصفوف الدراسية',
          lessonsCount: lessonsCount
        }] : [],
        enrolled_students: []
      });

    } catch (err) {
      console.error("TeacherDashboard error:", err);
      setError("تعذر جلب بيانات المدرس من الخادم. تأكد من اتصالك.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');

    try {
      // 1. جلب الكورس الخاص بالمادة المختارة
      const coursesResponse = await api.get(
        `http://localhost:3001/courses?subjectId=${lessonSubject}`
      );

      if (!coursesResponse.data || coursesResponse.data.length === 0) {
        setModalError('لم يتم العثور على كورس لهذه المادة.');
        setSubmitting(false);
        return;
      }

      const course = coursesResponse.data[0];
      const existingLessons = course.lessons || [];

      // 2. إنشاء الدرس الجديد
      const newLesson = {
        id: existingLessons.length > 0
          ? Math.max(...existingLessons.map(l => l.id)) + 1
          : 1,
        title: lessonTitle,
        duration: '00:00',
        completed: false,
        chapter: '',
        videoUrl: lessonVideoUrl || null,
        description: '',
      };

      // 3. إضافة الدرس للكورس في json-server
      await api.patch(`http://localhost:3001/courses/${course.id}`, {
        lessons: [...existingLessons, newLesson],
        totalLessons: existingLessons.length + 1,
      });

      // 4. تحديث teacher_dashboard: رفع lessonsCount للكورس + totalLessons
      const tdRes = await api.get('http://localhost:3001/teacher_dashboard');
      const td = tdRes.data;
      const updatedCourses = (td.my_courses || []).map(c =>
        String(c.subjectId) === String(lessonSubject)
          ? { ...c, lessonsCount: (c.lessonsCount || 0) + 1 }
          : c
      );
      await api.patch('http://localhost:3001/teacher_dashboard', {
        stats: { ...td.stats, totalLessons: (td.stats?.totalLessons || 0) + 1 },
        my_courses: updatedCourses,
      });

      // 5. إغلاق الـ Modal وإعادة تعيين الحقول
      setShowAddLessonModal(false);
      setLessonTitle('');
      setLessonSubject('');
      setLessonVideoUrl('');
      setModalError('');

      // 6. إعادة تحميل بيانات الداشبورد لإظهار التحديث
      fetchDashboardData();

      // 7. إظهار toast نجاح
      setToast({ type: 'success', message: 'تم إضافة الدرس بنجاح! ✅' });
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      console.error("Add lesson error:", err);
      setModalError('فشل إضافة الدرس. تأكد من تشغيل json-server.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-[#103B66] dark:text-blue-400 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-lg font-bold">{t('loading_dashboard')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-2xl text-center border border-red-200 dark:border-red-800 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">{t('error_title')}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="flex items-center justify-center gap-2 bg-red-600 dark:bg-red-700 text-white px-6 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition w-full font-bold"
          >
            <RefreshCcw className="w-4 h-4" />
            {t('retry')}
          </button>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm underline"
          >
            {t('back_to_home')}
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-2xl shadow-xl text-white font-bold text-sm transition-all animate-bounce-once ${
          toast.type === 'success' ? 'bg-green-500 dark:bg-green-600' :
          toast.type === 'error'   ? 'bg-red-500 dark:bg-red-600' :
                                     'bg-blue-500 dark:bg-blue-600'
        }`}>
          {toast.message}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('welcome_prefix')} {teacherName} 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('teacher_dashboard')}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-t-4 border-t-blue-500 dark:border-t-blue-400">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('total_students')}</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{data.stats.totalStudents}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-t-4 border-t-green-500 dark:border-t-green-400">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('lessons_tab')}</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{data.stats.totalLessons}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-full">
                <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-t-4 border-t-yellow-500 dark:border-t-yellow-400">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('avg_rating')}</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{data.stats.averageRating}</p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded-full">
                <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/upload-wizard')}
            className="flex items-center gap-2 bg-gradient-to-l from-[#103B66] to-[#1a5498] dark:from-blue-600 dark:to-blue-700 hover:from-[#0c2d4d] hover:to-[#103B66] dark:hover:from-blue-700 dark:hover:to-blue-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition"
          >
            <Upload className="w-5 h-5" />
            {t('upload_lesson')}
          </button>

          <button
            onClick={() => setShowAddLessonModal(true)}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-5 py-3 rounded-xl font-bold transition"
          >
            <Plus className="w-5 h-5" />
            {t('quick_add')}
          </button>

          <button
            onClick={() => navigate('/teacher-analytics')}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-5 py-3 rounded-xl font-bold transition"
          >
            <BarChart2 className="w-5 h-5" />
            {t('view_analytics')}
          </button>
        </div>

        {/* My Courses Grid */}
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[#103B66] dark:text-blue-400" />
          {t('my_courses')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {data.my_courses.map((course) => (
            <div
              key={course.id}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-blue-900/20 transition cursor-pointer"
              onClick={() => navigate('/teacher-analytics')}
            >
              <div className="flex items-center gap-3 mb-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                <div className="bg-blue-100 dark:bg-blue-900/40 p-2.5 rounded-lg flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-[#103B66] dark:text-blue-400" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 dark:text-white">{course.title}</h4>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{course.grade}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{course.lessonsCount} {t('lessons_tab')}</span>
                <span className="text-[#103B66] dark:text-blue-400 text-sm font-bold">إدارة الدروس ←</span>
              </div>
            </div>
          ))}
          {data.my_courses.length === 0 && (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-8 text-gray-500 dark:text-gray-400">
              لم يتم تعيين مادة لك حتى الآن.
            </div>
          )}
        </div>

        {/* Enrolled Students */}
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-[#103B66] dark:text-blue-400" />
          {t('my_students')}
        </h3>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">{t('full_name')}</th>
                  <th className="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">{t('email')}</th>
                  <th className="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">{t('grade')}</th>
                  <th className="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">{t('subject_progress')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.enrolled_students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-6 py-4 text-sm font-bold text-gray-800 dark:text-white">{student.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400" dir="ltr">{student.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{student.grade}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${student.progress >= 70 ? 'bg-green-500 dark:bg-green-400' :
                              student.progress >= 50 ? 'bg-yellow-500 dark:bg-yellow-400' : 'bg-red-500 dark:bg-red-400'
                              }`}
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 w-12">{student.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showAddLessonModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t('add_lesson')}</h3>
              <button
                onClick={() => {
                  setShowAddLessonModal(false);
                  setLessonTitle('');
                  setLessonSubject('');
                  setLessonVideoUrl('');
                  setModalError('');
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLesson} className="space-y-4">
              <div>
                <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2">{t('lesson_name')}</label>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  disabled={submitting}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#103B66] dark:focus:ring-blue-500 disabled:opacity-60"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2">{t('select_subject')}</label>
                <select
                  value={lessonSubject}
                  onChange={(e) => setLessonSubject(e.target.value)}
                  disabled={submitting}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#103B66] dark:focus:ring-blue-500 disabled:opacity-60"
                  required
                >
                  <option value="">{t('select_subject')}</option>
                  <option value="1">{t('subject_physics')}</option>
                  <option value="2">{t('subject_chemistry')}</option>
                  <option value="3">{t('subject_biology')}</option>
                  <option value="4">{t('subject_math')}</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-300 text-sm font-bold mb-2">{t('video_url')}</label>
                <input
                  type="url"
                  value={lessonVideoUrl}
                  onChange={(e) => setLessonVideoUrl(e.target.value)}
                  disabled={submitting}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#103B66] dark:focus:ring-blue-500 text-left disabled:opacity-60"
                  dir="ltr"
                  placeholder="https://..."
                />
              </div>

              {modalError && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-2 text-sm font-bold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {modalError}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddLessonModal(false);
                    setLessonTitle('');
                    setLessonSubject('');
                    setLessonVideoUrl('');
                    setModalError('');
                  }}
                  disabled={submitting}
                  className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-600 transition disabled:opacity-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#103B66] dark:bg-blue-600 hover:bg-[#0c2d4d] dark:hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('adding')}
                    </>
                  ) : (
                    t('add_lesson')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
