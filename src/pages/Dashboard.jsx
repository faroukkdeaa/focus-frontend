import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { Brain, BookOpen, AlertTriangle, TrendingUp, ChevronLeft, RefreshCcw, Home } from "lucide-react";
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

const transition = {
  transition: "background 0.25s ease, border-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease",
};

/* Icon container helper — using Theme tokens directly */
const iconWrap = (bg, borderColor, size = "48px", radius = "8px") => ({
  ...transition,
  width: size, height: size, borderRadius: radius,
  background: bg,
  border: `1px solid ${borderColor}`,
  display: "flex", alignItems: "center", justifyContent: "center",
  flexShrink: 0,
});

const Dashboard = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { C, glass } = useTheme();

  // 1. State Management
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Fetch Data Function
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const dashboardRes = await api.get('/student/dashboard');
      const payload = dashboardRes.data?.data ?? dashboardRes.data ?? {};
      setData(payload);

    } catch (err) {
      console.error("Error:", err);
      setError("تعذر الاتصال بالسيرفر.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Effect Hook
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // --- Loading State UI (Premium Skeleton Pulse Grid) ---
  if (loading) {
    return (
      <div
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        style={{
          ...transition,
          background: C.bg,
          minHeight: "100vh",
          fontFamily: "'Cairo', sans-serif",
        }}
      >
        <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px" }}>
          
          {/* Welcome skeleton */}
          <div style={{ marginBottom: "32px" }}>
            <SkeletonLoader type="text" width="200px" height="32px" className="mb-2" />
            <SkeletonLoader type="text" width="150px" height="20px" />
          </div>

          {/* AI Weakness alert skeleton (Conditional height based on average size) */}
          <div style={{ marginBottom: "32px" }}>
            <SkeletonLoader type="card" height="140px" />
          </div>

          {/* Stats skeleton - 3 cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "32px" }}>
            <SkeletonLoader type="card" height="120px" />
            <SkeletonLoader type="card" height="120px" />
            <SkeletonLoader type="card" height="120px" />
          </div>

          {/* Subjects title skeleton */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
            <SkeletonLoader type="avatar" width="36px" height="36px" />
            <SkeletonLoader type="text" width="120px" height="28px" />
          </div>

          {/* Subjects grid skeleton */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px", paddingBottom: "48px" }}>
            <SkeletonLoader type="card" height="160px" />
            <SkeletonLoader type="card" height="160px" />
            <SkeletonLoader type="card" height="160px" />
          </div>

        </main>
      </div>
    );
  }

  // --- Error State UI ---
  if (error) {
    return (
      <div
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        style={{
          ...transition,
          background: C.bg,
          minHeight: "100vh",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          fontFamily: "'Cairo', sans-serif",
        }}
      >
        <div
          style={{
            ...transition,
            ...glass(),
            border: `1px solid ${C.borderRed}`,
            padding: "40px",
            textAlign: "center",
            maxWidth: "420px",
            width: "100%",
          }}
        >
          <div style={{...iconWrap(C.redDim, C.redBorder, "56px", "16px"), margin: "0 auto"}}>
            <AlertTriangle style={{ color: C.redIcon, width: "28px", height: "28px" }} />
          </div>
          <h3 style={{ ...transition, color: C.textPrimary, fontWeight: 700, fontSize: "1.2rem", margin: "20px 0 8px" }}>
            {t('error_title')}
          </h3>
          <p style={{ ...transition, color: C.textMuted, fontSize: "0.9rem", marginBottom: "24px" }}>
            {error}
          </p>
          <button
            onClick={fetchDashboardData}
            style={{
              ...transition,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              width: "100%", padding: "12px 24px", borderRadius: "12px",
              fontSize: "0.9rem", fontWeight: 700,
              background: C.accent, color: "#FFFFFF", border: "none", cursor: "pointer",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            <RefreshCcw style={{ width: "16px", height: "16px" }} />
            {t('retry')}
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              ...transition,
              marginTop: "16px", background: "transparent", border: "none",
              color: C.textDim, fontSize: "0.82rem", cursor: "pointer",
              textDecoration: "underline",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = C.textMuted; }}
            onMouseLeave={e => { e.currentTarget.style.color = C.textDim; }}
          >
            {t('back_to_home')}
          </button>
        </div>
      </div>
    );
  }

  // --- Success State UI ---
  if (!data) return null;

  /* Stat card config — Bento Box approach */
  const lessonAttempts = Array.isArray(data.lesson_attempts) ? data.lesson_attempts : [];
  const statCards = [
    {
      label: t('completed_lessons'),
      value: Number(data.lesson_attempts_completed_count ?? 0),
      Icon: BookOpen,
      iconColor: C.iconA,
      iconBg: C.iconBgA,
      iconBorder: C.iconBorderA,
    },
    {
      label: t('improvement_rate'),
      value: '0%',
      Icon: TrendingUp,
      iconColor: C.green,
      iconBg: C.greenDim,
      iconBorder: C.greenBorder,
    },
    {
      label: t('study_hours'),
      value: 0,
      Icon: Home,
      iconColor: C.violetIcon || C.purple,
      iconBg: C.violetDim || C.purpleDim,
      iconBorder: C.violetBorder || C.purpleBorder,
    },
  ];

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={{
        ...transition,
        background: C.bg,
        minHeight: "100vh",
        fontFamily: "'Cairo', sans-serif",
      }}
    >
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px" }}>

        {/* ══════════ Welcome Section ══════════ */}
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ ...transition, color: C.textPrimary, fontSize: "1.8rem", fontWeight: 800, marginBottom: "8px" }}>
            {t('welcome_prefix')} {data.student?.student_name || 'طالب'} 👋
          </h2>
          <p style={{ ...transition, color: C.textMuted, fontSize: "0.95rem" }}>
            {lang === 'ar'
              ? 'أحدث بياناتك تظهر هنا مباشرة من الخادم.'
              : 'Your latest data appears here directly from the server.'}
          </p>
        </div>

        {/* ══════════ AI Weakness Alert ══════════ */}
        {data.weaknesses && data.weaknesses.length > 0 && (
          <div
            style={{
              ...transition,
              ...glass(),
              border: `1px solid ${C.borderRed}`,
              padding: "28px",
              marginBottom: "32px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div style={iconWrap(C.redDim, C.redBorder, "48px", "8px")}>
                <AlertTriangle style={{ color: C.redIcon, width: "24px", height: "24px" }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ ...transition, color: C.textPrimary, fontWeight: 700, fontSize: "1.1rem", marginBottom: "8px" }}>
                  {t('weakness_title')}
                </h3>
                <p style={{ ...transition, color: C.textMuted, fontSize: "0.875rem", lineHeight: 1.7, marginBottom: "16px" }}>
                  {t('weaknesses_in')}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                  {data.weaknesses
                    ?.filter((weakness) => weakness?.id != null)
                    .map((weakness) => (
                      <span
                        key={weakness.id}
                        style={{
                          ...transition,
                          padding: "4px 14px", borderRadius: "999px",
                          fontSize: "0.78rem", fontWeight: 600,
                          background: C.redDim,
                          color: C.redIcon,
                          border: `1px solid ${C.redBorder}`,
                        }}
                      >
                        {weakness.label || weakness.name}
                      </span>
                    ))}
                </div>

                <button
                  onClick={() => navigate('/remediation')}
                  style={{
                    ...transition,
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "10px 24px", borderRadius: "12px",
                    fontSize: "0.875rem", fontWeight: 700,
                    background: C.accent, color: "#FFFFFF", border: "none", cursor: "pointer",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                >
                  <Brain style={{ width: "16px", height: "16px" }} />
                  {t('view_remediation')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ Stats — Bento Box Grid ══════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px", marginBottom: "32px" }}>
          {statCards.map((s, i) => (
            <div
              key={i}
              style={{ ...transition, ...glass(), padding: "24px" }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = C.shadowHover || "0 8px 28px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = C.shadowCard;
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ ...transition, color: C.textMuted, fontSize: "0.875rem", fontWeight: 500, marginBottom: "8px" }}>
                    {s.label}
                  </p>
                  <p style={{ ...transition, color: C.textPrimary, fontSize: "1.875rem", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1 }}>
                    {s.value}
                  </p>
                </div>
                <div style={iconWrap(s.iconBg, s.iconBorder, "48px", "8px")}>
                  <s.Icon style={{ color: s.iconColor, width: "24px", height: "24px" }} strokeWidth={2} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ══════════ Progress Analytics CTA ══════════ */}
        <div
          onClick={() => navigate('/progress')}
          style={{
            ...transition,
            ...glass(),
            borderColor: C.borderAccent,
            padding: "20px 28px",
            marginBottom: "32px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = C.shadowHover || "0 8px 28px rgba(0,0,0,0.15)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = C.shadowCard;
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={iconWrap(C.accentDim, C.borderAccent, "48px", "8px")}>
              <TrendingUp style={{ color: C.accent, width: "24px", height: "24px" }} strokeWidth={2} />
            </div>
            <div>
              <p style={{ ...transition, color: C.textPrimary, fontWeight: 700, fontSize: "0.95rem" }}>
                {t('progress_banner_title')}
              </p>
              <p style={{ ...transition, color: C.textMuted, fontSize: "0.82rem" }}>
                {t('progress_banner_desc')}
              </p>
            </div>
          </div>
          <div style={iconWrap(C.accentDim, C.borderAccent, "36px", "10px")}>
            <ChevronLeft style={{ color: C.accent, width: "18px", height: "18px" }} />
          </div>
        </div>

        {/* ══════════ Lesson Attempts ══════════ */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div style={iconWrap(C.iconBgA, C.iconBorderA, "40px", "8px")}>
            <BookOpen style={{ color: C.iconA, width: "20px", height: "20px" }} strokeWidth={2} />
          </div>
          <h3 style={{ ...transition, color: C.textPrimary, fontSize: "1.3rem", fontWeight: 800 }}>
            الدروس الأخيرة
          </h3>
        </div>

        {lessonAttempts.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px", paddingBottom: "48px" }}>
            {lessonAttempts.map((attempt, index) => (
              <div
                key={attempt.id ?? attempt.attempt_id ?? index}
                style={{ ...transition, ...glass(), padding: "24px", cursor: "pointer" }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = C.shadowHover || "0 8px 28px rgba(0,0,0,0.15)";
                  e.currentTarget.style.borderColor = C.borderAccent;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = C.shadowCard;
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                  <div style={iconWrap(C.iconBgA, C.iconBorderA, "56px", "8px")}>
                    <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>📘</span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ ...transition, color: C.textPrimary, fontWeight: 700, fontSize: "1.05rem", marginBottom: "4px" }}>
                          {attempt.lesson_title ?? '—'}
                        </h4>
                        <p style={{ ...transition, color: C.textMuted, fontSize: "0.8rem" }}>
                          {attempt.attempted_at ?? '—'}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "10px", color: C.textDim, fontSize: "0.8rem", fontWeight: 700 }}>
                          <span>{attempt.score ?? 0} / {attempt.total_marks ?? 0}</span>
                          <span>{attempt.percentage ?? 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ ...glass(), padding: "40px", minHeight: "300px", marginBottom: "48px" }}>
            <EmptyState 
              icon={BookOpen}
              title="لا توجد دروس مسجلة بعد"
              description="لن تظهر هنا إلا الدروس الموجودة في lesson_attempts كما يرسلها الـ API."
              actionButton={
                <button
                  onClick={() => navigate('/')}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "12px 24px", borderRadius: "12px",
                    fontSize: "0.875rem", fontWeight: 700,
                    background: C.accent, color: "#FFFFFF", border: "none", cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                >
                  <Home style={{ width: "18px", height: "18px" }} />
                  العودة للرئيسية
                </button>
              }
            />
          </div>
        )}

      </main>
    </div>
  );
};

export default Dashboard;
