/**
 * themeUtils.js
 * Centralized theme logic, removing duplication across components.
 */

export function buildTheme(dark) {
  return dark
    ? {
        bg:           "#0B1120",
        bgPanel:      "#0D1526",
        bgCard:       "rgba(255,255,255,0.035)",
        border:       "rgba(255,255,255,0.08)",
        borderAccent: "rgba(79,70,229,0.38)",
        borderRed:    "rgba(239,68,68,0.22)",
        accent:       "#4F46E5",
        accentDim:    "rgba(79,70,229,0.14)",
        iconA:        "#38BDF8",
        iconBgA:      "rgba(56,189,248,0.10)",
        iconBorderA:  "rgba(56,189,248,0.22)",
        iconB:        "#818CF8",
        iconBgB:      "rgba(129,140,248,0.11)",
        iconBorderB:  "rgba(129,140,248,0.25)",
        textPrimary:  "#F8FAFC",
        textMuted:    "#94A3B8",
        textDim:      "#475569",
        shadowCard:   "0 1px 1px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.35)",
        trackBg:      "rgba(255,255,255,0.06)",
        green:        "#34D399",
        greenDim:     "rgba(52,211,153,0.12)",
        greenBorder:  "rgba(52,211,153,0.22)",
        red:          "#F87171",
        redIcon:      "#F87171",
        redDim:       "rgba(248,113,113,0.10)",
        redBorder:    "rgba(248,113,113,0.20)",
        yellow:       "#FBBF24",
        yellowDim:    "rgba(251,191,36,0.12)",
        yellowBorder: "rgba(251,191,36,0.22)",
        headerBg:     "rgba(11,17,32,0.88)",
        inputBg:      "rgba(255,255,255,0.04)",
        inputBorder:  "rgba(255,255,255,0.10)",
        tabBg:        "rgba(255,255,255,0.04)"
      }
    : {
        bg:           "#F8FAFC",
        bgPanel:      "#FFFFFF",
        bgCard:       "#FFFFFF",
        border:       "#E2E8F0",
        borderAccent: "rgba(15,76,129,0.28)",
        borderRed:    "rgba(239,68,68,0.20)",
        accent:       "#0F4C81",
        accentDim:    "rgba(15,76,129,0.08)",
        iconA:        "#0F4C81",
        iconBgA:      "rgba(15,76,129,0.08)",
        iconBorderA:  "rgba(15,76,129,0.18)",
        iconB:        "#4F46E5",
        iconBgB:      "rgba(79,70,229,0.08)",
        iconBorderB:  "rgba(79,70,229,0.18)",
        textPrimary:  "#0F172A",
        textMuted:    "#64748B",
        textDim:      "#94A3B8",
        shadowCard:   "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)",
        trackBg:      "#E2E8F0",
        green:        "#059669",
        greenDim:     "rgba(5,150,105,0.08)",
        greenBorder:  "rgba(5,150,105,0.18)",
        red:          "#EF4444",
        redIcon:      "#EF4444",
        redDim:       "rgba(239,68,68,0.08)",
        redBorder:    "rgba(239,68,68,0.18)",
        yellow:       "#D97706",
        yellowDim:    "rgba(217,119,6,0.08)",
        yellowBorder: "rgba(217,119,6,0.18)",
        headerBg:     "rgba(248,250,252,0.90)",
        inputBg:      "#F8FAFC",
        inputBorder:  "#E2E8F0",
        tabBg:        "#F1F5F9"
      };
}

export const glass = (T) => ({
  background:   T.bgCard,
  border:       `1px solid ${T.border}`,
  borderRadius: "20px",
  boxShadow:    T.shadowCard,
});

export const transition = {
  transition: "background 0.25s ease, border-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease",
};

export const _c = (T, x) => ({
  background:   T.bgCard,
  border:       `1px solid ${T.border}`,
  borderRadius: "16px",
  boxShadow:    T.shadowCard,
  ...x
});

export const _t = { transition: "all 0.25s ease" };

export const _input = (T) => ({
  ..._t, 
  width: "100%", 
  background: T.bg, 
  border: `1px solid ${T.border}`, 
  borderRadius: "12px", 
  padding: "14px 16px", 
  color: T.textPrimary, 
  outline: "none", 
  fontSize: "0.95rem"
});

export const _iw = (bg, bd, sz = "40px", r = "10px") => ({
  ..._t,
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