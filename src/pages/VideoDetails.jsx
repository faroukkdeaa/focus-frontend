import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Loader2, AlertTriangle, Trash2, Video, ExternalLink, ShieldAlert } from 'lucide-react';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

/* ════════════════════════════════════════════════════
   THEME FACTORY
   Returns a token object based on the current mode.
════════════════════════════════════════════════════ */
function buildTheme(dark) {
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
        textPrimary:  "#F8FAFC",
        textMuted:    "#94A3B8",
        textDim:      "#475569",
        shadowCard:   "0 1px 1px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.35)",
        redIcon:      "#F87171",
        redDim:       "rgba(248,113,113,0.10)",
        redBorder:    "rgba(248,113,113,0.20)",
        warningDim:   "rgba(245,158,11,0.10)",
        warningBorder:"rgba(245,158,11,0.20)",
        warningIcon:  "#FBBF24",
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
        textPrimary:  "#0F172A",
        textMuted:    "#64748B",
        textDim:      "#94A3B8",
        shadowCard:   "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)",
        redIcon:      "#EF4444",
        redDim:       "rgba(239,68,68,0.08)",
        redBorder:    "rgba(239,68,68,0.18)",
        warningDim:   "rgba(245,158,11,0.08)",
        warningBorder:"rgba(245,158,11,0.18)",
        warningIcon:  "#F59E0B",
      };
}

const glass = (T, extra) => ({
  background:   T.bgCard,
  border:       `1px solid ${T.border}`,
  borderRadius: "16px",
  boxShadow:    T.shadowCard,
  ...extra,
});

const transition = {
  transition: "background 0.25s ease, border-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease",
};

const iw = (T, type = 'accent') => {
  let bg, bd;
  if (type === 'red') { bg = T.redDim; bd = T.redBorder; }
  else if (type === 'warning') { bg = T.warningDim; bd = T.warningBorder; }
  else { bg = T.iconBgA; bd = T.iconBorderA; }
  return {
    ...transition,
    width: "42px", height: "42px", borderRadius: "12px",
    background: bg, border: `1px solid ${bd}`,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
  };
};

const VideoDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const T = buildTheme(isDark);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [videoInfo, setVideoInfo] = useState({
    title: '',
    lessonTitle: '',
    videoUrl: '',
  });

  const fetchVideo = useCallback(async () => {
    if (!id) {
      setError('معرّف الفيديو غير متوفر.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/videos/${id}`);
      const payload = data?.video || data?.data?.video || data?.data || data || {};

      setVideoInfo({
        title: payload.video_title || payload.title || payload.lesson_title || `فيديو #${id}`,
        lessonTitle: payload.lesson_title || payload.lesson?.title || '—',
        videoUrl: payload.video_url || payload.url || '',
      });
    } catch (err) {
      console.error('Failed to load video details:', err);
      setError('تعذّر تحميل بيانات الفيديو.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  const handleDelete = async () => {
    if (!id) {
      alert('معرّف الفيديو غير متوفر.');
      return;
    }

    const confirmed = window.confirm('هل أنت متأكد من حذف هذا العنصر نهائياً؟');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await api.delete(`/videos/${id}`);
      alert('تم حذف الفيديو بنجاح.');
      navigate('/teacher-analytics', { replace: true });
    } catch (err) {
      console.error('Delete video error:', err);
      alert('تعذّر حذف الفيديو. حاول مرة أخرى.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ ...transition, background: T.bg, minHeight: "100vh", fontFamily: "'Cairo', sans-serif" }}>
      <header
        style={{
          ...transition,
          position: "sticky", top: 0, zIndex: 20,
          background: isDark ? "rgba(11,17,32,0.88)" : "rgba(248,250,252,0.90)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div style={{ maxWidth: "1152px", margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <button
              onClick={() => navigate('/teacher-analytics')}
              style={{
                ...transition,
                display: "flex", alignItems: "center", gap: "6px",
                background: "transparent", border: "none", cursor: "pointer",
                color: T.textMuted, fontSize: "0.875rem", fontWeight: 700, flexShrink: 0
              }}
              onMouseEnter={e => e.currentTarget.style.color = T.textPrimary}
              onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
            >
              <ArrowRight style={{ width: "16px", height: "16px", ...(lang === 'en' ? { transform: "rotate(180deg)" } : {}) }} />
              العودة للتحليلات
            </button>
            <h1 style={{ ...transition, fontSize: "1.1rem", fontWeight: 800, color: T.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {videoInfo.title || 'تفاصيل الفيديو'}
            </h1>
          </div>
          <button
            onClick={handleDelete}
            disabled={isDeleting || loading}
            style={{
              ...transition,
              display: "flex", alignItems: "center", gap: "6px",
              padding: "10px 16px", borderRadius: "10px",
              background: T.redDim, border: `1px solid ${T.redBorder}`,
              color: T.redIcon, fontSize: "0.875rem", fontWeight: 700,
              cursor: (isDeleting || loading) ? "not-allowed" : "pointer",
              opacity: (isDeleting || loading) ? 0.6 : 1,
              flexShrink: 0
            }}
            onMouseEnter={e => { if(!isDeleting && !loading) { e.currentTarget.style.background = T.redBorder; } }}
            onMouseLeave={e => { if(!isDeleting && !loading) { e.currentTarget.style.background = T.redDim; } }}
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 style={{ width: "16px", height: "16px" }} />}
            {isDeleting ? 'جاري الحذف...' : 'حذف الفيديو'}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: "896px", margin: "0 auto", padding: "32px 24px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0" }}>
            <Loader2 className="animate-spin" style={{ color: T.accent, width: "32px", height: "32px", marginBottom: "12px" }} />
            <p style={{ ...transition, color: T.textMuted, fontSize: "0.95rem", fontWeight: 600 }}>جارٍ تحميل بيانات الفيديو...</p>
          </div>
        ) : error ? (
          <div style={{ ...transition, ...glass(T), border: `1px solid ${T.redBorder}`, background: T.redDim, padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={iw(T, 'red')}><AlertTriangle style={{ color: T.redIcon, width: "20px", height: "20px" }} /></div>
              <p style={{ ...transition, color: T.redIcon, fontSize: "0.95rem", fontWeight: 700 }}>{error}</p>
            </div>
            <button onClick={fetchVideo} style={{ ...transition, background: "transparent", border: "none", color: T.textPrimary, fontSize: "0.875rem", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <div style={{ ...transition, ...glass(T), padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Theater Mode Wrapper Mock */}
            <div style={{
              ...transition,
              width: "100%", aspectRatio: "16/9", background: "#000",
              borderRadius: "16px", border: `1px solid ${T.border}`,
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px",
              overflow: "hidden", position: "relative"
            }}>
              <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 60%)"
              }} />
              <Video style={{ color: "rgba(255,255,255,0.4)", width: "48px", height: "48px" }} strokeWidth={1} />
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", fontWeight: 600 }}>إدارة الفيديو (لا توجد معاينة متاحة)</p>
            </div>

            {/* Video Metadata */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingBottom: "24px", borderBottom: `1px solid ${T.border}` }}>
              <h2 style={{ ...transition, color: T.textPrimary, fontSize: "1.5rem", fontWeight: 800 }}>
                {videoInfo.title || 'فيديو بدون عنوان'}
              </h2>
              <p style={{ ...transition, color: T.textMuted, fontSize: "0.95rem" }}>
                الدرس المرتبط: <span style={{ color: T.textPrimary, fontWeight: 700 }}>{videoInfo.lessonTitle || '—'}</span>
              </p>
            </div>

            {/* Related Resources / Actions */}
            <div>
              <h3 style={{ ...transition, color: T.textPrimary, fontSize: "1.05rem", fontWeight: 700, marginBottom: "16px" }}>المرفقات والرابط الخارجي</h3>
              {videoInfo.videoUrl ? (
                <div style={{
                  ...transition,
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "16px", borderRadius: "12px",
                  background: T.iconBgA, border: `1px solid ${T.iconBorderA}`
                }}>
                  <div style={iw(T)}>
                    <ExternalLink style={{ color: T.iconA, width: "20px", height: "20px" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ ...transition, color: T.textPrimary, fontSize: "0.95rem", fontWeight: 700 }}>رابط الفيديو المباشر</h4>
                    <p style={{ ...transition, color: T.textMuted, fontSize: "0.8rem", marginTop: "2px", direction: "ltr", textAlign: lang === 'ar' ? "right" : "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "400px" }}>
                      {videoInfo.videoUrl}
                    </p>
                  </div>
                  <a
                    href={videoInfo.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      ...transition,
                      padding: "10px 20px", borderRadius: "10px",
                      background: T.accent, color: "#FFF",
                      fontSize: "0.875rem", fontWeight: 700, textDecoration: "none",
                      display: "flex", alignItems: "center", gap: "6px"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                  >
                    فتح في علامة تبويب جديدة
                    <ArrowRight style={{ width: "16px", height: "16px", ...(lang === 'ar' ? { transform: "rotate(180deg)" } : {}) }} />
                  </a>
                </div>
              ) : (
                <div style={{ ...transition, display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderRadius: "12px", background: T.warningDim, border: `1px solid ${T.warningBorder}` }}>
                  <ShieldAlert style={{ color: T.warningIcon, width: "20px", height: "20px" }} />
                  <p style={{ ...transition, color: T.textMuted, fontSize: "0.9rem", fontWeight: 600 }}>لا يوجد رابط فيديو متاح.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VideoDetails;
