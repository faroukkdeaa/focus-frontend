import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  Target, Timer, CheckCircle2, XCircle, Zap,
  ArrowRight, Trophy, RotateCcw, Home, BookOpen,
} from 'lucide-react';

const TIMER_SECONDS = 30;

// ── Question bank (keyed by subtopic) ────────────────────────────────────────
const MOCK_BANK = [
  // ── قانون أوم ──────────────────────────────────────────────────────────────
  {
    id: 1,
    subtopics: ['قانون أوم', 'ohm'],
    question: 'جسم موصل مقاومته 10 أوم يمر به تيار شدته 2 أمبير. ما الجهد الكهربي عليه؟',
    options: ['5 فولت', '20 فولت', '12 فولت', '8 فولت'],
    correct: 1,
    explanation: 'قانون أوم: ف = ت × م = 2 × 10 = 20 فولت',
  },
  {
    id: 2,
    subtopics: ['قانون أوم', 'ohm'],
    question: 'إذا تضاعف الجهد الكهربي مع ثبات المقاومة، فإن التيار...',
    options: ['يتضاعف', 'ينتصف', 'يظل ثابتاً', 'يصبح صفراً'],
    correct: 0,
    explanation: 'ت = ف / م، عند ثبات م وتضاعف ف يتضاعف التيار',
  },
  {
    id: 3,
    subtopics: ['قانون أوم', 'ohm'],
    question: 'وحدة قياس المقاومة الكهربية هي...',
    options: ['الأمبير', 'الفولت', 'الأوم (Ω)', 'الواط'],
    correct: 2,
    explanation: 'المقاومة تقاس بالأوم (Ω) نسبةً للعالم جورج سيمون أوم',
  },
  {
    id: 4,
    subtopics: ['قانون أوم', 'ohm'],
    question: 'مقاومة سلك 5 أوم، والجهد عليها 15 فولت. ما شدة التيار؟',
    options: ['3 أمبير', '75 أمبير', '10 أمبير', '0.33 أمبير'],
    correct: 0,
    explanation: 'ت = ف / م = 15 / 5 = 3 أمبير',
  },
  {
    id: 5,
    subtopics: ['قانون أوم', 'ohm'],
    question: 'أي من الصيغ التالية يعبر بشكل صحيح عن قانون أوم؟',
    options: ['م = ف × ت', 'ف = ت / م', 'ت = م / ف', 'ت = ف / م'],
    correct: 3,
    explanation: 'الصيغة الصحيحة: التيار = الجهد ÷ المقاومة، أي ت = ف / م',
  },
  // ── المعادلات التربيعية ──────────────────────────────────────────────────
  {
    id: 6,
    subtopics: ['المعادلات التربيعية', 'quadratic'],
    question: 'ما حلول المعادلة: س² − 5س + 6 = 0؟',
    options: ['س = 2 و 3', 'س = 1 و 6', 'س = −2 و −3', 'س = 5 و 1'],
    correct: 0,
    explanation: 'التحليل: (س−2)(س−3) = 0، إذن س = 2 أو س = 3',
  },
  {
    id: 7,
    subtopics: ['المعادلات التربيعية', 'quadratic'],
    question: 'في المعادلة أس² + بس + جـ = 0، المميز (Δ) يساوي...',
    options: ['ب² + 4أجـ', 'ب² − 4أجـ', '√ب − 4أجـ', '4أ − ب²'],
    correct: 1,
    explanation: 'المميز Δ = ب² − 4أجـ، يحدد عدد وطبيعة الجذور',
  },
  {
    id: 8,
    subtopics: ['المعادلات التربيعية', 'quadratic'],
    question: 'إذا كان المميز = 0، فإن المعادلة التربيعية تملك...',
    options: ['جذرين حقيقيين مختلفين', 'جذرين حقيقيين متساويين', 'لا جذور حقيقية', 'ثلاثة جذور'],
    correct: 1,
    explanation: 'عندما Δ = 0: جذران حقيقيان متساويان، س = −ب / 2أ',
  },
  {
    id: 9,
    subtopics: ['المعادلات التربيعية', 'quadratic'],
    question: 'ما مجموع جذري المعادلة: 2س² − 8س + 3 = 0؟',
    options: ['4', '−4', '3/2', '8'],
    correct: 0,
    explanation: 'مجموع الجذرين = −ب/أ = −(−8)/2 = 4',
  },
  {
    id: 10,
    subtopics: ['المعادلات التربيعية', 'quadratic'],
    question: 'حل المعادلة: س² − 16 = 0',
    options: ['س = 4 فقط', 'س = ±4', 'س = ±8', 'س = 16'],
    correct: 1,
    explanation: 'س² = 16، إذن س = ±4',
  },
  // ── الاتزان الكيميائي ────────────────────────────────────────────────────
  {
    id: 11,
    subtopics: ['الاتزان الكيميائي', 'chemical equilibrium'],
    question: 'وفق مبدأ لو شاتلييه، عند زيادة الضغط على تفاعل غازي يتحرك الاتزان إلى...',
    options: [
      'الجهة التي تزيد موالات الغاز',
      'الجهة التي تقلل موالات الغاز',
      'لا يتأثر الاتزان',
      'توقف التفاعل',
    ],
    correct: 1,
    explanation: 'زيادة الضغط تدفع الاتزان نحو الجهة الأقل في عدد موالات الغاز',
  },
  {
    id: 12,
    subtopics: ['الاتزان الكيميائي', 'chemical equilibrium'],
    question: 'ثابت الاتزان Kc = 1000 يدل على أن...',
    options: [
      'المتفاعلات بتركيز أكبر',
      'النواتج تسود بشكل كبير',
      'المتفاعلات والنواتج متساوية',
      'التفاعل لم يبدأ',
    ],
    correct: 1,
    explanation: 'Kc >> 1 تعني أن التفاعل يسير للأمام والنواتج تسود',
  },
  {
    id: 13,
    subtopics: ['الاتزان الكيميائي', 'chemical equilibrium'],
    question: 'عند رفع درجة الحرارة لتفاعل ماص للحرارة...',
    options: ['يتحرك للخلف', 'يتحرك للأمام', 'يظل في توازن', 'يتوقف'],
    correct: 1,
    explanation: 'التفاعل الماص يمتص حرارة، فرفع الحرارة يحرك الاتزان للأمام',
  },
  {
    id: 14,
    subtopics: ['الاتزان الكيميائي', 'chemical equilibrium'],
    question: 'إضافة عامل حفاز للتفاعل يؤثر على...',
    options: [
      'قيمة Kc فقط',
      'سرعة الوصول للاتزان فقط',
      'تركيز النواتج',
      'درجة حرارة التفاعل',
    ],
    correct: 1,
    explanation: 'العامل الحفاز يسرع الوصول للاتزان ولا يغير قيمة Kc',
  },
  {
    id: 15,
    subtopics: ['الاتزان الكيميائي', 'chemical equilibrium'],
    question: 'عند الاتزان الكيميائي، سرعة التفاعل الأمامي...',
    options: [
      'أكبر من العكسي',
      'أصغر من العكسي',
      'تساوي العكسي',
      'تساوي الصفر',
    ],
    correct: 2,
    explanation: 'عند الاتزان: سرعة الأمامي = سرعة العكسي (ولكن كلاهما ≠ 0)',
  },
  // ── قانون نيوتن الثاني ──────────────────────────────────────────────────
  {
    id: 16,
    subtopics: ["قانون نيوتن الثاني", "newton's 2nd law", 'newton'],
    question: 'جسم كتلته 5 كجم يتسارع بمعدل 3 م/ث². ما مقدار القوة المؤثرة عليه؟',
    options: ['10 نيوتن', '15 نيوتن', '8 نيوتن', '20 نيوتن'],
    correct: 1,
    explanation: 'ق = ك × ت = 5 × 3 = 15 نيوتن',
  },
  {
    id: 17,
    subtopics: ["قانون نيوتن الثاني", "newton's 2nd law", 'newton'],
    question: 'إذا تضاعفت الكتلة مع ثبات القوة، فإن التسارع...',
    options: ['يتضاعف', 'ينتصف', 'يظل ثابتاً', 'يصبح صفراً'],
    correct: 1,
    explanation: 'ت = ق / ك، عند ثبات ق وتضاعف ك ينتصف التسارع',
  },
  {
    id: 18,
    subtopics: ["قانون نيوتن الثاني", "newton's 2nd law", 'newton'],
    question: 'قوة 30 نيوتن تؤثر على جسم فيكتسب تسارعاً 6 م/ث². ما كتلة الجسم؟',
    options: ['3 كجم', '180 كجم', '5 كجم', '36 كجم'],
    correct: 2,
    explanation: 'ك = ق / ت = 30 / 6 = 5 كجم',
  },
  {
    id: 19,
    subtopics: ["قانون نيوتن الثاني", "newton's 2nd law", 'newton'],
    question: 'ينص القانون الثاني لنيوتن على أن التسارع...',
    options: [
      'عكسي مع القوة وطردي مع الكتلة',
      'طردي مع القوة وعكسي مع الكتلة',
      'ثابت دائماً',
      'لا يتأثر بالكتلة',
    ],
    correct: 1,
    explanation: 'ت = ق / ك، التسارع طردي مع القوة وعكسي مع الكتلة',
  },
  {
    id: 20,
    subtopics: ["قانون نيوتن الثاني", "newton's 2nd law", 'newton'],
    question: 'وحدة القوة في نظام SI مشتقة من F = ma، وهي...',
    options: ['الجول', 'الواط', 'النيوتن', 'الباسكال'],
    correct: 2,
    explanation: '1 نيوتن = 1 كجم · م/ث²، نسبةً للعالم إسحاق نيوتن',
  },
];

