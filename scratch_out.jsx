import { useState } from "react";
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
} from "lucide-react";



/* ════════════════════════════════════════════════════
   THEME FACTORY
   Returns a token object based on the current mode.
════════════════════════════════════════════════════ */
function buildTheme(dark) {
  return dark
    ? {
        // ── Surfaces ──────────────────────────────
        bg:           "#0B1120",
        bgPanel:      "#0D1526",
        bgCard:       "rgba(255,255,255,0.035)",
        bgCardHover:  "rgba(255,255,255,0.060)",
        // ── Borders ───────────────────────────────
        border:       "rgba(255,255,255,0.08)",
        borderAccent: "rgba(79,70,229,0.38)",
        borderAlt:    "rgba(14,165,233,0.28)",
        borderRed:    "rgba(239,68,68,0.22)",
        // ── Accents ───────────────────────────────
        accent:       "#4F46E5",   // Indigo
        accentAlt:    "#0EA5E9",   // Sky blue
        accentDim:    "rgba(79,70,229,0.14)",
        accentAltDim: "rgba(14,165,233,0.12)",
        // ── Icon Design System (high-contrast on dark) ──
        iconA:        "#38BDF8",                    // Bright sky-blue — crisp on dark
        iconB:        "#818CF8",                    // Bright periwinkle — crisp on dark
        iconBgA:      "rgba(56,189,248,0.10)",      // Subtle sky tint
        iconBgB:      "rgba(129,140,248,0.11)",     // Subtle indigo tint
        iconBgAHover: "rgba(56,189,248,0.17)",
        iconBgBHover: "rgba(129,140,248,0.18)",
        iconBorderA:  "rgba(56,189,248,0.22)",      // Crisp sky border
        iconBorderB:  "rgba(129,140,248,0.25)",     // Crisp indigo border
        // ── Text ──────────────────────────────────
        textPrimary:  "#F8FAFC",
        textMuted:    "#94A3B8",
        textDim:      "#475569",
        // ── Elevation ─────────────────────────────
        shadowCard:   "0 1px 1px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.35)",
        shadowHover:  "0 8px 28px rgba(0,0,0,0.55)",
        // ── CTA strip ─────────────────────────────
        ctaBg:        "#0E1A35",
        footerBg:     "#070C18",
      }
    : {
        // ── Surfaces ──────────────────────────────
        bg:           "#F8FAFC",
        bgPanel:      "#FFFFFF",
        bgCard:       "#FFFFFF",
        bgCardHover:  "#F1F5F9",
        // ── Borders ───────────────────────────────
        border:       "#E2E8F0",
        borderAccent: "rgba(15,76,129,0.28)",
        borderAlt:    "rgba(37,99,235,0.22)",
        borderRed:    "rgba(239,68,68,0.20)",
        // ── Accents ───────────────────────────────
        accent:       "#0F4C81",
        accentAlt:    "#2563EB",
        accentDim:    "rgba(15,76,129,0.08)",
        accentAltDim: "rgba(37,99,235,0.07)",
        // ── Icon Design System (clean on light) ───
        iconA:        "#0F4C81",                    // Deep brand blue
        iconB:        "#2563EB",                    // Vibrant blue
        iconBgA:      "rgba(15,76,129,0.08)",
        iconBgB:      "rgba(37,99,235,0.07)",
        iconBgAHover: "rgba(15,76,129,0.14)",
        iconBgBHover: "rgba(37,99,235,0.13)",
        iconBorderA:  "rgba(15,76,129,0.18)",
        iconBorderB:  "rgba(37,99,235,0.16)",
        // ── Text ──────────────────────────────────
        textPrimary:  "#0F172A",
        textMuted:    "#64748B",
        textDim:      "#94A3B8",
        // ── Elevation ─────────────────────────────
        shadowCard:   "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)",
        shadowHover:  "0 8px 28px rgba(0,0,0,0.10)",
        // ── CTA strip ─────────────────────────────
        ctaBg:        "#EFF6FF",
        footerBg:     "#F1F5F9",
      };
}



