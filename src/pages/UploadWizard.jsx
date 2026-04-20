import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext';
import LangToggle from '../components/LangToggle';
import {
  Check, ChevronRight, ChevronLeft, Upload, X, Plus, Trash2,
  BookOpen, Video, ClipboardList, Eye, Brain, Loader2,
  CheckCircle2, FileVideo, ImagePlus, AlertCircle, ArrowRight,
} from 'lucide-react';

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

const QuestionCard = ({ q, qIdx, apiSubtopics, onPatch, onPatchOption, onRemove, canRemove, showValidation }) => {
  const incomplete =
    showValidation &&
    (!q.text.trim() || q.options.some(o => !o.trim()) || q.correct === null || !q.subtopic);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border p-5 transition-colors ${
      incomplete ? 'border-red-300 dark:border-red-700' : 'border-gray-100 dark:border-gray-700'
    }`}>
      {/* Card header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="bg-[#103B66] dark:bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            سؤال {qIdx + 1}
          </span>
          {incomplete && (
            <span className="text-red-500 dark:text-red-400 text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> غير مكتمل
            </span>
          )}
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition"
            title="حذف السؤال"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Question text */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
            نص السؤال <span className="text-red-500">*</span>
          </label>
          <textarea
            value={q.text}
            onChange={e => onPatch(q.id, { text: e.target.value })}
            rows={2}
            placeholder="اكتب نص السؤال هنا..."
            className={`w-full bg-gray-50 dark:bg-gray-700 border rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#103B66] dark:focus:ring-blue-500 resize-none transition ${
              showValidation && !q.text.trim() ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
            }`}
          />
        </div>

        {/* Options */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
            الخيارات — انقر على الزر الدائري لتحديد الإجابة الصحيحة <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct_${q.id}`}
                  checked={q.correct === oi}
                  onChange={() => onPatch(q.id, { correct: oi })}
                  className="accent-[#103B66] dark:accent-blue-500 flex-shrink-0 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-4 flex-shrink-0">
                  {OPTION_LETTERS[oi]}
                </span>
                <input
                  type="text"
                  value={opt}
                  onChange={e => onPatchOption(q.id, oi, e.target.value)}
                  placeholder={`الخيار ${OPTION_LETTERS[oi]}`}
                  className={`flex-1 bg-gray-50 dark:bg-gray-700 border rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#103B66] dark:focus:ring-blue-500 transition ${
                    q.correct === oi
                      ? 'border-green-400 dark:border-green-600 bg-green-50/50 dark:bg-green-900/10'
                      : showValidation && !opt.trim()
                        ? 'border-red-400'
                        : 'border-gray-200 dark:border-gray-600'
                  }`}
                />
              </div>
            ))}
          </div>
          {showValidation && q.correct === null && (
            <p className="text-red-500 text-xs mt-1">يُرجى تحديد الإجابة الصحيحة</p>
          )}
        </div>

        {/* Metadata tags */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">الموضوع الفرعي <span className="text-red-500">*</span></label>
            <select
              value={q.subtopic}
              onChange={e => onPatch(q.id, { subtopic: e.target.value })}
              className={`w-full bg-gray-50 dark:bg-gray-700 border rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#103B66] dark:focus:ring-blue-500 transition ${
                showValidation && !q.subtopic ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
              }`}
            >
              <option value="">اختر الموضوع الفرعي</option>
              {apiSubtopics.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {showValidation && !q.subtopic && (
              <p className="text-red-500 text-[10px] mt-1">مطلوب</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">المهارة المعرفية</label>
            <select
              value={q.skill}
              onChange={e => onPatch(q.id, { skill: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#103B66] dark:focus:ring-blue-500"
            >
              <option value="">اختر المهارة</option>
              {COGNITIVE_SKILLS.map(s => (
                <option key={s.value} value={s.value}>{s.label} ({s.value})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">الصعوبة</label>
            <select
              value={q.difficulty}
              onChange={e => onPatch(q.id, { difficulty: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#103B66] dark:focus:ring-blue-500"
            >
              <option value="">اختر</option>
              {DIFFICULTIES.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Distractor pattern */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
            نمط المُلهي (Distractor) <span className="text-gray-400 font-normal">(اختياري)</span>
          </label>
          <input
            type="text"
            value={q.distractor}
            onChange={e => onPatch(q.id, { distractor: e.target.value })}
            placeholder="مثال: خطأ في العلامة، ارتباك في الوحدات..."
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#103B66] dark:focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

// ── Main wizard component ─────────────────────────────────────────────────────

const UploadWizard = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
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

  // ── Step 4 state ──
  const [publishing, setPublishing] = useState(false);
  const [toast,      setToast]      = useState(null); // { type, message }

  // ── API Data states ──
  const [apiSubjects,   setApiSubjects]   = useState([]);
  const [apiUnits,      setApiUnits]      = useState([]);
  const [apiLessons,    setApiLessons]    = useState([]);
  const [apiSubtopics,  setApiSubtopics]  = useState([]);
  const [loadingOpts,   setLoadingOpts]   = useState(false);

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

  // Fetch subtopics for quiz metadata based on selected lesson
  useEffect(() => {
    if (!lessonId) {
      console.warn('⚠️ Cannot fetch subtopics: lesson ID is missing.');
      setApiSubtopics([]);
      return;
    }

    api.get(`/lesson/${lessonId}/subtopics`)
      .then((res) => {
        console.log('🔥 RAW SUBTOPICS RESPONSE:', res.data);

        const payload = res.data?.data || res.data;
        let extractedSubtopics = [];

        if (payload && typeof payload === 'object') {
          // 1. Find the first level array (usually 'units' or 'chapters')
          const unitsArray = payload.units || payload.chapters || Object.values(payload).find(v => Array.isArray(v)) || [];

          // 2. Iterate through units and extract the nested subtopics/lessons
          extractedSubtopics = unitsArray.flatMap(unit => {
            // Look for the nested array inside the unit
            const nested = unit.subtopics || unit.sub_topics || unit.lessons || unit.topics || unit.children || Object.values(unit).find(v => Array.isArray(v));

            // If we found a nested array, return it. If not, return the unit itself as a fallback.
            return Array.isArray(nested) && nested.length > 0 ? nested : [unit];
          });

          // If unitsArray was empty but the payload itself is an array
          if (unitsArray.length === 0 && Array.isArray(payload)) {
            extractedSubtopics = payload;
          }
        }

        // 3. Normalize for the dropdown
        const finalSubtopics = extractedSubtopics.map(item => ({
          id: item.id || item.subtopic_id,
          name: item.name || item.title || item.subtopic_name || `موضوع ${item.id}`
        }));

        console.log('✅ FLATTENED SUBTOPICS:', finalSubtopics);
        setApiSubtopics(finalSubtopics);
      })
      .catch((err) => {
        console.error('❌ Failed to fetch subtopics', err);
        setApiSubtopics([]);
      });
  }, [lessonId]);

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
    setVideoFile(file);
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
    setPublishing(true);
    try {
      // الاستناد للدرس المختار الموجود فعلياً بدلاً من إنشائه
      const selectedLesson = apiLessons.find(l => String(l.id) === String(lessonId));
      const actualLessonName = selectedLesson ? (selectedLesson.title || selectedLesson.name) : 'درس جديد';
      const actualLessonId = selectedLesson ? selectedLesson.id : lessonId;

      const selectedSubjectObj = apiSubjects.find(s => String(s.id) === String(subject));
      const actualSubjectName = selectedSubjectObj ? (selectedSubjectObj.name || selectedSubjectObj.title) : subject;

      // 1. معالجة الفيديو ورفعه (مرتبط بالدرس المختار)
      const formData = new FormData();
      formData.append('title', `${actualSubjectName} - ${actualLessonName}`);
      formData.append('lesson_id', actualLessonId);
      formData.append('file', videoFile);

      const videoRes = await api.post('/videos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
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
          title: `اختبار الدرس: ${actualLessonName}`,
          video_id: newVideoId,
          questions: quizQuestions,
        };

        // رفع الاختبار
        await api.post('/quizzes', quizPayload);
      }

      // 5. نجاح ──────────────────────────────────────────────────────────
      setToast({ type: 'success', message: t('publish_success') });
      setTimeout(() => navigate('/teacher-dashboard'), 2800);
    } catch (err) {
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
    return subtopic?.name || subId;
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* ═══════════ HEADER ═══════════ */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#103B66] dark:bg-blue-600 p-2 rounded-lg shadow">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#103B66] dark:text-blue-400">{t('upload_wizard_title')}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('upload_wizard_subtitle')} {step} {t('upload_wizard_of')} {STEPS.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LangToggle />
            <button
              onClick={() => navigate('/teacher-dashboard')}
              className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition text-sm font-medium"
            >
              <ArrowRight className={`w-4 h-4 ${lang === 'en' ? 'rotate-180' : ''}`} />
              {t('back_to_teacher_dashboard')}
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════ STEP INDICATOR ═══════════ */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center">
            {STEPS.map((s, idx) => {
              const done    = completed.has(s.id);
              const current = step === s.id;
              const clickable = done || s.id < step;
              const Icon  = s.icon;
              return (
                <div key={s.id} className="flex items-center flex-1 min-w-0">
                  <button
                    onClick={() => goToStep(s.id)}
                    disabled={!clickable}
                    className={`flex flex-col items-center gap-1.5 flex-shrink-0 transition ${
                      clickable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      done    ? 'bg-green-500 text-white shadow-md' :
                      current ? 'bg-[#103B66] dark:bg-blue-500 text-white shadow-lg ring-4 ring-[#103B66]/20 dark:ring-blue-500/30' :
                                'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    }`}>
                      {done ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-xs font-bold hidden sm:block whitespace-nowrap ${
                      current ? 'text-[#103B66] dark:text-blue-400' :
                      done    ? 'text-green-600 dark:text-green-400' :
                                'text-gray-400 dark:text-gray-500'
                    }`}>
                      {t(s.labelKey)}
                    </span>
                  </button>

                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 sm:mx-3 rounded-full transition-all duration-500 ${
                      done ? 'bg-green-400 dark:bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* ╔══════════════ STEP 1 — Lesson Metadata ══════════════╗ */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{t('lesson_data_title')}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('lesson_data_subtitle')}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-5">

              {/* Subject */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {t('select_subject')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={subject}
                  onChange={e => {
                    setSubject(e.target.value);
                    setUnit('');
                    setStep1Errors(p => ({ ...p, subject: false }));
                  }}
                  className={`w-full bg-gray-50 dark:bg-gray-700 border rounded-xl px-4 py-3 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#103B66] dark:focus:ring-blue-500 transition ${
                    step1Errors.subject ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {loadingOpts ? (
                    <option value="">جاري التحميل...</option>
                  ) : (
                    <>
                      <option value="">{t('select_subject')}</option>
                      {apiSubjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name || s.title}</option>
                      ))}
                    </>
                  )}
                </select>
                {step1Errors.subject && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> يُرجى اختيار المادة الدراسية
                  </p>
                )}
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {t('select_unit')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={unit}
                  onChange={e => { setUnit(e.target.value); setStep1Errors(p => ({ ...p, unit: false })); }}
                  disabled={!subject}
                  className={`w-full bg-gray-50 dark:bg-gray-700 border rounded-xl px-4 py-3 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#103B66] dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition ${
                    step1Errors.unit ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {loadingOpts && subject ? (
                    <option value="">جاري تحميل الوحدات...</option>
                  ) : (
                    <>
                      <option value="">{subject ? t('select_unit') : (lang === 'ar' ? 'اختر المادة أولاً' : 'Select subject first')}</option>
                      {apiUnits.map(u => (
                        <option key={u.id} value={u.id}>{u.title || u.name}</option>
                      ))}
                    </>
                  )}
                </select>
                {step1Errors.unit && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> يُرجى اختيار الوحدة
                  </p>
                )}
              </div>

              {/* Lesson Dropdown */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  اختر الدرس <span className="text-red-500">*</span>
                </label>
                <select
                  value={lessonId}
                  onChange={e => { setLessonId(e.target.value); setStep1Errors(p => ({ ...p, lessonId: false })); }}
                  disabled={!unit}
                  className={`w-full bg-gray-50 dark:bg-gray-700 border rounded-xl px-4 py-3 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#103B66] dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition ${
                    step1Errors.lessonId ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {loadingOpts && unit ? (
                    <option value="">جاري تحميل الدروس...</option>
                  ) : (
                    <>
                      <option value="">{unit ? 'اختر الدرس' : (lang === 'ar' ? 'اختر الوحدة أولاً' : 'Select unit first')}</option>
                      {apiLessons.map(l => (
                        <option key={l.id} value={l.id}>{l.title || l.name}</option>
                      ))}
                    </>
                  )}
                </select>
                {step1Errors.lessonId && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> يُرجى اختيار الدرس
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {t('lesson_desc')}{' '}
                  <span className="text-gray-400 dark:text-gray-500 font-normal">{lang === 'ar' ? '(اختياري)' : '(optional)'}</span>
                </label>
                <textarea
                  value={lessonDesc}
                  onChange={e => setLessonDesc(e.target.value)}
                  rows={3}
                  placeholder="نبذة مختصرة عن محتوى الدرس..."
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#103B66] dark:focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ╔══════════════ STEP 2 — Video Upload ══════════════╗ */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{t('upload_video_title')}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('upload_video_subtitle')}</p>
            </div>

            {/* Drag & Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragEnter={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); validateAndSetVideo(e.dataTransfer.files[0]); }}
              onClick={() => !videoFile && videoInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all select-none ${
                isDragging
                  ? 'border-[#103B66] dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-[1.01]'
                  : videoFile
                    ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/10 cursor-default'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[#103B66] dark:hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer'
              }`}
            >
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4"
                className="hidden"
                onChange={e => validateAndSetVideo(e.target.files[0])}
              />

              {videoFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-green-100 dark:bg-green-900/40 p-4 rounded-full">
                    <FileVideo className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 dark:text-white text-lg break-all">{videoFile.name}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{formatBytes(videoFile.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setVideoFile(null); setVideoError(''); }}
                    className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition mt-1 font-medium"
                  >
                    <X className="w-4 h-4" /> إزالة الملف
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className={`p-4 rounded-full transition-all ${isDragging ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <Upload className={`w-10 h-10 transition-all ${isDragging ? 'text-[#103B66] dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  </div>
                  <div>
                    <p className="text-gray-700 dark:text-gray-300 font-bold text-lg">
                      {isDragging ? 'أفلت الملف هنا...' : 'اسحب ملف الفيديو هنا'}
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">أو انقر للاختيار من جهازك</p>
                  </div>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-full font-medium">
                    MP4 فقط • حد أقصى 500 MB
                  </span>
                </div>
              )}
            </div>

            {/* Video error */}
            {videoError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {videoError}
              </div>
            )}

            {/* Thumbnail */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                صورة مصغرة (Thumbnail){' '}
                <span className="text-gray-400 dark:text-gray-500 font-normal">(اختياري)</span>
              </label>
              <div
                onClick={() => thumbInputRef.current?.click()}
                className="border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:border-[#103B66] dark:hover:border-blue-400 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition"
              >
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files[0];
                    if (!f) return;
                    setThumbnail(f);
                    const reader = new FileReader();
                    reader.onload = ev => setThumbPreview(ev.target.result);
                    reader.readAsDataURL(f);
                  }}
                />
                {thumbPreview ? (
                  <>
                    <img src={thumbPreview} alt="thumbnail preview" className="w-24 h-16 object-cover rounded-lg flex-shrink-0 border border-gray-200 dark:border-gray-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 dark:text-white text-sm truncate">{thumbnail?.name}</p>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setThumbnail(null); setThumbPreview(''); }}
                        className="text-red-500 hover:text-red-700 text-xs mt-1 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> إزالة الصورة
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex-shrink-0">
                      <ImagePlus className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      انقر لإضافة صورة مصغرة (PNG, JPG)
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ╔══════════════ STEP 3 — MCQ Quiz Builder ══════════════╗ */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{t('build_quiz_title')}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('build_quiz_subtitle')}</p>
              </div>
              {/* Count badge */}
              <div className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm border transition-colors ${
                questions.length >= 15
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
                  : 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400'
              }`}>
                <ClipboardList className="w-4 h-4" />
                {questions.length} / 40
              </div>
            </div>

            {/* Validation banners */}
            {showQuizVal && questions.length > 0 && !isStep3Valid() && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                بعض الأسئلة غير مكتملة — تأكد من نص السؤال، الخيارات، الإجابة، واختيار الموضوع الفرعي لكل سؤال أو قم بحذف الأسئلة لإكمال الرفع بدون أسئلة.
              </div>
            )}

            {/* Questions */}
            <div className="space-y-4">
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
                />
              ))}
            </div>

            {/* Add question button */}
            {questions.length < 40 ? (
              <button
                type="button"
                onClick={addQuestion}
                className="w-full border-2 border-dashed border-[#103B66] dark:border-blue-500 text-[#103B66] dark:text-blue-400 rounded-2xl py-4 flex items-center justify-center gap-2 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
              >
                <Plus className="w-5 h-5" />
                إضافة سؤال جديد
              </button>
            ) : (
              <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                وصلت للحد الأقصى (40 سؤال)
              </p>
            )}
          </div>
        )}

        {/* ╔══════════════ STEP 4 — Review & Publish ══════════════╗ */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{t('review_publish_title')}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('review_publish_subtitle')}</p>
            </div>

            {/* Summary Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-4 pb-3 border-b dark:border-gray-700 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
                {t('lesson_summary')}
              </h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">المادة الدراسية</p>
                  <p className="font-bold text-gray-800 dark:text-white">
                    {apiSubjects.find(s => String(s.id) === String(subject))?.name || apiSubjects.find(s => String(s.id) === String(subject))?.title || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">الوحدة</p>
                  <p className="font-bold text-gray-800 dark:text-white">{unit || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">اسم الدرس</p>
                  <p className="font-bold text-gray-800 dark:text-white">
                    {apiLessons.find(l => String(l.id) === String(lessonId))?.title || apiLessons.find(l => String(l.id) === String(lessonId))?.name || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">ملف الفيديو</p>
                  <p className="font-bold text-gray-800 dark:text-white truncate">{videoFile?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">حجم الفيديو</p>
                  <p className="font-bold text-gray-800 dark:text-white">{videoFile ? formatBytes(videoFile.size) : '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">عدد الأسئلة</p>
                  <p className="font-bold text-gray-800 dark:text-white">{questions.length} سؤال</p>
                </div>
                {lessonDesc && (
                  <div className="col-span-2">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">وصف الدرس</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{lessonDesc}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Subtopic tags */}
            {uniqueSubtopics.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="font-bold text-gray-800 dark:text-white text-base mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#103B66] dark:bg-blue-400 inline-block" />
                  الموضوعات الفرعية المُوسَمة ({uniqueSubtopics.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {uniqueSubtopics.map(st => (
                    <span
                      key={st}
                      className="bg-blue-50 dark:bg-blue-900/30 text-[#103B66] dark:text-blue-300 px-3 py-1 rounded-full text-sm font-bold border border-blue-200 dark:border-blue-700"
                    >
                      {st}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Checklist */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-800 dark:text-white text-base mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#103B66] dark:text-blue-400" />
                {t('publish_checklist')}
              </h3>
              <div className="space-y-3">
                {checklist.map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      item.ok ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'
                    }`}>
                      {item.ok
                        ? <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                        : <X    className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      }
                    </div>
                    <span className={`text-sm ${
                      item.ok ? 'text-gray-700 dark:text-gray-300' : 'text-red-600 dark:text-red-400 font-bold'
                    }`}>
                      {item.ok ? '✅' : '❌'} {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={publishing}
                className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-4 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {t('save_draft')}
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={!allOk || publishing}
                className="bg-[#103B66] dark:bg-blue-600 hover:bg-[#0c2d4d] dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold shadow-lg transition flex items-center justify-center gap-2"
              >
                {publishing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('publishing')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    {t('publish_lesson')}
                  </>
                )}
              </button>
            </div>

            {!allOk && (
              <p className="text-center text-orange-500 dark:text-orange-400 text-sm font-medium">
                {t('complete_required')}
              </p>
            )}
          </div>
        )}

        {/* ═══════════ NAVIGATION BUTTONS ═══════════ */}
        <div className={`flex items-center mt-8 pt-6 border-t dark:border-gray-700 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
          {step > 1 && (
            <button
              type="button"
              onClick={goBack}
              disabled={publishing}
              className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
            >
              <ChevronRight className={`w-5 h-5 ${lang === 'en' ? 'rotate-180' : ''}`} />
              {t('back')}
            </button>
          )}
          {step < 4 && (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-2 bg-[#103B66] dark:bg-blue-600 hover:bg-[#0c2d4d] dark:hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition"
            >
              {lang === 'ar' ? 'التالي' : 'Next'}
              <ChevronLeft className={`w-5 h-5 ${lang === 'en' ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </main>

      {/* ═══════════ TOAST ═══════════ */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm max-w-sm w-full transition-all ${
          toast.type === 'success' ? 'bg-green-600 text-white' :
          toast.type === 'error'   ? 'bg-red-600 text-white'   :
                                     'bg-[#103B66] text-white'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            : <AlertCircle  className="w-5 h-5 flex-shrink-0" />
          }
          <span className="flex-1">{toast.message}</span>
          {toast.type !== 'success' && (
            <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 transition flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadWizard;