// ── Arabic letter labels for options ─────────────────────────────────────────
const ARABIC_LABELS = ['أ', 'ب', 'ج', 'د'];

// ── Motivational message based on score ──────────────────────────────────────
const getMotivation = (score, total) => {
  const pct = total > 0 ? score / total : 0;
  if (pct === 1)  return { msg: 'مثالي! أتقنت هذا الموضوع تماماً 🏆', color: 'text-yellow-400' };
  if (pct >= 0.8) return { msg: 'ممتاز! تحكم جيد في هذه النقطة 🎉', color: 'text-green-400' };
  if (pct >= 0.6) return { msg: 'جيد! راجع الأمثلة مرة أخرى وستتقنها 📚', color: 'text-blue-400' };
  if (pct >= 0.4) return { msg: 'لا تيأس! شاهد الفيديو مرة أخرى وعاود المحاولة 💪', color: 'text-orange-400' };
  return { msg: 'هذا الموضوع يحتاج تركيزاً أكثر. شاهد الفيديو وعد للمحاولة 🎯', color: 'text-red-400' };
};

// ── Main Component ────────────────────────────────────────────────────────────
const FocusedQuiz = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLanguage();
  const { subtopic, subject, lesson, subjectId, lessonId } = location.state || {};

  // ── Filter questions by subtopic ─────────────────────────────────────────
  const questions = useMemo(() => {
    if (!subtopic) return MOCK_BANK.slice(0, 5);
    const lower = subtopic.toLowerCase();
    const filtered = MOCK_BANK.filter((q) =>
      q.subtopics.some(
        (s) => s.toLowerCase().includes(lower) || lower.includes(s.toLowerCase())
      )
    );
    return (filtered.length >= 3 ? filtered : MOCK_BANK).slice(0, 5);
  }, [subtopic]);

  // ── State ─────────────────────────────────────────────────────────────────
  const [currentIdx, setCurrentIdx] = useState(0);
  // selected: null = unanswered, -1 = timed out, number = option index
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [slideIn, setSlideIn] = useState(true);

  const currentQ  = questions[currentIdx];
  const totalQ    = questions.length;
  const isLast    = currentIdx === totalQ - 1;
  const motivation = getMotivation(score, totalQ);

  // ── Timer countdown ───────────────────────────────────────────────────────
  useEffect(() => {
    if (showFeedback || finished || !currentQ) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [currentIdx, showFeedback, finished, currentQ]);

  // ── Trigger timeout when timeLeft hits 0 ─────────────────────────────────
  useEffect(() => {
    if (timeLeft === 0 && !showFeedback && !finished) {
      const id = setTimeout(() => {
        setSelected(-1);
        setShowFeedback(true);
      }, 0);
      return () => clearTimeout(id);
    }
  }, [timeLeft, showFeedback, finished]);

  // ── Auto-advance 2.5 s after a timeout (selected === -1) ─────────────────
  useEffect(() => {
    if (selected !== -1 || !showFeedback || finished) return;
    const id = setTimeout(() => {
      if (currentIdx >= totalQ - 1) {
        setFinished(true);
      } else {
        setSlideIn(false);
        setTimeout(() => {
          setCurrentIdx((prev) => prev + 1);
          setSelected(null);
          setShowFeedback(false);
          setTimeLeft(TIMER_SECONDS);
          setSlideIn(true);
        }, 180);
      }
    }, 2500);
    return () => clearTimeout(id);
  }, [selected, showFeedback, finished, currentIdx, totalQ]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSelect = (optIdx) => {
    if (showFeedback) return;
    if (optIdx === currentQ.correct) setScore((prev) => prev + 1);
    setSelected(optIdx);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (isLast) {
      setFinished(true);
      return;
    }
    setSlideIn(false);
    setTimeout(() => {
      setCurrentIdx((prev) => prev + 1);
      setSelected(null);
      setShowFeedback(false);
      setTimeLeft(TIMER_SECONDS);
      setSlideIn(true);
    }, 180);
  };

  // ── Option class helper ───────────────────────────────────────────────────
  const getOptionClass = (optIdx) => {
    const base =
      'w-full text-right px-4 py-3.5 rounded-xl border text-sm font-medium transition-all duration-150 flex items-center justify-between gap-3';

    if (!showFeedback) {
      return `${base} ${
        selected === optIdx
          ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/30'
          : 'bg-slate-700/50 border-slate-600/50 text-slate-200 hover:border-purple-400/60 hover:bg-slate-600/60 cursor-pointer'
      }`;
    }
    if (optIdx === currentQ.correct)
      return `${base} bg-green-500/20 border-green-500 text-green-200`;
    if (optIdx === selected && selected !== currentQ.correct)
      return `${base} bg-red-500/20 border-red-500 text-red-200`;
    return `${base} bg-slate-700/20 border-slate-700/30 text-slate-500 opacity-50`;
  };

  // ── Timer SVG ring ────────────────────────────────────────────────────────
  const r    = 22;
  const circ = 2 * Math.PI * r;
  const timerOffset = circ * (1 - timeLeft / TIMER_SECONDS);
  const timerStroke =
    timeLeft > 15 ? '#a855f7' : timeLeft > 8 ? '#f59e0b' : '#ef4444';

  // ── Guard: no state ───────────────────────────────────────────────────────
  if (!location.state) {
    return (
      <div
        className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-['Cairo']"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-5 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
            <Target className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-slate-300 mb-5 leading-relaxed">
            {t('no_focused_data')}
          </p>
          <button
            onClick={() => navigate('/remediation')}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition"
          >
            {t('go_to_remediation')}
          </button>
        </div>
      </div>
    );
  }

  // ── Finished screen ───────────────────────────────────────────────────────
  if (finished) {
    const scorePct = Math.round((score / totalQ) * 100);
    return (
      <div
        className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-['Cairo']"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Subtle bg glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-md w-full space-y-5">
          {/* Trophy */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-28 h-28 mx-auto bg-gradient-to-br from-yellow-400/20 to-orange-500/10 rounded-full flex items-center justify-center border border-yellow-500/20 shadow-xl shadow-yellow-900/10">
                <Trophy className="w-14 h-14 text-yellow-400" />
              </div>
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                {t('focused_quiz_done')}
              </span>
            </div>
          </div>

          {/* Score card */}
          <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-7 text-center">
            <p className="text-slate-400 text-sm mb-1">{t('final_score')}</p>
            <div className="flex items-end justify-center gap-1 mb-3">
              <span className="text-6xl font-extrabold text-white leading-none">
                {score}
              </span>
              <span className="text-xl text-slate-500 mb-1.5">/ {totalQ}</span>
            </div>

            {/* Score bar */}
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-4 mx-4">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${scorePct}%`,
                  background:
                    scorePct >= 80
                      ? 'linear-gradient(to right,#22c55e,#16a34a)'
                      : scorePct >= 60
                      ? 'linear-gradient(to right,#a855f7,#7c3aed)'
                      : 'linear-gradient(to right,#f97316,#dc2626)',
                }}
              />
            </div>

            <p className={`text-sm font-bold mb-4 ${motivation.color}`}>
              {motivation.msg}
            </p>

            {subtopic && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-300 text-xs font-medium mb-4">
                <Target className="w-3.5 h-3.5" />
                {subtopic}
              </div>
            )}

            {/* Mini stats */}
            <div className="grid grid-cols-2 divide-x divide-x-reverse divide-slate-700 border border-slate-700/60 rounded-xl overflow-hidden">
              <div className="py-3 px-4 text-center">
                <p className="text-2xl font-bold text-green-400">{score}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t('correct_label')}</p>
              </div>
              <div className="py-3 px-4 text-center">
                <p className="text-2xl font-bold text-red-400">{totalQ - score}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t('wrong_label')}</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={() =>
                navigate('/remediation', {
                  state: {
                    weakSubtopic: { name: subtopic, subject, subjectId, lessonId },
                  },
                })
              }
              className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/30"
            >
              <RotateCcw className="w-5 h-5" />
              {t('watch_video_again')}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center justify-center gap-2 py-4 bg-slate-700/60 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-600/60 transition-all"
            >
              <Home className="w-5 h-5" />
              {t('back_to_dashboard')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Quiz UI ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-purple-900/15 rounded-full blur-3xl" />
      </div>

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/remediation')}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition text-sm font-medium"
          >
            <ArrowRight className="w-4 h-4" />
            خروج
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center shadow shadow-purple-900/50">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm">اختبار مركّز</span>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-slate-200 transition"
            title="الوحة التحكم"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="relative max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Subtopic Banner ──────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/60 via-slate-800/80 to-slate-800/50 border border-purple-500/30 p-5">
          {/* Decorative circle */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full pointer-events-none" />
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-violet-500/10 rounded-full pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-purple-300 text-xs font-semibold tracking-wide uppercase">
                {t('high_precision_mode')}
              </span>
            </div>
            <h2 className="text-white font-bold text-lg leading-snug mb-2">
              {subtopic || 'اختبار مركّز'}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {subject && (
                <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-200 rounded-full text-xs font-medium border border-purple-500/30">
                  {subject}
                </span>
              )}
              {lesson && (
                <span className="text-slate-400 text-xs flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {lesson}
                </span>
              )}
              <span className="text-slate-500 text-xs">
                • {t('targets_weakness')}
              </span>
            </div>
          </div>
        </div>

        {/* ── Progress + Timer ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          {/* Progress bar */}
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">
                {t('question_progress')} {currentIdx + 1} {t('of')} {totalQ}
              </span>
              <span className="text-purple-400 font-bold">
                {Math.round((currentIdx / totalQ) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-slate-700/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${(currentIdx / totalQ) * 100}%` }}
              />
            </div>
          </div>

          {/* Circular timer */}
          <div className="relative w-14 h-14 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 52 52">
              <circle
                cx="26" cy="26" r={r}
                fill="none" stroke="#1e293b" strokeWidth="4"
              />
              <circle
                cx="26" cy="26" r={r}
                fill="none"
                stroke={timerStroke}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={timerOffset}
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Timer className={`w-3 h-3 mb-0.5 ${timeLeft <= 8 ? 'text-red-400' : 'text-slate-500'}`} />
              <span
                className={`text-xs font-extrabold leading-none ${
                  timeLeft <= 8 ? 'text-red-400' : 'text-slate-200'
                }`}
              >
                {timeLeft}
              </span>
            </div>
          </div>
        </div>

        {/* ── Question Card (animated) ─────────────────────────────────────── */}
        <div
          className={`transition-all duration-200 ease-out ${
            slideIn ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          }`}
        >
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">

            {/* Question number badge + text */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-extrabold">
                  {currentIdx + 1}
                </span>
                <span className="text-purple-400 text-xs font-semibold">
                  {currentQ?.subtopics?.[0] || subtopic}
                </span>
              </div>
              <p className="text-white font-semibold leading-relaxed text-base">
                {currentQ?.question}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {currentQ?.options.map((opt, optIdx) => (
                <button
                  key={optIdx}
                  onClick={() => handleSelect(optIdx)}
                  disabled={showFeedback}
                  className={getOptionClass(optIdx)}
                >
                  <span className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="shrink-0 w-6 h-6 rounded-lg bg-slate-600/70 text-slate-300 text-xs font-bold flex items-center justify-center">
                      {ARABIC_LABELS[optIdx]}
                    </span>
                    <span className="leading-snug text-right">{opt}</span>
                  </span>
                  {showFeedback && (
                    optIdx === currentQ.correct ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                    ) : optIdx === selected ? (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                    ) : null
                  )}
                </button>
              ))}
            </div>

            {/* ── Feedback box ──────────────────────────────────────────────── */}
            {showFeedback && (
              <div
                className={`rounded-xl p-4 flex items-start gap-3 border ${
                  selected === -1
                    ? 'bg-orange-500/10 border-orange-500/30'
                    : selected === currentQ?.correct
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {selected === -1 ? (
                    <Timer className="w-5 h-5 text-orange-400" />
                  ) : selected === currentQ?.correct ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div>
                  <p
                    className={`text-sm font-bold mb-1 ${
                      selected === -1
                        ? 'text-orange-300'
                        : selected === currentQ?.correct
                        ? 'text-green-300'
                        : 'text-red-300'
                    }`}
                  >
                    {selected === -1
                      ? t('time_up_msg')
                      : selected === currentQ?.correct
                      ? t('correct_msg')
                      : t('wrong_msg')}
                  </p>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {currentQ?.explanation}
                  </p>
                </div>
              </div>
            )}

            {/* ── Next button (only when answer given, not timed-out) ──────── */}
            {showFeedback && selected !== -1 && (
              <button
                onClick={handleNext}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-purple-900/30"
              >
                {isLast ? (
                  <>
                    <Trophy className="w-5 h-5" />
                    {t('show_final_result')}
                  </>
                ) : (
                  <>
                    <ArrowRight className={`w-5 h-5 ${lang === 'en' ? 'rotate-180' : ''}`} />
                    {t('next_q')}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Score tally (live) ───────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-6 pb-6">
          <span className="flex items-center gap-1.5 text-green-400 text-sm font-bold">
            <CheckCircle2 className="w-4 h-4" />
            {score} {t('correct_label')}
          </span>
          <span className="text-slate-700">|</span>
          <span className="flex items-center gap-1.5 text-red-400 text-sm font-bold">
            <XCircle className="w-4 h-4" />
            {currentIdx + (showFeedback ? 1 : 0) - score} {t('wrong_label')}
          </span>
        </div>

      </main>
    </div>
  );
};

export default FocusedQuiz;
