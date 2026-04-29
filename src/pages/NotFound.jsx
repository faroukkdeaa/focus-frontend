import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

/* ════════════════════════════════════════════════════
   DESIGN SYSTEM — Extracted from LandingPage.jsx
════════════════════════════════════════════════════ */
function buildTheme(dark) {
  return dark
    ? {
        bg:           "#0B1120",
        bgPanel:      "#0D1526",
        bgCard:       "rgba(255,255,255,0.035)",
        border:       "rgba(255,255,255,0.08)",
        borderAccent: "rgba(79,70,229,0.38)",
        accent:       "#4F46E5",
        textPrimary:  "#F8FAFC",
        textMuted:    "#94A3B8",
        shadowCard:   "0 1px 1px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.35)",
        redIcon:      "#F87171",
        redDim:       "rgba(248,113,113,0.10)",
        redBorder:    "rgba(248,113,113,0.20)",
      }
    : {
        bg:           "#F8FAFC",
        bgPanel:      "#FFFFFF",
        bgCard:       "#FFFFFF",
        border:       "#E2E8F0",
        borderAccent: "rgba(15,76,129,0.28)",
        accent:       "#0F4C81",
        textPrimary:  "#0F172A",
        textMuted:    "#64748B",
        shadowCard:   "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)",
        redIcon:      "#EF4444",
        redDim:       "rgba(239,68,68,0.08)",
        redBorder:    "rgba(239,68,68,0.18)",
      };
}

const glass = (T) => ({
  background:   T.bgCard,
  border:       `1px solid ${T.border}`,
  borderRadius: "24px",
  boxShadow:    T.shadowCard,
});

const transition = {
  transition: "background 0.25s ease, border-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease, opacity 0.2s ease, transform 0.2s ease",
};

const iw = (bg, bd, sz = "80px", r = "20px") => ({
  ...transition,
  width: sz,
  height: sz,
  borderRadius: r,
  background: bg,
  border: `1px solid ${bd}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto",
  marginBottom: "32px",
});

const NotFound = () => {
    const navigate = useNavigate();
    const { t, lang } = useLanguage();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const T = buildTheme(isDark);

    return (
        <div 
          style={{
            ...transition,
            background: T.bg,
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Cairo', sans-serif"
          }}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
            <div 
              style={{
                ...transition,
                ...glass(T),
                width: "100%",
                maxWidth: "480px",
                padding: "56px 40px",
                textAlign: "center",
                margin: "24px"
              }}
            >
                {/* 404 Visual Icon Container */}
                <div style={iw(T.redDim, T.redBorder)}>
                    <AlertTriangle style={{ color: T.redIcon, width: "36px", height: "36px" }} strokeWidth={1.5} />
                </div>

                <h1 style={{ ...transition, color: T.accent, fontSize: "5rem", fontWeight: 900, lineHeight: 1, marginBottom: "16px" }}>
                  404
                </h1>
                
                <h2 style={{ ...transition, color: T.textPrimary, fontSize: "1.5rem", fontWeight: 800, marginBottom: "12px" }}>
                  {t('not_found_msg')}
                </h2>
                
                <p style={{ ...transition, color: T.textMuted, fontSize: "1rem", lineHeight: 1.8, marginBottom: "40px" }}>
                    {t('not_found_desc')}
                </p>

                <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                        ...transition,
                        width: "100%",
                        background: T.accent,
                        color: "#FFFFFF",
                        padding: "16px",
                        borderRadius: "14px",
                        fontWeight: 700,
                        fontSize: "1rem",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.88";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                >
                    <Home style={{ width: "20px", height: "20px" }} />
                    {t('back_to_home')}
                </button>
            </div>
        </div>
    );
};

export default NotFound;
