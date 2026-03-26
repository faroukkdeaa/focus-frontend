import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Brain, TrendingUp, Target, LogIn, UserPlus, LayoutDashboard,
  ClipboardList, ScanSearch, FileBarChart2, Compass,
  Users, BookOpen, Zap, CheckCircle2, XCircle, ArrowRight, Quote, Loader2,
} from "lucide-react";
import { useLanguage } from '../context/LanguageContext';
import LangToggle from '../components/LangToggle';
import ThemeToggle from '../components/ThemeToggle';
import { publicApi } from '../api/api';

const LOGIN_PATH = '/login';
const DASHBOARD_PATH = '/dashboard';

// Subject icons and colors mapping
const SUBJECT_STYLES = {
  PHYSICS:   { icon: "⚡️", color: "from-blue-500 to-blue-600" },
  CHEMISTRY: { icon: "🧪", color: "from-green-500 to-green-600" },
  BIOLOGY:   { icon: "🧬", color: "from-emerald-500 to-emerald-600" },
  MATH:      { icon: "📐", color: "from-purple-500 to-purple-600" },
  DEFAULT:   { icon: "📚", color: "from-gray-500 to-gray-600" },
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('token'));
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const id = requestAnimationFrame(() => setIsLoggedIn(!!token));
    return () => cancelAnimationFrame(id);
  }, []);

  // Fetch subjects from API
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data } = await publicApi.get('/subjects');
        // API response is paginated: { data: [...], current_page, total }
        const list = Array.isArray(data) ? data : (data.data || []);
        setSubjects(list);
      } catch (err) {
        console.warn('Failed to fetch subjects:', err.message);
        setSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, []);

  const goToAuthOrDashboard = () => {
    navigate(isLoggedIn ? DASHBOARD_PATH : LOGIN_PATH);
  };

  const goToSubject = (subjectId) => {
    navigate(`/subject/${subjectId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50 dark:border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-[#0F4C81] p-2 rounded-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <span className="text-2xl font-bold text-[#0F4C81] dark:text-white">{t('app_name')}</span>
            </div>
            
            {/* Nav Buttons */}
            <div className="flex gap-3 items-center">
              <ThemeToggle />
              <LangToggle />
              {isLoggedIn ? (
                <button
                  onClick={goToAuthOrDashboard}
                  className="flex items-center gap-2 bg-[#0F4C81] hover:bg-[#0D4170] text-white px-6 py-2 rounded-lg font-bold transition shadow-lg shadow-blue-900/20"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {t('go_to_dashboard')}
                </button>
              ) : (
                <>
                  <button
                    onClick={goToAuthOrDashboard}
                    className="hidden md:flex items-center gap-2 border-2 border-[#0F4C81] text-[#0F4C81] px-6 py-2 rounded-lg font-bold hover:bg-[#0F4C81] hover:text-white transition"
                  >
                    <LogIn className="w-4 h-4" />
                    {t('login_title')}
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
                    className="flex items-center gap-2 bg-[#0F4C81] hover:bg-[#0D4170] text-white px-6 py-2 rounded-lg font-bold transition shadow-lg shadow-blue-900/20"
                  >
                    <UserPlus className="w-4 h-4" />
                    {t('new_account')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="animate-fade-in-up">
          <div className="inline-block mb-6">
            <span className="bg-blue-100 text-[#0F4C81] px-4 py-2 rounded-full text-sm font-bold border border-blue-200">
              {t('hero_badge')}
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
            {t('hero_title_1')}
            <br />
            <span className="text-[#0F4C81] dark:text-blue-400 relative">
              {t('hero_title_2')}
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-yellow-300 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                 <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" opacity="0.5" />
              </svg>
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            {t('hero_desc')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={goToAuthOrDashboard}
              className="bg-[#0F4C81] hover:bg-[#0D4170] text-white text-xl font-bold px-10 py-4 rounded-xl transition shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              {isLoggedIn ? t('go_to_dashboard') : t('start_learning')}
            </button>
            <button 
              className="border-2 border-[#0F4C81] text-[#0F4C81] hover:bg-blue-50 text-xl font-bold px-10 py-4 rounded-xl transition"
            >
              {t('watch_how')}
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          {[
            { 
              icon: <Brain className="w-8 h-8 text-green-600" />, 
              bg: "bg-green-100", 
              title: t('feature_analysis_title'), 
              desc: t('feature_analysis_desc')
            },
            { 
              icon: <Target className="w-8 h-8 text-[#0F4C81]" />, 
              bg: "bg-blue-100", 
              title: t('feature_plan_title'), 
              desc: t('feature_plan_desc')
            },
            { 
              icon: <TrendingUp className="w-8 h-8 text-purple-600" />, 
              bg: "bg-purple-100", 
              title: t('feature_progress_title'), 
              desc: t('feature_progress_desc')
            }
          ].map((feature, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100 dark:border-gray-700">
              <div className={`${feature.bg} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto rotate-3 hover:rotate-6 transition`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ STATS BAR ══════════ */}
      <section className="bg-[#0F4C81] dark:bg-[#0a3057] py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: t('stat_students'),  label: t('stat_students_label'),  icon: <Users     className="w-7 h-7" /> },
            { value: t('stat_subjects'),  label: t('stat_subjects_label'),  icon: <BookOpen  className="w-7 h-7" /> },
            { value: t('stat_teachers'),  label: t('stat_teachers_label'),  icon: <GraduationCap className="w-7 h-7" /> },
            { value: t('stat_accuracy'),  label: t('stat_accuracy_label'), icon: <Brain     className="w-7 h-7" /> },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-2">
              <div className="text-blue-200 opacity-80">{s.icon}</div>
              <p className="text-3xl font-black text-white">{s.value}</p>
              <p className="text-blue-200 text-sm font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ AI DETECTION EXPLAINER ══════════ */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400
              px-4 py-1.5 rounded-full text-sm font-bold mb-4 border border-green-200 dark:border-green-700/40">
              {t('ai_section_badge')}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-5 leading-tight">
              {t('ai_section_title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              {t('ai_section_subtitle')}
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-4 gap-6 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5
              bg-gradient-to-r from-blue-300 via-purple-300 to-green-300 dark:from-blue-700 dark:via-purple-700 dark:to-green-700 z-0" />

            {[
              { step: '01', icon: <ClipboardList className="w-6 h-6" />, color: 'blue',   title: t('ai_step1_title'), desc: t('ai_step1_desc') },
              { step: '02', icon: <ScanSearch    className="w-6 h-6" />, color: 'purple', title: t('ai_step2_title'), desc: t('ai_step2_desc') },
              { step: '03', icon: <FileBarChart2 className="w-6 h-6" />, color: 'orange', title: t('ai_step3_title'), desc: t('ai_step3_desc') },
              { step: '04', icon: <Compass       className="w-6 h-6" />, color: 'green',  title: t('ai_step4_title'), desc: t('ai_step4_desc') },
            ].map(({ step, icon, color, title, desc }, i) => {
              const ring   = { blue:'ring-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30', purple:'ring-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30', orange:'ring-orange-400 text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30', green:'ring-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30' };
              const numBg  = { blue:'bg-blue-500', purple:'bg-purple-500', orange:'bg-orange-500', green:'bg-green-500' };
              return (
                <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                  {/* Circle icon */}
                  <div className={`w-20 h-20 rounded-full ${ring[color]} ring-2 flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform`}>
                    {icon}
                  </div>
                  {/* Step badge */}
                  <span className={`absolute top-0 ${lang === 'ar' ? 'left-6' : 'right-6'} w-6 h-6 rounded-full ${numBg[color]} text-white text-[11px] font-black flex items-center justify-center shadow`}>
                    {step}
                  </span>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[200px]">{desc}</p>
                </div>
              );
            })}
          </div>

          {/* CTA inside section */}
          <div className="mt-14 text-center">
            <button
              onClick={goToAuthOrDashboard}
              className="inline-flex items-center gap-2.5 bg-gradient-to-l from-[#0F4C81] to-blue-600
                hover:from-[#0d4170] hover:to-blue-700 text-white font-bold px-10 py-4 rounded-xl
                shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-lg"
            >
              <Zap className="w-5 h-5" />
              {t('ai_cta_label')}
            </button>
          </div>
        </div>
      </section>

      {/* ══════════ MULTIPLE TEACHER EXPOSURE ══════════ */}
      <section className="py-24 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="inline-block bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400
              px-4 py-1.5 rounded-full text-sm font-bold mb-4 border border-yellow-200 dark:border-yellow-700/40">
              {t('mte_badge')}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-5 leading-tight">
              {t('mte_title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              {t('mte_subtitle')}
            </p>
          </div>

          {/* Comparison grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Problem card */}
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-red-700 dark:text-red-400">{t('mte_problem_label')}</h3>
              </div>
              <ul className="space-y-4">
                {[t('mte_problem_point1'), t('mte_problem_point2'), t('mte_problem_point3')].map((pt, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution card */}
            <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/40 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-green-700 dark:text-green-400">{t('mte_solution_label')}</h3>
              </div>
              <ul className="space-y-4">
                {[t('mte_solution_point1'), t('mte_solution_point2'), t('mte_solution_point3')].map((pt, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quote */}
          <div className="bg-gradient-to-l from-[#0F4C81]/10 to-blue-100/50 dark:from-blue-900/20 dark:to-gray-800
            border border-blue-200 dark:border-blue-800/40 rounded-2xl p-8 text-center">
            <Quote className="w-8 h-8 text-[#0F4C81] dark:text-blue-400 mx-auto mb-4 opacity-60" />
            <p className="text-xl md:text-2xl font-bold text-[#0F4C81] dark:text-blue-300 leading-relaxed">
              {t('mte_quote')}
            </p>
          </div>

          {/* Teacher avatars illustration */}
          <div className="mt-12 flex flex-col items-center gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">{t('stat_teachers')}</p>
            <div className="flex items-center gap-0">
              {['أ.أحمد', 'أ.سارة', 'أ.كريم', 'أ.نور', 'أ.تامر'].map((name, i) => (
                <div key={i} className={`w-14 h-14 rounded-full bg-gradient-to-br border-4 border-white dark:border-gray-800 shadow-md flex items-center justify-center text-white font-black text-xs select-none
                  ${['from-blue-500 to-blue-700','from-purple-500 to-purple-700','from-green-500 to-green-700','from-orange-500 to-orange-700','from-pink-500 to-pink-700'][i]}
                  ${i > 0 ? '-ms-3' : ''}`}>
                  {name}
                </div>
              ))}
              <div className="-ms-3 w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 border-4 border-white dark:border-gray-800 shadow-md flex items-center justify-center text-gray-500 dark:text-gray-300 font-black text-xs select-none">
                +15
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">{t('testimonials_title')}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">{t('testimonials_subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: t('t1_name'), grade: t('t1_grade'), text: t('t1_text'), color: 'from-blue-500 to-blue-700',   score: '98%' },
              { name: t('t2_name'), grade: t('t2_grade'), text: t('t2_text'), color: 'from-purple-500 to-purple-700', score: '94%' },
              { name: t('t3_name'), grade: t('t3_grade'), text: t('t3_text'), color: 'from-green-500 to-green-700',  score: '91%' },
            ].map(({ name, grade, text, color, score }, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-md hover:shadow-xl
                border border-gray-100 dark:border-gray-700 transition-all hover:-translate-y-1 flex flex-col gap-5">
                {/* Score badge */}
                <div className={`self-start bg-gradient-to-l ${color} text-white text-sm font-black px-3 py-1 rounded-full shadow-sm`}>
                  {score}
                </div>
                {/* Quote */}
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed flex-1">{text}</p>
                {/* Author */}
                <div className="flex items-center gap-3 pt-2 border-t dark:border-gray-700">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-black text-sm shrink-0`}>
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{name}</p>
                    <p className="text-xs text-gray-400">{grade}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ SUBJECTS SECTION ══════════ */}
      <section className="bg-white dark:bg-gray-800 py-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('all_subjects')}</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">{t('all_subjects_desc')}</p>
          </div>
          
          {loadingSubjects ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-[#0F4C81]" />
            </div>
          ) : subjects.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {subjects.map((subject) => {
                const style = SUBJECT_STYLES[subject.code] || SUBJECT_STYLES.DEFAULT;
                return (
                  <button 
                    key={subject.id}
                    onClick={() => goToSubject(subject.id)}
                    className="group bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl p-6
                      hover:border-[#0F4C81] hover:shadow-xl transition-all cursor-pointer text-center"
                  >
                    <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${style.color} flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition duration-300 shadow-md`}>
                      {style.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-[#0F4C81] transition">
                      {subject.name || subject.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {t('browse_subject') || 'تصفح المادة'}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            // لا توجد مواد متاحة — تأكد من تشغيل الـ Backend
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {t('no_subjects_available') || 'لا توجد مواد متاحة حالياً. تأكد من تشغيل السيرفر.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ══════════ CTA SECTION ══════════ */}
      <section className="bg-gradient-to-r from-[#0F4C81] to-[#1a5fa3] py-20 text-center text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full blur-2xl -translate-x-1/3 translate-y-1/3"></div>

        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="bg-white/10 w-fit mx-auto p-4 rounded-full mb-6 backdrop-blur-sm">
             <GraduationCap className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('cta_title')}</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            {t('cta_desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={goToAuthOrDashboard}
              className="bg-white text-[#0F4C81] hover:bg-gray-50 text-xl font-bold px-12 py-5 rounded-xl shadow-2xl transition hover:scale-105"
            >
              {isLoggedIn ? t('go_to_dashboard') : t('register_free')}
            </button>
            <button
              onClick={goToAuthOrDashboard}
              className="border-2 border-white/60 text-white hover:bg-white/10 text-xl font-bold px-10 py-5 rounded-xl transition flex items-center justify-center gap-2"
            >
              {t('watch_how')}
              <ArrowRight className={`w-5 h-5 ${lang === 'ar' ? '' : 'rotate-180'}`} />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="bg-gray-900 text-white py-10 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
             <Brain className="w-6 h-6" />
             <span className="text-xl font-bold">FOCUS</span>
          </div>
          <p className="text-gray-400">
            {t('copyright')}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;