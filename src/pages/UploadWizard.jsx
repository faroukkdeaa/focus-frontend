import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import LangToggle from '../components/LangToggle';
import {
  Check, ChevronRight, ChevronLeft, Upload, X, Plus, Trash2,
  BookOpen, Video, ClipboardList, Eye, Brain, Loader2,
  CheckCircle2, FileVideo, ImagePlus, AlertCircle, ArrowRight,
  Edit2, CircleHelp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UPLOAD_DRAFT_KEY = 'focus_upload_draft';

const tooltipBubbleStyle = {
  position: 'absolute',
  bottom: 'calc(100% + 8px)',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '220px',
  zIndex: 30,
  pointerEvents: 'none',
};

// --- DESIGN SYSTEM (Extracted from LandingPage) ---
const buildTheme = (isDark) => {
  const isDarkBool = Boolean(isDark);
  return {
    isDark: isDarkBool,
    bg: isDarkBool ? "#0f172a" : "#f8fafc",
    bgPanel: isDarkBool ? "#1e293b" : "#ffffff",
    bgCard: isDarkBool ? "#334155" : "#f1f5f9",
    headerBg: isDarkBool ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.85)",
    textPrimary: isDarkBool ? "#f8fafc" : "#0f172a",
    textMuted: isDarkBool ? "#94a3b8" : "#64748b",
    textDim: isDarkBool ? "#64748b" : "#94a3b8",
    border: isDarkBool ? "#334155" : "#e2e8f0",
    borderHover: isDarkBool ? "#475569" : "#cbd5e1",
    borderAccent: isDarkBool ? "#3b82f6" : "#2563eb",
    accent: isDarkBool ? "#3b82f6" : "#2563eb",
    accentHover: isDarkBool ? "#60a5fa" : "#1d4ed8",
    accentDim: isDarkBool ? "rgba(59, 130, 246, 0.1)" : "rgba(37, 99, 235, 0.05)",
    red: isDarkBool ? "#ef4444" : "#dc2626",
    redDim: isDarkBool ? "rgba(239, 68, 68, 0.1)" : "rgba(220, 38, 38, 0.05)",
    redBorder: isDarkBool ? "#7f1d1d" : "#fecaca",
    green: isDarkBool ? "#10b981" : "#16a34a",
    greenDim: isDarkBool ? "rgba(16, 185, 129, 0.1)" : "rgba(22, 163, 74, 0.05)",
    greenBorder: isDarkBool ? "#064e3b" : "#bbf7d0",
    yellow: isDarkBool ? "#f59e0b" : "#d97706",
    yellowDim: isDarkBool ? "rgba(245, 158, 11, 0.1)" : "rgba(217, 119, 6, 0.05)",
    yellowBorder: isDarkBool ? "#78350f" : "#fef08a",
    orange: isDarkBool ? "#f97316" : "#ea580c",
    orangeDim: isDarkBool ? "rgba(249, 115, 22, 0.1)" : "rgba(234, 88, 12, 0.05)",
    orangeBorder: isDarkBool ? "#7c2d12" : "#fed7aa",
    iconBgA: isDarkBool ? "#312e81" : "#e0e7ff",
    iconBorderA: isDarkBool ? "#4338ca" : "#c7d2fe",
    iconA: isDarkBool ? "#818cf8" : "#4f46e5",
    iconBgB: isDarkBool ? "#14532d" : "#dcfce7",
    iconBorderB: isDarkBool ? "#15803d" : "#bbf7d0",
    iconB: isDarkBool ? "#34d399" : "#16a34a",
    shadowCard: isDarkBool ? "0 4px 6px -1px rgba(0, 0, 0, 0.5)" : "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  };
};

const _c = (T) => ({
  background: T.bgPanel,
  border: `1px solid ${T.border}`,
  borderRadius: "16px",
  boxShadow: T.shadowCard,
});

const _t = { transition: "all 0.2s ease" };

const _iw = (bg, border, size = "48px", radius = "12px") => ({
  width: size,
  height: size,
  background: bg,
  border: `1px solid ${border}`,
  borderRadius: radius,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});

const _input = (T) => ({
  width: "100%",
  background: T.bgCard,
  border: `1px solid ${T.border}`,
  borderRadius: "12px",
  padding: "12px 16px",
  fontSize: "0.875rem",
  color: T.textPrimary,
  outline: "none",
  ..._t,
});
// ------------------------------------------

// ── Static data ───────────────────────────────────────────────────────────────

// ── Dynamic Data will be loaded via API instead of hardcoded ──

const COGNITIVE_SKILLS = [
  { value: 'Remember',  label: 'تذكر'   },
  { value: 'Understand',label: 'فهم'    },
  { value: 'Apply',     label: 'تطبيق'  },
  { value: 'Analyze',   label: 'تحليل'  },
  { value: 'Evaluate',  label: 'تقييم'  },
  { value: 'Create',    label: 'إنشاء'  },
];

const DIFFICULTIES = [
  { value: 'Easy',   label: 'سهل'    },
  { value: 'Medium', label: 'متوسط'  },
  { value: 'Hard',   label: 'صعب'    },
];

const STEPS = [
  { id: 1, labelKey: 'step_metadata', icon: BookOpen      },
  { id: 2, labelKey: 'step_video',    icon: Video         },
  { id: 3, labelKey: 'step_quiz',     icon: ClipboardList  },
  { id: 4, labelKey: 'step_review',   icon: Eye           },
];

const OPTION_LETTERS = ['أ', 'ب', 'ج', 'د'];

const mkQuestion = () => ({
  id: `q_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  text:       '',
  options:    ['', '', '', ''],
  correct:    null,
  subtopic:   '', // This will store the subtopic ID now
  skill:      '',
  difficulty: '',
  distractor: '',
});

// ── QuestionCard (extracted to prevent re-creation on parent re-render) ────────

const QuestionCard = ({ q, qIdx, apiSubtopics, onPatch, onPatchOption, onRemove, canRemove, showValidation, T }) => {
  const [openTip, setOpenTip] = useState(null);

  const tipTrigger = {
    width: '18px',
    height: '18px',
    borderRadius: '999px',
    border: `1px solid ${T.border}`,
    color: T.textDim,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'help',
    background: T.bgCard,
    flexShrink: 0,
  };

  const tipBox = {
    ..._c(T),
    borderRadius: '12px',
    padding: '10px 12px',
    fontSize: '0.72rem',
    lineHeight: 1.5,
    color: T.textMuted,
    textAlign: 'center',
  };

  const incomplete =
    showValidation &&
    (!q.text.trim() || q.options.some(o => !o.trim()) || q.correct === null || !q.subtopic);

  return (
    <div style={{..._t,..._c(T),padding:"20px",borderColor:incomplete?T.redBorder:T.border}}>
      {/* Card header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{background:T.accentDim,color:T.accent,fontSize:"0.75rem",fontWeight:800,padding:"4px 12px",borderRadius:"999px"}}>
            سؤال {qIdx + 1}
          </span>
          {incomplete && (
            <span style={{color:T.red,fontSize:"0.75rem",display:"flex",alignItems:"center",gap:"4px"}}>
              <AlertCircle style={{width:"12px",height:"12px"}} /> غير مكتمل
            </span>
          )}
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            style={{..._t,background:"transparent",border:"none",color:T.textMuted,cursor:"pointer"}}
            onMouseEnter={e=>e.currentTarget.style.color=T.red}
            onMouseLeave={e=>e.currentTarget.style.color=T.textMuted}
            title="حذف السؤال"
          >
            <Trash2 style={{width:"16px",height:"16px"}} />
          </button>
        )}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
        {/* Question text */}
        <div>
          <label style={{display:"block",fontSize:"0.75rem",fontWeight:800,color:T.textMuted,marginBottom:"6px"}}>
            نص السؤال <span style={{color:T.red}}>*</span>
          </label>
          <textarea
            value={q.text}
            onChange={e => onPatch(q.id, { text: e.target.value })}
            rows={2}
            placeholder="اكتب نص السؤال هنا..."
            style={{..._input(T),borderColor:(showValidation && !q.text.trim())?T.redBorder:T.border}}
            onFocus={e=>{e.target.style.borderColor=T.accent}}
            onBlur={e=>{e.target.style.borderColor=(showValidation && !q.text.trim())?T.redBorder:T.border}}
          />
        </div>

        {/* Options */}
        <div>
          <label style={{display:"block",fontSize:"0.75rem",fontWeight:800,color:T.textMuted,marginBottom:"8px"}}>
            الخيارات — انقر على الزر الدائري لتحديد الإجابة الصحيحة <span style={{color:T.red}}>*</span>
          </label>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:"8px"}}>
            {q.options.map((opt, oi) => {
              const isCorrect = q.correct === oi;
              return (
              <div 
                key={oi} 
                onClick={() => onPatch(q.id, { correct: oi })}
                style={{
                  ..._t,
                  display:"flex",alignItems:"center",gap:"8px",
                  padding:"8px",borderRadius:"12px",
                  background: isCorrect ? T.greenDim : "transparent",
                  border: `1px solid ${isCorrect ? T.greenBorder : "transparent"}`,
                  cursor: "pointer"
                }}
                onMouseEnter={e => {
                  if (!isCorrect) e.currentTarget.style.background = T.accentDim;
                }}
                onMouseLeave={e => {
                  if (!isCorrect) e.currentTarget.style.background = "transparent";
                }}
              >
                <input
                  type="radio"
                  name={`correct_${q.id}`}
                  checked={isCorrect}
                  readOnly
                  style={{accentColor:T.accent,flexShrink:0,width:"16px",height:"16px",cursor:"pointer"}}
                />
                <span style={{fontSize:"0.75rem",fontWeight:800,color:T.textMuted,width:"16px",flexShrink:0}}>
                  {OPTION_LETTERS[oi]}
                </span>
                <input
                  type="text"
                  value={opt}
                  onChange={e => onPatchOption(q.id, oi, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={`الخيار ${OPTION_LETTERS[oi]}`}
                  style={{
                    ..._input(T),
                    flex:1,
                    background:isCorrect?T.greenDim:T.bgCard,
                    borderColor:isCorrect?T.greenBorder:(showValidation&&!opt.trim())?T.redBorder:T.border,
                    cursor:"text"
                  }}
                  onFocus={e=>{e.target.style.borderColor=T.accent}}
                  onBlur={e=>{e.target.style.borderColor=isCorrect?T.greenBorder:(showValidation&&!opt.trim())?T.redBorder:T.border}}
                />
              </div>
            )})}
          </div>
          {showValidation && q.correct === null && (
            <p style={{color:T.red,fontSize:"0.75rem",marginTop:"4px"}}>يُرجى تحديد الإجابة الصحيحة</p>
          )}
        </div>

        {/* Metadata tags */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))",gap:"12px"}}>
          <div>
            <label style={{display:"flex",alignItems:"center",gap:"6px",fontSize:"0.75rem",fontWeight:800,color:T.textMuted,marginBottom:"6px",position:'relative'}}>
              <span>الموضوع الفرعي <span style={{color:T.red}}>*</span></span>
              <span
                style={tipTrigger}
                onMouseEnter={() => setOpenTip('subtopic')}
                onMouseLeave={() => setOpenTip(null)}
                aria-hidden="true"
              >
                <CircleHelp style={{ width: '12px', height: '12px' }} />
              </span>
              {openTip === 'subtopic' && (
                <span style={tooltipBubbleStyle}>
                  <span style={tipBox}>سيتم استخدام هذا لتوجيه الطلاب في تقرير نقاط الضعف واقتراح محتوى علاجي أدق.</span>
                </span>
              )}
            </label>
            <select
              value={q.subtopic}
              onChange={e => onPatch(q.id, { subtopic: e.target.value })}
              style={{..._input(T),borderColor:(showValidation&&!q.subtopic)?T.redBorder:T.border,appearance:"none",cursor:"pointer"}}
            >
              <option value="" style={{background:T.bgPanel,color:T.textPrimary}}>اختر الموضوع الفرعي</option>
              {apiSubtopics.map((item) => (
                <option key={item.id} value={item.id} style={{background:T.bgPanel,color:T.textPrimary}}>
                  {item.title}
                </option>
              ))}
            </select>
            {showValidation && !q.subtopic && (
              <p style={{color:T.red,fontSize:"10px",marginTop:"4px"}}>مطلوب</p>
            )}
          </div>
          <div>
            <label style={{display:"block",fontSize:"0.75rem",fontWeight:800,color:T.textMuted,marginBottom:"6px"}}>المهارة المعرفية</label>
            <select
              value={q.skill}
              onChange={e => onPatch(q.id, { skill: e.target.value })}
              style={{..._input(T),appearance:"none",cursor:"pointer"}}
            >
              <option value="" style={{background:T.bgPanel,color:T.textPrimary}}>اختر المهارة</option>
              {COGNITIVE_SKILLS.map(s => (
                <option key={s.value} value={s.value} style={{background:T.bgPanel,color:T.textPrimary}}>{s.label} ({s.value})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{display:"block",fontSize:"0.75rem",fontWeight:800,color:T.textMuted,marginBottom:"6px"}}>الصعوبة</label>
            <select
              value={q.difficulty}
              onChange={e => onPatch(q.id, { difficulty: e.target.value })}
              style={{..._input(T),appearance:"none",cursor:"pointer"}}
            >
              <option value="" style={{background:T.bgPanel,color:T.textPrimary}}>اختر</option>
              {DIFFICULTIES.map(d => (
                <option key={d.value} value={d.value} style={{background:T.bgPanel,color:T.textPrimary}}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Distractor pattern */}
        <div>
          <label style={{display:"flex",alignItems:"center",gap:"6px",fontSize:"0.75rem",fontWeight:800,color:T.textMuted,marginBottom:"6px",position:'relative'}}>
            <span>نمط المُلهي (Distractor) <span style={{color:T.textDim,fontWeight:"normal"}}>(اختياري)</span></span>
            <span
              style={tipTrigger}
              onMouseEnter={() => setOpenTip('distractor')}
              onMouseLeave={() => setOpenTip(null)}
              aria-hidden="true"
            >
              <CircleHelp style={{ width: '12px', height: '12px' }} />
            </span>
            {openTip === 'distractor' && (
              <span style={tooltipBubbleStyle}>
                <span style={tipBox}>وصف نمط الخطأ الشائع يساعد المدرّس على تحسين صياغة الخيارات وتشخيص سبب الالتباس.</span>
              </span>
            )}
          </label>
          <input
            type="text"
            value={q.distractor}
            onChange={e => onPatch(q.id, { distractor: e.target.value })}
            placeholder="مثال: خطأ في العلامة، ارتباك في الوحدات..."
            style={_input(T)}
            onFocus={e=>{e.target.style.borderColor=T.accent}}
            onBlur={e=>{e.target.style.borderColor=T.border}}
          />
        </div>
      </div>
    </div>
  );
};

// ── Main wizard component ─────────────────────────────────────────────────────


const StepAccordion = ({ stepNum, currentStep, title, subtitle, summary, isCompleted, onEdit, children, T, lang }) => {
  const isActive = currentStep === stepNum;
  const isFuture = currentStep < stepNum && !isCompleted;
  
  return (
    <div style={{ ..._c(T), marginBottom: "24px", overflow: "hidden", border: isActive ? `2px solid ${T.accent}` : `1px solid ${T.border}`, opacity: isFuture ? 0.6 : 1, transition: "all 0.3s ease" }}>
      <div 
        onClick={() => { if (isCompleted && !isActive) onEdit(); }}
        style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: (isCompleted && !isActive) ? "pointer" : "default", background: isActive ? T.accentDim : "transparent" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: isCompleted ? T.green : (isActive ? T.accent : T.bgCard), border: `1px solid ${isActive ? T.accent : T.border}`, color: (isCompleted || isActive) ? "#FFF" : T.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>
            {isCompleted ? <CheckCircle2 style={{ width: "16px", height: "16px" }} /> : stepNum}
          </div>
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: isActive ? T.accent : T.textPrimary }}>{title}</h2>
            {isActive ? (
              <p style={{ fontSize: "0.875rem", color: T.textMuted }}>{subtitle}</p>
            ) : isCompleted ? (
              <p style={{ fontSize: "0.875rem", color: T.textDim, marginTop: "4px" }}>{summary}</p>
            ) : null}
          </div>
        </div>
        {isCompleted && !isActive && (
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} style={{ background: "transparent", border: "none", color: T.accent, fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
            <Edit2 style={{ width: "16px", height: "16px" }} /> {lang === 'ar' ? 'تعديل' : 'Edit'}
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {isActive && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "24px", borderTop: `1px solid ${T.border}` }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const UploadWizard = () => {

  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { theme, glass: themeGlass } = useTheme();
  const isDark = theme === 'dark';
  const T = buildTheme(isDark);
  const videoInputRef = useRef(null);
  const thumbInputRef  = useRef(null);

  // Step tracking
  const [step, setStep]           = useState(1);
  const [completed, setCompleted] = useState(new Set());

  // ── Step 1 state ──
  const [subject,     setSubject]     = useState('');
  const [unit,        setUnit]        = useState('');
  const [lessonId,    setLessonId]    = useState('');
  const [lessonDesc,  setLessonDesc]  = useState('');
  const [step1Errors, setStep1Errors] = useState({});

  // ── Step 2 state ──
  const [videoFile,   setVideoFile]   = useState(null);
  const [videoError,  setVideoError]  = useState('');
  const [isDragging,  setIsDragging]  = useState(false);
  const [thumbnail,   setThumbnail]   = useState(null);
  const [thumbPreview,setThumbPreview]= useState('');

  // ── Step 3 state ──
  const [questions,       setQuestions]       = useState([mkQuestion()]);
  const [showQuizVal,     setShowQuizVal]      = useState(false);
  const [quizTitle,       setQuizTitle]       = useState('');
  const [quizTitleManual, setQuizTitleManual] = useState(false);

  // ── Step 4 state ──
  const [publishing, setPublishing] = useState(false);
  const [toast,      setToast]      = useState(null); // { type, message }
  const [showRestoreDraftPrompt, setShowRestoreDraftPrompt] = useState(false);
  const [draftSnapshot, setDraftSnapshot] = useState(null);

  // ── API Data states ──
  const [apiSubjects,   setApiSubjects]   = useState([]);
  const [apiUnits,      setApiUnits]      = useState([]);
  const [apiLessons,    setApiLessons]    = useState([]);
  const [apiSubtopics,  setApiSubtopics]  = useState([]);
  const [loadingOpts,   setLoadingOpts]   = useState(false);
  const draftSaveTimerRef = useRef(null);

  // Fetch subjects on mount
  useEffect(() => {
    setLoadingOpts(true);
    api.get('/subjects')
      .then(res => {
        const data = res.data?.data || res.data || [];
        setApiSubjects(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error('Failed to fetch subjects', err))
      .finally(() => setLoadingOpts(false));
  }, []);

  useEffect(() => {
    try {
      const rawDraft = localStorage.getItem(UPLOAD_DRAFT_KEY);
      if (!rawDraft) return;
      const parsed = JSON.parse(rawDraft);
      if (!parsed || typeof parsed !== 'object') return;
      setDraftSnapshot(parsed);
      setShowRestoreDraftPrompt(true);
    } catch (err) {
      console.error('Draft restore parse error:', err);
    }
  }, []);

  const restoreDraft = useCallback(() => {
    if (!draftSnapshot) return;

    setStep(draftSnapshot.step ?? 1);
    setCompleted(new Set(Array.isArray(draftSnapshot.completed) ? draftSnapshot.completed : []));

    setSubject(draftSnapshot.subject ?? '');
    setUnit(draftSnapshot.unit ?? '');
    setLessonId(draftSnapshot.lessonId ?? '');
    setLessonDesc(draftSnapshot.lessonDesc ?? '');

    // NOTE: File objects cannot survive localStorage serialization.
    // Clear thumbPreview so the UI does NOT show a stale preview with a null File state.
    // The user will be prompted to re-select the thumbnail via the toast below.
    setThumbPreview('');
    setThumbnail(null);

    setQuizTitle(draftSnapshot.quizTitle ?? '');
    setQuizTitleManual(Boolean(draftSnapshot.quizTitleManual));
    setQuestions(Array.isArray(draftSnapshot.questions) && draftSnapshot.questions.length > 0 ? draftSnapshot.questions : [mkQuestion()]);

    if (draftSnapshot.videoMeta?.name) {
      setVideoError(`تمت استعادة المسودة. أعد رفع الفيديو: ${draftSnapshot.videoMeta.name}`);
    }

    if (draftSnapshot.thumbnailMeta?.name) {
      setToast({ type: 'info', message: `تمت استعادة المسودة. أعد رفع الصورة المصغّرة: ${draftSnapshot.thumbnailMeta.name}` });
    }

    setShowRestoreDraftPrompt(false);
  }, [draftSnapshot]);

  const dismissDraft = useCallback(() => {
    setShowRestoreDraftPrompt(false);
    setDraftSnapshot(null);
  }, []);

  useEffect(() => {
    if (showRestoreDraftPrompt) return;

    const draftPayload = {
      step,
      completed: Array.from(completed),
      subject,
      unit,
      lessonId,
      lessonDesc,
      quizTitle,
      quizTitleManual,
      questions,
      thumbPreview,
      videoMeta: videoFile ? { name: videoFile.name, size: videoFile.size, type: videoFile.type } : null,
      thumbnailMeta: thumbnail ? { name: thumbnail.name, size: thumbnail.size, type: thumbnail.type } : null,
      updatedAt: Date.now(),
    };

    if (draftSaveTimerRef.current) {
      clearTimeout(draftSaveTimerRef.current);
    }

    draftSaveTimerRef.current = setTimeout(() => {
      localStorage.setItem(UPLOAD_DRAFT_KEY, JSON.stringify(draftPayload));
    }, 500);

    return () => {
      if (draftSaveTimerRef.current) {
        clearTimeout(draftSaveTimerRef.current);
      }
    };
  }, [
    step,
    completed,
    subject,
    unit,
    lessonId,
    lessonDesc,
    quizTitle,
    quizTitleManual,
    questions,
    thumbPreview,
    videoFile,
    thumbnail,
    showRestoreDraftPrompt,
  ]);

  // Fetch units when subject changes
  useEffect(() => {
    if (!subject) {
      setApiUnits([]);
      setApiSubtopics([]);
      return;
    }
    setLoadingOpts(true);
    api.get(`/subjects/${subject}/units`)
      .then((resUnits) => {
        const dUnits = resUnits.data?.data || resUnits.data || [];
        setApiUnits(Array.isArray(dUnits) ? dUnits : []);
      })
      .catch(err => {
        console.error('❌ Failed to fetch units', err);
      })
      .finally(() => setLoadingOpts(false));
  }, [subject]);

  // Fetch subtopics for quiz metadata based on selected lesson within selected subject
  useEffect(() => {
    if (!subject || !lessonId) {
      console.warn('⚠️ Cannot fetch subtopics: subject ID or lesson ID is missing.');
      setApiSubtopics([]);
      return;
    }

    api.get(`/subjects/${subject}/subtopics`)
      .then((res) => {
        console.log('🔥 RAW SUBTOPICS RESPONSE:', res.data);
        const responseData = res.data?.data || res.data || {};
        const units = responseData.units || [];
        const lessons = units.flatMap((unit) => unit.lessons || []);
        const currentLesson = lessons.find((lesson) => String(lesson.id) === String(lessonId));
        const lessonSubtopics = currentLesson?.subtopics || [];
        console.log('✅ LESSON SUBTOPICS:', lessonSubtopics);
        setApiSubtopics(lessonSubtopics);
      })
      .catch((err) => {
        console.error('❌ Failed to fetch subtopics', err);
        setApiSubtopics([]);
      });
  }, [subject, lessonId]);

  // Fetch lessons when unit changes
  useEffect(() => {
    if (!unit) {
      setApiLessons([]);
      setLessonId('');
      return;
    }
    setLoadingOpts(true);
    api.get(`/units/${unit}/lessons`)
      .then(res => {
        const dLessons = res.data?.data || res.data || [];
        setApiLessons(Array.isArray(dLessons) ? dLessons : []);
      })
      .catch(err => console.error('Failed to fetch lessons', err))
      .finally(() => setLoadingOpts(false));
  }, [unit]);

  const selectedLessonObj = apiLessons.find((l) => String(l.id) === String(lessonId));
  const selectedLessonTitle = selectedLessonObj ? (selectedLessonObj.title || selectedLessonObj.name || '') : '';

  useEffect(() => {
    if (quizTitleManual) return;
    setQuizTitle(selectedLessonTitle || '');
  }, [selectedLessonTitle, quizTitleManual]);

  const formatBytes = (bytes) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const validateAndSetVideo = (file) => {
    setVideoError('');
    if (!file) return;
    if (file.type !== 'video/mp4') {
      setVideoError('صيغة غير صحيحة. يُرجى رفع ملف MP4 فقط.');
      setVideoFile(null);
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      setVideoError('حجم الملف يتجاوز الحد المسموح به (500 ميجابايت).');
      setVideoFile(null);
      return;
    }
    // Warn if file may exceed typical PHP upload_max_filesize / post_max_size defaults
    if (file.size > 10 * 1024 * 1024) {
      console.warn(
        `[UploadWizard] Video file is ${(file.size / 1024 / 1024).toFixed(1)}MB. ` +
        'This may exceed the server PHP upload_max_filesize limit (default 8MB). ' +
        'Ask your backend admin to increase upload_max_filesize and post_max_size in php.ini.'
      );
    }
    setVideoFile(file);
  };

  const getVideoDurationSeconds = (file) => new Promise((resolve, reject) => {
    try {
      const video = document.createElement('video');
      const objectUrl = URL.createObjectURL(file);

      const cleanup = () => {
        URL.revokeObjectURL(objectUrl);
      };

      video.preload = 'metadata';
      video.src = objectUrl;
      video.onloadedmetadata = () => {
        const seconds = Number.isFinite(video.duration) ? Math.round(video.duration) : 0;
        cleanup();
        resolve(seconds);
      };
      video.onerror = () => {
        cleanup();
        reject(new Error('Failed to load video metadata.'));
      };
    } catch (err) {
      reject(err);
    }
  });

  const getStoredUser = () => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const handleQuizTitleChange = (value) => {
    setQuizTitle(value);
    const normalizedLessonTitle = (selectedLessonTitle || '').trim();
    const normalizedValue = value.trim();
    setQuizTitleManual(normalizedValue.length > 0 && normalizedValue !== normalizedLessonTitle);
  };

  // ── Validation ────────────────────────────────────────────────────────────

  const isStep1Valid = () => !!subject && !!unit && !!lessonId;
  const isStep3Valid = () => {
    if (questions.length === 0) return true; // Questions are entirely optional
    return questions.every(q => q.text.trim() && q.options.every(o => o.trim()) && q.correct !== null && q.subtopic);
  };

  // ── Navigation ────────────────────────────────────────────────────────────

  const goNext = () => {
    if (step === 1) {
      const errors = { subject: !subject, unit: !unit, lessonId: !lessonId };
      if (!isStep1Valid()) { setStep1Errors(errors); return; }
    }
    if (step === 2 && !videoFile) return;
    if (step === 3 && !isStep3Valid()) { setShowQuizVal(true); return; }
    setCompleted(prev => new Set([...prev, step]));
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToStep = (n) => {
    if (n < step || completed.has(n)) {
      setStep(n);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ── Question handlers (useCallback for stability) ─────────────────────────

  const addQuestion = () => {
    if (questions.length >= 40) return;
    setQuestions(p => [...p, mkQuestion()]);
  };

  const removeQuestion = (id) => setQuestions(p => p.filter(q => q.id !== id));

  const patchQuestion = useCallback((id, patch) => {
    setQuestions(p => p.map(q => (q.id === id ? { ...q, ...patch } : q)));
  }, []);

  const patchOption = useCallback((id, idx, val) => {
    setQuestions(p =>
      p.map(q => {
        if (q.id !== id) return q;
        const opts = [...q.options];
        opts[idx] = val;
        return { ...q, options: opts };
      })
    );
  }, []);

  // ── Publish ───────────────────────────────────────────────────────────────

  const handlePublish = async () => {
    // Soft size warning — does NOT block. Fix PHP limits on the server instead.
    if (videoFile && videoFile.size > 10 * 1024 * 1024) {
      const sizeMB = (videoFile.size / 1024 / 1024).toFixed(1);
      console.warn(
        `[UploadWizard] Video is ${sizeMB}MB — ensure PHP upload_max_filesize & post_max_size ` +
        'are large enough in php.ini (see console guide).'
      );
    }

    setPublishing(true);
    try {
      const actualLessonName = selectedLessonTitle || 'درس جديد';
      const actualLessonId = selectedLessonObj ? selectedLessonObj.id : lessonId;

      const selectedSubjectObj = apiSubjects.find(s => String(s.id) === String(subject));
      const actualSubjectName = selectedSubjectObj ? (selectedSubjectObj.name || selectedSubjectObj.title) : subject;

      // 1. معالجة الفيديو ورفعه (مرتبط بالدرس المختار)
      const formData = new FormData();
      formData.append('title', `${actualSubjectName} - ${actualLessonName}`);
      formData.append('lesson_id', actualLessonId);
      const storedUser = getStoredUser();
      const teacherId = storedUser?.teacher_id ?? storedUser?.id ?? null;
      if (teacherId != null && String(teacherId).length > 0) {
        formData.append('teacher_id', teacherId);
      }
      const durationSeconds = await getVideoDurationSeconds(videoFile);
      formData.append('duration', durationSeconds);

      const videoFileState = videoFile;
      console.log('FINAL VIDEO STATE:', videoFileState);
      if (videoFileState) {
        formData.append('file', videoFileState);
      }

      if (thumbnail && thumbnail instanceof File) {
        formData.append('thumbnail', thumbnail);
      }

      // Let the browser set Content-Type + boundary automatically (DO NOT set it manually)
      const videoRes = await api.post('/videos', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      const newVideoId = videoRes.data.id;

      // 3. رفع الكويز والأسئلة (اختياري فقط إذا توفرت أسئلة كاملة)
      if (questions.length > 0 && questions[0].text.trim() !== '') {
        const quizQuestions = questions.map((q) => ({
          question: q.text.trim(),
          option: q.options,
          correct_answer: q.options[q.correct], // Laravel backend expects the exact string
          subtopic_id: parseInt(q.subtopic, 10),
          difficulty: q.difficulty || null,
          cognitive_skill: q.skill || null,
        }));

        const quizPayload = {
          title: quizTitle.trim() || actualLessonName,
          video_id: newVideoId,
          questions: quizQuestions,
        };

        // رفع الاختبار
        await api.post('/quizzes', quizPayload);
      }

      // 5. نجاح ──────────────────────────────────────────────────────────
      localStorage.removeItem(UPLOAD_DRAFT_KEY);
      setToast({ type: 'success', message: t('publish_success') });
      setTimeout(() => navigate('/teacher-dashboard'), 2800);
    } catch (err) {
      const resp = err?.response;
      if (resp?.status === 422) {
        const validation = resp?.data?.errors || resp?.data || {};
        // If file-specific validation exists, log the first message for clarity
        const fileErr = validation?.file;
        if (fileErr && Array.isArray(fileErr) && fileErr.length > 0) {
          console.error('Publish file validation error:', fileErr[0]);
        }
        console.error('Publish validation errors:', validation);
      }
      console.error('Publish error:', err);
      setToast({ type: 'error', message: t('publish_error') });
      setPublishing(false);
    }
  };

  const handleSaveDraft = () => {
    setToast({ type: 'info', message: t('draft_saved') });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Derived (Step 4) ──────────────────────────────────────────────────────

  const uniqueSubtopics = [...new Set(questions.map(q => q.subtopic).filter(Boolean))].map(subId => {
    const subtopic = apiSubtopics.find(st => String(st.id) === String(subId));
    return subtopic?.title || subId;
  });

  const checklist = [
    { label: 'المادة الدراسية',                                                        ok: !!subject },
    { label: 'الوحدة',                                                                 ok: !!unit },
    { label: 'الدرس المختار',                                                           ok: !!lessonId },
    { label: 'ملف الفيديو (MP4)',                                                      ok: !!videoFile },
    { label: `عدد الأسئلة (اختياري - الحالي: ${questions.length})`,                    ok: true },
    { label: 'جميع الأسئلة مكتملة المعالم (إن وجدت)', ok: questions.length === 0 || questions.every(q => q.text.trim() && q.options.every(o => o.trim()) && q.correct !== null && q.subtopic) },
  ];

  const allOk = checklist.every(c => c.ok);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{..._t,background:T.bg,minHeight:"100vh",fontFamily:"'Cairo',sans-serif"}} dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* ═══════════ HEADER ═══════════ */}
      <header style={{background:T.headerBg,backdropFilter:"blur(12px)",borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,zIndex:20}}>
        <div style={{maxWidth:"896px",margin:"0 auto",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <div style={_iw(T.iconBgA,T.iconBorderA,"40px","10px")}>
              <Brain style={{width:"20px",height:"20px",color:T.iconA}} />
            </div>
            <div>
              <h1 style={{fontSize:"1.125rem",fontWeight:800,color:T.textPrimary}}>{t('upload_wizard_title')}</h1>
              <p style={{fontSize:"0.75rem",color:T.textMuted}}>{t('upload_wizard_subtitle')} {step} {t('upload_wizard_of')} {STEPS.length}</p>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
            <LangToggle />
            <button
              onClick={() => navigate('/teacher-dashboard')}
              style={{..._t,background:"transparent",border:"none",display:"flex",alignItems:"center",gap:"6px",fontSize:"0.875rem",fontWeight:600,color:T.textMuted,cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.color=T.textPrimary}
              onMouseLeave={e=>e.currentTarget.style.color=T.textMuted}
            >
              <ArrowRight style={{width:"16px",height:"16px",transform:lang==='en'?'rotate(180deg)':'none'}} />
              {t('back_to_teacher_dashboard')}
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════ STEP INDICATOR ═══════════ */}
      <div style={{background:T.bgPanel,borderBottom:`1px solid ${T.border}`}}>
        <div style={{maxWidth:"896px",margin:"0 auto",padding:"20px 24px"}}>
          <div style={{display:"flex",alignItems:"center"}}>
            {STEPS.map((s, idx) => {
              const done    = completed.has(s.id);
              const current = step === s.id;
              const clickable = done || s.id < step;
              const Icon  = s.icon;
              return (
                <div key={s.id} style={{display:"flex",alignItems:"center",flex:1,minWidth:0}}>
                  <button
                    onClick={() => goToStep(s.id)}
                    disabled={!clickable}
                    style={{..._t,display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",flexShrink:0,background:"transparent",border:"none",cursor:clickable?"pointer":"not-allowed",opacity:clickable?1:0.7}}
                    onMouseEnter={e=>{if(clickable)e.currentTarget.style.opacity=0.8}}
                    onMouseLeave={e=>{if(clickable)e.currentTarget.style.opacity=1}}
                  >
                    <div style={{
                      width:"8px",height:"8px",borderRadius:"50%",transition:"all 0.3s ease",
                      background:done?T.green:current?T.accent:T.borderHover,
                      boxShadow:current?`0 0 0 4px ${T.accentDim}`:"none"
                    }} />
                    <span style={{
                      fontSize:"0.75rem",fontWeight:800,whiteSpace:"nowrap",
                      color:current?T.accent:done?T.green:T.textMuted
                    }}>
                      {t(s.labelKey)}
                    </span>
                  </button>

                  {idx < STEPS.length - 1 && (
                    <div style={{
                      flex:1,height:"1px",margin:"0 12px",transition:"all 0.5s ease",
                      background:done?T.green:T.borderHover
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <main style={{maxWidth:"896px",margin:"0 auto",padding:"32px 24px"}}>

        {showRestoreDraftPrompt && (
          <div style={{...themeGlass({ padding: '16px 18px', borderRadius: '14px' }), marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'}}>
            <p style={{margin:0,color:T.textPrimary,fontSize:'0.88rem',fontWeight:700}}>
              تم العثور على مسودة غير مكتملة. هل تريد استعادتها؟
            </p>
            <div style={{display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
              <button
                type="button"
                onClick={dismissDraft}
                style={{..._t,background:'transparent',border:`1px solid ${T.border}`,color:T.textMuted,padding:'8px 12px',borderRadius:'10px',fontSize:'0.8rem',fontWeight:700,cursor:'pointer'}}
              >
                تجاهل
              </button>
              <button
                type="button"
                onClick={restoreDraft}
                style={{..._t,background:T.accent,border:'none',color:'#fff',padding:'8px 12px',borderRadius:'10px',fontSize:'0.8rem',fontWeight:800,cursor:'pointer'}}
              >
                استعادة
              </button>
            </div>
          </div>
        )}

        {/* ╔══════════════ STEP 1 — Lesson Metadata ══════════════╗ */}
        <StepAccordion stepNum={1} currentStep={step} title={t('lesson_data_title')} subtitle={t('lesson_data_subtitle')} summary={lessonId ? (apiLessons.find(l => String(l.id) === String(lessonId))?.title || 'تم اختيار الدرس') : 'لم يكتمل'} isCompleted={completed.has(1)} onEdit={() => goToStep(1)} T={T} lang={lang}>
          <div style={{display:"flex",flexDirection:"column",gap:"24px"}}>
            <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>

              {/* Subject */}
              <div>
                <label style={{display:"block",fontSize:"0.875rem",fontWeight:800,color:T.textPrimary,marginBottom:"8px"}}>
                  {t('select_subject')} <span style={{color:T.red}}>*</span>
                </label>
                <select
                  value={subject}
                  onChange={e => {
                    setSubject(e.target.value);
                    setUnit('');
                    setStep1Errors(p => ({ ...p, subject: false }));
                  }}
                  style={{..._input(T),borderColor:step1Errors.subject?T.redBorder:T.border,appearance:"none",cursor:"pointer"}}
                  onFocus={e=>{e.target.style.borderColor=T.accent}}
                  onBlur={e=>{e.target.style.borderColor=step1Errors.subject?T.redBorder:T.border}}
                >
                  {loadingOpts ? (
                    <option value="" style={{background:T.bgPanel,color:T.textPrimary}}>جاري التحميل...</option>
                  ) : (
                    <>
                      <option value="" style={{background:T.bgPanel,color:T.textPrimary}}>{t('select_subject')}</option>
                      {apiSubjects.map(s => (
                        <option key={s.id} value={s.id} style={{background:T.bgPanel,color:T.textPrimary}}>{s.name || s.title}</option>
                      ))}
                    </>
                  )}
                </select>
                {step1Errors.subject && (
                  <p style={{color:T.red,fontSize:"0.75rem",marginTop:"6px",display:"flex",alignItems:"center",gap:"4px"}}>
                    <AlertCircle style={{width:"12px",height:"12px"}} /> يُرجى اختيار المادة الدراسية
                  </p>
                )}
              </div>

              {/* Unit */}
              <div>
                <label style={{display:"block",fontSize:"0.875rem",fontWeight:800,color:T.textPrimary,marginBottom:"8px"}}>
                  {t('select_unit')} <span style={{color:T.red}}>*</span>
                </label>
                <select
                  value={unit}
                  onChange={e => { setUnit(e.target.value); setStep1Errors(p => ({ ...p, unit: false })); }}
                  disabled={!subject}
                  style={{..._input(T),borderColor:step1Errors.unit?T.redBorder:T.border,opacity:!subject?0.5:1,appearance:"none",cursor:!subject?"not-allowed":"pointer"}}
                  onFocus={e=>{e.target.style.borderColor=T.accent}}
                  onBlur={e=>{e.target.style.borderColor=step1Errors.unit?T.redBorder:T.border}}
                >
                  {loadingOpts && subject ? (
                    <option value="" style={{background:T.bgPanel,color:T.textPrimary}}>جاري تحميل الوحدات...</option>
                  ) : (
                    <>
                      <option value="" style={{background:T.bgPanel,color:T.textPrimary}}>{subject ? t('select_unit') : (lang === 'ar' ? 'اختر المادة أولاً' : 'Select subject first')}</option>
                      {apiUnits.map(u => (
                        <option key={u.id} value={u.id} style={{background:T.bgPanel,color:T.textPrimary}}>{u.title || u.name}</option>
                      ))}
                    </>
                  )}
                </select>
                {step1Errors.unit && (
                  <p style={{color:T.red,fontSize:"0.75rem",marginTop:"6px",display:"flex",alignItems:"center",gap:"4px"}}>
                    <AlertCircle style={{width:"12px",height:"12px"}} /> يُرجى اختيار الوحدة
                  </p>
                )}
              </div>

              {/* Lesson Dropdown */}
              <div>
                <label style={{display:"block",fontSize:"0.875rem",fontWeight:800,color:T.textPrimary,marginBottom:"8px"}}>
                  اختر الدرس <span style={{color:T.red}}>*</span>
                </label>
                <select
                  value={lessonId}
                  onChange={e => { setLessonId(e.target.value); setStep1Errors(p => ({ ...p, lessonId: false })); }}
                  disabled={!unit}
                  style={{..._input(T),borderColor:step1Errors.lessonId?T.redBorder:T.border,opacity:!unit?0.5:1,appearance:"none",cursor:!unit?"not-allowed":"pointer"}}
                  onFocus={e=>{e.target.style.borderColor=T.accent}}
                  onBlur={e=>{e.target.style.borderColor=step1Errors.lessonId?T.redBorder:T.border}}
                >
                  {loadingOpts && unit ? (
                    <option value="" style={{background:T.bgPanel,color:T.textPrimary}}>جاري تحميل الدروس...</option>
                  ) : (
                    <>
                      <option value="" style={{background:T.bgPanel,color:T.textPrimary}}>{unit ? 'اختر الدرس' : (lang === 'ar' ? 'اختر الوحدة أولاً' : 'Select unit first')}</option>
                      {apiLessons.map(l => (
                        <option key={l.id} value={l.id} style={{background:T.bgPanel,color:T.textPrimary}}>{l.title || l.name}</option>
                      ))}
                    </>
                  )}
                </select>
                {step1Errors.lessonId && (
                  <p style={{color:T.red,fontSize:"0.75rem",marginTop:"6px",display:"flex",alignItems:"center",gap:"4px"}}>
                    <AlertCircle style={{width:"12px",height:"12px"}} /> يُرجى اختيار الدرس
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label style={{display:"block",fontSize:"0.875rem",fontWeight:800,color:T.textPrimary,marginBottom:"8px"}}>
                  {t('lesson_desc')}{' '}
                  <span style={{color:T.textMuted,fontWeight:"normal"}}>{lang === 'ar' ? '(اختياري)' : '(optional)'}</span>
                </label>
                <textarea
                  value={lessonDesc}
                  onChange={e => setLessonDesc(e.target.value)}
                  rows={3}
                  placeholder="نبذة مختصرة عن محتوى الدرس..."
                  style={_input(T)}
                  onFocus={e=>{e.target.style.borderColor=T.accent}}
                  onBlur={e=>{e.target.style.borderColor=T.border}}
                />
              </div>
            </div>
          </div>
        </StepAccordion>

        {/* ╔══════════════ STEP 2 — Video Upload ══════════════╗ */}
        <StepAccordion stepNum={2} currentStep={step} title={t('upload_video_title')} subtitle={t('upload_video_subtitle')} summary={videoFile ? videoFile.name : 'لا يوجد فيديو'} isCompleted={completed.has(2)} onEdit={() => goToStep(2)} T={T} lang={lang}>
          <div style={{display:"flex",flexDirection:"column",gap:"24px"}}>

            {/* Drag & Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragEnter={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); validateAndSetVideo(e.dataTransfer.files[0]); }}
              onClick={() => !videoFile && videoInputRef.current?.click()}
              style={{
                ..._t,
                border:`1px dashed ${isDragging?T.accent:videoFile?T.green:T.borderHover}`,
                borderRadius:"16px",
                padding:"40px",
                textAlign:"center",
                cursor:videoFile?"default":"pointer",
                background:isDragging?T.accentDim:videoFile?T.greenDim:T.bgPanel,
                userSelect:"none"
              }}
            >
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4"
                style={{display:"none"}}
                onChange={e => validateAndSetVideo(e.target.files[0])}
              />

              {videoFile ? (
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"12px"}}>
                  <div style={_iw(T.greenDim,T.greenBorder,"64px","16px")}>
                    <FileVideo style={{width:"32px",height:"32px",color:T.green}} />
                  </div>
                  <div>
                    <p className="truncate" title={videoFile.name} style={{fontWeight:800,color:T.textPrimary,fontSize:"1.125rem"}}>{videoFile.name}</p>
                    <p style={{color:T.textMuted,fontSize:"0.875rem",marginTop:"4px"}}>{formatBytes(videoFile.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setVideoFile(null); setVideoError(''); }}
                    style={{..._t,display:"flex",alignItems:"center",gap:"6px",fontSize:"0.875rem",fontWeight:700,color:T.red,background:"transparent",border:"none",cursor:"pointer",marginTop:"8px"}}
                    onMouseEnter={e=>{e.currentTarget.style.color=T.redBorder}}
                    onMouseLeave={e=>{e.currentTarget.style.color=T.red}}
                  >
                    <X style={{width:"16px",height:"16px"}} /> إزالة الملف
                  </button>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"12px"}}>
                  <div style={_iw(isDragging?T.accentDim:T.bgCard,isDragging?T.borderAccent:T.border,"64px","16px")}>
                    <Upload style={{width:"32px",height:"32px",color:isDragging?T.accent:T.textMuted}} />
                  </div>
                  <div>
                    <p style={{color:T.textPrimary,fontWeight:800,fontSize:"1.125rem"}}>
                      {isDragging ? 'أفلت الملف هنا...' : 'اسحب ملف الفيديو هنا'}
                    </p>
                    <p style={{color:T.textMuted,fontSize:"0.875rem",marginTop:"4px"}}>أو انقر للاختيار من جهازك</p>
                  </div>
                  <span style={{fontSize:"0.75rem",background:T.bgCard,color:T.textMuted,padding:"4px 12px",borderRadius:"999px",fontWeight:600}}>
                    MP4 فقط • حد أقصى 500 MB
                  </span>
                </div>
              )}
            </div>

            {/* Video error */}
            {videoError && (
              <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"12px",background:T.redDim,border:`1px solid ${T.redBorder}`,borderRadius:"12px",color:T.red,fontSize:"0.875rem",fontWeight:600}}>
                <AlertCircle style={{width:"16px",height:"16px",flexShrink:0}} />
                {videoError}
              </div>
            )}

            {/* Thumbnail */}
            <div style={{..._c(T),padding:"24px"}}>
              <label style={{display:"block",fontSize:"0.875rem",fontWeight:800,color:T.textPrimary,marginBottom:"12px"}}>
                صورة مصغرة (Thumbnail){' '}
                <span style={{color:T.textMuted,fontWeight:"normal"}}>(اختياري)</span>
              </label>
              <div
                onClick={() => thumbInputRef.current?.click()}
                style={{..._t,border:`1px dashed ${T.borderHover}`,borderRadius:"12px",padding:"20px",display:"flex",alignItems:"center",gap:"16px",cursor:"pointer"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.background=T.accentDim;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.borderHover;e.currentTarget.style.background="transparent";}}
              >
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  style={{display:"none"}}
                  onChange={(e) => {
                    const f = e.target.files[0];
                    if (!f) return;
                    setThumbnail(f);
                    const reader = new FileReader();
                    reader.onload = (ev) => setThumbPreview(ev.target.result);
                    reader.readAsDataURL(f);
                  }}
                />
                {thumbPreview ? (
                  <>
                    <img src={thumbPreview} alt="thumbnail preview" style={{width:"96px",height:"64px",objectFit:"cover",borderRadius:"8px",flexShrink:0,border:`1px solid ${T.border}`}} />
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontWeight:800,color:T.textPrimary,fontSize:"0.875rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{thumbnail?.name}</p>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setThumbnail(null); setThumbPreview(''); }}
                        style={{..._t,color:T.red,fontSize:"0.75rem",marginTop:"4px",display:"flex",alignItems:"center",gap:"4px",background:"transparent",border:"none",cursor:"pointer"}}
                        onMouseEnter={e=>e.currentTarget.style.color=T.redBorder}
                        onMouseLeave={e=>e.currentTarget.style.color=T.red}
                      >
                        <X style={{width:"12px",height:"12px"}} /> إزالة الصورة
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{background:T.bgCard,padding:"12px",borderRadius:"8px",flexShrink:0}}>
                      <ImagePlus style={{width:"24px",height:"24px",color:T.textMuted}} />
                    </div>
                    <span style={{color:T.textMuted,fontSize:"0.875rem"}}>
                      انقر لإضافة صورة مصغرة (PNG, JPG)
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </StepAccordion>

        {/* ╔══════════════ STEP 3 — MCQ Quiz Builder ══════════════╗ */}
        <StepAccordion stepNum={3} currentStep={step} title={t('build_quiz_title')} subtitle={t('build_quiz_subtitle')} summary={`تم إضافة ${questions.length} أسئلة`} isCompleted={completed.has(3)} onEdit={() => goToStep(3)} T={T} lang={lang}>
          <div style={{display:"flex",flexDirection:"column",gap:"24px"}}>
            {/* Header */}
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"16px"}}>
              <div style={{ display: 'none' }}>
                {/* Hidden header */}
              </div>
              {/* Count badge */}
              <div style={{
                flexShrink:0,display:"flex",alignItems:"center",gap:"8px",padding:"8px 16px",borderRadius:"999px",fontSize:"0.875rem",fontWeight:800,border:`1px solid`,
                ...(questions.length >= 15
                  ? {background:T.greenDim,borderColor:T.greenBorder,color:T.green}
                  : {background:T.orangeDim,borderColor:T.orangeBorder,color:T.orange})
              }}>
                <ClipboardList style={{width:"16px",height:"16px"}} />
                {questions.length} / 40
              </div>
            </div>

            {/* Quiz title binding */}
            <div style={{..._c(T),padding:"20px"}}>
              <label style={{display:"flex",alignItems:"center",gap:"6px",fontSize:"0.875rem",fontWeight:800,color:T.textPrimary,marginBottom:"8px",position:'relative'}}>
                <span>عنوان الاختبار</span>
                <span
                  style={{width:'18px',height:'18px',borderRadius:'999px',border:`1px solid ${T.border}`,display:'inline-flex',alignItems:'center',justifyContent:'center',color:T.textDim,background:T.bgCard,cursor:'help'}}
                  title="عنوان واضح يساعد الطالب على تمييز الاختبار بسرعة داخل النتائج والتقارير."
                  aria-hidden="true"
                >
                  <CircleHelp style={{ width: '12px', height: '12px' }} />
                </span>
              </label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => handleQuizTitleChange(e.target.value)}
                placeholder={selectedLessonTitle || 'اكتب عنوان الاختبار'}
                style={_input(T)}
                onFocus={e=>{e.target.style.borderColor=T.accent}}
                onBlur={e=>{e.target.style.borderColor=T.border}}
              />
              <p style={{marginTop:"6px",fontSize:"0.75rem",color:T.textMuted}}>
                {!quizTitleManual
                  ? 'يتم مزامنة العنوان تلقائياً مع اسم الدرس.'
                  : 'تم تخصيص عنوان الاختبار يدوياً.'}
              </p>
            </div>

            {/* Validation banners */}
            {showQuizVal && questions.length > 0 && !isStep3Valid() && (
              <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"12px",background:T.redDim,border:`1px solid ${T.redBorder}`,borderRadius:"12px",color:T.red,fontSize:"0.875rem",fontWeight:600}}>
                <AlertCircle style={{width:"16px",height:"16px",flexShrink:0}} />
                بعض الأسئلة غير مكتملة — تأكد من نص السؤال، الخيارات، الإجابة، واختيار الموضوع الفرعي لكل سؤال أو قم بحذف الأسئلة لإكمال الرفع بدون أسئلة.
              </div>
            )}

            {/* Questions */}
            <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
              {questions.map((q, qIdx) => (
                <QuestionCard
                  key={q.id}
                  q={q}
                  qIdx={qIdx}
                  onPatch={patchQuestion}
                  onPatchOption={patchOption}
                  onRemove={() => removeQuestion(q.id)}
                  canRemove={true}
                  showValidation={showQuizVal}
                  apiSubtopics={apiSubtopics}
                  T={T}
                />
              ))}
            </div>

            {/* Add question button */}
            {questions.length < 40 ? (
              <button
                type="button"
                onClick={addQuestion}
                style={{..._t,width:"100%",border:`1px dashed ${T.accent}`,color:T.accent,borderRadius:"16px",padding:"16px",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",fontWeight:800,background:"transparent",cursor:"pointer"}}
                onMouseEnter={e=>{e.currentTarget.style.background=T.accentDim}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent"}}
              >
                <Plus style={{width:"20px",height:"20px"}} />
                إضافة سؤال جديد
              </button>
            ) : (
              <p style={{..._c(T),textAlign:"center",color:T.textMuted,fontSize:"0.875rem",padding:"8px"}}>
                وصلت للحد الأقصى (40 سؤال)
              </p>
            )}
          </div>
        </StepAccordion>

        {/* ╔══════════════ STEP 4 — Review & Publish ══════════════╗ */}
        <StepAccordion stepNum={4} currentStep={step} title={t('review_publish_title')} subtitle={t('review_publish_subtitle')} summary={'مراجعة نهائية'} isCompleted={completed.has(4)} onEdit={() => goToStep(4)} T={T} lang={lang}>
          <div style={{display:"flex",flexDirection:"column",gap:"24px"}}>
            {/* Summary Card */}
            <div style={{..._c(T),padding:"24px", border: "none", boxShadow: "none"}}>
              <h3 style={{fontWeight:800,color:T.textPrimary,fontSize:"1.125rem",marginBottom:"16px",paddingBottom:"12px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:"8px"}}>
                <BookOpen style={{width:"20px",height:"20px",color:T.accent}} />
                {t('lesson_summary')}
              </h3>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:"16px 32px",fontSize:"0.875rem"}}>
                <div>
                  <p style={{color:T.textMuted,fontSize:"0.75rem",marginBottom:"2px"}}>المادة الدراسية</p>
                  <p className="truncate" title={apiSubjects.find(s => String(s.id) === String(subject))?.name || apiSubjects.find(s => String(s.id) === String(subject))?.title || '—'} style={{fontWeight:800,color:T.textPrimary}}>
                    {apiSubjects.find(s => String(s.id) === String(subject))?.name || apiSubjects.find(s => String(s.id) === String(subject))?.title || '—'}
                  </p>
                </div>
                <div>
                  <p style={{color:T.textMuted,fontSize:"0.75rem",marginBottom:"2px"}}>الوحدة</p>
                  <p className="truncate" title={unit || '—'} style={{fontWeight:800,color:T.textPrimary}}>{unit || '—'}</p>
                </div>
                <div>
                  <p style={{color:T.textMuted,fontSize:"0.75rem",marginBottom:"2px"}}>اسم الدرس</p>
                  <p className="truncate" title={apiLessons.find(l => String(l.id) === String(lessonId))?.title || apiLessons.find(l => String(l.id) === String(lessonId))?.name || '—'} style={{fontWeight:800,color:T.textPrimary}}>
                    {apiLessons.find(l => String(l.id) === String(lessonId))?.title || apiLessons.find(l => String(l.id) === String(lessonId))?.name || '—'}
                  </p>
                </div>
                <div>
                  <p style={{color:T.textMuted,fontSize:"0.75rem",marginBottom:"2px"}}>ملف الفيديو</p>
                  <p className="truncate" title={videoFile?.name || '—'} style={{fontWeight:800,color:T.textPrimary}}>{videoFile?.name || '—'}</p>
                </div>
                <div>
                  <p style={{color:T.textMuted,fontSize:"0.75rem",marginBottom:"2px"}}>حجم الفيديو</p>
                  <p style={{fontWeight:800,color:T.textPrimary}}>{videoFile ? formatBytes(videoFile.size) : '—'}</p>
                </div>
                <div>
                  <p style={{color:T.textMuted,fontSize:"0.75rem",marginBottom:"2px"}}>عدد الأسئلة</p>
                  <p style={{fontWeight:800,color:T.textPrimary}}>{questions.length} سؤال</p>
                </div>
                {lessonDesc && (
                  <div style={{gridColumn:"span 2"}}>
                    <p style={{color:T.textMuted,fontSize:"0.75rem",marginBottom:"2px"}}>وصف الدرس</p>
                    <p style={{fontWeight:600,color:T.textPrimary,fontSize:"0.875rem",lineHeight:1.6}}>{lessonDesc}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Subtopic tags */}
            {uniqueSubtopics.length > 0 && (
              <div style={{..._c(T),padding:"24px"}}>
                <h3 style={{fontWeight:800,color:T.textPrimary,fontSize:"1rem",marginBottom:"12px",display:"flex",alignItems:"center",gap:"8px"}}>
                  <span style={{width:"8px",height:"8px",borderRadius:"50%",background:T.accent,display:"inline-block"}} />
                  الموضوعات الفرعية المُوسَمة ({uniqueSubtopics.length})
                </h3>
                <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
                  {uniqueSubtopics.map(st => (
                    <span
                      key={st}
                      style={{background:T.accentDim,color:T.accent,padding:"4px 12px",borderRadius:"999px",fontSize:"0.875rem",fontWeight:800,border:`1px solid ${T.borderAccent}`}}
                    >
                      {st}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Checklist */}
            <div style={{..._c(T),padding:"24px"}}>
              <h3 style={{fontWeight:800,color:T.textPrimary,fontSize:"1rem",marginBottom:"16px",display:"flex",alignItems:"center",gap:"8px"}}>
                <CheckCircle2 style={{width:"20px",height:"20px",color:T.accent}} />
                {t('publish_checklist')}
              </h3>
              <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                {checklist.map(item => (
                  <div key={item.label} style={{display:"flex",alignItems:"center",gap:"12px"}}>
                    <div style={{flexShrink:0,width:"24px",height:"24px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:item.ok?T.greenDim:T.redDim}}>
                      {item.ok
                        ? <Check style={{width:"14px",height:"14px",color:T.green}} />
                        : <X    style={{width:"14px",height:"14px",color:T.red}} />
                      }
                    </div>
                    <span style={{fontSize:"0.875rem",fontWeight:item.ok?600:800,color:item.ok?T.textPrimary:T.red}}>
                      {item.ok ? '✅' : '❌'} {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:"16px"}}>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={publishing}
                style={{..._t,background:T.bgPanel,border:`2px solid ${T.borderHover}`,color:T.textPrimary,padding:"16px",borderRadius:"16px",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",cursor:publishing?"not-allowed":"pointer",opacity:publishing?0.6:1}}
                onMouseEnter={e=>{if(!publishing)e.currentTarget.style.background=T.bgCard}}
                onMouseLeave={e=>{if(!publishing)e.currentTarget.style.background=T.bgPanel}}
              >
                {t('save_draft')}
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={!allOk || publishing}
                style={{..._t,background:T.accent,border:"none",color:"#FFF",padding:"16px",borderRadius:"16px",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",cursor:(!allOk||publishing)?"not-allowed":"pointer",opacity:(!allOk||publishing)?0.5:1,boxShadow:T.shadowCard}}
                onMouseEnter={e=>{if(allOk&&!publishing)e.currentTarget.style.background=T.accentHover}}
                onMouseLeave={e=>{if(allOk&&!publishing)e.currentTarget.style.background=T.accent}}
              >
                {publishing ? (
                  <>
                    <Loader2 style={{width:"20px",height:"20px"}} className="animate-spin" />
                    {t('publishing')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 style={{width:"20px",height:"20px"}} />
                    {t('publish_lesson')}
                  </>
                )}
              </button>
            </div>

            {!allOk && (
              <p style={{textAlign:"center",color:T.orange,fontSize:"0.875rem",fontWeight:600}}>
                {t('complete_required')}
              </p>
            )}
          </div>
        </StepAccordion>

        {/* ═══════════ NAVIGATION BUTTONS ═══════════ */}
        <div style={{display:"flex",alignItems:"center",justifyContent:step>1?"space-between":"flex-end",marginTop:"32px",paddingTop:"24px",borderTop:`1px solid ${T.border}`}}>
          {step > 1 && (
            <button
              type="button"
              onClick={goBack}
              disabled={publishing}
              style={{..._t,display:"flex",alignItems:"center",gap:"8px",border:`1px solid ${T.borderHover}`,background:T.bgPanel,color:T.textPrimary,padding:"12px 24px",borderRadius:"12px",fontWeight:800,cursor:publishing?"not-allowed":"pointer",opacity:publishing?0.5:1}}
              onMouseEnter={e=>{if(!publishing)e.currentTarget.style.background=T.bgCard}}
              onMouseLeave={e=>{if(!publishing)e.currentTarget.style.background=T.bgPanel}}
            >
              <ChevronRight style={{width:"20px",height:"20px",transform:lang==='en'?'rotate(180deg)':'none'}} />
              {t('back')}
            </button>
          )}
          {step < 4 && (
            <button
              type="button"
              onClick={goNext}
              style={{..._t,display:"flex",alignItems:"center",gap:"8px",background:T.accent,color:"#FFF",padding:"12px 32px",borderRadius:"12px",fontWeight:800,border:"none",cursor:"pointer",boxShadow:T.shadowCard}}
              onMouseEnter={e=>{e.currentTarget.style.background=T.accentHover}}
              onMouseLeave={e=>{e.currentTarget.style.background=T.accent}}
            >
              {lang === 'ar' ? 'التالي' : 'Next'}
              <ChevronLeft style={{width:"20px",height:"20px",transform:lang==='en'?'rotate(180deg)':'none'}} />
            </button>
          )}
        </div>
      </main>

      {/* ═══════════ TOAST ═══════════ */}
      {toast && (
        <div style={{position:"fixed",bottom:"24px",left:"50%",transform:"translateX(-50%)",zIndex:50,display:"flex",alignItems:"center",gap:"12px",padding:"16px 24px",borderRadius:"16px",boxShadow:"0 10px 25px -5px rgba(0, 0, 0, 0.3)",fontSize:"0.875rem",fontWeight:800,maxWidth:"400px",width:"100%",color:"#FFF",background:toast.type==='success'?T.green:toast.type==='error'?T.red:T.accent}}>
          {toast.type === 'success'
            ? <CheckCircle2 style={{width:"20px",height:"20px",flexShrink:0}} />
            : <AlertCircle  style={{width:"20px",height:"20px",flexShrink:0}} />
          }
          <span style={{flex:1}}>{toast.message}</span>
          {toast.type !== 'success' && (
            <button onClick={() => setToast(null)} style={{background:"transparent",border:"none",color:"#FFF",cursor:"pointer",opacity:0.7}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.7}>
              <X style={{width:"16px",height:"16px"}} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadWizard;
