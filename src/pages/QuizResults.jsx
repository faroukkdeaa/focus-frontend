import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import axios from 'axios';
import { CheckCircle2, XCircle, AlertCircle, RefreshCcw, ArrowRight, Home, Award, Brain } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const API = 'http://localhost:3001';

const QuizResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const savedRef = useRef(false); // prevent double-save in StrictMode
  
  // Get data from navigation state
  const { score, total, questions, userAnswers, lesson, subjectId, subjectName } = location.state || {};

  const percentage = location.state ? Math.round((score / total) * 100) : 0;

  // ── Save result to db when page mounts ───────────────────────────────────
  useEffect(() => {
    if (!location.state || savedRef.current) return;
    savedRef.current = true;

    const saveResult = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = String(storedUser.id || '');
        if (!userId) return;

        // 1. حفظ نتيجة الكويز في user_quiz_results
        await axios.post(`${API}/user_quiz_results`, {
          userId,
          lessonTitle: lesson?.title || '',
          subjectName: subjectName || '',
          subjectId:   String(subjectId || ''),
          score,
          total,
          percentage,
          date: new Date().toISOString().split('T')[0],
        });

        // 2. لو النتيجة أقل من 50% — أضف ثغرة جديدة في user_remediation_gaps
        if (percentage < 50 && lesson) {
          const gapLabel = `${subjectName || ''} - ${lesson.title || ''}`;

          // تحقق أن الثغرة غير موجودة مسبقاً
          const existing = await axios.get(
            `${API}/user_remediation_gaps?userId=${userId}&gap=${encodeURIComponent(gapLabel)}`
          );
          if (existing.data.length === 0) {
            await axios.post(`${API}/user_remediation_gaps`, {
              userId,
              gap:        gapLabel,
              subject:    subjectName || '',
              subjectId:  subjectId || '',
              lessonId:   lesson.id || '',
              lessonTitle: lesson.title || '',
              difficulty: percentage < 30 ? 'hard' : 'medium',
              completed:  false,
            });
          }

          // 3. حدّث user_dashboards weaknesses
          const udRes = await axios.get(`${API}/user_dashboards?userId=${userId}`);
          if (udRes.data.length > 0) {
            const ud = udRes.data[0];
            const current = ud.weaknesses || [];
            if (!current.includes(gapLabel)) {
              await axios.patch(`${API}/user_dashboards/${ud.id}`, {
                weaknesses: [...current, gapLabel],
              });
            }
          }
        }

        // 4. حدّث improvementRate في user_dashboards بناءً على النتيجة
        const udRes2 = await axios.get(`${API}/user_dashboards?userId=${userId}`);
        if (udRes2.data.length > 0) {
          const ud = udRes2.data[0];
          const prevRate = ud.stats?.improvementRate || 0;
          const newRate = Math.round((prevRate + percentage) / 2);
          await axios.patch(`${API}/user_dashboards/${ud.id}`, {
            stats: { ...ud.stats, improvementRate: newRate },
          });
        }
      } catch (err) {
        console.error('Save quiz result error:', err);
      }
    };

    saveResult();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect if no data (e.g., direct access)
  if (!location.state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="bg-yellow-50 p-8 rounded-2xl text-center border border-yellow-200 max-w-md">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-yellow-700 mb-4">{t('no_results')}</p>
            <button onClick={() => navigate('/dashboard')} className="text-[#103B66] hover:underline font-bold">
                {t('back_home')}
            </button>
        </div>
      </div>
    );
  }

  let feedbackMessage = "";
  let feedbackColor = "";
  
  if (percentage >= 90) {
    feedbackMessage = t('excellent');
    feedbackColor = "text-green-600";
  } else if (percentage >= 75) {
    feedbackMessage = t('very_good');
    feedbackColor = "text-blue-600";
  } else if (percentage >= 50) {
    feedbackMessage = t('good');
    feedbackColor = "text-yellow-600";
  } else {
    feedbackMessage = t('needs_work');
    feedbackColor = "text-red-600";
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 font-['Cairo']" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Score Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-full h-2 ${
                percentage >= 50 ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            
            <div className="w-32 h-32 mx-auto bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6 relative">
                {/* Circular Progress (Simplified Visual) */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="64"
                        cy="64"
                        r="60"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200 dark:text-gray-600"
                    />
                    <circle
                        cx="64"
                        cy="64"
                        r="60"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={377}
                        strokeDashoffset={377 - (377 * percentage) / 100}
                        className={percentage >= 50 ? 'text-green-500' : 'text-red-500'}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-[#103B66]">{percentage}%</span>
                </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t('quiz_result')}</h1>
            <p className={`text-lg font-medium mb-1 ${feedbackColor}`}>{feedbackMessage}</p>
            <p className="text-gray-500 dark:text-gray-400">
                {t('correct_of_prefix')} <span className="font-bold text-[#103B66]">{score}</span> {t('correct_of_middle')} <span className="font-bold text-[#103B66]">{total}</span> {t('correct_of_suffix')}
            </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
                onClick={() => navigate('/quiz', { state: { lesson, subjectId } })}
                className="bg-[#103B66] text-white py-4 rounded-xl font-bold hover:bg-[#0c2d4d] transition flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10"
            >
                <RefreshCcw className="w-5 h-5" /> {t('retake_quiz')}
            </button>
            <button 
                onClick={() => {
                    if (lesson && subjectId) {
                        navigate('/course-details', { state: { lesson, subjectId } });
                    } else {
                        navigate('/dashboard');
                    }
                }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-4 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2"
            >
                <ArrowRight className={`w-5 h-5 ${lang === 'en' ? 'rotate-180' : ''}`} /> {t('back_to_lesson')}
            </button>
        </div>

        {/* Weakness Report CTA */}
        <button
            onClick={() =>
                navigate('/weakness-report', {
                    state: { score, total, questions, userAnswers, lesson, subjectId },
                })
            }
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold border-2 border-[#103B66] text-[#103B66] hover:bg-[#103B66] hover:text-white transition-all group"
        >
            <Brain className="w-5 h-5 group-hover:animate-pulse" />
            {t('view_weakness_report')}
        </button>

        {/* Answer Review Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <Award className="w-6 h-6 text-[#103B66]" />
                {t('review_answers')}
            </h2>

            <div className="space-y-6">
                {questions.map((q, index) => {
                    const userAnswerIndex = userAnswers[index];
                    const isCorrect = userAnswerIndex === q.correct;
                    const isSkipped = userAnswerIndex === null || userAnswerIndex === undefined;

                    return (
                        <div key={index} className={`p-4 rounded-xl border ${
                            isCorrect ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'
                        }`}>
                            <div className="flex items-start gap-3">
                                <div className={`mt-1 min-w-[24px] h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                    isCorrect ? 'bg-green-500' : 'bg-red-500'
                                }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 dark:text-white mb-3">{q.question}</h3>
                                    
                                    <div className="space-y-2">
                                        {/* User's Answer */}
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">{t('your_answer')}:</span>
                                            {isSkipped ? (
                                                <span className="text-orange-500 font-medium flex items-center gap-1">
                                                    <AlertCircle className="w-4 h-4" /> {t('not_answered')}
                                                </span>
                                            ) : (
                                                <span className={`font-bold flex items-center gap-1 ${
                                                    isCorrect ? 'text-green-700' : 'text-red-700'
                                                }`}>
                                                    {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                    {q.options[userAnswerIndex]}
                                                </span>
                                            )}
                                        </div>

                                        {/* Correct Answer (if wrong) */}
                                        {!isCorrect && (
                                            <div className="flex items-center gap-2 text-sm bg-white/50 dark:bg-gray-700/50 p-2 rounded-lg inline-block">
                                                <span className="text-gray-500 dark:text-gray-400">{t('correct_answer')}:</span>
                                                <span className="font-bold text-green-700 flex items-center gap-1">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    {q.options[q.correct]}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

      </div>
    </div>
  );
};

export default QuizResults;