/* ════════════════════════════════════════════════════
   SHARED CARD STYLE HELPER
═══════════════��════════════════════════════════════ */
const card = (T, extra) => ({
  background:   T.bgCard,
  border:       `1px solid ${T.border}`,
  borderRadius: "16px",
  boxShadow:    T.shadowCard,
  ...extra,
});

/* ════════════════════════════════════════════════════
   TRANSITION WRAPPER
════════════════════════════════════════════════════ */
const transition = {
  transition: "background 0.25s ease, border-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease",
};

/* ════════════════════════════════════════════════════
   1 — HEADER
════════════════════════════════════════════════════ */
function NavHeader({
  T,
  isDarkMode,
  setIsDarkMode,
  onNavigate,
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
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            style={{
              ...transition,
              width: "40px", height: "40px", borderRadius: "10px",
              background:  T.iconBgA,
              border:      `1px solid ${T.iconBorderA}`,
              display:     "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Brain style={{ color: T.iconA, width: "20px", height: "20px" }} strokeWidth={2} />
          </div>
          <span style={{ ...transition, color: T.iconA, fontSize: "1.4rem", fontWeight: 800, letterSpacing: "0.16em" }}>
            FOCUS
          </span>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">

          {/* ── Theme toggle ── */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
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
              const el = e.currentTarget ;
              el.style.borderColor = T.borderAccent;
              el.style.color       = T.accent;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget ;
              el.style.borderColor = T.border;
              el.style.color       = T.textMuted;
            }}
          >
            {isDarkMode
              ? <Sun  style={{ width: "16px", height: "16px" }} strokeWidth={1.5} />
              : <Moon style={{ width: "16px", height: "16px" }} strokeWidth={1.5} />
            }
          </button>

          {/* Login */}
          <button
            onClick={() => onNavigate("auth")}
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
              const el = e.currentTarget ;
              el.style.color       = T.textPrimary;
              el.style.borderColor = T.borderAccent;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget ;
              el.style.color       = T.textMuted;
              el.style.borderColor = T.border;
            }}
          >
            تسجيل الدخول
          </button>

          {/* Sign up — solid accent */}
          <button
            onClick={() => onNavigate("auth")}
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
              (e.currentTarget ).style.opacity = "0.88";
            }}
            onMouseLeave={e => {
              (e.currentTarget ).style.opacity = "1";
            }}
          >
            حساب جديد
          </button>
        </div>
      </div>
    </header>
  );
}

