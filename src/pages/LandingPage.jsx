import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { publicApi } from "../api/api";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import FullLogo from "../components/FullLogo";
import TargetIcon from "../components/TargetIcon";
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
  ClipboardCheck,
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
          <FullLogo className="text-3xl" theme="dark" />

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

function FeatureCard({
  icon: Icon,
  title,
  description,
  iconColor = "#22d3ee",
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative p-[1.5px] rounded-2xl cursor-default"
      style={{ fontFamily: "'Cairo', sans-serif" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Animated gradient border layer */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        animate={{
          opacity: hovered ? 1 : 0,
          background: hovered
            ? [
                "linear-gradient(135deg, #1e40af, #7c3aed, #1e40af)",
                "linear-gradient(225deg, #7c3aed, #1e40af, #7c3aed)",
                "linear-gradient(315deg, #1e40af, #7c3aed, #1e40af)",
              ]
            : "linear-gradient(135deg, #1e40af, #7c3aed)",
        }}
        transition={{
          opacity: { duration: 0.35 },
          background: { duration: 3, repeat: Infinity, ease: "linear" },
        }}
      />

      {/* Subtle default border */}
      <div
        className="absolute inset-0 rounded-2xl border border-gray-200 dark:border-white/10"
      />

      {/* Card body */}
      <div
        className="relative rounded-2xl flex flex-col items-center text-center px-6 py-8 gap-5 bg-white shadow-sm dark:bg-[#1A2744]/40 dark:shadow-none"
        style={{ height: "100%" }}
      >
        {/* Icon container */}
        <div
          className="relative flex items-center justify-center w-14 h-14 rounded-xl flex-shrink-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${iconColor}18 0%, ${iconColor}06 100%)`,
            border: `1px solid ${iconColor}30`,
          }}
        >
          <motion.div
            animate={
              hovered
                ? { filter: `drop-shadow(0 0 8px ${iconColor}90)` }
                : { filter: `drop-shadow(0 0 4px ${iconColor}50)` }
            }
            transition={{ duration: 0.4 }}
          >
            <Icon size={26} color={iconColor} strokeWidth={1.5} />
          </motion.div>
          {/* Subtle icon glow bg */}
          <motion.div
            className="absolute inset-0 rounded-xl"
            animate={{ opacity: hovered ? 0.2 : 0.08 }}
            transition={{ duration: 0.4 }}
            style={{ background: `radial-gradient(circle, ${iconColor} 0%, transparent 70%)` }}
          />
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-2">
          <h3
            className="text-slate-900 dark:text-white m-0"
            style={{ fontSize: "1.1rem", fontWeight: 700, lineHeight: 1.4 }}
          >
            {title}
          </h3>
          <p
            className="m-0 leading-relaxed text-slate-600 dark:text-[#94a3b8]"
            style={{ fontSize: "0.875rem", fontWeight: 400, maxWidth: "22ch" }}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function HeroSection({ T, glass, onNavigate, handleSmartNav }) {
  return (
    <section
      dir="rtl"
      className="bg-slate-50 dark:bg-[#0f172a]"
      style={{
        ...transition,
        position:      "relative",
        minHeight:     "100vh",
        width:         "100%",
        overflow:      "hidden",
        padding:       "80px 0 100px",
        fontFamily:    "'Cairo', sans-serif",
      }}
    >
      {/* ── Ambient background gradients ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden="true">
        {/* Cyan top-right glow */}
        <div style={{
          position: "absolute", top: "-10%", right: "5%",
          width: "520px", height: "520px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
        }} />
        {/* Purple bottom-left glow */}
        <div style={{
          position: "absolute", bottom: "-5%", left: "10%",
          width: "480px", height: "480px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)",
        }} />
        {/* Center indigo subtle */}
        <div style={{
          position: "absolute", top: "30%", left: "35%",
          width: "300px", height: "300px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)",
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12" style={{ position: "relative", zIndex: 10 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "48px 64px",
          alignItems: "center",
        }} className="grid-cols-1 lg:grid-cols-2">

          {/* ── Column 1: Text (right in RTL) ── */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", textAlign: "right", gap: "28px" }}>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                borderRadius: "999px", padding: "8px 16px", fontSize: "0.875rem",
                background: "rgba(14,165,233,0.10)",
                border: "1px solid rgba(14,165,233,0.25)",
                backdropFilter: "blur(12px)",
                color: "#38bdf8",
              }}
            >
              <span>✨</span>
              <span>منصة تعليمية مدعومة بالذكاء الاصطناعي</span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              className="text-slate-900 dark:text-[#f1f5f9]"
              style={{
                fontFamily: "'Cairo', sans-serif",
                fontSize: "clamp(2rem, 4vw, 3.5rem)",
                fontWeight: 900,
                lineHeight: 1.3,
                margin: 0,
                textAlign: "right",
              }}
            >
              منصتك الذكية{" "}
              <span style={{
                background: "linear-gradient(135deg, #818cf8 0%, #a78bfa 40%, #c084fc 80%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                للتميز في
              </span>
              <br />
              الثانوية العامة
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
              className="text-slate-600 dark:text-[#cbd5e1]"
              style={{
                fontFamily: "'Cairo', sans-serif",
                fontSize: "clamp(0.95rem, 1.5vw, 1.125rem)",
                lineHeight: 1.8,
                fontWeight: 400,
                maxWidth: "32rem",
                margin: 0,
              }}
            >
              تعلّم بأسلوب ذكي ومخصص مع منصة{" "}
              <span style={{ color: "#818cf8", fontWeight: 600 }}>Focus</span>
              . دروس تفاعلية، اختبارات تكيفية، ومسار دراسي يتكيف مع مستواك
              ليضمن لك أعلى النتائج في امتحاناتك.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
              style={{ display: "flex", flexDirection: "row-reverse", gap: "16px", flexWrap: "wrap", justifyContent: "flex-start" }}
            >
              {/* Primary CTA – smooth scroll to subjects */}
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  document.getElementById('subjects-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  position: "relative", overflow: "hidden",
                  borderRadius: "12px", padding: "12px 28px",
                  color: "#ffffff", cursor: "pointer",
                  fontFamily: "'Cairo', sans-serif", fontWeight: 700, fontSize: "1rem",
                  background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)",
                  boxShadow: "0 0 24px rgba(99,102,241,0.45), 0 4px 16px rgba(99,102,241,0.3)",
                  border: "none",
                }}
              >
                ابدأ التعلم الآن ←
              </motion.button>

              {/* Secondary CTA */}
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate("signup")}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  borderRadius: "12px", padding: "12px 28px", cursor: "pointer",
                  fontFamily: "'Cairo', sans-serif", fontWeight: 600, fontSize: "1rem",
                  color: "#e2e8f0",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: "blur(16px)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              >
                <span style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: "rgba(99,102,241,0.25)", color: "#818cf8", fontSize: "0.75rem",
                }}>▶</span>
                شاهد كيف يعمل
              </motion.button>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
              style={{
                display: "flex", flexDirection: "row-reverse", gap: "32px", paddingTop: "8px",
                borderTop: "1px solid rgba(255,255,255,0.06)", width: "100%",
              }}
            >
              {/* {[
                { value: "+٥٠٠٠", label: "طالب نشط" },
                { value: "٩٨٪",   label: "معدل النجاح" },
                { value: "+٢٠٠",  label: "درس تفاعلي" },
              ].map((stat) => (
                <div key={stat.label} style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", paddingTop: "16px" }}>
                  <span style={{
                    fontFamily: "'Cairo', sans-serif", fontSize: "1.4rem", fontWeight: 800,
                    background: "linear-gradient(135deg, #38bdf8, #818cf8)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  }}>{stat.value}</span>
                  <span style={{
                    fontFamily: "'Cairo', sans-serif", fontSize: "0.8rem",
                    color: "#64748b", fontWeight: 500,
                  }}>{stat.label}</span>
                </div>
              ))} */}
            </motion.div>
          </div>

          {/* ── Column 2: Visual – TargetIcon with glow auras (left in RTL) ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: "32px 0" }}>

            {/* Large cyan glow aura behind icon */}
            <div style={{
              position: "absolute",
              width: "520px", height: "520px",
              background: "radial-gradient(circle, rgba(6,182,212,0.28) 0%, rgba(99,102,241,0.14) 45%, transparent 72%)",
              borderRadius: "50%",
              filter: "blur(32px)",
            }} />

            {/* Inner bright core glow */}
            <div style={{
              position: "absolute",
              width: "300px", height: "300px",
              background: "radial-gradient(circle, rgba(56,189,248,0.20) 0%, transparent 70%)",
              borderRadius: "50%",
              filter: "blur(20px)",
            }} />

            {/* Floating TargetIcon */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ position: "relative", maxWidth: "90vw" }}
            >
              {/* Ground shadow that shrinks/grows with float */}
              <motion.div
                animate={{ scaleX: [1, 0.75, 1], opacity: [0.5, 0.25, 0.5] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute", bottom: "-28px", left: "50%",
                  transform: "translateX(-50%)",
                  width: "260px", height: "28px",
                  background: "radial-gradient(ellipse, rgba(6,182,212,0.35) 0%, transparent 70%)",
                  filter: "blur(12px)", borderRadius: "50%",
                }}
              />
              <TargetIcon className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 relative z-10" />
            </motion.div>
          </div>

        </div>
      </div>

      {/* ── Feature Cards (below the hero grid) ── */}
      <div className="relative max-w-7xl mx-auto px-6 lg:px-12" style={{ position: "relative", zIndex: 10, marginTop: "80px" }} dir="rtl">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
          {[
            {
              icon: Brain,
              title: "كشف نقاط الضعف بالذكاء الاصطناعي",
              description: "النظام يحلل إجاباتك ويحدد المواضيع التي تحتاج للتركيز عليها بدقة",
              iconColor: "#22d3ee",
            },
            {
              icon: TrendingUp,
              title: "تتبع التقدم المستمر",
              description: "متابعة دقيقة لتطورك في كل مادة ومقارنة مع تقارير تفصيلية",
              iconColor: "#818cf8",
            },
            {
              icon: Target,
              title: "خطة دراسية شخصية",
              description: "توجيه ذكي للدروس والتمارين بناءً على مستواك الحالي وأهدافك",
              iconColor: "#34d399",
            },
            {
              icon: Zap,
              title: "تغذية راجعة فورية",
              description: "تلقَّ تحليلاً فورياً بعد كل سؤال لتفهم أخطاءك وتصحّحها لحظياً",
              iconColor: "#f59e0b",
            },
            {
              icon: BarChart3,
              title: "تحليلات أداء متقدمة",
              description: "رسوم بيانية واضحة تُظهر نموك عبر الوقت في كل موضوع ومادة",
              iconColor: "#a78bfa",
            },
            {
              icon: BookOpen,
              title: "محتوى شامل ومنظّم",
              description: "جميع مواد الثانوية العامة في مكان واحد، منظّمة ومصنّفة بعناية",
              iconColor: "#38bdf8",
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <FeatureCard {...f} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ stat }) {
  const [hovered, setHovered] = useState(false);
  const { isDarkMode } = useTheme();
  
  const iconColor = stat.color || "#38bdf8";
  const Icon = stat.icon;

  const bgGradient = isDarkMode
    ? "linear-gradient(160deg, #0d1528 0%, #0a0f1e 100%)"
    : `linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)`;

  const borderStatic = isDarkMode
    ? "1.5px solid rgba(255,255,255,0.07)"
    : "1.5px solid rgba(0,0,0,0.04)";

  const textColor = isDarkMode ? "#ffffff" : "#0f172a";
  const descColor = isDarkMode ? "#94a3b8" : "#475569";

  return (
    <div
      className="relative p-[1.5px] rounded-2xl cursor-default h-full transition-transform duration-300"
      style={{ fontFamily: "'Cairo', sans-serif", transform: hovered ? "translateY(-4px)" : "translateY(0)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        className="absolute inset-0 rounded-2xl"
        animate={{
          opacity: hovered ? 1 : 0,
          background: hovered
            ? [
                `linear-gradient(135deg, ${iconColor}50, transparent, ${iconColor}50)`,
                `linear-gradient(225deg, transparent, ${iconColor}50, transparent)`,
                `linear-gradient(315deg, ${iconColor}50, transparent, ${iconColor}50)`,
              ]
            : `linear-gradient(135deg, ${iconColor}20, transparent)`,
        }}
        transition={{
          opacity: { duration: 0.35 },
          background: { duration: 3, repeat: Infinity, ease: "linear" },
        }}
      />
      <div
        className="absolute inset-0 rounded-2xl"
        style={{ border: borderStatic }}
      />
      <div
        className="relative rounded-2xl flex flex-col items-center justify-center p-8 h-full text-center"
        style={{ background: bgGradient, boxShadow: isDarkMode ? "none" : hovered ? "0 10px 25px -5px rgba(0,0,0,0.05)" : "0 4px 6px -1px rgba(0,0,0,0.02)", transition: "box-shadow 0.3s ease" }}
      >
        <div
            className="flex items-center justify-center w-16 h-16 rounded-full mb-5"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${iconColor}18 0%, ${iconColor}06 100%)`,
              border: `1px solid ${iconColor}30`,
            }}
        >
          <motion.div
            animate={
              hovered
                ? { filter: `drop-shadow(0 0 8px ${iconColor}80)`, scale: 1.1 }
                : { filter: `drop-shadow(0 0 4px ${iconColor}40)`, scale: 1 }
            }
            transition={{ duration: 0.4 }}
          >
            <Icon size={30} color={iconColor} strokeWidth={1.5} />
          </motion.div>
        </div>
        
        <div style={{ color: iconColor, fontSize: "2.2rem", fontWeight: 800, lineHeight: 1, marginBottom: "8px" }}>
          {stat.value}
        </div>
        <div style={{ color: textColor, fontWeight: 700, fontSize: "1rem", marginBottom: "4px" }}>
          {stat.label}
        </div>
        <div style={{ color: descColor, fontSize: "0.8rem" }}>
          {stat.sub}
        </div>
      </div>
    </div>
  );
}

function StatsSection({ T, landingData }) {
  const stats = [
    { icon: Users,         color: "#38bdf8", value: `${landingData?.all_students_count ?? "52"}+`, label: "طالب مسجّل",   sub: "عبر محافظات مصر" },
    { icon: GraduationCap, color: "#38bdf8", value: `${landingData?.all_teachers_count ?? "23"}+`,   label: "معلم متخصص",  sub: "يستخدمون لوحة التحليل" },
    { icon: Star,          color: "#38bdf8", value: "%98",   label: "نسبة الرضا",  sub: "يوصون بالمنصة" },
    { icon: Zap,           color: "#38bdf8", value: `${landingData?.subjects_count ?? "3"}+`,  label: "درس ومراجعة", sub: "محتوى محدّث باستمرار" },
  ];

  return (
    <section style={{ ...transition, background: T.bgPanel, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: "70px 0" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <StatCard stat={s} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SubjectCard({ subject, onClick }) {
  const [hovered, setHovered] = useState(false);
  const { isDarkMode, theme: T } = useTheme();
  
  const iconColor = subject.color || "#818cf8";
  const Icon = subject.icon;

  const bgGradient = isDarkMode
    ? "linear-gradient(160deg, #0d1528 0%, #0a0f1e 100%)"
    : `linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)`;

  const borderStatic = isDarkMode
    ? "1.5px solid rgba(255,255,255,0.07)"
    : "1.5px solid rgba(0,0,0,0.04)";

  const textColor = isDarkMode ? "#ffffff" : "#0f172a";
  const descColor = isDarkMode ? "#94a3b8" : "#475569";

  return (
    <div
      className="relative p-[1.5px] rounded-2xl cursor-pointer h-full transition-transform duration-300"
      style={{ fontFamily: "'Cairo', sans-serif", transform: hovered ? "translateY(-4px)" : "translateY(0)" }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        className="absolute inset-0 rounded-2xl"
        animate={{
          opacity: hovered ? 1 : 0,
          background: hovered
            ? [
                `linear-gradient(135deg, ${iconColor}50, transparent, ${iconColor}50)`,
                `linear-gradient(225deg, transparent, ${iconColor}50, transparent)`,
                `linear-gradient(315deg, ${iconColor}50, transparent, ${iconColor}50)`,
              ]
            : `linear-gradient(135deg, ${iconColor}20, transparent)`,
        }}
        transition={{
          opacity: { duration: 0.35 },
          background: { duration: 3, repeat: Infinity, ease: "linear" },
        }}
      />
      <div
        className="absolute inset-0 rounded-2xl"
        style={{ border: borderStatic }}
      />
      <div
        className="relative rounded-2xl flex flex-col p-6 h-full text-right"
        style={{ background: bgGradient, boxShadow: isDarkMode ? "none" : hovered ? "0 10px 25px -5px rgba(0,0,0,0.05)" : "0 4px 6px -1px rgba(0,0,0,0.02)", transition: "box-shadow 0.3s ease" }}
      >
        <div className="flex justify-between items-start mb-6" dir="ltr">
          <div
             className="relative flex items-center justify-center w-14 h-14 rounded-xl flex-shrink-0"
             style={{
               background: `radial-gradient(circle at 50% 50%, ${iconColor}18 0%, ${iconColor}06 100%)`,
               border: `1px solid ${iconColor}30`,
             }}
          >
            <motion.div
              animate={
                hovered
                  ? { filter: `drop-shadow(0 0 8px ${iconColor}80)` }
                  : { filter: `drop-shadow(0 0 4px ${iconColor}40)` }
              }
              transition={{ duration: 0.4 }}
            >
              <Icon size={28} color={iconColor} strokeWidth={1.5} />
            </motion.div>
          </div>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: "8px",
              fontSize: "0.75rem",
              letterSpacing: "0.05em",
              background: `${iconColor}15`,
              color: iconColor,
              border: `1px solid ${iconColor}30`,
              textTransform: "uppercase"
            }}
          >
            {subject.eng}
          </span>
        </div>
        
        <h3
          className="m-0 mb-4"
          style={{ color: textColor, fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.4 }}
        >
          {subject.name}
        </h3>
        
        <div className="mt-auto flex items-center gap-2" style={{ color: descColor, fontSize: "0.85rem" }}>
          <span className="transition-colors duration-300" style={{ color: hovered ? iconColor : descColor }}>ابدأ الآن</span>
          <motion.div animate={{ x: hovered ? -4 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronRight size={16} color={hovered ? iconColor : descColor} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function SubjectsSection({ T, subjects, onNavigateSubject }) {
  const SUBJECT_MAP = {
    PHYSICS:   { icon: Atom,         eng: "Physics",     color: "#38bdf8" },
    CHEMISTRY: { icon: FlaskConical, eng: "Chemistry",   color: "#34d399" },
    BIOLOGY:   { icon: Microscope,   eng: "Biology",     color: "#f472b6" },
    MATH:      { icon: Calculator,   eng: "Mathematics", color: "#818cf8" },
    DEFAULT:   { icon: BookOpen,     eng: "Subject",     color: "#a78bfa" },
  };

  const displayedSubjects = subjects?.length > 0 ? subjects.map(s => {
      const mapped = SUBJECT_MAP[s.code] || SUBJECT_MAP.DEFAULT;
      return {
         ...mapped,
         name: s.title,
         id: s.id
      };
  }) : [
    { name: "الفيزياء",   icon: Atom,         eng: "Physics",     color: "#38bdf8" },
    { name: "الكيمياء",   icon: FlaskConical, eng: "Chemistry",   color: "#34d399" },
    { name: "الأحياء",    icon: Microscope,   eng: "Biology",     color: "#f472b6" },
    { name: "الرياضيات",  icon: Calculator,   eng: "Mathematics", color: "#818cf8" },
  ];

  return (
    <section id="subjects-section" style={{ ...transition, background: T.bg, padding: "90px 0" }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
          {displayedSubjects.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <SubjectCard
                subject={s}
                onClick={() => s.id ? onNavigateSubject(s.id) : null}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ stepName, title, description, icon: Icon, iconColor = "#818cf8" }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative p-[1.5px] rounded-2xl cursor-default h-full"
      style={{ fontFamily: "'Cairo', sans-serif" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        className="absolute inset-0 rounded-2xl"
        animate={{
          opacity: hovered ? 1 : 0,
          background: hovered
            ? [
                `linear-gradient(135deg, ${iconColor}40, transparent, ${iconColor}40)`,
                `linear-gradient(225deg, transparent, ${iconColor}40, transparent)`,
                `linear-gradient(315deg, ${iconColor}40, transparent, ${iconColor}40)`,
              ]
            : `linear-gradient(135deg, ${iconColor}20, transparent)`,
        }}
        transition={{
          opacity: { duration: 0.35 },
          background: { duration: 3, repeat: Infinity, ease: "linear" },
        }}
      />
      <div
        className="absolute inset-0 rounded-2xl border border-gray-200 dark:border-white/10"
      />
      <div
        className="relative rounded-2xl flex flex-col items-center text-center px-6 py-8 gap-4 bg-white shadow-sm dark:bg-[#1A2744]/40 dark:shadow-none"
        style={{ height: "100%" }}
      >
        <div
          className="relative flex items-center justify-center w-14 h-14 rounded-full flex-shrink-0 mb-2"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${iconColor}18 0%, ${iconColor}06 100%)`,
            border: `1px solid ${iconColor}30`,
          }}
        >
          <motion.div
            animate={
              hovered
                ? { filter: `drop-shadow(0 0 8px ${iconColor}90)` }
                : { filter: `drop-shadow(0 0 4px ${iconColor}50)` }
            }
            transition={{ duration: 0.4 }}
          >
            <Icon size={26} color={iconColor} strokeWidth={1.5} />
          </motion.div>
        </div>
        
        <span
          style={{
            display: "inline-block",
            padding: "2px 12px",
            borderRadius: "999px",
            fontSize: "0.75rem",
            background: `${iconColor}20`,
            color: iconColor,
            border: `1px solid ${iconColor}40`,
          }}
        >
          {stepName}
        </span>
        
        <h3
          className="text-slate-900 dark:text-white m-0"
          style={{ fontSize: "1.05rem", fontWeight: 700, lineHeight: 1.4 }}
        >
          {title}
        </h3>
        <p
          className="m-0 leading-relaxed text-slate-600 dark:text-[#94a3b8]"
          style={{ fontSize: "0.875rem", fontWeight: 400 }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

function HowItWorksSection({ T }) {
  const steps = [
    { num: "١", icon: ClipboardCheck, title: "تشخيص المستوى", desc: "حل اختبارات تشخيصية دقيقة لتحديد مستواك ومكامن قوتك وضعفك.", iconColor: "#22d3ee" },
    { num: "٢", icon: Brain,          title: "تحليل الذكاء الاصطناعي", desc: "النظام يرصد نمط إجاباتك ويكشف نقاط الضعف الدقيقة عبر وسوم المهارات.", iconColor: "#818cf8" },
    { num: "٣", icon: Target,         title: "خطة مخصصة", desc: "استلم مساراً دراسياً يركز فقط على مراجعة ما تحتاج إلى تحسينه.", iconColor: "#34d399" },
    { num: "٤", icon: TrendingUp,     title: "تطور مستمر", desc: "راقب تقدمك أسبوعياً مع تقارير شاملة تُعدّل الخطة تلقائياً بمستواك الجديد.", iconColor: "#f59e0b" },
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <StepCard
                stepName={`الخطوة ${s.num}`}
                title={s.title}
                description={s.desc}
                icon={s.icon}
                iconColor={s.iconColor}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonSection({ T }) {
  const trad  = ["طريقة دراسة موحدة لجميع الطلاب", "لا تشخيص دقيق لنقاط الضعف", "مراجعة المحتوى كله بلا تركيز", "نتائج متأخرة بعد الامتحان فقط", "لا تتكيف مع مستواك الشخصي"];
  const focus = ["تحليل ذكي يكشف ضعفك بدقة", "خطة دراسية مخصصة لك فقط", "تركيز فوري على ما تحتاجه فعلاً", "تغذية راجعة متقدمة بعد كل سؤال", "نظام يتطور كلما تطور مستواك"];

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
          
          {/* Traditional Card */}
          <div className="relative p-[1.5px] rounded-2xl cursor-default h-full">
            <div className="absolute inset-0 rounded-2xl border border-red-200 dark:border-red-900/30" />
            <div className="relative rounded-2xl flex flex-col px-8 py-8 h-full bg-red-50/50 dark:bg-[#2a0f15]/80">
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <XCircle className="text-red-500" style={{ width: "22px", height: "22px" }} strokeWidth={1.5} />
                </div>
                <h3 className="text-red-600 dark:text-red-400" style={{ fontWeight: 700, fontSize: "1.15rem", margin: 0 }}>الطريقة التقليدية</h3>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "18px" }}>
                {trad.map((pt, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <XCircle className="text-red-500 opacity-70" style={{ width: "18px", height: "18px", flexShrink: 0 }} strokeWidth={1.5} />
                    <span className="text-slate-700 dark:text-slate-400" style={{ fontSize: "0.95rem" }}>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Focus Card */}
          <div className="relative p-[1.5px] rounded-2xl cursor-default h-full overflow-hidden">
            <motion.div
              className="absolute inset-0 rounded-2xl hidden dark:block"
              animate={{
                background: [
                  "linear-gradient(135deg, #1e40af, #7c3aed, #1e40af)",
                  "linear-gradient(225deg, #7c3aed, #1e40af, #7c3aed)",
                  "linear-gradient(315deg, #1e40af, #7c3aed, #1e40af)",
                ]
              }}
              transition={{ background: { duration: 3, repeat: Infinity, ease: "linear" } }}
            />
            <div className="absolute inset-0 rounded-2xl border border-blue-200 dark:border-white/10" />
            <div className="relative rounded-2xl flex flex-col px-8 py-8 h-full bg-blue-50/50 dark:bg-[#1A2744]/60">
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Sparkles className="text-blue-500 dark:text-cyan-400" style={{ width: "22px", height: "22px" }} strokeWidth={1.5} />
                </div>
                <h3 className="text-blue-600 dark:text-cyan-400" style={{ fontWeight: 700, fontSize: "1.15rem", margin: 0 }}>منظومة FOCUS الذكية</h3>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "18px" }}>
                {focus.map((pt, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <CheckCircle2 className="text-emerald-500 dark:text-emerald-400" style={{ width: "18px", height: "18px", flexShrink: 0 }} strokeWidth={1.5} />
                    <span className="text-slate-900 dark:text-slate-100" style={{ fontSize: "0.95rem", fontWeight: 500 }}>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
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
          <FullLogo className="scale-75 origin-left text-3xl" theme={T.isDark ? 'dark' : 'light'} />
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
