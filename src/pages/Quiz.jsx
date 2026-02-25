import { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Clock, Loader2, AlertCircle } from "lucide-react";
import { useLanguage } from '../context/LanguageContext';

const Quiz = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLanguage();

  // جلب بيانات الدرس من location.state
  const lesson = location.state?.lesson;
  const subjectId = location.state?.subjectId;

  // 1. حالات التحكم (State)
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [userAnswers, setUserAnswers] = useState({}); // New: Track all answers
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600);

  const questions = quizData?.questions || [];

  // جلب بيانات الاختبار من json-server
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

        // البحث عن الاختبار بناءً على lessonId و subjectId
        const response = await axios.get(
          `http://localhost:3001/quizzes?lessonId=${lesson.id}&subjectId=${subjectId}`
        );

        if (response.data && response.data.length > 0) {
          const quiz = response.data[0];
          setQuizData(quiz);
          setTimeLeft(quiz.timeLimit || 600);
        } else {
          // لو مفيش اختبار محدد، نجيب أول اختبار للمادة
          const fallbackResponse = await axios.get(
            `http://localhost:3001/quizzes?subjectId=${subjectId}`
          );
          if (fallbackResponse.data && fallbackResponse.data.length > 0) {
            const quiz = fallbackResponse.data[0];
            setQuizData(quiz);
            setTimeLeft(quiz.timeLimit || 600);
          } else {
            setError('لا يوجد اختبار متاح لهذا الدرس.');
          }
        }
      } catch (err) {
        console.error("Quiz loading error:", err);
        setError('تعذر تحميل الاختبار. تأكد من تشغيل json-server.');
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [lesson, subjectId]);

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
  const handleNextQuestion = () => {
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
      finishQuizLogic(updatedAnswers);
    }
  };

  // إنهاء الامتحان
  const handleFinishQuiz = () => {
    // Save current answer before finishing (if any selected)
    let finalAnswers = { ...userAnswers };
    let finalScore = score;

    if (selectedAnswer !== null) {
      finalAnswers[currentQuestion] = selectedAnswer;
      if (selectedAnswer === questions[currentQuestion].correct) {
        finalScore += 1;
      }
    }

    finishQuizLogic(finalAnswers, finalScore);
  };

  const finishQuizLogic = (finalAnswers, finalScore = score) => {
    navigate('/quiz-results', {
      state: {
        score: finalScore,
        total: questions.length,
        questions: questions,
        userAnswers: finalAnswers,
        lesson: lesson,
        subjectId: subjectId,
        subjectName: quizData?.subjectName,
      }
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
          <button onClick={handleFinishQuiz} className="text-gray-400 hover:text-red-500 transition">
            <span className="text-sm font-bold">{t('finish_quiz')}</span>
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
            disabled={selectedAnswer === null}
            className="bg-[#103B66] hover:bg-[#0c2d4d] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:shadow-none transition flex items-center gap-2"
          >
            {currentQuestion === questions.length - 1 ? t('finish_quiz') : t('next_question')}
            <ArrowRight className={`w-5 h-5 ${lang === 'en' ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </main>
    </div>
  );
};

export default Quiz;