/* ════════════════════════════════════════════════════
   2 — HERO
════════════════════════════════════════════════════ */
function HeroSection({ T, onNavigate }) {
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
      {/* Subtle structural dot grid */}
      <div
        style={{
          position:         "absolute", inset: 0, pointerEvents: "none",
          backgroundImage:  `radial-gradient(${T.textDim === "#475569" ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.055)"} 1px, transparent 1px)`,
          backgroundSize:   "36px 36px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 text-center">
        <div className="max-w-3xl mx-auto">

          {/* Badge */}
          <div
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
          </div>

          {/* H1 */}
          <h1
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
          </h1>

          {/* Sub */}
          <p
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
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => onNavigate("auth")}
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
                (e.currentTarget ).style.opacity   = "0.88";
                (e.currentTarget ).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget ).style.opacity   = "1";
                (e.currentTarget ).style.transform = "translateY(0)";
              }}
            >
              ابدأ التعلم الآن
              <ArrowLeft style={{ width: "16px", height: "16px" }} />
            </button>

            <button
              onClick={() => onNavigate("auth")}
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
                (e.currentTarget ).style.borderColor = T.borderAccent;
                (e.currentTarget ).style.color        = T.accent;
              }}
              onMouseLeave={e => {
                (e.currentTarget ).style.borderColor = T.border;
                (e.currentTarget ).style.color        = T.textPrimary;
              }}
            >
              شاهد كيف يعمل
            </button>
          </div>
        </div>

        {/* ── Feature cards (hero bottom) ── */}
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px", marginTop: "72px" }}
        >
          {[
            { icon: Brain,      iconBg: T.iconBgA, iconBdr: T.iconBorderA, iconClr: T.iconA, title: "كشف نقاط الضعف بالذكاء الاصطناعي", desc: "النظام يحلل إجاباتك ويحدد المواضيع التي تحتاج للتركيز عليها بدقة" },
            { icon: Target,     iconBg: T.iconBgB, iconBdr: T.iconBorderB, iconClr: T.iconB, title: "خطة دراسية شخصية",                  desc: "توجيه ذكي للدروس والتمارين بناءً على مستواك الحالي وأهدافك" },
            { icon: TrendingUp, iconBg: T.iconBgA, iconBdr: T.iconBorderA, iconClr: T.iconA, title: "تتبع التقدم المستمر",                 desc: "متابعة دقيقة لتطورك في كل مادة ومهارة مع تقارير تفصيلية" },
          ].map((f, i) => (
            <div
              key={i}
              style={{ ...transition, ...card(T), padding: "32px", textAlign: "right" }}
              onMouseEnter={e => {
                const el = e.currentTarget ;
                el.style.transform   = "translateY(-4px)";
                el.style.boxShadow   = T.shadowHover;
                el.style.borderColor = T.borderAccent;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget ;
                el.style.transform   = "translateY(0)";
                el.style.boxShadow   = T.shadowCard;
                el.style.borderColor = T.border;
              }}
            >
              {/* Icon container — Premium Minimalist approach */}
              <div
                style={{
                  ...transition,
                  width:          "56px", height: "56px", borderRadius: "14px",
                  background:     f.iconBg,
                  border:         `1px solid ${f.iconBdr}`,
                  display:        "flex", alignItems: "center", justifyContent: "center",
                  marginBottom:   "18px",
                }}
              >
                <f.icon style={{ color: f.iconClr, width: "26px", height: "26px" }} strokeWidth={2} />
              </div>
              <h3 style={{ ...transition, color: T.textPrimary, fontWeight: 700, fontSize: "1.05rem", marginBottom: "10px" }}>
                {f.title}
              </h3>
              <p style={{ ...transition, color: T.textMuted, fontSize: "0.875rem", lineHeight: 1.8 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════
   3 — STATS STRIP
════════════════════════════════════════════════════ */
function StatsSection({ T }) {
  const stats = [
    { icon: Users,         iconBg: T.iconBgA, iconBdr: T.iconBorderA, iconClr: T.iconA, value: "+٢٠٠k", label: "طالب مسجّل",   sub: "عبر محافظات مصر" },
    { icon: GraduationCap, iconBg: T.iconBgB, iconBdr: T.iconBorderB, iconClr: T.iconB, value: "+٨٧",   label: "معلم متخصص",  sub: "يستخدمون لوحة التحليل" },
    { icon: Star,          iconBg: T.iconBgA, iconBdr: T.iconBorderA, iconClr: T.iconA, value: "٩٨٪",   label: "نسبة الرضا",  sub: "يوصون بالمنصة" },
    { icon: Zap,           iconBg: T.iconBgB, iconBdr: T.iconBorderB, iconClr: T.iconB, value: "+٢٠٠",  label: "درس ومراجعة", sub: "محتوى محدّث باستمرار" },
  ];

  return (
    <section
      style={{ ...transition, background: T.bgPanel, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: "56px 0" }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "24px" }}>
          {stats.map((s, i) => (
            <div
              key={i}
              style={{ ...transition, ...card(T), padding: "28px 24px", textAlign: "center" }}
            >
              {/* Icon container — crisp, high-contrast */}
              <div
                style={{
                  ...transition,
                  width: "44px", height: "44px", borderRadius: "12px",
                  background: s.iconBg,
                  border:     `1px solid ${s.iconBdr}`,
                  display:    "flex", alignItems: "center", justifyContent: "center",
                  margin:     "0 auto 16px",
                }}
              >
                <s.icon style={{ color: s.iconClr, width: "20px", height: "20px" }} strokeWidth={2} />
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

/* ════════════════════════════════════════════════════
   4 — SUBJECTS
════════════════════════════════════════════════════ */
function SubjectsSection({ T }) {
  const subjects = [
    { name: "الفيزياء",   icon: Atom,         eng: "Physics",     iconBg: T.iconBgA, iconBdr: T.iconBorderA, iconClr: T.iconA, badgeBg: T.accentDim,    badgeBdr: T.borderAccent, badgeClr: T.accent,    cardBdr: T.borderAccent },
    { name: "الكيمياء",   icon: FlaskConical, eng: "Chemistry",   iconBg: T.iconBgB, iconBdr: T.iconBorderB, iconClr: T.iconB, badgeBg: T.accentAltDim, badgeBdr: T.borderAlt,    badgeClr: T.accentAlt, cardBdr: T.borderAlt    },
    { name: "الأحياء",    icon: Microscope,   eng: "Biology",     iconBg: T.iconBgA, iconBdr: T.iconBorderA, iconClr: T.iconA, badgeBg: T.accentDim,    badgeBdr: T.borderAccent, badgeClr: T.accent,    cardBdr: T.borderAccent },
    { name: "الرياضيات",  icon: Calculator,   eng: "Mathematics", iconBg: T.iconBgB, iconBdr: T.iconBorderB, iconClr: T.iconB, badgeBg: T.accentAltDim, badgeBdr: T.borderAlt,    badgeClr: T.accentAlt, cardBdr: T.borderAlt    },
  ];

  return (
    <section style={{ ...transition, background: T.bg, padding: "90px 0" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
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

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
          {subjects.map((s, i) => (
            <div
              key={i}
              style={{ ...transition, ...card(T), padding: "28px", cursor: "pointer" }}
              onMouseEnter={e => {
                const el = e.currentTarget ;
                el.style.transform   = "translateY(-4px)";
                el.style.boxShadow   = T.shadowHover;
                el.style.borderColor = s.cardBdr;
                // Boost icon container opacity on card hover
                const iconEl = el.querySelector(".icon-wrap")  | null;
                if (iconEl) { iconEl.style.background = s.iconBg.replace("0.10", "0.17").replace("0.11", "0.18"); }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget ;
                el.style.transform   = "translateY(0)";
                el.style.boxShadow   = T.shadowCard;
                el.style.borderColor = T.border;
                const iconEl = el.querySelector(".icon-wrap")  | null;
                if (iconEl) { iconEl.style.background = s.iconBg; }
              }}
            >
              {/* Icon container — structured, high-contrast */}
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

              {/* Badge */}
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
              <div
                style={{ ...transition, display: "flex", alignItems: "center", gap: "4px", color: T.textDim, fontSize: "0.8rem", marginTop: "8px" }}
              >
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

/* ════════════════════════════════════════════════════
   5 — HOW IT WORKS
════════════════════════════════════════════════════ */
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
              {/* Icon container — structured circle, high-contrast */}
              <div
                style={{
                  ...transition,
                  width: "60px", height: "60px", borderRadius: "50%",
                  background:   s.iconBg,
                  border:       `1px solid ${s.iconBdr}`,
                  display:      "flex", alignItems: "center", justifyContent: "center",
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

/* ════════════════════════════════════════════════════
   6 — COMPARISON
════════════════════════════════════════════════════ */
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
          {/* Traditional */}
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

          {/* FOCUS */}
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

/* ════════════════════════════════════════════════════
   7 — TESTIMONIALS
════════════════════════════════════════════════════ */
function TestimonialsSection({ T }) {
  const testimonials = [
    { quote: "FOCUS غيّرت طريقة مذاكرتي كلياً. درجتي في الفيزياء اتحسنت ٢٥ درجة في شهرين بسبب التركيز على نقاط الضعف الفعلية.", name: "يوسف ��حمد",     role: "طالب ثانوية عامة · القاهرة",      avatar: "ي", accent: T.accent,    dim: T.accentDim,    brd: T.borderAccent },
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
                const el = e.currentTarget ;
                el.style.transform   = "translateY(-3px)";
                el.style.boxShadow   = T.shadowHover;
                el.style.borderColor = t.brd;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget ;
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

/* ════════════════════════════════════════════════════
   8 — CTA + FOOTER
════════════════════════════════════════════════════ */
function CTASection({ T, onNavigate }) {
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
          {/* CTA icon — large, high-contrast */}
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
              onClick={() => onNavigate("auth")}
              style={{
                ...transition,
                display: "flex", alignItems: "center", gap: "8px",
                padding: "14px 40px", borderRadius: "12px",
                fontSize: "1rem", fontWeight: 700,
                background: T.accent, color: "#FFFFFF", border: "none", cursor: "pointer",
              }}
              onMouseEnter={e => {
                (e.currentTarget ).style.opacity   = "0.88";
                (e.currentTarget ).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget ).style.opacity   = "1";
                (e.currentTarget ).style.transform = "translateY(0)";
              }}
            >
              سجل الآن مجاناً
              <ArrowLeft style={{ width: "16px", height: "16px" }} />
            </button>
            <button
              onClick={() => onNavigate("auth")}
              style={{
                ...transition,
                padding: "14px 40px", borderRadius: "12px",
                fontSize: "1rem",
                background: T.bgCard, color: T.textPrimary,
                border: `1px solid ${T.border}`, cursor: "pointer",
                boxShadow: T.shadowCard,
              }}
              onMouseEnter={e => {
                (e.currentTarget ).style.borderColor = T.borderAccent;
                (e.currentTarget ).style.color        = T.accent;
              }}
              onMouseLeave={e => {
                (e.currentTarget ).style.borderColor = T.border;
                (e.currentTarget ).style.color        = T.textPrimary;
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                ...transition,
                width: "28px", height: "28px", borderRadius: "8px",
                background: T.accentDim, border: `1px solid ${T.borderAccent}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Brain style={{ color: T.accent, width: "14px", height: "14px" }} strokeWidth={1.5} />
            </div>
            <span style={{ ...transition, color: T.accent, fontWeight: 700, letterSpacing: "0.14em" }}>FOCUS</span>
          </div>
          <p style={{ ...transition, color: T.textDim, fontSize: "0.78rem" }}>
            © ٢٠٢٦ FOCUS. جميع الحقوق محفوظة.
          </p>
          <div style={{ display: "flex", gap: "20px" }}>
            {["شروط الاستخدام", "سياسة الخصوصية"].map((link, i) => (
              <span
                key={i}
                style={{ ...transition, color: T.textDim, fontSize: "0.78rem", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget ).style.color = T.textMuted}
                onMouseLeave={e => (e.currentTarget ).style.color = T.textDim}
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

/* ════════════════════════════════════════════════════
   ROOT
════════════════════════════════════════════════════ */
export function LandingPage({ onNavigate }: LandingPageProps) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const T = buildTheme(isDarkMode);

  return (
    <div dir="rtl" style={{ ...transition, background: T.bg, minHeight: "100vh", overflowX: "hidden" }}>
      <NavHeader        T={T} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onNavigate={onNavigate} />
      <HeroSection      T={T} onNavigate={onNavigate} />
      <StatsSection     T={T} />
      <SubjectsSection  T={T} />
      <HowItWorksSection T={T} />
      <ComparisonSection T={T} />
      <TestimonialsSection T={T} />
      <CTASection       T={T} onNavigate={onNavigate} />
    </div>
  );
}