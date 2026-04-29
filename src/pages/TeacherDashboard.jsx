import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { Brain, Users, BookOpen, Star, Plus, Loader2, RefreshCcw, X, AlertCircle, Upload, BarChart2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

const transition = { transition: "all 0.25s ease" };

const iconWrap = (bg, bd, sz = "40px", r = "8px") => ({
  ...transition,
  width: sz,
  height: sz,
  borderRadius: r,
  background: bg,
  border: `1px solid ${bd}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0
});

const inputStyle = (C) => ({
  ...transition,
  width: "100%",
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: "12px",
  padding: "14px 16px",
  color: C.textPrimary,
  outline: "none",
  fontSize: "0.95rem"
});

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  
  // 1. Theme Adoption (Global Context)
  const { isDarkMode, C, glass } = useTheme();

  // 2. State Management (Zero Logic Changes)
  const [teacherName, setTeacherName] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonSubject, setLessonSubject] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [modalError, setModalError] = useState('');

  // 3. API Fetching (Zero Logic Changes)
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get('/teachers/dashboard');
      const payload = res.data ?? {};
      const teacher = payload.teacher ?? {};

      setTeacherName(teacher.teacher_name || 'مدرس');

      setData({
        stats: {
          totalStudents: Array.isArray(payload.student_attempts)
            ? payload.student_attempts.length
            : 0,
          totalLessons: Number(payload.videos_count ?? 0),
          averageRating: payload.average_score != null
            ? (typeof payload.average_score === 'string'
              ? payload.average_score
              : `${payload.average_score}%`)
            : 'N/A',
        },
        my_courses: teacher.subject_name
          ? [{
              id: teacher.teacher_id ?? 1,
              title: teacher.subject_name,
              grade: 'الصفوف الدراسية',
              lessonsCount: Number(payload.videos_count ?? 0),
            }]
          : [],
        enrolled_students: Array.isArray(payload.student_attempts) ? payload.student_attempts : [],
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

      await api.patch(`http://localhost:3001/courses/${course.id}`, {
        lessons: [...existingLessons, newLesson],
        totalLessons: existingLessons.length + 1,
      });

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

      setShowAddLessonModal(false);
      setLessonTitle('');
      setLessonSubject('');
      setLessonVideoUrl('');
      setModalError('');

      fetchDashboardData();

      setToast({ type: 'success', message: 'تم إضافة الدرس بنجاح! ✅' });
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      console.error("Add lesson error:", err);
      setModalError('فشل إضافة الدرس. تأكد من تشغيل json-server.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Loading UI ---
  if (loading) {
    return (
      <div style={{...transition, background: C.bg, minHeight: "100vh", fontFamily: "'Cairo', sans-serif", paddingBottom: "64px"}} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <main style={{maxWidth: "1280px", margin: "0 auto", padding: "32px 24px"}}>
          <div style={{marginBottom: "32px"}}>
            <SkeletonLoader type="text" width="250px" height="32px" className="mb-2" />
            <SkeletonLoader type="text" width="180px" height="20px" />
          </div>

          <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "32px"}}>
            <SkeletonLoader type="card" height="120px" />
            <SkeletonLoader type="card" height="120px" />
            <SkeletonLoader type="card" height="120px" />
          </div>

          <div style={{display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "40px"}}>
            <SkeletonLoader type="card" width="160px" height="48px" />
            <SkeletonLoader type="card" width="160px" height="48px" />
            <SkeletonLoader type="card" width="160px" height="48px" />
          </div>

          <div style={{marginBottom: "48px"}}>
            <SkeletonLoader type="text" width="200px" height="28px" className="mb-6" />
            <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px"}}>
              <SkeletonLoader type="card" height="160px" />
              <SkeletonLoader type="card" height="160px" />
            </div>
          </div>

          <div>
            <SkeletonLoader type="text" width="200px" height="28px" className="mb-6" />
            <SkeletonLoader type="card" height="300px" />
          </div>
        </main>
      </div>
    );
  }

  // --- Error UI ---
  if (error) {
    return (
      <div style={{...transition, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Cairo', sans-serif", padding: "16px"}} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div style={{...glass(), padding: "32px", maxWidth: "440px", textAlign: "center", borderColor: C.redBorder, background: C.redDim}}>
          <AlertCircle style={{width: "48px", height: "48px", color: C.red, margin: "0 auto 16px"}} />
          <h3 style={{fontSize: "1.25rem", fontWeight: 800, color: C.red, marginBottom: "8px"}}>{t('error_title')}</h3>
          <p style={{color: C.textDim, fontSize: "0.95rem", marginBottom: "24px"}}>{error}</p>
          <button
            onClick={fetchDashboardData}
            style={{...transition, width: "100%", padding: "12px", background: C.red, color: "#FFF", border: "none", borderRadius: "12px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer"}}
            onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.1)"}
            onMouseLeave={e => e.currentTarget.style.filter = "none"}
          >
            <RefreshCcw style={{width: "16px", height: "16px"}} />
            {t('retry')}
          </button>
          <button
            onClick={() => navigate('/')}
            style={{marginTop: "16px", background: "transparent", border: "none", color: C.textDim, textDecoration: "underline", fontSize: "0.85rem", cursor: "pointer"}}
          >
            {t('back_to_home')}
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{...transition, background: C.bg, minHeight: "100vh", fontFamily: "'Cairo', sans-serif", paddingBottom: "64px"}} dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* Toast notification */}
      {toast && (
        <div style={{position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)", zIndex: 50, display: "flex", alignItems: "center", gap: "12px", padding: "12px 24px", borderRadius: "16px", background: toast.type === 'success' ? C.green : toast.type === 'error' ? C.red : C.accent, color: "#FFF", fontWeight: 700, fontSize: "0.875rem", boxShadow: C.shadowCard, animation: "bounce-once 0.3s ease-out forwards"}}>
          {toast.message}
        </div>
      )}

      <main style={{maxWidth: "1280px", margin: "0 auto", padding: "32px 24px"}}>
        {/* Welcome Section */}
        <div style={{marginBottom: "32px"}}>
          <h2 style={{fontSize: "1.875rem", fontWeight: 800, color: C.textPrimary, marginBottom: "8px", letterSpacing: "-0.02em"}}>
            {t('welcome_prefix')} {teacherName} 👋
          </h2>
          <p style={{color: C.textMuted, fontSize: "1rem", fontWeight: 500}}>
            {t('teacher_dashboard')}
          </p>
        </div>

        {/* Stats Cards (Bento Box) */}
        <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "32px"}}>
          <div style={{...glass(), padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
            <div>
              <p style={{fontSize: "0.875rem", color: C.textMuted, fontWeight: 500, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em"}}>{t('total_students')}</p>
              <p style={{fontSize: "1.875rem", fontWeight: 800, color: C.textPrimary, lineHeight: 1, letterSpacing: "-0.025em"}}>{data.stats.totalStudents}</p>
            </div>
            <div style={iconWrap(C.iconBgA, C.iconBorderA, "56px", "8px")}>
              <Users style={{width: "24px", height: "24px", color: C.iconA}} strokeWidth={2} />
            </div>
          </div>

          <div style={{...glass(), padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
            <div>
              <p style={{fontSize: "0.875rem", color: C.textMuted, fontWeight: 500, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em"}}>{t('lessons_tab')}</p>
              <p style={{fontSize: "1.875rem", fontWeight: 800, color: C.textPrimary, lineHeight: 1, letterSpacing: "-0.025em"}}>{data.stats.totalLessons}</p>
            </div>
            <div style={iconWrap(C.greenDim, C.greenBorder, "56px", "8px")}>
              <BookOpen style={{width: "24px", height: "24px", color: C.green}} strokeWidth={2} />
            </div>
          </div>

          <div style={{...glass(), padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
            <div>
              <p style={{fontSize: "0.875rem", color: C.textMuted, fontWeight: 500, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em"}}>{t('avg_rating')}</p>
              <p style={{fontSize: "1.875rem", fontWeight: 800, color: C.textPrimary, lineHeight: 1, letterSpacing: "-0.025em"}}>{data.stats.averageRating}</p>
            </div>
            <div style={iconWrap(C.yellowDim, C.yellowBorder, "56px", "8px")}>
              <Star style={{width: "24px", height: "24px", color: C.yellow}} strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "40px"}}>
          <button
            onClick={() => navigate('/upload-wizard')}
            style={{...transition, background: C.accent, color: "#FFF", padding: "14px 24px", borderRadius: "12px", fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem"}}
            onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.1)"}
            onMouseLeave={e => e.currentTarget.style.filter = "none"}
          >
            <Upload style={{width: "20px", height: "20px"}} />
            {t('upload_lesson')}
          </button>

          <button
            onClick={() => setShowAddLessonModal(true)}
            style={{...transition, background: "transparent", color: C.textPrimary, padding: "14px 24px", borderRadius: "12px", fontWeight: 700, border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem"}}
            onMouseEnter={e => e.currentTarget.style.background = C.bgCard}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <Plus style={{width: "20px", height: "20px"}} />
            {t('quick_add')}
          </button>

          <button
            onClick={() => navigate('/teacher-analytics')}
            style={{...transition, background: "transparent", color: C.textPrimary, padding: "14px 24px", borderRadius: "12px", fontWeight: 700, border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem"}}
            onMouseEnter={e => {e.currentTarget.style.background = C.bgCard; e.currentTarget.style.borderColor = C.iconBorderB; e.currentTarget.style.color = C.iconB;}}
            onMouseLeave={e => {e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textPrimary;}}
          >
            <BarChart2 style={{width: "20px", height: "20px"}} />
            {t('view_analytics')}
          </button>
        </div>

        {/* My Courses Grid */}
        <h3 style={{fontSize: "1.5rem", fontWeight: 800, color: C.textPrimary, marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px"}}>
          <BookOpen style={{width: "24px", height: "24px", color: C.accent}} />
          {t('my_courses')}
        </h3>

        <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "48px"}}>
          {data.my_courses.map((course) => (
            <div
              key={course.id}
              onClick={() => navigate('/teacher-analytics')}
              style={{...transition, ...glass(), padding: "24px", cursor: "pointer"}}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.borderAccent}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >
              <div style={{display: "flex", alignItems: "center", gap: "16px", borderBottom: `1px solid ${C.border}`, padding: "16px", marginBottom: "16px"}}>
                <div style={iconWrap(C.iconBgA, C.iconBorderA, "48px", "8px")}>
                  <BookOpen style={{width: "24px", height: "24px", color: C.iconA}} />
                </div>
                <h4 style={{fontSize: "1.25rem", fontWeight: 800, color: C.textPrimary}}>{course.title}</h4>
              </div>
              <p style={{fontSize: "0.875rem", color: C.textMuted, marginBottom: "20px"}}>{course.grade}</p>
              <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                <span style={{fontSize: "0.875rem", color: C.textDim, fontWeight: 600}}>{course.lessonsCount} {t('lessons_tab')}</span>
                <span style={{fontSize: "0.875rem", fontWeight: 800, color: C.accent}}>إدارة الدروس ←</span>
              </div>
            </div>
          ))}
          {data.my_courses.length === 0 && (
            <div style={{gridColumn: "1/-1"}}>
              <EmptyState 
                icon={BookOpen} 
                title="لا توجد مواد دراسية" 
                description="لم يتم تعيين مادة لك حتى الآن. تواصل مع الإدارة للإضافة." 
              />
            </div>
          )}
        </div>

        {/* 🚨 Enrolled Students (Responsive Card-Stack Pattern Table) 🚨 */}
        <h3 style={{fontSize: "1.5rem", fontWeight: 800, color: C.textPrimary, marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px"}}>
          <Users style={{width: "24px", height: "24px", color: C.accent}} />
          {t('my_students')}
        </h3>

        <div className="w-full">
          <table className="w-full border-collapse block md:table">
            
            {/* Desktop Headers (Hidden on Mobile) */}
            <thead className="hidden md:table-header-group" style={{background: C.bgPanel, borderBottom: `1px solid ${C.border}`}}>
              <tr>
                <th style={{padding: "16px 24px", textAlign: "right", fontSize: "0.75rem", fontWeight: 800, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em"}}>{t('full_name')}</th>
                <th style={{padding: "16px 24px", textAlign: "right", fontSize: "0.75rem", fontWeight: 800, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em"}}>{t('email')}</th>
                <th style={{padding: "16px 24px", textAlign: "right", fontSize: "0.75rem", fontWeight: 800, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em"}}>آخر اختبار</th>
                <th style={{padding: "16px 24px", textAlign: "right", fontSize: "0.75rem", fontWeight: 800, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em"}}>الدرجة</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="block md:table-row-group">
              {Array.from(
                new Map(data.enrolled_students.map(item => [item.student_id, item])).values()
              ).map((student) => {
                const scoreLabel = student.total_marks != null
                  ? `${student.score ?? 0} / ${student.total_marks}`
                  : '—';
                return (
                  <tr 
                    key={student.student_id} 
                    className="block md:table-row mb-4 md:mb-0" 
                    style={{
                      ...glass(), // Glassmorphism applied to row
                      borderBottom: `1px solid ${C.border}`,
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.borderAccent}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                  >
                    <td className="flex justify-between items-center md:table-cell" style={{padding: "16px 24px", fontSize: "0.9rem", fontWeight: 700, color: C.textPrimary}}>
                      <span className="md:hidden text-xs font-bold uppercase tracking-wider" style={{color: C.textMuted}}>{t('full_name')}</span>
                      <span>{student.student_name || '—'}</span>
                    </td>
                    
                    <td className="flex justify-between items-center md:table-cell" style={{padding: "16px 24px", fontSize: "0.9rem", color: C.textDim}} dir="ltr">
                      <span className="md:hidden text-xs font-bold uppercase tracking-wider" style={{color: C.textMuted}}>{t('email')}</span>
                      <span>{student.student_email || '—'}</span>
                    </td>
                    
                    <td className="flex justify-between items-center md:table-cell" style={{padding: "16px 24px", fontSize: "0.9rem", color: C.textDim}}>
                      <span className="md:hidden text-xs font-bold uppercase tracking-wider" style={{color: C.textMuted}}>آخر اختبار</span>
                      <span>{student.lesson_title || student.video_title || '—'}</span>
                    </td>
                    
                    <td className="flex justify-between items-center md:table-cell" style={{padding: "16px 24px", fontSize: "0.9rem", fontWeight: 800, color: C.textPrimary}}>
                      <span className="md:hidden text-xs font-bold uppercase tracking-wider" style={{color: C.textMuted}}>الدرجة</span>
                      <span>{scoreLabel}</span>
                    </td>
                  </tr>
                );
              })}
              
              {data.enrolled_students.length === 0 && (
                <tr className="block md:table-row">
                  <td colSpan={4} className="block md:table-cell" style={{padding: "32px 0"}}>
                    <EmptyState 
                      icon={Users} 
                      title="لا يوجد طلاب مسجلين" 
                      description="لم يقم أي طالب بالتسجيل في مقرراتك حتى الآن." 
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* ADD LESSON MODAL */}
      {showAddLessonModal && (
        <div style={{position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "16px"}} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div style={{...glass(), width: "100%", maxWidth: "480px", padding: "32px", background: C.bgPanel}}>
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px"}}>
              <h3 style={{fontSize: "1.25rem", fontWeight: 800, color: C.textPrimary}}>{t('add_lesson')}</h3>
              <button
                onClick={() => {
                  setShowAddLessonModal(false);
                  setLessonTitle('');
                  setLessonSubject('');
                  setLessonVideoUrl('');
                  setModalError('');
                }}
                style={{background: "transparent", border: "none", color: C.textMuted, cursor: "pointer"}}
              >
                <X style={{width: "24px", height: "24px"}} />
              </button>
            </div>

            <form onSubmit={handleAddLesson} style={{display: "flex", flexDirection: "column", gap: "20px"}}>
              <div>
                <label style={{display: "block", color: C.textDim, fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px"}}>{t('lesson_name')}</label>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  disabled={submitting}
                  style={inputStyle(C)}
                  onFocus={e => e.target.style.borderColor = C.accent}
                  onBlur={e => e.target.style.borderColor = C.border}
                  required
                />
              </div>

              <div>
                <label style={{display: "block", color: C.textDim, fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px"}}>{t('select_subject')}</label>
                <select
                  value={lessonSubject}
                  onChange={(e) => setLessonSubject(e.target.value)}
                  disabled={submitting}
                  style={{...inputStyle(C), appearance: "none", cursor: "pointer"}}
                  onFocus={e => e.target.style.borderColor = C.accent}
                  onBlur={e => e.target.style.borderColor = C.border}
                  required
                >
                  <option value="" disabled style={{color: C.textMuted}}>{t('select_subject')}</option>
                  <option value="1" style={{color: C.textPrimary, background: C.bgPanel}}>{t('subject_physics')}</option>
                  <option value="2" style={{color: C.textPrimary, background: C.bgPanel}}>{t('subject_chemistry')}</option>
                  <option value="3" style={{color: C.textPrimary, background: C.bgPanel}}>{t('subject_biology')}</option>
                  <option value="4" style={{color: C.textPrimary, background: C.bgPanel}}>{t('subject_math')}</option>
                </select>
              </div>

              <div>
                <label style={{display: "block", color: C.textDim, fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px"}}>{t('video_url')}</label>
                <input
                  type="url"
                  value={lessonVideoUrl}
                  onChange={(e) => setLessonVideoUrl(e.target.value)}
                  disabled={submitting}
                  style={{...inputStyle(C), textAlign: "left"}}
                  onFocus={e => e.target.style.borderColor = C.accent}
                  onBlur={e => e.target.style.borderColor = C.border}
                  dir="ltr"
                  placeholder="https://..."
                />
              </div>

              {modalError && (
                <div style={{...transition, padding: "12px 16px", borderRadius: "8px", background: C.redDim, border: `1px solid ${C.redBorder}`, color: C.red, fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px"}}>
                  <AlertCircle style={{width: "16px", height: "16px"}} />
                  {modalError}
                </div>
              )}

              <div style={{display: "flex", gap: "12px", marginTop: "12px"}}>
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
                  style={{...transition, flex: 1, padding: "14px", borderRadius: "12px", background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer"}}
                  onMouseEnter={e => e.currentTarget.style.color = C.textPrimary}
                  onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{...transition, flex: 1, padding: "14px", borderRadius: "12px", background: C.accent, color: "#FFF", border: "none", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1}}
                  onMouseEnter={e => {if(!submitting)e.currentTarget.style.filter="brightness(1.1)"}}
                  onMouseLeave={e => {if(!submitting)e.currentTarget.style.filter="none"}}
                >
                  {submitting ? (
                    <>
                      <Loader2 style={{width: "20px", height: "20px"}} className="animate-spin" />
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
