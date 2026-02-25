import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Brain, BookOpen, AlertTriangle, TrendingUp, PlayCircle, ChevronLeft, Loader2, RefreshCcw } from "lucide-react";
import { useLanguage } from '../context/LanguageContext';


/**
 * @typedef {Object} DashboardData
 * @property {string} studentName - اسم الطالب
 * @property {number} upcomingExams - عدد الامتحانات القادمة
 * @property {string[]} weaknesses - قائمة نقاط الضعف
 * @property {Object} stats - الإحصائيات
 * @property {number} stats.completedLessons
 * @property {number} stats.improvementRate
 * @property {number} stats.studyHours
 * @property {Array} subjects - قائمة المواد
 */

const Dashboard = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  // 1. State Management
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Fetch Data Function
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // جلب بيانات الداشبورد والمواد من json-server
      // عندما يكون الباكند جاهزاً، غيّر الروابط فقط
      // const token = localStorage.getItem('token');
      const [dashboardResponse, subjectsResponse] = await Promise.all([
        axios.get('http://localhost:3001/dashboard', {
          headers: {
            // Authorization: `Bearer ${token}` // فعّل هذا عندما يكون الباكند جاهزاً
          }
        }),
        axios.get('http://localhost:3001/subjects', {
          headers: {
            // Authorization: `Bearer ${token}` // فعّل هذا عندما يكون الباكند جاهزاً
          }
        })
      ]);

      // دمج البيانات
      const dashboardData = dashboardResponse.data;
      const subjects = subjectsResponse.data;

      setData({
        ...dashboardData,
        subjects: subjects || []
      });

    } catch (err) {
      console.error("Error:", err);
      setError("تعذر الاتصال بالسيرفر. تأكد من تشغيل json-server.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Effect Hook
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // --- Loading State UI ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-[#103B66] dark:text-blue-400 transition-colors">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-lg font-bold">{t('loading_dashboard')}</p>
      </div>
    );
  }

  // --- Error State UI ---
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 font-['Cairo'] transition-colors" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-2xl text-center border border-red-200 dark:border-red-800 max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">{t('error_title')}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors w-full font-bold"
          >
            <RefreshCcw className="w-4 h-4" />
            {t('retry')}
          </button>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm underline transition-colors"
          >
            {t('back_to_home')}
          </button>
        </div>
      </div>
    );
  }

  // --- Success State UI ---
  // لو مفيش داتا جت (لسه)، نرجع null عشان الصفحة متضربش
  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Cairo'] transition-colors" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in-down">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">
            {t('welcome_prefix')} {data.studentName} 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-300 transition-colors">
            {lang === 'ar'
              ? `لديك ${data.upcomingExams} ${t('upcoming_tasks_suffix')}`
              : `You have ${data.upcomingExams} ${t('upcoming_tasks_suffix')}`}
          </p>
        </div>

        {/* AI Weakness Alert */}
        {data.weaknesses && data.weaknesses.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-8 shadow-sm transition-colors">
            <div className="flex items-start gap-4">
              <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded-2xl shrink-0 transition-colors">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-900 dark:text-red-300 mb-2 transition-colors">
                  {t('weakness_title')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed transition-colors">
                  {t('weaknesses_in')}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {data.weaknesses.map((weakness, index) => (
                    <span key={index} className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-3 py-1 rounded-full text-sm font-medium shadow-sm transition-colors">
                      {weakness}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/remediation')}
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-colors flex items-center gap-2"
                >
                  <Brain className="w-4 h-4" />
                  {t('view_remediation')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-t-4 border-t-[#103B66] dark:border-t-blue-500 transition-colors">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 transition-colors">{t('completed_lessons')}</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white transition-colors">{data.stats.completedLessons}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full transition-colors">
                <BookOpen className="w-6 h-6 text-[#103B66]" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-t-4 border-t-green-500 transition-colors">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 transition-colors">{t('improvement_rate')}</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white transition-colors">+{data.stats.improvementRate}%</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full transition-colors">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-t-4 border-t-purple-500 transition-colors">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 transition-colors">{t('study_hours')}</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white transition-colors">{data.stats.studyHours}</p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full transition-colors">
                <PlayCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Progress Analytics CTA */}
        <div
          onClick={() => navigate('/progress')}
          className="bg-gradient-to-l from-[#103B66] to-[#1a5498] dark:from-blue-700 dark:to-blue-900 rounded-2xl p-5 mb-8 flex items-center justify-between cursor-pointer hover:opacity-95 transition shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base">{t('progress_banner_title')}</p>
              <p className="text-blue-200 text-sm">{t('progress_banner_desc')}</p>
            </div>
          </div>
          <div className="bg-white/10 hover:bg-white/20 transition p-2 rounded-lg flex-shrink-0">
            <ChevronLeft className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Subjects Grid */}
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 transition-colors">
          <BookOpen className="w-6 h-6 text-[#103B66] dark:text-blue-400" />
          {t('subjects_title')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          {data.subjects.map((subject, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate(`/subject/${subject.id ?? (subject.name ? encodeURIComponent(subject.name) : String(idx))}`)}
            >
              <div className="flex items-start gap-4">
                {/* هنا ممكن نستخدم دالة لتعيين الأيقونة واللون بناء على اسم المادة */}
                <div className={`w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-3xl shadow-md group-hover:scale-110 transition-all`}>
                  {/* أيقونة افتراضية لو مفيش أيقونة جاية من الباك إند */}
                  {subject.icon || "📚"}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 dark:text-white transition-colors">{subject.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors">{subject.completed} من {subject.lessons} درس</p>
                    </div>
                    <div className="text-center">
                      <span className={`text-lg font-bold ${subject.progress >= 70 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'} transition-colors`}>
                        {subject.progress}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden transition-colors">
                    <div
                      className={`h-full bg-[#103B66] dark:bg-blue-500 transition-colors`}
                      style={{ width: `${subject.progress}%` }}
                    ></div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center transition-colors">
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-bold transition-colors">الحالة: {subject.progress >= 50 ? "جيد" : "يحتاج تحسين"}</span>
                    <button className="text-[#103B66] dark:text-blue-400 text-sm font-bold flex items-center hover:underline transition-colors">
                      المتابعة <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
};

export default Dashboard;