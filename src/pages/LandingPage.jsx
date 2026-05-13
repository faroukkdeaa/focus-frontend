import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import LangToggle from "../components/LangToggle";
import { publicApi } from "../api/api";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import Logo from "../components/Logo";
import {
  Brain,
  TrendingUp,
  Target,
  GraduationCap,
  Zap,
  Users,
  BookOpen,
  BarChart3,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowLeft,
  Star,
  ChevronRight,
  Sun,
  Moon,
  FlaskConical,
  Microscope,
  Calculator,
  Atom,
  Clock,
  Lightbulb,
  Search,
} from "lucide-react";

const LOGIN_PATH = "/login";
const DASHBOARD_PATH = "/dashboard";

/* ════════════════════════════════════════════════════
   THEME TOKENS IMPORTED FROM CONTEXT
════════════════════════════════════════════════════ */
const card = (T, extra) => ({
  background:   T.bgCard,
  border:       `1px solid ${T.border}`,
  borderRadius: "16px",
  boxShadow:    T.shadowCard,
  ...extra,
});

const transition = {
  transition: "background 0.25s ease, border-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease",
};

void motion;

function NavHeader({
  T,
  isDarkMode,
  setIsDarkMode,
  onNavigate,
  handleSmartNav,
  isLoggedIn,
  t,
  searchQuery,
  setSearchQuery,
  handleSearch,
}) {
  return (
    <header
      style={{
        ...transition,
        position:             "sticky",
        top:                  0,
        zIndex:               50,
        background:           isDarkMode ? "rgba(11,17,32,0.88)" : "rgba(248,250,252,0.90)",
        backdropFilter:       "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom:         `1px solid ${T.border}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between gap-4">
        {/* Logo */}
          <Logo className="scale-95 origin-left" />

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
          <div
            style={{
              ...transition,
              position: "relative",
              width: "100%",
            }}
          >
            <input
              type="text"
              placeholder={t("search") || "بحث..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                ...transition,
                width: "100%",
                background: T.bgCard,
                border: `1px solid ${T.border}`,
                color: T.textPrimary,
                borderRadius: "14px",
                padding: "10px 42px",
                fontSize: "0.9rem",
                outline: "none",
                boxShadow: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = T.borderAccent;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = T.border;
              }}
            />
            <Search
              style={{
                position: "absolute",
                insetInlineStart: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "16px",
                height: "16px",
                color: T.textDim,
                pointerEvents: "none",
              }}
              strokeWidth={2}
            />
          </div>
        </form>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <LangToggle />

          {/* ── Theme toggle ── */}
          <button
            onClick={setIsDarkMode} // Now directly calls the global toggleTheme
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{
              ...transition,
              width:        "38px",
              height:       "38px",
              borderRadius: "50%",
              display:      "flex",
              alignItems:   "center",
              justifyContent: "center",
              background:   T.bgCard,
              border:       `1px solid ${T.border}`,
              cursor:       "pointer",
              color:        T.textMuted,
            }}
            onMouseEnter={e => {
              const el = e.currentTarget;
              el.style.borderColor = T.borderAccent;
              el.style.color       = T.accent;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget;
              el.style.borderColor = T.border;
              el.style.color       = T.textMuted;
            }}
          >
            {isDarkMode
              ? <Sun  style={{ width: "16px", height: "16px" }} strokeWidth={1.5} />
              : <Moon style={{ width: "16px", height: "16px" }} strokeWidth={1.5} />
            }
          </button>

          {isLoggedIn ? (
            <button
              onClick={() => handleSmartNav('/login')}
              style={{
                ...transition,
                padding:      "9px 20px",
                borderRadius: "10px",
                fontSize:     "0.875rem",
                fontWeight:   700,
                background:   T.accent,
                color:        "#FFFFFF",
                border:       "none",
                cursor:       "pointer",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              {t('go_to_dashboard') || "لوحة التحكم"}
            </button>
          ) : (
            <>
              {/* Login */}
              <button
                onClick={() => onNavigate("login")}
                style={{
                  ...transition,
                  padding:      "9px 20px",
                  borderRadius: "10px",
                  fontSize:     "0.875rem",
                  color:        T.textMuted,
                  background:   "transparent",
                  border:       `1px solid ${T.border}`,
                  cursor:       "pointer",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.color       = T.textPrimary;
                  el.style.borderColor = T.borderAccent;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.color       = T.textMuted;
                  el.style.borderColor = T.border;
                }}
              >
                تسجيل الدخول
              </button>

              {/* Sign up */}
              <button
                onClick={() => onNavigate("signup")}
                style={{
                  ...transition,
                  padding:      "9px 20px",
                  borderRadius: "10px",
                  fontSize:     "0.875rem",
                  fontWeight:   700,
                  background:   T.accent,
                  color:        "#FFFFFF",
                  border:       "none",
                  cursor:       "pointer",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.opacity = "0.88";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                حساب جديد
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function HeroSection({ T, glass, onNavigate, handleSmartNav }) {
  return (
    <section
      style={{
        ...transition,
        background:   T.bg,
        paddingTop:   "96px",
        paddingBottom:"100px",
        position:     "relative",
        overflow:     "hidden",
      }}
    >
      <div
        style={{
          position:         "absolute", inset: 0, pointerEvents: "none",
          backgroundImage:  `radial-gradient(${T.textDim === "#475569" ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.055)"} 1px, transparent 1px)`,
          backgroundSize:   "36px 36px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 text-center">
        <motion.div 
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            style={{
              ...transition,
              display:        "inline-flex",
              alignItems:     "center",
              gap:            "8px",
              padding:        "8px 18px",
              borderRadius:   "999px",
              marginBottom:   "28px",
              background:     T.accentDim,
              border:         `1px solid ${T.borderAccent}`,
            }}
          >
            <Sparkles style={{ color: T.accent, width: "14px", height: "14px" }} />
            <span style={{ color: T.accent, fontSize: "0.8rem" }}>
              منصة تعليمية مدعومة بالذكاء الاصطناعي
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            style={{
              ...transition,
              color:        T.textPrimary,
              fontSize:     "clamp(2.8rem, 6vw, 4.8rem)",
              fontWeight:   800,
              lineHeight:   1.18,
              marginBottom: "20px",
            }}
          >
            منصتك الذكية للتميز في
            <br />
            <span style={{ color: T.accent }}>الثانوية العامة</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            style={{
              ...transition,
              color:        T.textMuted,
              fontSize:     "1.1rem",
              lineHeight:   1.85,
              marginBottom: "40px",
            }}
          >
            نظام ذكي يحلل نقاط ضعفك تلقائياً ويوجهك للدروس المناسبة
            <br />
            لتحقيق أفضل النتائج في الشعبة العلمية
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}
          >
            <button
              onClick={() => handleSmartNav('/signup')}
              style={{
                ...transition,
                display:      "flex", alignItems: "center", gap: "8px",
                padding:      "14px 32px",
                borderRadius: "12px",
                fontSize:     "1rem",
                fontWeight:   700,
                background:   T.accent,
                color:        "#FFFFFF",
                border:       "none",
                cursor:       "pointer",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.opacity   = "0.88";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity   = "1";
              }}
            >
              ابدأ التعلم الآن
              <ArrowLeft style={{ width: "16px", height: "16px" }} />
            </button>

            <button
              onClick={() => onNavigate("signup")}
              style={{
                ...transition,
                display:      "flex", alignItems: "center", gap: "8px",
                padding:      "14px 32px",
                borderRadius: "12px",
                fontSize:     "1rem",
                background:   T.bgCard,
                color:        T.textPrimary,
                border:       `1px solid ${T.border}`,
                cursor:       "pointer",
                boxShadow:    T.shadowCard,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = T.borderAccent;
                e.currentTarget.style.color        = T.accent;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.color        = T.textPrimary;
              }}
            >
              شاهد كيف يعمل
            </button>
          </motion.div>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px", marginTop: "72px" }}>
          {[
            { icon: Brain,      iconBg: T.iconBgA, iconBdr: T.iconBorderA, iconClr: T.iconA, title: "كشف نقاط الضعف بالذكاء الاصطناعي", desc: "النظام يحلل إجاباتك ويحدد المواضيع التي تحتاج للتركيز عليها بدقة" },
            { icon: Target,     iconBg: T.iconBgA, iconBdr: T.iconBorderA, iconClr: T.iconA, title: "خطة دراسية شخصية",                  desc: "توجيه ذكي للدروس والتمارين بناءً على مستواك الحالي وأهدافك" },
            { icon: TrendingUp, iconBg: T.iconBgA, iconBdr: T.iconBorderA, iconClr: T.iconA, title: "تتبع التقدم المستمر",                 desc: "متابعة دقيقة لتطورك في كل مادة ومهارة مع تقارير تفصيلية" },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              whileHover={{ y: -4 }}
              style={{ ...transition, ...glass(), padding: "32px", textAlign: "right" }}
              onMouseEnter={e => {
                const el = e.currentTarget;
                el.style.boxShadow   = T.shadowHover;
                el.style.borderColor = T.borderAccent;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.boxShadow   = T.shadowCard;
                el.style.borderColor = T.border;
              }}
            >
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  ...transition,
                  width:          "56px", height: "56px", borderRadius: "14px",
                  background:     f.iconBg,
                  border:         `1px solid ${f.iconBdr}`,
                  display:        "flex", alignItems: "center", justifyContent: "center",
                  marginBottom:   "18px",
                }}
              >
                <f.icon
                  className="h-7 w-7 shrink-0"
                  style={{
                    color: f.iconClr,
                    stroke: f.iconClr,
                    margin: 0,
                    padding: 0,
                  }}
                  strokeWidth={2}
                  fill="none"
                />
              </div>
              <h3 style={{ ...transition, color: T.textPrimary, fontWeight: 700, fontSize: "1.05rem", marginBottom: "10px" }}>
                {f.title}
              </h3>
              <p style={{ ...transition, color: T.textMuted, fontSize: "0.875rem", lineHeight: 1.8 }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection({ T, landingData }) {
  const stats = [
    { icon: Users,         iconBg: T.iconBgA, iconBdr: T.iconBorderA, iconClr: T.iconA, value: `+${landingData?.all_students_count ?? "٢٠٠"}`, label: "طالب مسجّل",   sub: "عبر محافظات مصر" },
    { icon: GraduationCap, iconBg: T.iconBgA, iconBdr: T.iconBorderA, iconClr: T.iconA, value: `+${landingData?.all_teachers_count ?? "٨٧"}`,   label: "معلم متخصص",  sub: "يستخدمون لوحة التحليل" },
    { icon: Star,          iconBg: T.iconBgA, iconBdr: T.iconBorderA, iconClr: T.iconA, value: "٩٨٪",   label: "نسبة الرضا",  sub: "يوصون بالمنصة" },
    { icon: Zap,           iconBg: T.iconBgA, iconBdr: T.iconBorderA, iconClr: T.iconA, value: `+${landingData?.subjects_count ?? "٤"}`,  label: "درس ومراجعة", sub: "محتوى محدّث باستمرار" },
  ];

  return (
    <section style={{ ...transition, background: T.bgPanel, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: "56px 0" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "24px" }}>
          {stats.map((s, i) => (
            <div key={i} style={{ ...transition, ...card(T), padding: "28px 24px", textAlign: "center" }}>
              <div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                style={{
                  ...transition,
                  width: "64px", height: "64px", borderRadius: "9999px",
                  background: s.iconBg,
                  border:     `1px solid ${s.iconBdr}`,
                  display:    "flex", alignItems: "center", justifyContent: "center",
                  margin:     "0 auto 16px",
                }}
              >
                <s.icon
                  className="h-8 w-8 shrink-0"
                  style={{
                    color: s.iconClr,
                    stroke: s.iconClr,
                    margin: 0,
                    padding: 0,
                  }}
                  strokeWidth={2}
                  fill="none"
                />
              </div>
              <div style={{ ...transition, color: T.iconA, fontSize: "2.2rem", fontWeight: 800, lineHeight: 1, marginBottom: "6px" }}>
                {s.value}
              </div>
              <div style={{ ...transition, color: T.textPrimary, fontWeight: 600, fontSize: "0.9rem" }}>
                {s.label}
              </div>
              <div style={{ ...transition, color: T.textMuted, fontSize: "0.75rem", marginTop: "3px" }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SubjectsSection({ T, subjects, onNavigateSubject }) {
  const SUBJECT_MAP = {
    PHYSICS:   { icon: Atom,         eng: "Physics",     iconBg: T.iconBgA, iconBdr: T.iconBorderA, iconClr: T.iconA, badgeBg: T.accentDim,    badgeBdr: T.borderAccent, badgeClr: T.accent,    cardBdr: T.borderAccent },
    CHEMISTRY: { icon: FlaskConical, eng: "Chemistry",   iconBg: T.iconBgB, iconBdr: T.iconBorderB, iconClr: T.iconB, badgeBg: T.accentAltDim, badgeBdr: T.borderAlt,    badgeClr: T.accentAlt, cardBdr: T.borderAlt    },
    BIOLOGY:   { icon: Microscope,   eng: "Biology",     iconBg: T.iconBgA, iconBdr: T.iconBorderA, iconClr: T.iconA, badgeBg: T.accentDim,    badgeBdr: T.borderAccent, badgeClr: T.accent,    cardBdr: T.borderAccent },
    MATH:      { icon: Calculator,   eng: "Mathematics", iconBg: T.iconBgB, iconBdr: T.iconBorderB, iconClr: T.iconB, badgeBg: T.accentAltDim, badgeBdr: T.borderAlt,    badgeClr: T.accentAlt, cardBdr: T.borderAlt    },
    DEFAULT:   { icon: BookOpen,     eng: "Subject",     iconBg: T.iconBgA, iconBdr: T.iconBorderA, iconClr: T.iconA, badgeBg: T.accentDim,    badgeBdr: T.borderAccent, badgeClr: T.accent,    cardBdr: T.borderAccent },
  };

  const displayedSubjects = subjects?.length > 0 ? subjects.map(s => {
      const mapped = SUBJECT_MAP[s.code] || SUBJECT_MAP.DEFAULT;
      return {
         ...mapped,
         name: s.title,
         id: s.id
      };
  }) : [
    { name: "الفيزياء",   icon: Atom,         eng: "Physics",     iconBg: T.iconBgA, iconBdr: T.iconBorderA, iconClr: T.iconA, badgeBg: T.accentDim,    badgeBdr: T.borderAccent, badgeClr: T.accent,    cardBdr: T.borderAccent },
    { name: "الكيمياء",   icon: FlaskConical, eng: "Chemistry",   iconBg: T.iconBgB, iconBdr: T.iconBorderB, iconClr: T.iconB, badgeBg: T.accentAltDim, badgeBdr: T.borderAlt,    badgeClr: T.accentAlt, cardBdr: T.borderAlt    },
    { name: "الأحياء",    icon: Microscope,   eng: "Biology",     iconBg: T.iconBgA, iconBdr: T.iconBorderA, iconClr: T.iconA, badgeBg: T.accentDim,    badgeBdr: T.borderAccent, badgeClr: T.accent,    cardBdr: T.borderAccent },
    { name: "الرياضيات",  icon: Calculator,   eng: "Mathematics", iconBg: T.iconBgB, iconBdr: T.iconBorderB, iconClr: T.iconB, badgeBg: T.accentAltDim, badgeBdr: T.borderAlt,    badgeClr: T.accentAlt, cardBdr: T.borderAlt    },
  ];

  return (
    <section style={{ ...transition, background: T.bg, padding: "90px 0" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div style={{ marginBottom: "48px" }}>
          <div
            style={{
              ...transition,
              display:      "inline-flex", alignItems: "center", gap: "8px",
              padding:      "6px 16px", borderRadius: "999px", marginBottom: "16px",
              background:   T.accentDim, border: `1px solid ${T.borderAccent}`,
            }}
          >
            <BookOpen style={{ color: T.accent, width: "13px", height: "13px" }} />
            <span style={{ color: T.accent, fontSize: "0.76rem" }}>المواد الدراسية</span>
          </div>
          <h2 style={{ ...transition, color: T.textPrimary, fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 800 }}>
            جميع مواد الشعبة العلمية
          </h2>
          <p style={{ ...transition, color: T.textMuted, fontSize: "0.95rem", marginTop: "8px" }}>
            محتوى شامل ومنظم لكل مواد الثانوية العامة
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
          {displayedSubjects.map((s, i) => (
            <div
              key={i}
              style={{ ...transition, ...card(T), padding: "28px", cursor: "pointer" }}
              onClick={() => s.id ? onNavigateSubject(s.id) : null}
              onMouseEnter={e => {
                const el = e.currentTarget;
                el.style.transform   = "translateY(-4px)";
                el.style.boxShadow   = T.shadowHover;
                el.style.borderColor = s.cardBdr;
                const iconEl = el.querySelector(".icon-wrap");
                if (iconEl) { iconEl.style.background = s.iconBg.replace("0.10", "0.17").replace("0.11", "0.18"); }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.transform   = "translateY(0)";
                el.style.boxShadow   = T.shadowCard;
                el.style.borderColor = T.border;
                const iconEl = el.querySelector(".icon-wrap");
                if (iconEl) { iconEl.style.background = s.iconBg; }
              }}
            >
              <div
                className="icon-wrap"
                style={{
                  ...transition,
                  width: "60px", height: "60px", borderRadius: "16px",
                  background:   s.iconBg,
                  border:       `1px solid ${s.iconBdr}`,
                  display:      "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "18px",
                }}
              >
                <s.icon style={{ color: s.iconClr, width: "28px", height: "28px" }} strokeWidth={2} />
              </div>
              <span
                style={{
                  ...transition,
                  display:       "inline-block",
                  padding:       "2px 10px",
                  borderRadius:  "6px",
                  fontSize:      "0.7rem",
                  letterSpacing: "0.06em",
                  marginBottom:  "10px",
                  background:    s.badgeBg,
                  color:         s.badgeClr,
                  border:        `1px solid ${s.badgeBdr}`,
                }}
              >
                {s.eng}
              </span>
              <h3 style={{ ...transition, color: T.textPrimary, fontWeight: 700, fontSize: "1.15rem", marginBottom: "8px" }}>
                {s.name}
              </h3>
              <div style={{ ...transition, display: "flex", alignItems: "center", gap: "4px", color: T.textDim, fontSize: "0.8rem", marginTop: "8px" }}>
                <span>ابدأ الآن</span>
                <ChevronRight style={{ width: "14px", height: "14px" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection({ T }) {
  const steps = [
    { num: "٢", icon: BookOpen,    title: "أجب على الاختبارات",           desc: "حل اختبارات تشخيصية ذكية مصنّفة حسب الموضوع والمهارة المعرفية.",    iconBg: T.iconBgA, iconBdr: T.iconBorderA, iconClr: T.iconA, badgeClr: T.accent,    badgeBg: T.accentDim,    badgeBdr: T.borderAccent },
    { num: "٣", icon: BarChart3,   title: "حلّل الذكاء الاصطناعي نتائجك", desc: "النظام يرصد نمط إجاباتك ويكشف نقاط الضعف الدقيقة عبر وسوم المهارات.", iconBg: T.iconBgB, iconBdr: T.iconBorderB, iconClr: T.iconB, badgeClr: T.accentAlt, badgeBg: T.accentAltDim, badgeBdr: T.borderAlt    },
    { num: "٤", icon: Lightbulb,   title: "احصل على خطتك الشخصية",        desc: "توجيه فوري للدروس والتمارين العلاجية المناسبة بالضبط لما تحتاجه.",   iconBg: T.iconBgA, iconBdr: T.iconBorderA, iconClr: T.iconA, badgeClr: T.accent,    badgeBg: T.accentDim,    badgeBdr: T.borderAccent },
    { num: "٥", icon: TrendingUp,  title: "راقب تحسّنك المستمر",           desc: "تقارير أسبوعية تفصيلية تُظهر تطورك وتُعدّل الخطة تلقائياً.",          iconBg: T.iconBgB, iconBdr: T.iconBorderB, iconClr: T.iconB, badgeClr: T.accentAlt, badgeBg: T.accentAltDim, badgeBdr: T.borderAlt    },
  ];

  return (
    <section style={{ ...transition, background: T.bgPanel, padding: "90px 0", borderTop: `1px solid ${T.border}` }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <div
            style={{
              ...transition,
              display:      "inline-flex", alignItems: "center", gap: "8px",
              padding:      "6px 16px", borderRadius: "999px", marginBottom: "16px",
              background:   T.accentDim, border: `1px solid ${T.borderAccent}`,
            }}
          >
            <Clock style={{ color: T.accent, width: "13px", height: "13px" }} />
            <span style={{ color: T.accent, fontSize: "0.76rem" }}>كيف يعمل النظام</span>
          </div>
          <h2 style={{ ...transition, color: T.textPrimary, fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 800 }}>
            أربع خطوات للتميز
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div
                style={{
                  ...transition,
                  width: "60px", height: "60px", borderRadius: "50%",
                  background:   s.iconBg,
                  border:       `1px solid ${s.iconBdr}`,
                  display:      "flex", alignItems: "center", justifyItems: "center",
                  justifyContent: "center",
                  margin:       "0 auto 18px",
                }}
              >
                <s.icon style={{ color: s.iconClr, width: "24px", height: "24px" }} strokeWidth={2} />
              </div>
              <span
                style={{
                  ...transition,
                  display:      "inline-block",
                  padding:      "2px 10px", borderRadius: "999px",
                  fontSize:     "0.72rem",
                  background:   s.badgeBg, color: s.badgeClr, border: `1px solid ${s.badgeBdr}`,
                  marginBottom: "10px",
                }}
              >
                الخطوة {s.num}
              </span>
              <h3 style={{ ...transition, color: T.textPrimary, fontWeight: 700, fontSize: "0.95rem", marginBottom: "8px" }}>
                {s.title}
              </h3>
              <p style={{ ...transition, color: T.textMuted, fontSize: "0.83rem", lineHeight: 1.8 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonSection({ T }) {
  const trad  = ["طريقة دراسة موحدة لجميع الطلاب", "لا تشخيص لنقاط الضعف الفعلية", "مراجعة المحتوى كله بلا تركيز", "نتائج متأخرة بعد الامتحان فقط", "لا تتكيف مع مستواك الشخصي"];
  const focus = ["تحليل ذكي يكشف ضعفك بدقة الوسوم", "خطة دراسية مخصصة لكل طالب", "تركيز فوري على ما تحتاجه فعلاً", "تغذية راجعة فورية بعد كل سؤال", "نظام يتطور مع تطور مستواك"];

  return (
    <section style={{ ...transition, background: T.bg, padding: "90px 0", borderTop: `1px solid ${T.border}` }}>
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <h2 style={{ ...transition, color: T.textPrimary, fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 800, marginBottom: "10px" }}>
            لماذا FOCUS تختلف؟
          </h2>
          <p style={{ ...transition, color: T.textMuted, fontSize: "0.95rem" }}>
            مقارنة واضحة بين الطريقة التقليدية ومنظومة FOCUS الذكية
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          <div
            style={{
              ...transition,
              padding: "32px", borderRadius: "16px",
              background:  T.bgCard,
              border:      `1px solid ${T.borderRed}`,
              boxShadow:   T.shadowCard,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ ...transition, width: "40px", height: "40px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <XCircle style={{ color: "#EF4444", width: "18px", height: "18px" }} strokeWidth={1.5} />
              </div>
              <h3 style={{ ...transition, color: T.textPrimary, fontWeight: 700, fontSize: "1rem" }}>الطريقة التقليدية</h3>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
              {trad.map((pt, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <XCircle style={{ color: "#EF4444", opacity: 0.5, width: "16px", height: "16px", flexShrink: 0 }} strokeWidth={1.5} />
                  <span style={{ ...transition, color: T.textMuted, fontSize: "0.875rem" }}>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
          <div
            style={{
              ...transition,
              padding:    "32px", borderRadius: "16px",
              background: T.bgCard,
              border:     `1px solid ${T.borderAccent}`,
              boxShadow:  T.shadowCard,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ ...transition, width: "40px", height: "40px", borderRadius: "10px", background: T.accentDim, border: `1px solid ${T.borderAccent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles style={{ color: T.accent, width: "18px", height: "18px" }} strokeWidth={1.5} />
              </div>
              <h3 style={{ ...transition, color: T.accent, fontWeight: 700, fontSize: "1rem" }}>مظومة FOCUS الذكية</h3>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
              {focus.map((pt, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <CheckCircle2 style={{ color: T.accent, width: "16px", height: "16px", flexShrink: 0 }} strokeWidth={1.5} />
                  <span style={{ ...transition, color: T.textPrimary, fontSize: "0.875rem" }}>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ T }) {
  const testimonials = [
    { quote: "FOCUS غيّرت طريقة مذاكرتي كلياً. درجتي في الفيزياء اتحسنت ٢٥ درجة في شهرين بسبب التركيز على نقاط الضعف الفعلية.", name: "يوسف محمد",     role: "طالب ثانوية عامة · القاهرة",      avatar: "ي", accent: T.accent,    dim: T.accentDim,    brd: T.borderAccent },
    { quote: "كمعلمة، لوحة التحليل وفّرت عليّ ساعات. بشوف مين الطلاب اللي محتاجين مساعدة في أي موضوع بالظبط.",                name: "أ. سارة إبراهيم", role: "معلمة كيمياء · الجيزة",            avatar: "س", accent: T.accentAlt, dim: T.accentAltDim, brd: T.borderAlt    },
    { quote: "كنت خايفة من الرياضيات، بس FOCUS بيّن لي بالظبط المواضيع اللي عندي فيها ضعف وكيف أصلحها.",                        name: "نور أحمد",         role: "طالبة ثانوية عامة · الإسكندرية",   avatar: "ن", accent: T.accent,    dim: T.accentDim,    brd: T.borderAccent },
  ];

  return (
    <section style={{ ...transition, background: T.bgPanel, padding: "90px 0", borderTop: `1px solid ${T.border}` }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <div
            style={{
              ...transition,
              display:      "inline-flex", alignItems: "center", gap: "8px",
              padding:      "6px 16px", borderRadius: "999px", marginBottom: "16px",
              background:   T.accentDim, border: `1px solid ${T.borderAccent}`,
            }}
          >
            <Star style={{ color: T.accent, width: "13px", height: "13px" }} fill={T.accent} />
            <span style={{ color: T.accent, fontSize: "0.76rem" }}>آراء مستخدمينا</span>
          </div>
          <h2 style={{ ...transition, color: T.textPrimary, fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 800 }}>
            يقولون عن FOCUS
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {testimonials.map((t, i) => (
            <div
              key={i}
              style={{ ...transition, ...card(T), padding: "28px", display: "flex", flexDirection: "column", gap: "18px" }}
              onMouseEnter={e => {
                const el = e.currentTarget;
                el.style.transform   = "translateY(-3px)";
                el.style.boxShadow   = T.shadowHover;
                el.style.borderColor = t.brd;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.transform   = "translateY(0)";
                el.style.boxShadow   = T.shadowCard;
                el.style.borderColor = T.border;
              }}
            >
              <div style={{ display: "flex", gap: "3px" }}>
                {Array.from({ length: 5 }).map((_, si) => (
                  <Star key={si} style={{ color: t.accent, width: "13px", height: "13px" }} fill={t.accent} />
                ))}
              </div>
              <p style={{ ...transition, color: T.textMuted, fontSize: "0.875rem", lineHeight: 1.85, flex: 1 }}>
                "{t.quote}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "14px", borderTop: `1px solid ${T.border}` }}>
                <div
                  style={{
                    ...transition,
                    width: "38px", height: "38px", borderRadius: "50%",
                    background:   t.dim,
                    border:       `1px solid ${t.brd}`,
                    display:      "flex", alignItems: "center", justifyContent: "center",
                    color:        t.accent, fontWeight: 700, fontSize: "0.875rem",
                    flexShrink:   0,
                  }}
                >
                  {t.avatar}
                </div>
                <div>
                  <div style={{ ...transition, color: T.textPrimary, fontWeight: 600, fontSize: "0.84rem" }}>{t.name}</div>
                  <div style={{ ...transition, color: T.textMuted, fontSize: "0.74rem" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection({ T, onNavigate, handleSmartNav }) {
  return (
    <>
      <section
        style={{
          ...transition,
          background:   T.ctaBg,
          padding:      "120px 0",
          borderTop:    `1px solid ${T.border}`,
          textAlign:    "center",
        }}
      >
        <div className="max-w-3xl mx-auto px-6">
          <div
            style={{
              ...transition,
              width: "72px", height: "72px", borderRadius: "18px",
              background:   T.iconBgA,
              border:       `1px solid ${T.iconBorderA}`,
              display:      "flex", alignItems: "center", justifyContent: "center",
              margin:       "0 auto 28px",
            }}
          >
            <GraduationCap style={{ color: T.iconA, width: "36px", height: "36px" }} strokeWidth={2} />
          </div>
          <h2 style={{ ...transition, color: T.textPrimary, fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, lineHeight: 1.2, marginBottom: "18px" }}>
            ابدأ رحلتك نحو{" "}
            <span style={{ color: T.accent }}>التميز الأكاديمي</span>
          </h2>
          <p style={{ ...transition, color: T.textMuted, fontSize: "1.05rem", marginBottom: "40px", lineHeight: 1.8 }}>
            انضم لآلاف الطلاب الذين حققوا نتائج متميزة مع FOCUS
            <br />
            ابدأ مجاناً اليوم، ولا تحتاج بطاقة ائتمانية
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px" }}>
            <button
              onClick={() => handleSmartNav('/signup')}
              style={{
                ...transition,
                display: "flex", alignItems: "center", gap: "8px",
                padding: "14px 40px", borderRadius: "12px",
                fontSize: "1rem", fontWeight: 700,
                background: T.accent, color: "#FFFFFF", border: "none", cursor: "pointer",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.opacity   = "0.88";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity   = "1";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              سجل الآن مجاناً
              <ArrowLeft style={{ width: "16px", height: "16px" }} />
            </button>
            <button
              onClick={() => onNavigate("login")}
              style={{
                ...transition,
                padding: "14px 40px", borderRadius: "12px",
                fontSize: "1rem",
                background: T.bgCard, color: T.textPrimary,
                border: `1px solid ${T.border}`, cursor: "pointer",
                boxShadow: T.shadowCard,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = T.borderAccent;
                e.currentTarget.style.color        = T.accent;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.color        = T.textPrimary;
              }}
            >
              تسجيل الدخول
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "24px", marginTop: "36px" }}>
            {["بدون بطاقة ائتمانية", "تجربة مجانية", "إلغاء في أي وقت"].map((label, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 style={{ color: T.accent, width: "14px", height: "14px" }} strokeWidth={1.5} />
                <span style={{ ...transition, color: T.textMuted, fontSize: "0.82rem" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ ...transition, background: T.footerBg, borderTop: `1px solid ${T.border}`, padding: "28px 24px" }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo className="scale-75 origin-left" />
          <p style={{ ...transition, color: T.textDim, fontSize: "0.78rem" }}>
            © ٢٠٢٦ FOCUS. جميع الحقوق محفوظة.
          </p>
          <div style={{ display: "flex", gap: "20px" }}>
            {["شروط الاستخدام", "سياسة الخصوصية"].map((link, i) => (
              <span
                key={i}
                style={{ ...transition, color: T.textDim, fontSize: "0.78rem", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.color = T.textMuted}
                onMouseLeave={e => e.currentTarget.style.color = T.textDim}
              >
                {link}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}

const LandingPage = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { C: T, glass, isDarkMode, toggleTheme } = useTheme();
  
  const [isLoggedIn] = useState(() => !!localStorage.getItem('token'));
  const [landingData, setLandingData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSmartNav = (fallbackRoute) => {
    if (!isLoggedIn) {
      navigate(fallbackRoute);
      return;
    }
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'teacher' || user.role === 'admin') {
          navigate('/teacher-dashboard');
          return;
        }
      }
    } catch (e) {
      console.error("Error parsing user data:", e);
    }
    navigate('/dashboard');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const { data } = await publicApi.get('/landing_page');
        const payload = data?.data ?? data ?? {};
        setLandingData(payload);
      } catch (err) {
        console.warn('Failed to fetch landing page data:', err.message);
        setLandingData(null);
      }
    };
    fetchLandingData();
  }, []);

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ ...transition, background: T.bg, minHeight: "100vh", overflowX: "hidden", fontFamily: "'Cairo', sans-serif" }}>
      <NavHeader        T={T} isDarkMode={isDarkMode} setIsDarkMode={toggleTheme} onNavigate={navigate} handleSmartNav={handleSmartNav} isLoggedIn={isLoggedIn} t={t} searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />
      <HeroSection      T={T} glass={glass} onNavigate={navigate} handleSmartNav={handleSmartNav} />
      <StatsSection     T={T} landingData={landingData} />
      <SubjectsSection  T={T} subjects={landingData?.subjects} onNavigateSubject={(id) => navigate(`/subject/${id}`)} />
      <HowItWorksSection T={T} />
      <ComparisonSection T={T} />
      <TestimonialsSection T={T} />
      <CTASection       T={T} onNavigate={navigate} handleSmartNav={handleSmartNav} />
    </div>
  );
}

export default LandingPage;
