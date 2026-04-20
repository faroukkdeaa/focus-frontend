import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Save, Loader2, AlertTriangle } from 'lucide-react';
import api from '../api/api';

const OPTION_KEYS_NUMERIC = ['option_1', 'option_2', 'option_3', 'option_4'];
const OPTION_KEYS_ALPHA = ['option_a', 'option_b', 'option_c', 'option_d'];

const toOptionText = (value) => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    return value.text ?? value.answer_text ?? value.option_text ?? value.label ?? '';
  }
  return '';
};

const toFourOptions = (values) => {
  const result = (Array.isArray(values) ? values : [])
    .slice(0, 4)
    .map((value) => toOptionText(value));

  while (result.length < 4) result.push('');
  return result;
};

const clampAnswerIndex = (idx) => {
  if (!Number.isFinite(idx)) return 0;
  return Math.max(0, Math.min(3, idx));
};

const detectCorrectAnswerIndex = (question, options) => {
  const directIndex = Number(question?.correct_answer_index);
  if (Number.isFinite(directIndex)) return clampAnswerIndex(directIndex);

  if (Array.isArray(question?.choices)) {
    const choiceIndex = question.choices.findIndex(
      (choice) => choice?.is_correct === true || choice?.id === question?.correct_choice_id
    );
    if (choiceIndex >= 0) return clampAnswerIndex(choiceIndex);
  }

  const rawAnswer = question?.correct_answer ?? question?.correct_option ?? question?.answer;
  const numericAnswer = Number(rawAnswer);
  if (Number.isFinite(numericAnswer)) {
    if (numericAnswer >= 0 && numericAnswer <= 3) return clampAnswerIndex(numericAnswer);
    if (numericAnswer >= 1 && numericAnswer <= 4) return clampAnswerIndex(numericAnswer - 1);
  }

  if (typeof rawAnswer === 'string') {
    const normalized = rawAnswer.trim().toLowerCase();
    const letterMap = { a: 0, b: 1, c: 2, d: 3 };

    if (letterMap[normalized] !== undefined) return letterMap[normalized];

    const optionMatch = normalized.match(/option[_\s-]?([1-4]|[a-d])/);
    if (optionMatch?.[1]) {
      const value = optionMatch[1];
      if (letterMap[value] !== undefined) return letterMap[value];
      return clampAnswerIndex(Number(value) - 1);
    }

    const optionTextIndex = options.findIndex((opt) => opt.trim() === rawAnswer.trim());
    if (optionTextIndex >= 0) return clampAnswerIndex(optionTextIndex);
  }

  return 0;
};

const normalizeQuestionForEditor = (rawQuestion, index) => {
  const question =
    rawQuestion?.attributes ||
    rawQuestion?.question ||
    rawQuestion?.data ||
    rawQuestion ||
    {};

  const hasNumericOptions = OPTION_KEYS_NUMERIC.some((key) => question?.[key] !== undefined);
  const hasAlphaOptions = OPTION_KEYS_ALPHA.some((key) => question?.[key] !== undefined);

  let options = ['', '', '', ''];
  if (hasNumericOptions || hasAlphaOptions) {
    const keys = hasNumericOptions ? OPTION_KEYS_NUMERIC : OPTION_KEYS_ALPHA;
    options = toFourOptions(keys.map((key) => question?.[key] ?? ''));
  } else if (Array.isArray(question?.choices)) {
    options = toFourOptions(question.choices);
  } else if (Array.isArray(question?.options)) {
    options = toFourOptions(question.options);
  }

  const correctAnswerIndex = detectCorrectAnswerIndex(question, options);

  return {
    id: question?.id ?? question?.question_id ?? rawQuestion?.id ?? `q-${index + 1}`,
    question_text: question?.question_text ?? question?.question ?? '',
    options,
    correct_answer_index: correctAnswerIndex,
    correct_answer: `option_${correctAnswerIndex + 1}`,
  };
};

