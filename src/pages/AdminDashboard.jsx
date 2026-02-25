import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowRight, Users, BookOpen, ClipboardCheck, CheckCircle2,
  XCircle, Eye, Trash2, Brain, TrendingUp, ShieldCheck,
  AlertTriangle, Loader2, PlayCircle, LayoutDashboard, RefreshCcw,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';

// ── API Base ──────────────────────────────────────────────────────────────────
const API = 'http://localhost:3001';

// ── Sub-components ────────────────────────────────────────────────────────────

const Toast = ({ toast }) => {
  if (!toast) return null;
  const styles = {
    success: 'bg-emerald-500',
    error:   'bg-red-500',
    info:    'bg-blue-500',
  };
  return (
    <div
      className={`fixed bottom-6 ${toast.lang === 'ar' ? 'right-6' : 'left-6'} z-50 flex items-center gap-3
        ${styles[toast.type] ?? 'bg-gray-700'} text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold
        animate-pulse`}
    >
      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
      {toast.message}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, gradient, loading }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow group">
    <div className="flex items-start justify-between mb-3">
      <div className={`p-3 rounded-xl ${gradient}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <TrendingUp className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
    {loading ? (
      <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-1" />
    ) : (
      <p className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
        {(value ?? 0).toLocaleString('en-US')}
      </p>
    )}
    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">{label}</p>
  </div>
);

const SectionError = ({ message, onRetry }) => (
  <div className="py-12 text-center flex flex-col items-center gap-3">
    <AlertTriangle className="w-10 h-10 text-amber-400" />
    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{message}</p>
    <button
      onClick={onRetry}
      className="flex items-center gap-1.5 text-sm font-bold text-[#103B66] dark:text-blue-400
        hover:underline transition"
    >
      <RefreshCcw className="w-4 h-4" />
      إعادة المحاولة
    </button>
  </div>
);

const SectionLoader = ({ rows = 3 }) => (
  <div className="p-6 space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse" />
    ))}
  </div>
);

const ChartTooltip = ({ active, payload, label, tRegistrations, tViews }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="text-gray-300 font-bold mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-300">
            {p.dataKey === 'registrations' ? tRegistrations : tViews}:&nbsp;
          </span>
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const navigate    = useNavigate();
  const { t, lang } = useLanguage();

  // ── Data state ──
  const [kpi,              setKpi]              = useState(null);
  const [pendingTeachers,  setPendingTeachers]  = useState([]);
  const [reports,          setReports]          = useState([]);
  const [activityRaw,      setActivityRaw]      = useState([]);

  // ── Loading state per section ──
  const [loadingKpi,      setLoadingKpi]      = useState(true);
  const [loadingPending,  setLoadingPending]  = useState(true);
  const [loadingReports,  setLoadingReports]  = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // ── Error state per section ──
  const [errorKpi,      setErrorKpi]      = useState(null);
  const [errorPending,  setErrorPending]  = useState(null);
  const [errorReports,  setErrorReports]  = useState(null);
  const [errorActivity, setErrorActivity] = useState(null);

  // ── Action loading (approve / reject / remove) ──
  const [loadingId, setLoadingId] = useState(null);
  const [toast,     setToast]     = useState(null);

  // ── Activity data shaped for chart (day label depends on lang) ──
  const activityData = activityRaw.map(row => ({
    day:           lang === 'ar' ? row.day_ar : row.day_en,
    registrations: row.registrations,
    views:         row.views,
  }));

  // ── Fetch helpers ─────────────────────────────────────────────────────────

  const fetchKpi = useCallback(async () => {
    setLoadingKpi(true);
    setErrorKpi(null);
    try {
      const { data } = await axios.get(`${API}/admin_kpi`);
      setKpi(data);
    } catch {
      setErrorKpi(t('error_title'));
    } finally {
      setLoadingKpi(false);
    }
  }, [t]);

  const fetchPending = useCallback(async () => {
    setLoadingPending(true);
    setErrorPending(null);
    try {
      const { data } = await axios.get(`${API}/admin_pending_teachers`);
      setPendingTeachers(data);
    } catch {
      setErrorPending(t('error_title'));
    } finally {
      setLoadingPending(false);
    }
  }, [t]);

  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    setErrorReports(null);
    try {
      const { data } = await axios.get(`${API}/admin_reports`);
      setReports(data);
    } catch {
      setErrorReports(t('error_title'));
    } finally {
      setLoadingReports(false);
    }
  }, [t]);

  const fetchActivity = useCallback(async () => {
    setLoadingActivity(true);
    setErrorActivity(null);
    try {
      const { data } = await axios.get(`${API}/admin_activity`);
      setActivityRaw(data);
    } catch {
      setErrorActivity(t('error_title'));
    } finally {
      setLoadingActivity(false);
    }
  }, [t]);

  // ── Initial load (parallel) ───────────────────────────────────────────────
  useEffect(() => {
    fetchKpi();
    fetchPending();
    fetchReports();
    fetchActivity();
  }, [fetchKpi, fetchPending, fetchReports, fetchActivity]);

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = (type, message) => {
    setToast({ type, message, lang });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleApprove = async (id) => {
    setLoadingId(`approve-${id}`);
    try {
      // DELETE from pending list in json-server
      await axios.delete(`${API}/admin_pending_teachers/${id}`);
      setPendingTeachers(prev => prev.filter(t => t.id !== id));
      showToast('success', t('approved_msg'));
    } catch {
      showToast('error', t('error_title'));
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    setLoadingId(`reject-${id}`);
    try {
      await axios.delete(`${API}/admin_pending_teachers/${id}`);
      setPendingTeachers(prev => prev.filter(t => t.id !== id));
      showToast('error', t('rejected_msg'));
    } catch {
      showToast('error', t('error_title'));
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemoveContent = async (id) => {
    setLoadingId(`remove-${id}`);
    try {
      await axios.delete(`${API}/admin_reports/${id}`);
      setReports(prev => prev.filter(r => r.id !== id));
      showToast('info', t('content_removed_msg'));
    } catch {
      showToast('error', t('error_title'));
    } finally {
      setLoadingId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Cairo']"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >

      {/* ═════════════ HEADER ═════════════ */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#103B66] dark:bg-blue-600 p-2.5 rounded-xl shadow">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#103B66] dark:text-blue-400 leading-tight">
                {t('admin_dashboard')}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('admin_subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-800
                dark:hover:text-white transition text-sm font-medium"
            >
              <ArrowRight className={`w-4 h-4 ${lang === 'en' ? 'rotate-180' : ''}`} />
              <span className="hidden sm:inline">{t('back_to_dashboard')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">

        {/* ═════════════ ROLE BADGE ═════════════ */}
        <div className="flex items-center gap-2.5 bg-[#103B66]/8 dark:bg-blue-900/25 border border-[#103B66]/15
          dark:border-blue-700/50 rounded-2xl px-5 py-3 w-fit">
          <ShieldCheck className="w-5 h-5 text-[#103B66] dark:text-blue-400 flex-shrink-0" />
          <span className="text-sm font-bold text-[#103B66] dark:text-blue-400">
            {t('admin_role_badge')}
          </span>
        </div>

        {/* ═════════════ KPI CARDS ═════════════ */}
        <section>
          {errorKpi ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
              <SectionError message={errorKpi} onRetry={fetchKpi} />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label={t('total_students')}     value={kpi?.totalStudents}     icon={Users}         gradient="bg-blue-500"   loading={loadingKpi} />
              <StatCard label={t('total_teachers')}     value={kpi?.totalTeachers}     icon={ShieldCheck}   gradient="bg-emerald-500" loading={loadingKpi} />
              <StatCard label={t('total_lessons')}      value={kpi?.totalLessons}      icon={PlayCircle}    gradient="bg-violet-500"  loading={loadingKpi} />
              <StatCard label={t('total_quizzes_taken')}value={kpi?.totalQuizzesTaken} icon={ClipboardCheck}gradient="bg-orange-500"  loading={loadingKpi} />
            </div>
          )}
        </section>

        {/* ═════════════ PENDING TEACHER VERIFICATIONS ═════════════ */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100
          dark:border-gray-700 shadow-sm overflow-hidden">

          <div className="px-6 py-5 border-b dark:border-gray-700 flex flex-wrap items-center
            justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
                {t('pending_verifications')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {t('pending_subtitle')}
              </p>
            </div>
            {!loadingPending && !errorPending && (
              <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400
                text-xs font-bold px-3 py-1.5 rounded-full">
                {pendingTeachers.length} {t('pending_count_label')}
              </span>
            )}
          </div>

          {loadingPending ? (
            <SectionLoader rows={4} />
          ) : errorPending ? (
            <SectionError message={errorPending} onRetry={fetchPending} />
          ) : pendingTeachers.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-semibold">{t('no_pending')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    {[t('teacher_name'), t('specialty'), t('email'), t('reg_date'), t('actions')].map(h => (
                      <th key={h} className="px-5 py-3.5 text-start text-xs font-bold text-gray-500
                        dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {pendingTeachers.map(teacher => (
                    <tr key={teacher.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-5 py-4 font-semibold text-gray-800 dark:text-white whitespace-nowrap">
                        {teacher.name}
                      </td>
                      <td className="px-5 py-4">
                        <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400
                          text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                          {teacher.specialty}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs">
                        {teacher.email}
                      </td>
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap tabular-nums">
                        {teacher.date}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(teacher.id)}
                            disabled={loadingId !== null}
                            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600
                              disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold
                              px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                          >
                            {loadingId === `approve-${teacher.id}`
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <CheckCircle2 className="w-3.5 h-3.5" />}
                            {t('approve')}
                          </button>
                          <button
                            onClick={() => handleReject(teacher.id)}
                            disabled={loadingId !== null}
                            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600
                              disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold
                              px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                          >
                            {loadingId === `reject-${teacher.id}`
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <XCircle className="w-3.5 h-3.5" />}
                            {t('reject')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ═════════════ CONTENT MODERATION & REPORTS ═════════════ */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100
          dark:border-gray-700 shadow-sm overflow-hidden">

          <div className="px-6 py-5 border-b dark:border-gray-700 flex flex-wrap items-center
            justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                {t('content_reports')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {t('reports_subtitle')}
              </p>
            </div>
            {!loadingReports && !errorReports && (
              <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400
                text-xs font-bold px-3 py-1.5 rounded-full">
                {reports.length} {t('reports_count_label')}
              </span>
            )}
          </div>

          {loadingReports ? (
            <SectionLoader rows={5} />
          ) : errorReports ? (
            <SectionError message={errorReports} onRetry={fetchReports} />
          ) : reports.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-semibold">{t('no_reports')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    {[t('content_title_col'), t('content_type'), t('teacher_col'), t('reported_issue'), t('actions')].map(h => (
                      <th key={h} className="px-5 py-3.5 text-start text-xs font-bold text-gray-500
                        dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {reports.map(report => (
                    <tr key={report.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-5 py-4 font-semibold text-gray-800 dark:text-white">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          {report.title}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          report.type === 'video'
                            ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                            : 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                        }`}>
                          {report.type === 'video' ? t('content_video') : t('content_quiz')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {report.teacher}
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          {report.issue}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30
                              text-blue-500 dark:text-blue-400 transition-colors"
                            title={t('view_content')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveContent(report.id)}
                            disabled={loadingId !== null}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30
                              text-red-500 dark:text-red-400 transition-colors
                              disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t('remove_content')}
                          >
                            {loadingId === `remove-${report.id}`
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ═════════════ PLATFORM ACTIVITY CHART ═════════════ */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100
          dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="p-2.5 bg-[#103B66]/10 dark:bg-blue-900/30 rounded-xl">
              <TrendingUp className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800 dark:text-white">
                {t('platform_activity')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {t('activity_chart_subtitle')}
              </p>
            </div>
          </div>

          {loadingActivity ? (
            <div className="h-[290px] bg-gray-100 dark:bg-gray-700/40 rounded-xl animate-pulse" />
          ) : errorActivity ? (
            <SectionError message={errorActivity} onRetry={fetchActivity} />
          ) : (
            <>
              {/* Legend pills */}
              <div className="flex items-center gap-4 mb-5 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#103B66]" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {t('new_registrations')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {t('video_views')}
                  </span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={290}>
                <LineChart
                  data={activityData}
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12, fill: '#9ca3af', fontFamily: 'Cairo, sans-serif' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#9ca3af', fontFamily: 'Cairo, sans-serif' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={
                      <ChartTooltip
                        tRegistrations={t('new_registrations')}
                        tViews={t('video_views')}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="registrations"
                    stroke="#103B66"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#103B66', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, fill: '#103B66' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </section>

        {/* Bottom spacer */}
        <div className="h-4" />
      </main>

      {/* Toast Notification */}
      <Toast toast={toast} />
    </div>
  );
};

export default AdminDashboard;
