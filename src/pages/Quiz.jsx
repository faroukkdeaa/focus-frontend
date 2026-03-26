import { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/api';
import { ArrowRight, Clock, Loader2, AlertCircle } from "lucide-react";
import { useLanguage } from '../context/LanguageContext';
import { MOCK_API, REAL_TO_MOCK_SUBJECT } from '../utils/subjectMapping';

// تحويل سؤال real API للشكل الداخلي ({ id, question, options:[], correct:N })
const normalizeQuestion = (q, idx) => {
  // Real API format: option_1, option_2, option_3, option_4
  if (q.option_1 !== undefined) {
    const options = [q.option_1, q.option_2, q.option_3, q.option_4].filter(Boolean);
    // correct_answer not returned in question list — scored by server
    return {
      id:       q.question_id ?? q.id ?? idx,
      question: q.question ?? q.question_text ?? `Q${idx + 1}`,
      options,
      correct:  -1, // يحسبها السيرفر
      _realId:  q.question_id ?? q.id,
    };
  }
  // Mock format: options as array + correct as index
  if (Array.isArray(q.options) && typeof q.correct === 'number') return { ...q, _realId: q.id ?? q.question_id };
  // choices format: [{id, text, is_correct}]
  if (Array.isArray(q.choices)) {
    const options = q.choices.map(c => c.text ?? c.answer_text ?? String(c));
    const correct = q.choices.findIndex(c => c.id === q.correct_choice_id || c.is_correct);
    return { id: q.id ?? q.question_id ?? idx, question: q.question ?? q.question_text, options, correct: correct >= 0 ? correct : 0, _realId: q.id ?? q.question_id };
  }
  // fallback
  return { id: idx, question: q.question ?? q.question_text ?? `Q${idx}`, options: [], correct: 0, _realId: q.id ?? q.question_id };
};

const Quiz = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLanguage();

  // ── Auth guard: الزائر يتحوّل لتسجيل الدخول مع رابط العودة ──
  const isLoggedIn = !!localStorage.getItem('token');
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname), { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // جلب بيانات الدرس من location.state
  const lesson     = location.state?.lesson;
  const subjectId  = location.state?.subjectId;
  const teacherId  = location.state?.teacherId;  // مطلوب لجلب كويز من real API

  // 1. حالات التحكم (State)
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600);
  const [submitting, setSubmitting] = useState(false);
  // real API params — محتاجينهم عشان نسلم الإجابات
  const [realParams, setRealParams] = useState(null); // { subjectId, teacherId, lessonId, videoId, quizId }

  const questions = quizData?.questions || [];

  // جلب بيانات الاختبار — real API أولاً، fallback لـ mock
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!lesson || !subjectId) {
          setError('بيانات الدرس غير متوفرة. يرجى العودة للدرس أولاً.');
          setLoading(false);
          return;
        }

        // ── 1. Real API: subjects/{s}/teachers/{t}/lessons/{l}/content ──────────
        if (teacherId) {
          try {
            const contentRes = await api.get(
              `/teachers/${teacherId}/lessons/${lesson.id}/content`
            );
            const videos = contentRes.data?.videos || [];
            // ابحث عن أول video عنده quiz بأسئلة
            for (const video of videos) {
              const quizzes = video.quizzes || [];
              for (const q of quizzes) {
                const normalizedQs = (q.questions || []).map(normalizeQuestion);
                if (normalizedQs.length > 0) {
                  setQuizData({
                    title:       q.lesson_name ?? lesson.title ?? 'اختبار',
                    subtitle:    video.video_title ?? '',
                    lessonTitle: q.lesson_name ?? lesson.title ?? '',
                    questions:   normalizedQs,
                    timeLimit:   600,
                  });
                  setRealParams({
                    subjectId,
                    teacherId,
                    lessonId:  lesson.id,
                    videoId:   video.video_id,
                    quizId:    q.quiz_id,
                  });
                  setTimeLeft(600);
                  setLoading(false);
                  return; // تم التحميل من real API
                }
              }
            }
          } catch (err) {
            console.warn('Real API quiz load failed:', err.message);
          }
        }

        // لو مفيش quiz من الـ API، اعرض رسالة
        if (!quizData) {
          setError('لا يوجد اختبار متاح لهذا الدرس.');
        }
      } catch (err) {
        console.error('Quiz loading error:', err);
        setError('تعذر تحميل الاختبار.');
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id, subjectId, teacherId]);

  // دالة العداد التنازلي
  useEffect(() => {
    if (timeLeft > 0 && quizData) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (timeLeft === 0) {
      handleFinishQuiz(); // لو الوقت خلص سلم الامتحان
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, quizData]);

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
    // Save current answer before finishing (if any selected)
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

    // ── Real API submit ────────────────────────────────────────────────────
    if (realParams) {
      try {
        const token = localStorage.getItem('token');
        const { subjectId: sId, teacherId: tId, lessonId: lId, videoId, quizId } = realParams;

        // حوّل الإجابات: [{ question_id, answer_text }]
        const answers = Object.entries(finalAnswers).map(([qIdx, aIdx]) => ({
          question_id: questions[Number(qIdx)]?._realId ?? questions[Number(qIdx)]?.id,
          answer_text:  questions[Number(qIdx)]?.options?.[aIdx] ?? String(aIdx),
        }));

        const res = await api.post(
          `/quiz/${quizId}/answer`,
          { answers }
        );

        const serverScore = res.data?.score ?? finalScore;

        // حفظ إتمام الدرس في localStorage
        try {
          const completionData = JSON.parse(localStorage.getItem('lessonCompletions') || '{}');
          completionData[lId] = {
            subjectId: String(sId),
            completed: true,
            completedAt: new Date().toISOString().split('T')[0],
          };
          localStorage.setItem('lessonCompletions', JSON.stringify(completionData));
        } catch { /* غير حرج */ }

        navigate('/quiz-results', {
          state: {
            score:       serverScore,
            total:       questions.length,
            questions,
            userAnswers: finalAnswers,
            lesson,
            subjectId:   sId,
            teacherId:   tId,
            subjectName: quizData?.subjectName,
            fromRealApi: true,
          },
        });
        return;
      } catch (err) {
        console.error('Real API submit error:', err);
        // لو السيرفر وقع → نعرض خطأ بدل ما نروح لنتيجة غلط
        setError('تعذّر إرسال الإجابات للسيرفر. تأكد من اتصالك وحاول مرة أخرى.');
        setSubmitting(false);
        return;
      } finally {
        setSubmitting(false);
      }
    }

    // ── Mock / local fallback ──────────────────────────────────────────────
    setSubmitting(false);
    navigate('/quiz-results', {
      state: {
        score:       finalScore,
        total:       questions.length,
        questions,
        userAnswers: finalAnswers,
        lesson,
        subjectId,
        subjectName: quizData?.subjectName,
      },
    });
  };

  // العودة للدرس الحالي
  const handleBackToLesson = () => {
    if (lesson && subjectId) {
      navigate('/course-details', { state: { lesson, subjectId } });
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