const EditQuiz = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    const fetchQuiz = async () => {
      if (!id) {
        if (isActive) {
          setError('معرّف الاختبار غير متوفر.');
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // 1. Dual-fetch strategy (in case quizzes-details is missing the questions array)
        let responseData;
        try {
          const { data } = await api.get(`/quizzes-details/${id}`);
          responseData = data?.quiz || data?.data?.quiz || data?.data || data;
        } catch (err) {
          const fallback = await api.get(`/quizzes/${id}`);
          responseData = fallback.data?.quiz || fallback.data?.data || fallback.data;
        }

        if (isActive) {
          setQuizTitle(responseData?.lesson_name || responseData?.title || 'اختبار بدون عنوان');
        }

        // 2. Extract raw questions array
        let rawQuestions = responseData?.questions?.data || responseData?.questions || [];
        if (typeof rawQuestions === 'object' && !Array.isArray(rawQuestions)) {
          rawQuestions = Object.values(rawQuestions);
        }

        console.log('🔍 RAW QUESTIONS API DEBUG:', rawQuestions);

        // 3. Bulletproof Normalization
        const normalized = rawQuestions.map((q, idx) => {
          // Unnest if q is wrapped in another object
          const actualQ = (q.question && typeof q.question === 'object') ? q.question : q;

          // Deep search for question text
          const qText = actualQ.question_text || actualQ.question || actualQ.title || actualQ.text || '';

          // Deep search for options
          let opts = ['', '', '', ''];
          if (actualQ.option_1 !== undefined || actualQ.option_a !== undefined) {
            opts = [
              actualQ.option_1 || actualQ.option_a || '',
              actualQ.option_2 || actualQ.option_b || '',
              actualQ.option_3 || actualQ.option_c || '',
              actualQ.option_4 || actualQ.option_d || ''
            ];
          } else if (Array.isArray(actualQ.choices)) {
            opts = [
              actualQ.choices[0]?.text || actualQ.choices[0] || '',
              actualQ.choices[1]?.text || actualQ.choices[1] || '',
              actualQ.choices[2]?.text || actualQ.choices[2] || '',
              actualQ.choices[3]?.text || actualQ.choices[3] || ''
            ];
          } else if (Array.isArray(actualQ.options)) {
            opts = [
              actualQ.options[0] || '',
              actualQ.options[1] || '',
              actualQ.options[2] || '',
              actualQ.options[3] || ''
            ];
          }

          return {
            id: actualQ.id || actualQ.question_id || idx,
            question_text: typeof qText === 'string' ? qText : 'نص السؤال غير مدعوم',
            options: opts,
            correct_answer: actualQ.correct_answer || actualQ.correct_choice || 'option_1'
          };
        });

        if (isActive) {
          setQuestions(normalized);
        }
      } catch (err) {
        console.error('Error fetching quiz for edit:', err);
        if (isActive) {
          setError('تعذّر تحميل بيانات الاختبار للتعديل.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchQuiz();
    return () => {
      isActive = false;
    };
  }, [id]);

  const updateQuestionText = (index, text) => {
    const updated = [...questions];
    updated[index].question_text = text;
    setQuestions(updated);
  };

  const updateOption = (qIndex, optIndex, text) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = text;
    setQuestions(updated);
  };

  const updateCorrectAnswer = (qIndex, answerKey) => {
    const updated = [...questions];
    updated[qIndex].correct_answer = answerKey;
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([...questions, { id: null, question_text: '', options: ['', '', '', ''], correct_answer: 'option_1' }]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        title: quizTitle,
        lesson_name: quizTitle,
        questions: questions.map((q) => ({
          id: q.id,
          question_text: q.question_text,
          option_1: q.options[0],
          option_2: q.options[1],
          option_3: q.options[2],
          option_4: q.options[3],
          correct_answer: q.correct_answer,
        })),
      };

      await api.put(`/quizzes/${id}`, payload);
      alert('تم حفظ التعديلات بنجاح!');
      navigate(-1);
    } catch (err) {
      console.error('Save error:', err);
      alert('حدث خطأ أثناء الحفظ. تأكد من اتصالك.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Cairo']" dir="rtl">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-[#103B66] dark:text-blue-400 truncate">
              {quizTitle || 'تعديل الاختبار'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-[#103B66] dark:hover:text-white transition"
            >
              <ArrowRight className="w-4 h-4" />
              عودة
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-[#103B66] dark:bg-blue-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8 pb-32">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#103B66] dark:text-blue-400 mb-3" />
            <p className="text-sm font-medium">جارٍ تحميل بيانات الاختبار...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-4 flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : (
          <>
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <label className="block text-gray-400 text-sm font-bold mb-2">عنوان الاختبار</label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-6">
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="bg-gray-800 p-6 rounded-xl border border-gray-700 relative">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-violet-400">سؤال {qIndex + 1}</h3>
                    <button
                      onClick={() => removeQuestion(qIndex)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      حذف السؤال
                    </button>
                  </div>

                  <textarea
                    value={q.question_text}
                    onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                    placeholder="اكتب صيغة السؤال هنا..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white mb-4 h-24 focus:outline-none focus:border-violet-500"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((optNum, oIndex) => {
                      const optionKey = `option_${optNum}`;
                      return (
                        <div key={optNum} className="flex items-center gap-3 bg-gray-900 p-3 rounded-lg border border-gray-700">
                          <input
                            type="radio"
                            name={`correct_${qIndex}`}
                            checked={q.correct_answer === optionKey}
                            onChange={() => updateCorrectAnswer(qIndex, optionKey)}
                            className="w-5 h-5 accent-violet-500"
                          />
                          <input
                            type="text"
                            value={q.options[oIndex]}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            placeholder={`اختيار ${optNum}`}
                            className="flex-1 bg-transparent border-none text-white focus:outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addQuestion}
              className="w-full py-4 border-2 border-dashed border-gray-600 text-gray-400 rounded-xl hover:border-violet-500 hover:text-violet-400 transition font-bold"
            >
              + إضافة سؤال جديد
            </button>
          </>
        )}
      </main>
    </div>
  );
};

export default EditQuiz;
