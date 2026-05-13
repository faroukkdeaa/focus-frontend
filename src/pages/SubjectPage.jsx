import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { publicApi } from '../api/api';
import {
  ArrowRight, BookOpen, PlayCircle, Play, FileText, Zap,
  ChevronDown, ChevronUp, Clock, AlertTriangle, RefreshCcw,
  Home, LogIn, User, GraduationCap, ChevronLeft, Users, Lock, Heart, Star
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import i18n from '../i18n/i18n';
import { SUBJECT_ICONS } from '../utils/subjectMapping';
import AuthModal from '../components/AuthModal';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

/* ════════════════════════════════════════════════════
   DESIGN SYSTEM — Extracted from LandingPage.jsx
════════════════════════════════════════════════════ */
function buildTheme(dk){return dk?{bg:"#0B1120",bgCard:"rgba(255,255,255,0.035)",border:"rgba(255,255,255,0.08)",borderAccent:"rgba(79,70,229,0.38)",accent:"#4F46E5",accentDim:"rgba(79,70,229,0.14)",iconA:"#38BDF8",iconBgA:"rgba(56,189,248,0.10)",iconBorderA:"rgba(56,189,248,0.22)",iconB:"#818CF8",iconBgB:"rgba(129,140,248,0.11)",iconBorderB:"rgba(129,140,248,0.25)",textPrimary:"#F8FAFC",textMuted:"#94A3B8",textDim:"#475569",shadowCard:"0 1px 1px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.35)",trackBg:"rgba(255,255,255,0.06)",green:"#34D399",greenDim:"rgba(52,211,153,0.12)",greenBorder:"rgba(52,211,153,0.22)",red:"#F87171",redDim:"rgba(248,113,113,0.10)",redBorder:"rgba(248,113,113,0.20)",yellow:"#FBBF24",yellowDim:"rgba(251,191,36,0.12)",yellowBorder:"rgba(251,191,36,0.22)",headerBg:"rgba(11,17,32,0.88)"}:{bg:"#F8FAFC",bgCard:"#FFFFFF",border:"#E2E8F0",borderAccent:"rgba(15,76,129,0.28)",accent:"#0F4C81",accentDim:"rgba(15,76,129,0.08)",iconA:"#0F4C81",iconBgA:"rgba(15,76,129,0.08)",iconBorderA:"rgba(15,76,129,0.18)",iconB:"#2563EB",iconBgB:"rgba(37,99,235,0.07)",iconBorderB:"rgba(37,99,235,0.16)",textPrimary:"#0F172A",textMuted:"#64748B",textDim:"#94A3B8",shadowCard:"0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)",trackBg:"#E2E8F0",green:"#059669",greenDim:"rgba(5,150,105,0.08)",greenBorder:"rgba(5,150,105,0.18)",red:"#EF4444",redDim:"rgba(239,68,68,0.08)",redBorder:"rgba(239,68,68,0.18)",yellow:"#D97706",yellowDim:"rgba(217,119,6,0.08)",yellowBorder:"rgba(217,119,6,0.18)",headerBg:"rgba(248,250,252,0.90)"};}
const _c=(T,x)=>({background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:"16px",boxShadow:T.shadowCard,...x});
const _t={transition:"all 0.25s ease"};
const _iw=(bg,bd,sz="40px",r="10px")=>({..._t,width:sz,height:sz,borderRadius:r,background:bg,border:`1px solid ${bd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0});

const getProfilePictureUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace('/api', '');
  if (path.startsWith('/storage/')) return `${baseUrl}${path}`;
  if (path.startsWith('storage/')) return `${baseUrl}/${path}`;
  if (path.startsWith('/')) return `${baseUrl}${path}`;
  return `${baseUrl}/storage/${path}`;
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const SectionLoader = ({ rows = 3, T }) => (
  <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonLoader key={i} type="card" height="68px" className="w-full" />
    ))}
  </div>
);

const SectionError = ({ message, onRetry, T, t }) => (
  <div style={{padding:"32px",display:"flex",flexDirection:"column",alignItems:"center",gap:"12px",textAlign:"center"}}>
    <AlertTriangle style={{width:"28px",height:"28px",color:T.yellow}} />
    <p style={{fontSize:"0.9rem",color:T.textDim}}>{message}</p>
    <button
      onClick={onRetry}
      style={{..._t,display:"flex",alignItems:"center",gap:"6px",fontSize:"0.9rem",fontWeight:700,color:T.accent,background:"transparent",border:"none",cursor:"pointer"}}
    >
      <RefreshCcw style={{width:"14px",height:"14px"}} /> {t('retry')}
    </button>
  </div>
);

// ── Teacher Card ───────────────────────────────────────────────────────────────

const subjectStyles = {
  فيزياء: { bg: "linear-gradient(135deg, #0d3320 0%, #071a10 50%, #030e08 100%)", accent: "#22c55e", badge: "rgba(34,197,94,0.2)", badgeText: "#4ade80" },
  كيمياء: { bg: "linear-gradient(135deg, #1a1500 0%, #0d0b00 50%, #060500 100%)", accent: "#eab308", badge: "rgba(234,179,8,0.2)", badgeText: "#facc15" },
  أحياء:  { bg: "linear-gradient(135deg, #0d1a00 0%, #070d00 50%, #030600 100%)", accent: "#84cc16", badge: "rgba(132,204,22,0.2)", badgeText: "#a3e635" },
  رياضيات: { bg: "linear-gradient(135deg, #071030 0%, #030820 50%, #010410 100%)", accent: "#60a5fa", badge: "rgba(96,165,250,0.2)", badgeText: "#93c5fd" },
  علوم:   { bg: "linear-gradient(135deg, #18071a 0%, #0d040e 50%, #060206 100%)", accent: "#c084fc", badge: "rgba(192,132,252,0.2)", badgeText: "#d8b4fe" },
  DEFAULT: { bg: "linear-gradient(135deg, #0f172a 0%, #020617 100%)", accent: "#38bdf8", badge: "rgba(56,189,248,0.2)", badgeText: "#7dd3fc" }
};

const formulaMap = {
  فيزياء: ["E=mc²", "F=ma", "v=λf", "P=mv", "ΔE=hν", "∇·E=ρ/ε₀", "F=kq₁q₂/r²", "∮B·dl=μ₀I"],
  كيمياء: ["H₂O", "PV=nRT", "pH=-log[H⁺]", "ΔG=ΔH-TΔS", "CO₂", "NaCl", "Fe₂O₃", "C₆H₁₂O₆"],
  أحياء:  ["DNA→RNA", "ATP→ADP", "C₆H₁₂O₆+O₂", "mRNA", "tRNA", "Mitosis", "Meiosis", "NADPH"],
  رياضيات: ["∫f(x)dx", "∑n(n+1)/2", "e^iπ+1=0", "f'(x)", "det(A)", "∇²φ=0", "lim→∞", "∂²u/∂t²"],
  علوم:   ["E=mc²", "H₂O", "DNA", "F=ma", "ATP", "∫dx", "pH=7", "CO₂"],
  DEFAULT:["E=mc²", "∞", "xyz", "∑", "1+1=2"]
};

const TeacherCard = ({ teacher, subjectName, delay = 0, isSelected, onSelect, T, t }) => {
  const [liked, setLiked] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  const style = subjectStyles[subjectName] ?? subjectStyles.DEFAULT;
  const formulas = formulaMap[subjectName] ?? formulaMap.DEFAULT;
  const profilePictureUrl = getProfilePictureUrl(teacher.teacher_profile_picture);
  
  const studentCount = teacher.students_count || ((teacher.id || 1) * 123 % 500) + 100;
  const rating = (4.5 + (((teacher.id || 1) % 5) * 0.1)).toFixed(1);

  return (
    <motion.button
      onClick={() => onSelect(teacher)}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      whileHover={{ scale: 1.03, y: -6 }}
      className="text-right flex flex-col overflow-hidden w-full m-0 p-0 text-inherit border-none bg-transparent"
      style={{
        borderRadius: "16px",
        boxShadow: isSelected ? `0 0 0 2px ${T.accent}` : T.shadowCard,
        background: T.bgCard,
        cursor: "pointer",
        outline: "none"
      }}
    >
      <div className="relative overflow-hidden w-full" style={{ aspectRatio: "1 / 1" }}>
        {/* Chalkboard background */}
        <div className="absolute inset-0" style={{ background: style.bg }} />
        
        {/* Scattered formula overlays */}
        <div className="absolute inset-0 overflow-hidden select-none pointer-events-none">
          {formulas.map((formula, i) => (
            <span
              key={i}
              className="absolute font-mono opacity-[0.12] whitespace-nowrap"
              style={{
                color: style.accent,
                fontSize: `${0.55 + (i % 3) * 0.18}rem`,
                top: `${(i * 31 + 7) % 80}%`,
                left: `${(i * 43 + 5) % 75}%`,
                transform: `rotate(${(i * 27 - 30) % 60}deg)`,
              }}
            >
              {formula}
            </span>
          ))}
        </div>
        
        {/* Chalk texture */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(255,255,255,0.3) 28px, rgba(255,255,255,0.3) 29px)" }} />
        
        {/* Teacher photo or fallback */}
        {profilePictureUrl && !imgError ? (
          <img
            src={profilePictureUrl}
            alt={teacher.name || t('subject_page_teacher_fallback', { id: teacher.id })}
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center" style={{ fontSize: "5rem", fontWeight: 900, color: "rgba(255,255,255,0.15)" }}>
            {(teacher.name || t('subject_page_teacher_fallback', { id: teacher.id })).charAt(0)}
          </div>
        )}

        {/* Bottom fade into card body */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[rgba(0,0,0,0.8)] via-[rgba(0,0,0,0.5)] to-transparent" />

        {/* Subject badge (Right side since RTL) */}
        <div className="absolute top-3 right-3 z-10">
          <span
            className="text-[10px] px-2.5 py-1 rounded-full font-bold tracking-widest uppercase"
            style={{
              background: style.badge,
              color: style.badgeText,
              border: `1px solid ${style.accent}40`,
              backdropFilter: "blur(8px)",
            }}
          >
            {subjectName || "مدرس"}
          </span>
        </div>

        {/* Like button (Left side since RTL) */}
        <button
          onClick={(e) => { e.stopPropagation(); setLiked((v) => !v); }}
          className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", border: "none", cursor: "pointer" }}
        >
          <Heart size={15} className={liked ? "fill-rose-500 text-rose-500" : "text-white/70"} />
        </button>
      </div>

      {/* Text Info */}
      <div className="p-4 text-right w-full" dir="rtl" style={{ background: T.bgCard, flex: 1 }}>
        <h3 className="mb-1 truncate font-bold" style={{ fontSize: "1.05rem", letterSpacing: "0.01em", color: T.textPrimary }}>
          {teacher.name || t('subject_page_teacher_fallback', { id: teacher.id })}
        </h3>
        
        <p className="text-sm mb-3 truncate" style={{ color: T.textMuted }}>
           معلم مادة {subjectName || ""}
        </p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 text-xs" style={{ color: T.textMuted }}>
            <Users size={12} />
            {/* <span>{studentCount.toLocaleString()}</span> */}
          </div>
          <div className="flex items-center gap-1 text-xs text-yellow-500">
            <Star size={12} className="fill-yellow-500" />
            <span className="font-bold">{rating}</span>
          </div>
        </div>

        <div className="flex gap-1.5 justify-end flex-wrap">
          <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: T.trackBg, color: T.textMuted, border: `1px solid ${T.border}` }}>
            الثانوية العامة
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: T.trackBg, color: T.textMuted, border: `1px solid ${T.border}` }}>
            {subjectName || "مراجعات"}
          </span>
        </div>
      </div>
    </motion.button>
  );
};

// ── Glowing Modern Lesson Card Components ───────────────────────────────────

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #0f0c29 0%, #111a4a 50%, #1a0533 100%)",
  "linear-gradient(135deg, #0a0e27 0%, #0d1f4a 50%, #1a0a3d 100%)",
  "linear-gradient(135deg, #09142b 0%, #0c1a42 40%, #1e0738 100%)",
];

const TYPE_ICON = {
  video: Play,
  article: BookOpen,
  quiz: Zap,
};

function FallbackThumbnail({ lessonNumber, type = "video" }) {
  const gradient = FALLBACK_GRADIENTS[(lessonNumber - 1) % FALLBACK_GRADIENTS.length] || FALLBACK_GRADIENTS[0];
  const Icon = TYPE_ICON[type] || Play;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-slate-100 dark:bg-[#111A3A]">
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(99,102,241,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.4)_1px,transparent_1px)] bg-[size:20px_20px]" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(99,102,241,0.18)_0%,transparent_70%)]" />
      <div className="relative flex items-center justify-center rounded-xl w-9 h-9 bg-white/50 dark:bg-white/5 border border-indigo-200 dark:border-indigo-500/30 shadow-[0_0_18px_rgba(99,102,241,0.15)] dark:shadow-[0_0_18px_rgba(99,102,241,0.35)]">
        <Icon size={16} className="text-indigo-600 dark:text-indigo-400" strokeWidth={1.8} />
      </div>
      <span className="relative mt-2 text-xs tracking-widest text-slate-500 dark:text-slate-400/60 font-['Cairo']" style={{ letterSpacing: "0.15em" }}>
        {String(lessonNumber).padStart(2, "0")}
      </span>
    </div>
  );
}

function LessonCard({ title, duration, attachments = 0, thumbnailUrl, lessonNumber, isCompleted = false, isLocked = false, type = "video", onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <style>{`
        .lesson-card .play-btn { transition: opacity 0.2s ease, transform 0.2s ease; opacity: 0; transform: scale(0.85); }
        .lesson-card:hover .play-btn { opacity: 1; transform: scale(1); }
        .lesson-card .thumb-overlay { transition: opacity 0.25s ease; opacity: 0; }
        .lesson-card:hover .thumb-overlay { opacity: 1; }
      `}</style>
      <motion.div
        className={`lesson-card flex items-stretch w-full rounded-xl overflow-hidden relative border transition-colors ${isLocked ? "cursor-not-allowed opacity-80" : "cursor-pointer"} bg-white dark:bg-[#1A2744]/40 hover:bg-slate-50 dark:hover:bg-[#1A2744]/60 border-gray-200 dark:border-white/10`}
        onClick={!isLocked ? onClick : undefined}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        dir="rtl"
        whileTap={!isLocked ? { scale: 0.992 } : undefined}
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-black/5 dark:from-white/5 to-transparent pointer-events-none z-[1]" />
        
        <div className="shrink-0 w-[152px] aspect-[16/9] rounded-l-none rounded-r-[10px] overflow-hidden my-2 mr-2 ml-0 relative">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover block" />
          ) : (
            <FallbackThumbnail lessonNumber={lessonNumber} type={type} />
          )}
          <div className="thumb-overlay absolute inset-0 bg-slate-900/10 dark:bg-[#070818]/45 flex items-center justify-center" />
          
          {!isLocked && (
            <div className="play-btn absolute inset-0 flex items-center justify-center">
              <div className="w-[34px] h-[34px] rounded-full bg-indigo-600/90 dark:bg-indigo-500/85 flex items-center justify-center shadow-[0_0_18px_rgba(79,70,229,0.4)] dark:shadow-[0_0_18px_rgba(99,102,241,0.6)]">
                <Play size={14} fill="white" color="white" className="-mr-[2px]" />
              </div>
            </div>
          )}

          {isLocked && (
            <div className="absolute inset-0 bg-slate-100/60 dark:bg-[#070818]/65 flex items-center justify-center">
              <Lock className="text-slate-500 dark:text-slate-400/70 w-[18px] h-[18px]" />
            </div>
          )}

          {isCompleted && !isLocked && (
            <div className="absolute top-[6px] left-[6px] w-[18px] h-[18px] rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.5)]">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center py-2.5 pr-2 pl-3.5 gap-1.5 min-w-0 z-[2]">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold tracking-widest font-['Cairo'] transition-colors ${hovered ? "text-indigo-600 dark:text-indigo-400" : "text-indigo-500 dark:text-indigo-500/80"}`}>
              الدرس {String(lessonNumber).padStart(2, "0")}
            </span>
            {type !== "video" && (
              <span className="text-[9px] px-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/25 text-indigo-700 dark:text-indigo-400 font-['Cairo']">
                {type === "article" ? "مقال" : "اختبار"}
              </span>
            )}
          </div>
          
          <h4 className={`truncate m-0 font-bold text-[14px] font-['Cairo'] transition-colors ${isLocked ? "text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-white"}`}>
            {title}
          </h4>
          
          <div className="flex items-center gap-3.5 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] font-['Cairo'] text-slate-500 dark:text-slate-400">
              <Clock size={11} className="text-slate-400 dark:text-slate-500" /> {duration}
            </span>
            {attachments > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-['Cairo'] text-slate-500 dark:text-slate-400">
                <FileText size={11} className="text-slate-400 dark:text-slate-500" /> {attachments} {attachments === 1 ? "ملف" : "ملفات"}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center pl-3.5 pr-1 z-[2]">
          <motion.div animate={hovered && !isLocked ? { x: -3 } : { x: 0 }} transition={{ duration: 0.2 }}>
            <ChevronLeft size={16} className={`transition-colors ${hovered && !isLocked ? "text-indigo-600 dark:text-indigo-400" : "text-slate-300 dark:text-slate-600"}`} />
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}

// ── Unit card (self-contained, collapsible) ───────────────────────────────────

const UnitCard = ({ unit, subjectId, onStartLesson, isLoggedIn, T, t }) => {
  const [expanded, setExpanded] = useState(false);
  const totalCount = unit.lessons.length;

  return (
    <div className="overflow-hidden mb-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A2744]/40 shadow-sm transition-all">
      {/* ── Unit header ── */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center gap-4 p-4 text-right bg-transparent border-none cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-[#1A2744]/60"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
          <span className="text-indigo-600 dark:text-indigo-400 text-sm font-black">{unit.order}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="truncate font-bold text-slate-900 dark:text-white text-sm leading-tight m-0">{unit.title}</p>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 block font-['Cairo']">{t('subject_page_lessons_count', { count: totalCount })}</span>
        </div>

        {expanded
          ? <ChevronUp className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
        }
      </button>

      {/* ── Lesson rows ── */}
      {expanded && (
        <div className="p-4 flex flex-col gap-3 border-t border-gray-100 dark:border-white/5 bg-slate-50/50 dark:bg-transparent">
          {unit.lessons.map((lesson, idx) => {
            const isLocked = lesson.is_locked || (!isLoggedIn && idx > 0);
            return (
              <LessonCard
                key={lesson.id ?? idx}
                title={lesson.title}
                duration={lesson.duration ?? '--'}
                lessonNumber={idx + 1}
                isCompleted={lesson.completed}
                isLocked={isLocked}
                onClick={() => onStartLesson(lesson, subjectId)}
                type={lesson.type ?? "video"}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

const SubjectPageLoadingSkeleton = ({ lang, T, glass }) => (
  <div style={{..._t,background:T.bg,minHeight:"100vh",fontFamily:"'Cairo',sans-serif"}} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
    <main style={{maxWidth:"896px",margin:"0 auto",padding:"32px 16px",display:"flex",flexDirection:"column",gap:"18px"}}>
      <div style={glass({ padding: '24px' })}>
        <SkeletonLoader type="text" height="30px" width="45%" className="mb-4" />
        <SkeletonLoader type="text" height="14px" width="80%" className="mb-3" />
        <SkeletonLoader type="text" height="14px" width="62%" />
      </div>

      {Array.from({ length: 5 }).map((_, idx) => (
        <SkeletonLoader key={idx} type="card" height="72px" className="w-full" />
      ))}
    </main>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────

const SubjectPage = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const { lang } = useLanguage();
  const { t } = useTranslation();
  const { theme, C, glass } = useTheme();
  const isDark = theme === 'dark';
  const T = buildTheme(isDark);

  // ── State ──
  const [subject,         setSubject]         = useState(null);
  const [allTeachers,     setAllTeachers]     = useState([]); // المدرسين المحملين حتى الآن
  const [teachersApiPage, setTeachersApiPage] = useState(1);  // صفحة الـ API الحالية
  const [teachersLastPage,setTeachersLastPage]= useState(1);  // آخر صفحة في الـ API
  const [loadingMoreTeachers, setLoadingMoreTeachers] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [units,           setUnits]           = useState([]);
  const [loadingSubject,  setLoadingSubject]  = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingLessons,  setLoadingLessons]  = useState(false);
  const [errorSubject,    setErrorSubject]    = useState(null);
  const [errorTeachers,   setErrorTeachers]   = useState(null);
  const [errorLessons,    setErrorLessons]    = useState(null);
  const [selectedTeacherImgError, setSelectedTeacherImgError] = useState(false);

  // هل في مدرسين كمان في الـ API؟
  const hasMoreTeachers = teachersApiPage < teachersLastPage;

  // ── Auth Modal State ──
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    type: 'lesson', // 'lesson'
    lessonTitle: '',
    pendingAction: null, // { lesson, subjectId, type: 'lesson' }
  });

  const isLoggedIn = !!localStorage.getItem('token');

  // ── Fetch subject basic info ──
  const fetchSubject = useCallback(async () => {
    setLoadingSubject(true);
    setErrorSubject(null);
    try {
      const { data } = await publicApi.get('/subjects');
      // API response is paginated: { data: [...], current_page, total }
      const list = Array.isArray(data) ? data : (data.data || []);
      const found = list.find(s => String(s.id) === String(subjectId));
      if (!found) throw new Error('subject not found');
      setSubject({
        id:     found.id,
        name:   found.name || found.title,
        code:   found.code,
        icon:   SUBJECT_ICONS[found.code] ?? '📚',
      });
    } catch {
      // Fallback minimal: استخدم الـ ID كاسم
      setSubject({ id: subjectId, name: i18n.t('subject_page_subject_fallback', { id: subjectId }), code: 'DEFAULT', icon: '📚' });
    } finally {
      setLoadingSubject(false);
    }
  }, [subjectId]);

  // ── Fetch teachers for this subject (paginated) ──
  const fetchTeachers = useCallback(async (page = 1) => {
    if (page === 1) {
      setLoadingTeachers(true);
      setErrorTeachers(null);
      setAllTeachers([]);
    } else {
      setLoadingMoreTeachers(true);
    }
    try {
      const { data } = await publicApi.get(`/subjects/${subjectId}/teachers?page=${page}`);
      // API response: { teachers: { data: [...], meta: { last_page } } }
      const teachersRaw = data?.teachers?.data || data?.teachers || data?.data || data || [];
      const teachersList = Array.isArray(teachersRaw) ? teachersRaw : [];
      const lastPage = data?.teachers?.meta?.last_page || data?.teachers?.last_page || data?.last_page || 1;

      const mapped = teachersList.map((teacher) => ({
        id: teacher.teacher_id || teacher.id,
        name: teacher.teacher_name || teacher.name || i18n.t('subject_page_teacher_fallback', { id: teacher.teacher_id || teacher.id }),
        teacher_profile_picture: teacher.teacher_profile_picture || teacher.profile_picture || teacher.profilePicture || teacher.image || teacher.avatar || null,
      }));

      setAllTeachers(prev => page === 1 ? mapped : [...prev, ...mapped]);
      setTeachersApiPage(page);
      setTeachersLastPage(lastPage);
    } catch {
      setErrorTeachers(i18n.t('subject_page_error_teachers'));
    } finally {
      setLoadingTeachers(false);
      setLoadingMoreTeachers(false);
    }
  }, [subjectId]);

  // ── Fetch lessons for selected teacher ──
  // ✅ يجلب دروس المدرس فقط عند اختياره
  const fetchTeacherLessons = useCallback(async (teacherId) => {
    setLoadingLessons(true);
    setErrorLessons(null);
    setUnits([]);
    
    try {
      // 1. جلب وحدات المادة أولاً
      const unitsRes = await publicApi.get(`/subjects/${subjectId}/units`);
      const unitsRaw = unitsRes.data?.data || unitsRes.data || [];
      const unitsList = Array.isArray(unitsRaw) ? unitsRaw : [];
      
      // 2. جلب الدروس من كل وحدة
      const allSubjectLessons = [];
      for (const unit of unitsList) {
        try {
          const lessonsRes = await publicApi.get(`/units/${unit.id}/lessons`);
          const lessonsRaw = lessonsRes.data?.data || lessonsRes.data || [];
          const lessons = Array.isArray(lessonsRaw) ? lessonsRaw : [];
          lessons.forEach(l => {
            allSubjectLessons.push({ ...l, _unitTitle: unit.title || unit.name });
          });
        } catch {
          // تجاهل الخطأ والمتابعة
        }
      }
      
      // 3. جلب الدروس عبر فيديوهات المدرس
      const teacherLessonsRes = await publicApi.get(`/teachers/${teacherId}/lessons`);

      // ✅ Extract lessons with proper fallback chaining
      const teacherLessonsRaw = 
        teacherLessonsRes.data?.lessons?.data ||  // Paginated Laravel: { lessons: { data: [...] } }
        teacherLessonsRes.data?.lessons ||        // Direct nested: { lessons: [...] }
        teacherLessonsRes.data?.data ||           // Paginated direct: { data: [...] }
        teacherLessonsRes.data ||                 // Direct array: [...]
        [];
      
      const teacherLessonsList = Array.isArray(teacherLessonsRaw) ? teacherLessonsRaw : [];

      // ✅ Use teacher's lessons directly (backend already filters by teacher+video relationship)
      // Match them with unit info from allSubjectLessons for enrichment
      const enrichedLessons = teacherLessonsList.map(teacherLesson => {
        // Try to find matching lesson in allSubjectLessons to get unit info
        const subjectLesson = allSubjectLessons.find(sl => sl.id === teacherLesson.id);
        
        return {
          ...teacherLesson,
          _unitTitle: subjectLesson?._unitTitle || teacherLesson.unit_title || teacherLesson.chapter || i18n.t('subject_page_general_lessons'),
        };
      });

      // Group lessons by unit (chapter)
      const chapterMap = {};
      enrichedLessons.forEach(l => {
        const key = l._unitTitle || l.unit_title || l.chapter || i18n.t('subject_page_general_lessons');
        if (!chapterMap[key]) {
          chapterMap[key] = {
            id: Object.keys(chapterMap).length + 1,
            title: key,
            order: Object.keys(chapterMap).length + 1,
            lessons: []
          };
        }
        chapterMap[key].lessons.push({
          id: l.id,
          title: l.title ?? l.name ?? i18n.t('subject_page_lesson_fallback', { id: l.id }),
          duration: l.duration ?? '--',
          chapter: key,
          description: l.description ?? '',
        });
      });
      setUnits(Object.values(chapterMap));
    } catch {
      setErrorLessons(i18n.t('subject_page_error_lessons'));
    } finally {
      setLoadingLessons(false);
    }
  }, [subjectId]);

  // ── Effects ──
  useEffect(() => {
    fetchSubject();
    fetchTeachers();
  }, [fetchSubject, fetchTeachers]);

  useEffect(() => {
    if (selectedTeacher) {
      fetchTeacherLessons(selectedTeacher.id);
    }
  }, [selectedTeacher, fetchTeacherLessons]);

  useEffect(() => {
    setSelectedTeacherImgError(false);
  }, [selectedTeacher?.id, selectedTeacher?.profile_picture]);

  // ── Handle teacher selection ──
  const handleSelectTeacher = (teacher) => {
    if (selectedTeacher?.id === teacher.id) {
      // Deselect
      setSelectedTeacher(null);
      setUnits([]);
    } else {
      setSelectedTeacher(teacher);
    }
  };

  // ── Derived stats ──
  const totalLessons = units.reduce((s, u) => s + u.lessons.length, 0);

  // ── Auth Modal helpers ──
  const openAuthModal = (type, lesson) => {
    setAuthModal({
      isOpen: true,
      type,
      lessonTitle: lesson?.title || '',
      pendingAction: { lesson, subjectId, type },
    });
  };

  const closeAuthModal = () => {
    setAuthModal(prev => ({ ...prev, isOpen: false }));
  };

  // ── Navigation helpers ──
  const handleStartLesson = (lesson, sid) => {
    if (!isLoggedIn) {
      // عرض Modal بدلاً من التوجيه المباشر
      openAuthModal('lesson', lesson);
      // حفظ البيانات في sessionStorage للعودة بعد تسجيل الدخول
      sessionStorage.setItem('pendingLesson', JSON.stringify({
        type: 'lesson',
        lesson,
        subjectId: sid,
        subjectName: subject?.name,
        teacherId: selectedTeacher?.id,
      }));
      return;
    }
    const courseDetailsPath = `/course-details?lessonId=${encodeURIComponent(String(lesson?.id ?? ''))}&teacherId=${encodeURIComponent(String(selectedTeacher?.id ?? ''))}&subjectId=${encodeURIComponent(String(sid))}`;
    navigate(courseDetailsPath, {
      state: { 
        lesson, 
        subjectId: sid, 
        subjectName: subject?.name,
        teacherId: selectedTeacher?.id  // ✅ Pass teacher ID
      } 
    });
  };

  const handleBack = () => {
    if (selectedTeacher) {
      setSelectedTeacher(null);
      setUnits([]);
    } else if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  // ── Full-page loader ──
  if (loadingSubject && loadingTeachers) {
    return <SubjectPageLoadingSkeleton lang={lang} T={T} glass={glass} />;
  }

  return (
    <div style={{..._t,background:T.bg,minHeight:"100vh",fontFamily:"'Cairo',sans-serif"}} dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* ═══ GUEST BANNER ═══ */}
      {!isLoggedIn && (
        <div style={{background:T.accentDim,borderBottom:`1px solid ${T.borderAccent}`}}>
          <div style={{maxWidth:"896px",margin:"0 auto",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px",flexWrap:"wrap"}}>
            <p style={{fontSize:"0.875rem",color:T.accent,fontWeight:600}}>
              👋 {t('subject_page_guest_banner')}
            </p>
            <button
              onClick={() => navigate('/login?redirect=' + encodeURIComponent(window.location.pathname))}
              style={{..._t,display:"flex",alignItems:"center",gap:"8px",padding:"6px 16px",borderRadius:"8px",fontSize:"0.875rem",fontWeight:700,background:T.accent,color:"#FFF",border:"none",cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.filter="brightness(1.1)"}
              onMouseLeave={e=>e.currentTarget.style.filter="none"}
            >
              <LogIn style={{width:"16px",height:"16px"}} />
              {t('login')}
            </button>
          </div>
        </div>
      )}

      {/* ═══ SUB-HEADER ═══ */}
      <header style={{background:T.headerBg,borderBottom:`1px solid ${T.border}`,backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:40}}>
        <div style={{maxWidth:"896px",margin:"0 auto",padding:"16px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <button
              onClick={handleBack}
              style={{..._t,display:"flex",alignItems:"center",gap:"8px",color:T.textMuted,fontWeight:700,background:"transparent",border:"none",cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.color=T.accent}
              onMouseLeave={e=>e.currentTarget.style.color=T.textMuted}
            >
              <ArrowRight style={{width:"20px",height:"20px",...(lang==='en'?{transform:"rotate(180deg)"}:{})}} />
              {selectedTeacher 
                ? t('subject_page_back_to_teachers')
                : (isLoggedIn ? t('back_to_dashboard') : t('back_to_home'))
              }
            </button>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <div style={_iw(T.accentDim,T.borderAccent,"32px","8px")}>
                <BookOpen style={{width:"16px",height:"16px",color:T.accent}} />
              </div>
              <h1 style={{fontSize:"1.25rem",fontWeight:800,color:T.textPrimary}}>
                {loadingSubject ? '…' : (subject?.name ?? subjectId)}
              </h1>
            </div>
            <div style={{width:"128px"}} />
          </div>
        </div>
      </header>

      <main style={{maxWidth:"896px",margin:"0 auto",padding:"32px 16px",display:"flex",flexDirection:"column",gap:"24px"}}>

        {/* ═══ SECTION 1 — Subject info card ═══ */}
        {errorSubject ? (
          <SectionError message={errorSubject} onRetry={fetchSubject} T={T} t={t} />
        ) : loadingSubject ? (
          <div style={glass({ padding: '24px' })}>
            <SkeletonLoader type="text" height="30px" width="42%" className="mb-4" />
            <SkeletonLoader type="text" height="12px" width="72%" />
          </div>
        ) : subject ? (
          <div style={{..._c(T),padding:"24px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
                <span style={{fontSize:"2.5rem"}}>{subject.icon}</span>
                <div>
                  <h2 style={{fontSize:"1.5rem",fontWeight:800,color:T.textPrimary}}>{subject.name}</h2>
                  <p style={{fontSize:"0.875rem",color:T.textDim,marginTop:"4px"}}>
                    {loadingTeachers 
                      ? t('subject_page_loading_teachers')
                      : t('subject_page_available_teachers', { count: allTeachers.length })
                    }
                  </p>
                </div>
              </div>
              {selectedTeacher && totalLessons > 0 && (
                <div style={{display:"flex",alignItems:"center",gap:"16px",fontSize:"0.875rem"}}>
                  <span style={{color:T.textDim}}>
                    {t('subject_page_lessons_count', { count: totalLessons })}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* ═══ SECTION 2 — Teachers List (when no teacher selected) ═══ */}
        {!selectedTeacher && (
          <div>
            <h3 style={{fontSize:"1.125rem",fontWeight:800,color:T.textPrimary,marginBottom:"16px",display:"flex",alignItems:"center",gap:"8px"}}>
              <Users style={{width:"20px",height:"20px",color:T.accent}} />
              {t('subject_page_choose_teacher')}
              {allTeachers.length > 0 && (
                <span style={{fontSize:"0.875rem",fontWeight:400,color:T.textDim}}>
                  ({t('subject_page_teachers_count', { count: allTeachers.length })})
                </span>
              )}
            </h3>

            {errorTeachers ? (
              <SectionError message={errorTeachers} onRetry={fetchTeachers} T={T} t={t} />
            ) : loadingTeachers ? (
              <SectionLoader rows={4} T={T} />
            ) : allTeachers.length === 0 ? (
              <div style={glass({ padding: '8px' })}>
                <EmptyState
                  icon={GraduationCap}
                  title={t('subject_page_no_teachers_title')}
                  description={t('subject_page_no_teachers_desc')}
                />
              </div>
            ) : (
              <>
                <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>
                  {allTeachers.map((teacher, i) => (
                    <TeacherCard
                      key={teacher.id}
                      teacher={teacher}
                      subjectName={subject?.name}
                      delay={i * 0.07}
                      isSelected={false}
                      onSelect={handleSelectTeacher}
                      T={T}
                      t={t}
                    />
                  ))}
                </div>
                
                {/* زر عرض المزيد */}
                {hasMoreTeachers && (
                  <button
                    onClick={() => fetchTeachers(teachersApiPage + 1)}
                    disabled={loadingMoreTeachers}
                    style={{..._t,marginTop:"16px",width:"100%",padding:"12px",borderRadius:"12px",border:`2px dashed ${T.border}`,color:T.textMuted,fontWeight:700,background:"transparent",cursor:loadingMoreTeachers?"not-allowed":"pointer",opacity:loadingMoreTeachers?0.5:1}}
                    onMouseEnter={e=>{if(!loadingMoreTeachers){e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color=T.accent}}}
                    onMouseLeave={e=>{if(!loadingMoreTeachers){e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.textMuted}}}
                  >
                    {loadingMoreTeachers ? t('subject_page_loading_more_teachers') : t('subject_page_load_more_teachers')}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══ SECTION 3 — Selected Teacher's Lessons ═══ */}
        {selectedTeacher && (
          <div>
            {/* Selected teacher info */}
            <div style={{..._c(T),padding:"16px",marginBottom:"24px",background:T.accent,border:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
                {getProfilePictureUrl(selectedTeacher.teacher_profile_picture) && !selectedTeacherImgError ? (
                  <img
                    src={getProfilePictureUrl(selectedTeacher.teacher_profile_picture)}
                    alt={selectedTeacher.name}
                    onError={() => setSelectedTeacherImgError(true)}
                    style={{width:"56px",height:"56px",borderRadius:"50%",objectFit:"cover",flexShrink:0}}
                  />
                ) : (
                  <div style={{width:"56px",height:"56px",borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.5rem",fontWeight:900,color:"#FFF",flexShrink:0}}>
                    {selectedTeacher.name.charAt(0)}
                  </div>
                )}
                <div style={{flex:1}}>
                  <p style={{fontWeight:700,fontSize:"1.125rem",color:"#FFF"}}>{selectedTeacher.name}</p>
                  <p style={{color:"rgba(255,255,255,0.8)",fontSize:"0.875rem"}}>
                    {loadingLessons 
                      ? t('subject_page_loading_lessons')
                      : t('subject_page_available_lessons', { count: totalLessons })
                    }
                  </p>
                </div>
                <button
                  onClick={() => handleSelectTeacher(selectedTeacher)}
                  style={{..._t,padding:"8px 16px",borderRadius:"8px",background:"rgba(255,255,255,0.2)",color:"#FFF",border:"none",fontWeight:700,fontSize:"0.875rem",cursor:"pointer"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.3)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.2)"}
                >
                  {t('subject_page_change_teacher')}
                </button>
              </div>
            </div>

            {/* Lessons */}
            <h3 style={{fontSize:"1.125rem",fontWeight:800,color:T.textPrimary,marginBottom:"16px",display:"flex",alignItems:"center",gap:"8px"}}>
              <BookOpen style={{width:"20px",height:"20px",color:T.accent}} />
              {t('subject_page_lessons_catalog')}
            </h3>

            {errorLessons ? (
              <SectionError message={errorLessons} onRetry={() => fetchTeacherLessons(selectedTeacher.id)} T={T} t={t} />
            ) : loadingLessons ? (
              <SectionLoader rows={5} T={T} />
            ) : units.length === 0 ? (
              <div style={glass({ padding: '8px' })}>
                <EmptyState
                  icon={PlayCircle}
                  title={t('subject_page_no_lessons_title')}
                  description={t('subject_page_no_lessons_desc')}
                />
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                {units.map(unit => (
                  <UnitCard
                    key={unit.id}
                    unit={unit}
                    subjectId={subjectId}
                    onStartLesson={handleStartLesson}
                    isLoggedIn={isLoggedIn}
                    T={T}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ═══ AUTH MODAL ═══ */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={closeAuthModal}
        type={authModal.type}
        lessonTitle={authModal.lessonTitle}
        redirectPath={`/subject/${subjectId}`}
      />
    </div>
  );
};

export default SubjectPage;
