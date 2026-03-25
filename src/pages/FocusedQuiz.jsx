import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/api';
import { useLanguage } from '../context/LanguageContext';
import {
  Target, Timer, CheckCircle2, XCircle, Zap,
  ArrowRight, Trophy, RotateCcw, Home, BookOpen,
} from 'lucide-react';

const API = 'http://localhost:3001';
const TIMER_SECONDS = 30;

const ARABIC_LABELS = ['Ø£', 'Ø¨', 'Ø¬', 'Ø¯'];

// â”€â”€ Motivational message based on score â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getMotivation = (score, total) => {
  const pct = total > 0 ? score / total : 0;
  if (pct === 1)  return { msg: 'Ù…Ø«Ø§Ù„ÙŠ! Ø£ØªÙ‚Ù†Øª Ù‡Ø°Ø§ Ø§Ù„Ù…ÙˆØ¶ÙˆØ¹ ØªÙ…Ø§Ù…Ø§Ù‹ ðŸ†', color: 'text-yellow-400' };
  if (pct >= 0.8) return { msg: 'Ù…Ù…ØªØ§Ø²! ØªØ­ÙƒÙ… Ø¬ÙŠØ¯ ÙÙŠ Ù‡Ø°Ù‡ Ø§Ù„Ù†Ù‚Ø·Ø© ðŸŽ‰', color: 'text-green-400' };
  if (pct >= 0.6) return { msg: 'Ø¬ÙŠØ¯! Ø±Ø§Ø¬Ø¹ Ø§Ù„Ø£Ù…Ø«Ù„Ø© Ù…Ø±Ø© Ø£Ø®Ø±Ù‰ ÙˆØ³ØªØªÙ‚Ù†Ù‡Ø§ ðŸ“š', color: 'text-blue-400' };
  if (pct >= 0.4) return { msg: 'Ù„Ø§ ØªÙŠØ£Ø³! Ø´Ø§Ù‡Ø¯ Ø§Ù„ÙÙŠØ¯ÙŠÙˆ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰ ÙˆØ¹Ø§ÙˆØ¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© ðŸ’ª', color: 'text-orange-400' };
  return { msg: 'Ù‡Ø°Ø§ Ø§Ù„Ù…ÙˆØ¶ÙˆØ¹ ÙŠØ­ØªØ§Ø¬ ØªØ±ÙƒÙŠØ²Ø§Ù‹ Ø£ÙƒØ«Ø±. Ø´Ø§Ù‡Ø¯ Ø§Ù„ÙÙŠØ¯ÙŠÙˆ ÙˆØ¹Ø¯ Ù„Ù„Ù…Ø­Ø§ÙˆÙ„Ø© ðŸŽ¯', color: 'text-red-400' };
};

// â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FocusedQuiz = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLanguage();
  const { subtopic, subject, lesson, subjectId, lessonId } = location.state || {};

  // â”€â”€ Questions state (API-driven) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [questions,  setQuestions]  = useState([]);
  const [loadingQ,   setLoadingQ]   = useState(true);
  const [errorQ,     setErrorQ]     = useState(null);

  const fetchQuestions = useCallback(async () => {
    setLoadingQ(true);
    setErrorQ(null);
    try {
      const { data } = await api.get(`${API}/focused_questions`);
      // Mirror the original filtering logic: match by subtopic bidirectionally
      if (subtopic) {
        const lower    = subtopic.toLowerCase();
        const filtered = data.filter((q) =>
          q.subtopics.some(
            (s) => s.toLowerCase().includes(lower) || lower.includes(s.toLowerCase())
          )
        );
        setQuestions((filtered.length >= 3 ? filtered : data).slice(0, 5));
      } else {
        setQuestions(data.slice(0, 5));
      }
    } catch {
      setErrorQ('ØªØ¹Ø°Ù‘Ø± ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø£Ø³Ø¦Ù„Ø©. ØªØ­Ù‚Ù‚ Ù…Ù† Ø§ØªØµØ§Ù„Ùƒ ÙˆØ­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.');
    } finally {
      setLoadingQ(false);
    }
  }, [subtopic]);

  useEffect(() => {
    if (location.state) fetchQuestions();
  }, [fetchQuestions, location.state]);

  // â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Timer countdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (showFeedback || finished || !currentQ) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [currentIdx, showFeedback, finished, currentQ]);

  // â”€â”€ Trigger timeout when timeLeft hits 0 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (timeLeft === 0 && !showFeedback && !finished) {
      const id = setTimeout(() => {
        setSelected(-1);
        setShowFeedback(true);
      }, 0);
      return () => clearTimeout(id);
    }
  }, [timeLeft, showFeedback, finished]);

  // â”€â”€ Auto-advance 2.5 s after a timeout (selected === -1) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Option class helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Timer SVG ring â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const r    = 22;
  const circ = 2 * Math.PI * r;
  const timerOffset = circ * (1 - timeLeft / TIMER_SECONDS);
  const timerStroke =
    timeLeft > 15 ? '#a855f7' : timeLeft > 8 ? '#f59e0b' : '#ef4444';

  // â”€â”€ Guard: no state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Loading screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loadingQ) {
    return (
      <div
        className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-['Cairo']"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-600/20 border border-purple-500/30
            flex items-center justify-center">
            <Zap className="w-8 h-8 text-purple-400 animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-48 bg-slate-700 rounded-full animate-pulse mx-auto" />
            <div className="h-3 w-32 bg-slate-700/60 rounded-full animate-pulse mx-auto" />
          </div>
          <p className="text-slate-400 text-sm">Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø£Ø³Ø¦Ù„Ø©â€¦</p>
        </div>
      </div>
    );
  }

  // â”€â”€ Error screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (errorQ) {
    return (
      <div
        className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-['Cairo']"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="text-center max-w-sm space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20
            flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{errorQ}</p>
          <button
            onClick={fetchQuestions}
            className="flex items-center gap-2 mx-auto px-6 py-3 bg-purple-600 hover:bg-purple-700
              text-white font-bold rounded-xl transition"
          >
            <RotateCcw className="w-4 h-4" />
            Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©
          </button>
        </div>
      </div>
    );
  }

  // â”€â”€ Finished screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Main Quiz UI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="min-h-screen bg-slate-900 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-purple-900/15 rounded-full blur-3xl" />
      </div>

      {/* â”€â”€ Sticky Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/remediation')}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition text-sm font-medium"
          >
            <ArrowRight className="w-4 h-4" />
            Ø®Ø±ÙˆØ¬
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center shadow shadow-purple-900/50">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm">Ø§Ø®ØªØ¨Ø§Ø± Ù…Ø±ÙƒÙ‘Ø²</span>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-slate-200 transition"
            title="Ø§Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="relative max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* â”€â”€ Subtopic Banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
              {subtopic || 'Ø§Ø®ØªØ¨Ø§Ø± Ù…Ø±ÙƒÙ‘Ø²'}
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
                â€¢ {t('targets_weakness')}
              </span>
            </div>
          </div>
        </div>

        {/* â”€â”€ Progress + Timer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

        {/* â”€â”€ Question Card (animated) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

            {/* â”€â”€ Feedback box â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

            {/* â”€â”€ Next button (only when answer given, not timed-out) â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

        {/* â”€â”€ Score tally (live) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
