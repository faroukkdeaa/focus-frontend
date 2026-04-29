import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import api from '../api/api';
import { ArrowRight, Clock, Loader2, AlertCircle, Trophy, BookOpen } from "lucide-react";
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

/* ════════════════════════════════════════════════════
   DESIGN SYSTEM — Extracted from LandingPage.jsx
════════════════════════════════════════════════════ */
function buildTheme(dk){return dk?{bg:"#0B1120",bgCard:"rgba(255,255,255,0.035)",border:"rgba(255,255,255,0.08)",borderAccent:"rgba(79,70,229,0.38)",accent:"#4F46E5",accentDim:"rgba(79,70,229,0.14)",iconA:"#38BDF8",iconBgA:"rgba(56,189,248,0.10)",iconBorderA:"rgba(56,189,248,0.22)",textPrimary:"#F8FAFC",textMuted:"#94A3B8",textDim:"#475569",shadowCard:"0 1px 1px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.35)",trackBg:"rgba(255,255,255,0.06)",green:"#34D399",greenDim:"rgba(52,211,153,0.12)",greenBorder:"rgba(52,211,153,0.22)",red:"#F87171",redDim:"rgba(248,113,113,0.10)",redBorder:"rgba(248,113,113,0.20)",yellow:"#FBBF24",yellowDim:"rgba(251,191,36,0.12)",yellowBorder:"rgba(251,191,36,0.22)",headerBg:"rgba(11,17,32,0.88)"}:{bg:"#F8FAFC",bgCard:"#FFFFFF",border:"#E2E8F0",borderAccent:"rgba(15,76,129,0.28)",accent:"#0F4C81",accentDim:"rgba(15,76,129,0.08)",iconA:"#0F4C81",iconBgA:"rgba(15,76,129,0.08)",iconBorderA:"rgba(15,76,129,0.18)",textPrimary:"#0F172A",textMuted:"#64748B",textDim:"#94A3B8",shadowCard:"0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)",trackBg:"#E2E8F0",green:"#059669",greenDim:"rgba(5,150,105,0.08)",greenBorder:"rgba(5,150,105,0.18)",red:"#EF4444",redDim:"rgba(239,68,68,0.08)",redBorder:"rgba(239,68,68,0.18)",yellow:"#D97706",yellowDim:"rgba(217,119,6,0.08)",yellowBorder:"rgba(217,119,6,0.18)",headerBg:"rgba(248,250,252,0.90)"};}
const _c=(T,x)=>({background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:"16px",boxShadow:T.shadowCard,...x});
const _t={transition:"all 0.25s ease"};
const _iw=(bg,bd,sz="40px",r="10px")=>({..._t,width:sz,height:sz,borderRadius:r,background:bg,border:`1px solid ${bd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0});

// تحويل سؤال real API للشكل الداخلي ({ id, question, options:[], correct:N })
const normalizeQuestion = (q, idx) => {
  // Real API format: option_1, option_2, option_3, option_4 (or option_a/b/c/d)
  if (q.option_1 !== undefined || q.option_a !== undefined) {
    const rawKeys = ['option_1', 'option_2', 'option_3', 'option_4', 'option_a', 'option_b', 'option_c', 'option_d'];
    const optionsWithKeys = [];
    rawKeys.forEach(k => {
      if (q[k] !== undefined && q[k] !== null && String(q[k]).trim() !== '') {
        optionsWithKeys.push({ text: q[k], key: k });
      }
    });

    return {
      id:       q.question_id ?? q.id ?? idx,
      question: q.question ?? q.question_text ?? `Q${idx + 1}`,
      options:  optionsWithKeys.map(o => o.text),
      optionKeys: optionsWithKeys.map(o => o.key),
      correct:  -1, // يحسبها السيرفر
      _realId:  q.question_id ?? q.id,
    };
  }
  // choices format: [{id, text, is_correct}]
  if (Array.isArray(q.choices)) {
    const options = q.choices.map(c => c.text ?? c.answer_text ?? String(c));
    const correct = q.choices.findIndex(c => c.id === q.correct_choice_id || c.is_correct);
    return { id: q.id ?? q.question_id ?? idx, question: q.question ?? q.question_text, options, correct: correct >= 0 ? correct : 0, _realId: q.id ?? q.question_id };
  }
  // Mock format: options as array + correct as index
  if (Array.isArray(q.options)) return { ...q, _realId: q.id ?? q.question_id };
  // fallback
  return { id: idx, question: q.question ?? q.question_text ?? `Q${idx}`, options: [], correct: 0, _realId: q.id ?? q.question_id };
};

const Quiz = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { teacherId, lessonId, quizId } = useParams(); // ✅ Extract all 3 IDs from URL
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const T = buildTheme(isDark);

  // ── Auth guard ──
  const isLoggedIn = !!localStorage.getItem('token');
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname), { replace: true });
    }
  }, [isLoggedIn, navigate]);



  // 1. حالات التحكم (State)
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false); // سبق محاولة الكويز
  const [quizData, setQuizData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600);
  const [submitting, setSubmitting] = useState(false);
  // real API params
  const [realParams, setRealParams] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [finalScoreData, setFinalScoreData] = useState(null);

  const questions = quizData?.questions || [];

  // جلب بيانات الاختبار: GET /api/quizzes-details/{quizId}
  useEffect(() => {
    const loadQuiz = async () => {
      if (!isLoggedIn) return;

      try {
        setLoading(true);
        setError(null);
        setAlreadyAttempted(false);

        const rawQuizId = quizId != null ? String(quizId).trim() : '';
        if (!rawQuizId) {
          setError('رقم الاختبار غير متوفر.');
          return;
        }

        const quizRes = await api.get(`/quizzes-details/${rawQuizId}`);
        const data = quizRes.data ?? {};

        // Laravel showQuiz: عند محاولة سابقة يرجع { message } فقط بدون مفتاح quiz
        if (data.message && !data.quiz) {
          setAlreadyAttempted(true);
          return;
        }

        const quizPayload = data.quiz ?? data.data?.quiz;
        const teacherData = data.teacher ?? data.data?.teacher;

        if (!quizPayload || typeof quizPayload !== 'object') {
          setError('تعذّر تحميل أسئلة الاختبار. حاول مرة أخرى.');
          return;
        }

        if (quizPayload.quiz_attempt === true) {
          setAlreadyAttempted(true);
          return;
        }

        const questionsRaw = Array.isArray(quizPayload.questions)
          ? quizPayload.questions
          : (quizPayload.questions?.data ?? quizPayload.questions ?? []);

        const normalizedQs = (Array.isArray(questionsRaw) ? questionsRaw : [])
          .map(normalizeQuestion)
          .filter((q) => q.options.length > 0);

        if (normalizedQs.length === 0) {
          setError('هذا الاختبار لا يحتوي على أسئلة بعد. تواصل مع المدرس.');
          return;
        }

        setQuizData({
          title:       quizPayload.lesson_name ?? 'اختبار',
          subtitle:    teacherData?.teacher_name ?? '',
          lessonTitle: quizPayload.lesson_name ?? '',
          questions:   normalizedQs,
          timeLimit:   600,
        });

        setRealParams({
          quizId: rawQuizId,
          lessonId: quizPayload.lesson_id,
          subjectId: teacherData?.subject_id,
          teacherId: teacherData?.teacher_id,
        });
        setTimeLeft(600);
      } catch (err) {
        console.error('[Quiz] Loading error:', err);
        if (err.response?.status === 401) {
          setError('يجب تسجيل الدخول لأداء الاختبار.');
        } else if (err.response?.status === 404) {
          setError('الاختبار غير موجود.');
        } else {
          setError('تعذّر تحميل الاختبار. تأكد من اتصالك وحاول مرة أخرى.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId, isLoggedIn]);


  // دالة العداد التنازلي
  useEffect(() => {
    if (timeLeft > 0 && quizData && !showResults) {          // ← أضف && !showResults
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (timeLeft === 0 && !showResults) {             // ← أضف && !showResults
      handleFinishQuiz();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, quizData, showResults]);                     // ← أضف showResults للديبندنسي

  // تحويل الوقت لدقائق وثواني
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // اختيار إجابة
  const handleOptionSelect = (index) => {
    setSelectedAnswer(index);
  };

  // السؤال التالي
  const handleNextQuestion = async () => {
    // Save current answer
    const updatedAnswers = { ...userAnswers, [currentQuestion]: selectedAnswer };
    setUserAnswers(updatedAnswers);

    // Update Score if correct
    if (selectedAnswer === questions[currentQuestion].correct) {
      setScore(prev => prev + 1);
    }

    // Move to next question or finish
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      // Check if we already have an answer for the next question (for going back/forth)
      // or reset if not. For now, simpliest is reset as "Back" button logic in original was simple
      setSelectedAnswer(null);
    } else {
      // This case theoretically handled by the button text check, but safe to have
      await finishQuizLogic(updatedAnswers);
    }
  };

  // إنهاء الامتحان
  const handleFinishQuiz = async () => {
    if (submitting || showResults) return;                   // ← أضف هذا السطر

    let finalAnswers = { ...userAnswers };
    let finalScore = score;

    if (selectedAnswer !== null) {
      finalAnswers[currentQuestion] = selectedAnswer;
      if (selectedAnswer === questions[currentQuestion].correct) {
        finalScore += 1;
      }
    }

    await finishQuizLogic(finalAnswers, finalScore);
  };

  const goToWeaknessReport = (finalScore, finalAnswers, correctAnswersFromServer = []) => {
    const safeQuestions = Array.isArray(questions) ? questions : [];
    const safeUserAnswers =
      finalAnswers && typeof finalAnswers === 'object' ? finalAnswers : {};

    const resolvedLessonId =
      realParams?.lessonId ??
      location.state?.lesson_id ??
      location.state?.lessonId ??
      location.state?.lesson?.id ??
      (safeQuestions.length > 0
        ? (safeQuestions[0]?.lesson_id ?? safeQuestions[0]?.question?.lesson_id)
        : null) ??
      lessonId ??
      null;

    if (!safeQuestions.length) {
      console.warn('⚠️ Weakness report payload has no questions at navigation time.');
    }
    if (!resolvedLessonId) {
      console.warn('⚠️ Weakness report payload is missing lesson_id at navigation time.');
    }

    const reportState = {
      score: finalScore,
      total: safeQuestions.length,
      questions: safeQuestions,
      userAnswers: safeUserAnswers,
      correctAnswersFromServer: correctAnswersFromServer,
      lesson_id: resolvedLessonId,
      lessonId: resolvedLessonId,
      lesson: location.state?.lesson ?? (resolvedLessonId ? { id: resolvedLessonId } : undefined),
      subjectId: realParams?.subjectId ?? location.state?.subjectId,
      teacherId: realParams?.teacherId ?? location.state?.teacherId ?? teacherId,
      subjectName: location.state?.subjectName,
      quizId: realParams?.quizId ?? quizId,
    };

    console.log('📦 Weakness report payload summary:', {
      questionsCount: reportState.questions.length,
      answersCount: Object.keys(reportState.userAnswers || {}).length,
      lesson_id: reportState.lesson_id,
    });

    navigate('/weakness-report', { state: reportState });
  };

  const finishQuizLogic = async (finalAnswers, finalScore = score) => {
    setSubmitting(true);

    if (realParams) {
      try {
        const { subjectId: sId, teacherId: tId, lessonId: lId, quizId } = realParams;

        const answers = Object.entries(finalAnswers).map(([qIdx, aIdx]) => {
          const q = questions[Number(qIdx)];
          // ✅ FIX: Send the actual option TEXT, not the key
          // Backend compares correct_answer with the text value, not "option_1"
          const ansText = q?.options?.[aIdx] ?? String(aIdx);
          
          console.log('📤 Submitting answer:', {
            question_id: q?._realId ?? q?.id,
            selected_index: aIdx,
            answer_text: ansText,
            optionKey: q?.optionKeys?.[aIdx], // for debugging only
          });
          
          return {
            question_id: q?._realId ?? q?.id,
            answer_text: ansText,
          };
        });

        console.log('📤 Full payload:', { answers });
        
        const res = await api.post(`/quiz/${quizId}/answer`, { answers });
        console.log('📥 Server response:', res.data);
        
        const serverScore = res.data?.score ?? finalScore;

        // حفظ إتمام الدرس في localStorage
        if (lId) {
          try {
            const completionData = JSON.parse(localStorage.getItem('lessonCompletions') || '{}');
            completionData[lId] = {
              subjectId: String(sId),
              completed: true,
              completedAt: new Date().toISOString().split('T')[0],
            };
            localStorage.setItem('lessonCompletions', JSON.stringify(completionData));
          } catch { /* غير حرج */ }
        }

        goToWeaknessReport(serverScore, finalAnswers, res.data?.correct_answers_quiz || []);
        return;
      } catch (err) {
        console.error('Real API submit error:', err);
        setError('تعذّر إرسال الإجابات للسيرفر. تأكد من اتصالك وحاول مرة أخرى.');
        setSubmitting(false);
        return;
      } finally {
        setSubmitting(false);
      }
    }

    // ← Fallback بدون realParams
    setSubmitting(false);
    goToWeaknessReport(finalScore, finalAnswers, []);
  };

  // العودة للدرس الحالي
  const handleBackToLesson = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (realParams?.lessonId) {
      navigate('/dashboard'); // fallback safe
    } else {
      navigate('/dashboard');
    }
  };

  // Loading State
  if (loading) {
    return (
      <div dir={lang==='ar'?'rtl':'ltr'} style={{..._t,background:T.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Cairo',sans-serif"}}>
        <Loader2 style={{width:"48px",height:"48px",color:T.accent,marginBottom:"16px"}} className="animate-spin" />
        <p style={{fontSize:"1.1rem",fontWeight:700,color:T.textPrimary}}>{t('loading_quiz')}</p>
      </div>
    );
  }

  // Already Attempted
  if (alreadyAttempted) {
    return (
      <div dir={lang==='ar'?'rtl':'ltr'} style={{..._t,background:T.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Cairo',sans-serif",padding:"16px"}}>
        <div style={{..._t,..._c(T),borderColor:T.yellowBorder,padding:"40px",textAlign:"center",maxWidth:"440px",width:"100%"}}>
          <div style={{..._iw(T.yellowDim,T.yellowBorder,"72px","50%"),margin:"0 auto 20px"}}>
            <Trophy style={{width:"36px",height:"36px",color:T.yellow}} />
          </div>
          <h2 style={{..._t,fontSize:"1.4rem",fontWeight:800,color:T.textPrimary,marginBottom:"12px"}}>
            لقد اجتزت هذا الاختبار مسبقاً!
          </h2>
          <p style={{..._t,color:T.textMuted,marginBottom:"24px",lineHeight:1.7,fontSize:"0.9rem"}}>
            يمكنك مراجعة إجاباتك السابقة من لوحة التحكم، أو الاستمرار في تعلُّم الدروس الأخرى.
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            <button onClick={handleBackToLesson} style={{..._t,display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",background:T.accent,color:"#FFF",padding:"12px 24px",borderRadius:"12px",fontWeight:700,border:"none",cursor:"pointer",fontSize:"0.9rem"}}>
              <BookOpen style={{width:"20px",height:"20px"}} /> العودة للدرس
            </button>
            <button onClick={()=>navigate('/dashboard')} style={{..._t,background:"transparent",border:"none",color:T.textMuted,cursor:"pointer",fontWeight:600,fontSize:"0.82rem"}}>
              اذهب للوحة التحكم
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div dir={lang==='ar'?'rtl':'ltr'} style={{..._t,background:T.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Cairo',sans-serif"}}>
        <div style={{..._t,..._c(T),borderColor:T.redBorder,padding:"32px",textAlign:"center",maxWidth:"440px"}}>
          <AlertCircle style={{width:"48px",height:"48px",color:T.red,margin:"0 auto 16px"}} />
          <p style={{color:T.red,marginBottom:"16px",fontWeight:600}}>{error}</p>
          <button onClick={handleBackToLesson} style={{..._t,background:"transparent",border:"none",color:T.textMuted,cursor:"pointer",fontSize:"0.85rem",textDecoration:"underline"}}>{t('back_to_lesson')}</button>
        </div>
      </div>
    );
  }

  if (!quizData || questions.length === 0) {
    return (
      <div dir={lang==='ar'?'rtl':'ltr'} style={{..._t,background:T.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Cairo',sans-serif"}}>
        <div style={{..._t,..._c(T),borderColor:T.yellowBorder,padding:"32px",textAlign:"center",maxWidth:"440px"}}>
          <p style={{color:T.yellow,marginBottom:"16px",fontWeight:600}}>{t('quiz_no_data')}</p>
          <button onClick={handleBackToLesson} style={{..._t,background:"transparent",border:"none",color:T.textMuted,cursor:"pointer",fontSize:"0.85rem",textDecoration:"underline"}}>{t('back_to_lesson')}</button>
        </div>
      </div>
    );
  }
    // ── واجهة عرض النتيجة ──────────────────────────────────────────
  if (showResults && finalScoreData) {
    const percentage = Math.round((finalScoreData.score / finalScoreData.total) * 100);
    const passed = percentage >= 50;

    return (
      <div dir={lang==='ar'?'rtl':'ltr'} style={{..._t,background:T.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Cairo',sans-serif",padding:"16px"}}>
        <div style={{..._t,..._c(T),borderColor:passed?T.greenBorder:T.redBorder,padding:"40px",textAlign:"center",maxWidth:"440px",width:"100%"}}>
          <div style={{..._iw(passed?T.greenDim:T.redDim,passed?T.greenBorder:T.redBorder,"80px","50%"),margin:"0 auto 24px"}}>
            <Trophy style={{width:"40px",height:"40px",color:passed?T.green:T.red}} />
          </div>
          <h2 style={{..._t,fontSize:"1.5rem",fontWeight:800,color:T.textPrimary,marginBottom:"8px"}}>
            {passed ? 'أحسنت! لقد نجحت' : 'لم تجتز الاختبار'}
          </h2>
          <div style={{position:"relative",width:"144px",height:"144px",margin:"24px auto"}}>
            <svg style={{width:"100%",height:"100%",transform:"rotate(-90deg)"}} viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" stroke={T.trackBg} />
              <circle cx="60" cy="60" r="52" fill="none" stroke={passed?T.green:T.red} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(percentage/100)*327} 327`} style={{transition:'stroke-dasharray 1s ease'}} />
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:"1.8rem",fontWeight:900,color:passed?T.green:T.red}}>{finalScoreData.score}</span>
              <span style={{fontSize:"0.7rem",color:T.textDim}}>من {finalScoreData.total}</span>
            </div>
          </div>
          <p style={{fontSize:"1.1rem",fontWeight:700,color:passed?T.green:T.red,marginBottom:"24px"}}>{percentage}%</p>
          <button onClick={handleBackToLesson} style={{..._t,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",padding:"12px 24px",borderRadius:"12px",fontWeight:700,border:"none",cursor:"pointer",background:T.accent,color:"#FFF",fontSize:"0.9rem"}}>
            <BookOpen style={{width:"20px",height:"20px"}} /> العودة للدرس
          </button>
        </div>
      </div>
    );
  }

  // --- واجهة الامتحان (Quiz View) ---
  return (
    <div dir={lang==='ar'?'rtl':'ltr'} style={{..._t,background:T.bg,minHeight:"100vh",fontFamily:"'Cairo',sans-serif"}}>
      {/* Header */}
      <header style={{..._t,position:"sticky",top:0,zIndex:10,background:T.headerBg,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:`1px solid ${T.border}`}}>
        <div style={{maxWidth:"900px",margin:"0 auto",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <div style={_iw(T.iconBgA,T.iconBorderA,"36px","10px")}>
              <Clock style={{color:T.iconA,width:"18px",height:"18px"}} strokeWidth={2} />
            </div>
            <span style={{fontWeight:700,fontFamily:"monospace",fontSize:"1.1rem",color:timeLeft<60?T.red:T.textPrimary,...(timeLeft<60?{animation:"pulse 1s infinite"}:{})}}>{formatTime(timeLeft)}</span>
          </div>
          <div style={{textAlign:"center"}}>
            <h1 style={{fontWeight:700,color:T.textPrimary,fontSize:"0.95rem"}}>{quizData.title}</h1>
            <p style={{fontSize:"0.7rem",color:T.textDim}}>{quizData.subtitle || quizData.lessonTitle}</p>
          </div>
          <button onClick={handleFinishQuiz} disabled={submitting} style={{..._t,background:"transparent",border:"none",color:T.textMuted,cursor:"pointer",fontWeight:700,fontSize:"0.82rem",opacity:submitting?0.5:1}} onMouseEnter={e=>{e.currentTarget.style.color=T.red}} onMouseLeave={e=>{e.currentTarget.style.color=T.textMuted}}>
            {submitting ? '...' : t('finish_quiz')}
          </button>
        </div>
      </header>

      <main style={{maxWidth:"800px",margin:"0 auto",padding:"32px 24px"}}>
        {/* Progress */}
        <div style={{marginBottom:"32px"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.82rem",color:T.textMuted,marginBottom:"8px"}}>
            <span>{t('quiz_question')} {currentQuestion + 1} {t('of')} {questions.length}</span>
            <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
          </div>
          <div style={{height:"3px",background:T.trackBg,borderRadius:"4px",overflow:"hidden"}}>
            <div style={{height:"100%",background:T.accent,transition:"width 0.5s ease",width:`${((currentQuestion+1)/questions.length)*100}%`,borderRadius:"4px"}} />
          </div>
        </div>

        {/* Question Card */}
        <div style={{..._t,..._c(T),padding:"32px"}}>
          <h2 style={{..._t,fontSize:"1.25rem",fontWeight:700,color:T.textPrimary,marginBottom:"32px",lineHeight:1.7}}>
            {questions[currentQuestion].question}
          </h2>

          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            {questions[currentQuestion].options.map((option, index) => {
              const isSel = selectedAnswer === index;
              return (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  style={{..._t,width:"100%",textAlign:"right",padding:"16px 20px",borderRadius:"12px",border:`1px solid ${isSel?T.borderAccent:T.border}`,background:isSel?T.accentDim:"transparent",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}
                  onMouseEnter={e=>{if(!isSel){e.currentTarget.style.borderColor=T.borderAccent;e.currentTarget.style.background=isDark?"rgba(255,255,255,0.03)":"#F8FAFC"}}}
                  onMouseLeave={e=>{if(!isSel){e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background="transparent"}}}
                >
                  <span style={{fontWeight:700,color:isSel?T.accent:T.textMuted,fontSize:"0.9rem"}}>{option}</span>
                  <div style={{..._t,width:"22px",height:"22px",borderRadius:"50%",border:`2px solid ${isSel?T.accent:T.textDim}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {isSel && <div style={{width:"12px",height:"12px",borderRadius:"50%",background:T.accent}} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{marginTop:"32px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <button
            onClick={() => {
              if (currentQuestion > 0) {
                setCurrentQuestion(currentQuestion - 1);
                const prevAns = userAnswers[currentQuestion - 1];
                setSelectedAnswer(prevAns !== undefined ? prevAns : null);
              }
            }}
            disabled={currentQuestion === 0}
            style={{..._t,background:"transparent",border:`1px solid ${T.border}`,borderRadius:"12px",padding:"10px 20px",color:T.textMuted,fontWeight:700,cursor:currentQuestion===0?"not-allowed":"pointer",opacity:currentQuestion===0?0.4:1,fontSize:"0.85rem"}}
          >
            {t('back')}
          </button>

          <button
            onClick={() => {
              if (currentQuestion === questions.length - 1) {
                handleFinishQuiz();
              } else {
                handleNextQuestion();
              }
            }}
            disabled={selectedAnswer === null || submitting}
            style={{..._t,background:T.accent,color:"#FFF",padding:"10px 32px",borderRadius:"12px",fontWeight:700,border:"none",cursor:(selectedAnswer===null||submitting)?"not-allowed":"pointer",opacity:(selectedAnswer===null||submitting)?0.5:1,display:"flex",alignItems:"center",gap:"8px",fontSize:"0.9rem"}}
          >
            {submitting
              ? <><Loader2 style={{width:"20px",height:"20px"}} className="animate-spin" /> جاري الإرسال...</>
              : <>{currentQuestion === questions.length - 1 ? t('finish_quiz') : t('next_question')}<ArrowRight style={{width:"20px",height:"20px",...(lang==='en'?{transform:"rotate(180deg)"}:{})}} /></>}
          </button>
        </div>
      </main>
    </div>
  );
};

export default Quiz;
