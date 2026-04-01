import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import api from '../api/api';
import { ArrowRight, Clock, Loader2, AlertCircle, Trophy, BookOpen } from "lucide-react";
import { useLanguage } from '../context/LanguageContext';

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

  // ── Auth guard: الزائر يتحوّل لتسجيل الدخول مع رابط العودة ──
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

  const finishQuizLogic = async (finalAnswers, finalScore = score) => {
    setSubmitting(true);

    if (realParams) {
      try {
        const { subjectId: sId, teacherId: tId, lessonId: lId, quizId } = realParams;

        const answers = Object.entries(finalAnswers).map(([qIdx, aIdx]) => {
          const q = questions[Number(qIdx)];
          let ansText;
          if (q?._realId && q?.optionKeys) {
            ansText = q.optionKeys[aIdx];
          } else {
            ansText = q?.options?.[aIdx] ?? String(aIdx);
          }
          return {
            question_id: q?._realId ?? q?.id,
            answer_text: ansText,
          };
        });

        const res = await api.post(`/quiz/${quizId}/answer`, { answers });
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

        // ← عرض النتيجة في نفس الصفحة بدل الانتقال
        setFinalScoreData({ score: serverScore, total: questions.length });
        setShowResults(true);
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

    // ← Fallback بدون realParams – نفس السلوك
    setFinalScoreData({ score: finalScore, total: questions.length });
    setShowResults(true);
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-[#103B66] font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-lg font-bold">{t('loading_quiz')}</p>
      </div>
    );
  }

  // Already Attempted State — شاشة مخصصة وليست مجرد خطأ
  if (alreadyAttempted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 font-['Cairo'] px-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-10 text-center max-w-md w-full shadow-lg">
          <div className="w-20 h-20 mx-auto mb-5 bg-amber-100 dark:bg-amber-800/30 rounded-full flex items-center justify-center">
            <Trophy className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-amber-800 dark:text-amber-300 mb-3">
            لقد اجتزت هذا الاختبار مسبقاً!
          </h2>
          <p className="text-amber-700 dark:text-amber-400 mb-6 leading-relaxed">
            يمكنك مراجعة إجاباتك السابقة من لوحة التحكم، أو الاستمرار في تعلُّم الدروس الأخرى.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleBackToLesson}
              className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-3 px-6 rounded-xl font-bold transition"
            >
              <BookOpen className="w-5 h-5" />
              العودة للدرس
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-amber-700 dark:text-amber-400 hover:underline text-sm font-medium"
            >
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-red-50 p-8 rounded-2xl text-center border border-red-200 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={handleBackToLesson}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            {t('back_to_lesson')}
          </button>
        </div>
      </div>
    );
  }

  if (!quizData || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-yellow-50 p-8 rounded-2xl text-center border border-yellow-200 max-w-md">
          <p className="text-yellow-700 mb-4">{t('quiz_no_data')}</p>
          <button
            onClick={handleBackToLesson}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            {t('back_to_lesson')}
          </button>
        </div>
      </div>
    );
  }
    // ── واجهة عرض النتيجة ──────────────────────────────────────────
  if (showResults && finalScoreData) {
    const percentage = Math.round((finalScoreData.score / finalScoreData.total) * 100);
    const passed = percentage >= 50;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 font-['Cairo'] px-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className={`rounded-2xl p-10 text-center max-w-md w-full shadow-lg border
          ${passed
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
          }`}>

          {/* أيقونة */}
          <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center
            ${passed ? 'bg-emerald-100 dark:bg-emerald-800/30' : 'bg-red-100 dark:bg-red-800/30'}`}>
            <Trophy className={`w-12 h-12 ${passed ? 'text-emerald-500' : 'text-red-500'}`} />
          </div>

          {/* العنوان */}
          <h2 className={`text-2xl font-bold mb-2
            ${passed ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}`}>
            {passed ? 'أحسنت! لقد نجحت' : 'لم تجتز الاختبار'}
          </h2>

          {/* الدرجة الدائرية */}
          <div className="relative w-36 h-36 mx-auto my-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none"
                className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="10" />
              <circle cx="60" cy="60" r="52" fill="none"
                className={passed ? 'stroke-emerald-500' : 'stroke-red-500'}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${(percentage / 100) * 327} 327`}
                style={{ transition: 'stroke-dasharray 1s ease' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-black ${passed ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                {finalScoreData.score}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                من {finalScoreData.total}
              </span>
            </div>
          </div>

          {/* النسبة المئوية */}
          <p className={`text-lg font-bold mb-6
            ${passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {percentage}%
          </p>

          {/* زر العودة فقط – بدون إعادة امتحان */}
          <button
            onClick={handleBackToLesson}
            className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold transition
              ${passed
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
              }`}>
            <BookOpen className="w-5 h-5" />
            العودة للدرس
          </button>
        </div>
      </div>
    );
  }

  // --- واجهة الامتحان (Quiz View) ---
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#103B66] dark:text-blue-400">
            <Clock className="w-5 h-5" />
            <span className={`font-bold font-mono text-lg ${timeLeft < 60 ? 'text-red-500 animate-pulse' : ''}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="text-center">
            <h1 className="font-bold text-gray-800 dark:text-white">{quizData.title}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{quizData.subtitle || quizData.lessonTitle}</p>
          </div>
          <button onClick={handleFinishQuiz} disabled={submitting} className="text-gray-400 hover:text-red-500 disabled:opacity-50 transition">
            <span className="text-sm font-bold">{submitting ? '...' : t('finish_quiz')}</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span>{t('quiz_question')} {currentQuestion + 1} {t('of')} {questions.length}</span>
            <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#103B66] transition-all duration-500"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-8 leading-relaxed">
            {questions[currentQuestion].question}
          </h2>

          <div className="space-y-4">
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                className={`w-full text-right p-4 rounded-xl border-2 transition-all flex items-center justify-between group
                                ${selectedAnswer === index
                    ? 'border-[#103B66] bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-100 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <span className={`font-bold ${
                  selectedAnswer === index ? 'text-[#103B66] dark:text-blue-300' : 'text-gray-600 dark:text-gray-300'
                }`}>
                  {option}
                </span>

                {/* Radio Circle */}
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                ${selectedAnswer === index ? 'border-[#103B66]' : 'border-gray-300'}`}>
                  {selectedAnswer === index && <div className="w-3 h-3 bg-[#103B66] rounded-full"></div>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={() => {
              if (currentQuestion > 0) {
                setCurrentQuestion(currentQuestion - 1);
                const prevAns = userAnswers[currentQuestion - 1];
                setSelectedAnswer(prevAns !== undefined ? prevAns : null);
              }
            }}
            disabled={currentQuestion === 0}
            className="text-gray-500 hover:text-[#103B66] disabled:opacity-50 font-bold px-4 py-2"
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
            className="bg-[#103B66] hover:bg-[#0c2d4d] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:shadow-none transition flex items-center gap-2">
            {submitting
              ? <><Loader2 className="w-5 h-5 animate-spin" /> جاري الإرسال...</>
              : <>{currentQuestion === questions.length - 1 ? t('finish_quiz') : t('next_question')}<ArrowRight className={`w-5 h-5 ${lang === 'en' ? 'rotate-180' : ''}`} /></>}
          </button>
        </div>
      </main>
    </div>
  );
};

export default Quiz;
