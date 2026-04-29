import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { RefreshCcw, AlertTriangle } from 'lucide-react';

class ErrorBoundaryInner extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { C, glass, isDarkMode } = this.props.themeContext;
      const transition = { transition: "all 0.25s ease" };

      // Make sure C is defined (fallback to dark mode defaults if Context failed)
      const themeColors = C || {
        bg: isDarkMode ? "#0B1120" : "#F8FAFC",
        redBorder: isDarkMode ? "rgba(248,113,113,0.20)" : "rgba(239,68,68,0.18)",
        redDim: isDarkMode ? "rgba(248,113,113,0.10)" : "rgba(239,68,68,0.08)",
        red: isDarkMode ? "#F87171" : "#EF4444",
        textDim: isDarkMode ? "#475569" : "#94A3B8"
      };

      const glassStyle = glass ? glass() : {
        background: isDarkMode ? "rgba(255,255,255,0.035)" : "#FFFFFF",
        border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.08)" : "#E2E8F0"}`,
        borderRadius: "16px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        backdropFilter: "blur(12px)"
      };

      return (
        <div style={{...transition, background: themeColors.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Cairo', sans-serif", padding: "16px"}} dir="rtl">
          <div style={{...glassStyle, padding: "32px", maxWidth: "440px", textAlign: "center", borderColor: themeColors.redBorder, background: themeColors.redDim}}>
            <AlertTriangle style={{width: "48px", height: "48px", color: themeColors.red, margin: "0 auto 16px"}} />
            <h3 style={{fontSize: "1.25rem", fontWeight: 800, color: themeColors.red, marginBottom: "8px"}}>عذراً، حدث خطأ غير متوقع</h3>
            <p style={{color: themeColors.textDim, fontSize: "0.95rem", marginBottom: "24px"}}>لقد واجهنا مشكلة أثناء تحميل هذه الصفحة. يرجى المحاولة مرة أخرى.</p>
            <button
              onClick={() => window.location.reload()}
              style={{...transition, width: "100%", padding: "12px", background: themeColors.red, color: "#FFF", border: "none", borderRadius: "12px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer"}}
              onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.1)"}
              onMouseLeave={e => e.currentTarget.style.filter = "none"}
            >
              <RefreshCcw style={{width: "16px", height: "16px", transform: "scaleX(-1)"}} />
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ErrorBoundary(props) {
  const themeContext = useTheme();
  return <ErrorBoundaryInner themeContext={themeContext} {...props} />;
}
