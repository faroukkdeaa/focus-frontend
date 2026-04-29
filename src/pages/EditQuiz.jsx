import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Save, Loader2, AlertTriangle, Trash2, Plus, Check } from 'lucide-react';
import api from '../api/api';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

/* ════════════════════════════════════════════════════
   THEME FACTORY
════════════════════════════════════════════════════ */
function buildTheme(dark) {
  return dark
    ? {
        bg:           "#0B1120",
        bgPanel:      "#0D1526",
        bgCard:       "rgba(255,255,255,0.035)",
        border:       "rgba(255,255,255,0.08)",
        borderAccent: "rgba(79,70,229,0.38)",
        borderRed:    "rgba(239,68,68,0.22)",
        accent:       "#4F46E5",
        accentDim:    "rgba(79,70,229,0.14)",
        iconA:        "#38BDF8",
        iconBgA:      "rgba(56,189,248,0.10)",
        iconBorderA:  "rgba(56,189,248,0.22)",
        textPrimary:  "#F8FAFC",
        textMuted:    "#94A3B8",
        textDim:      "#475569",
        shadowCard:   "0 1px 1px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.35)",
        redIcon:      "#F87171",
        redDim:       "rgba(248,113,113,0.10)",
        redBorder:    "rgba(248,113,113,0.20)",
        green:        "#34D399",
        greenDim:     "rgba(52,211,153,0.12)",
        greenBorder:  "rgba(52,211,153,0.22)",
      }
    : {
        bg:           "#F8FAFC",
        bgPanel:      "#FFFFFF",
        bgCard:       "#FFFFFF",
        border:       "#E2E8F0",
        borderAccent: "rgba(15,76,129,0.28)",
        borderRed:    "rgba(239,68,68,0.20)",
        accent:       "#0F4C81",
        accentDim:    "rgba(15,76,129,0.08)",
        iconA:        "#0F4C81",
        iconBgA:      "rgba(15,76,129,0.08)",
        iconBorderA:  "rgba(15,76,129,0.18)",
        textPrimary:  "#0F172A",
        textMuted:    "#64748B",
        textDim:      "#94A3B8",
        shadowCard:   "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)",
        redIcon:      "#EF4444",
        redDim:       "rgba(239,68,68,0.08)",
        redBorder:    "rgba(239,68,68,0.18)",
        green:        "#059669",
        greenDim:     "rgba(5,150,105,0.08)",
        greenBorder:  "rgba(5,150,105,0.18)",
      };
}

const glass = (T, extra) => ({
  background:   T.bgCard,
  border:       `1px solid ${T.border}`,
  borderRadius: "16px",
  boxShadow:    T.shadowCard,
  ...extra,
});

const transition = {
  transition: "all 0.25s ease",
};

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
  const { theme } = useTheme();
  const toast = useToast();
  const isDark = theme === 'dark';
  const T = buildTheme(isDark);

  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const focusOptionInput = (questionIndex, optionIndex) => {
    requestAnimationFrame(() => {
      const target = document.querySelector(`[data-option-input="${questionIndex}-${optionIndex}"]`);
      if (target) {
        target.focus();
      }
    });
  };

  const handleOptionEnter = (event, questionIndex, optionIndex) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();

    const currentQuestion = questions[questionIndex];
    const maxOptionIndex = (currentQuestion?.options?.length || 4) - 1;

    if (optionIndex < maxOptionIndex) {
      focusOptionInput(questionIndex, optionIndex + 1);
      return;
    }

    const nextQuestionIndex = questions.length;
    addQuestion();
    setTimeout(() => {
      focusOptionInput(nextQuestionIndex, 0);
    }, 0);
  };

  const handleSave = async () => {
    setIsSaving(true);
    let isSaved = false;
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
      isSaved = true;
      alert('تم حفظ التعديلات بنجاح!');
      navigate(-1);
    } catch (err) {
      console.error('Save error:', err);
      alert('حدث خطأ أثناء الحفظ. تأكد من اتصالك.');
    } finally {
      setIsSaving(false);
    }
    return isSaved;
  };

  useEffect(() => {
    const onGlobalSave = async (event) => {
      const isSaveShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's';
      if (!isSaveShortcut) return;

      event.preventDefault();
      if (isSaving || isDeleting || isLoading) return;

      const saved = await handleSave();
      if (saved) {
        toast.success('تم الحفظ بنجاح');
      }
    };

    window.addEventListener('keydown', onGlobalSave);
    return () => window.removeEventListener('keydown', onGlobalSave);
  }, [isSaving, isDeleting, isLoading, handleSave, toast]);

  const handleDelete = async () => {
    if (!id) {
      alert('معرّف الاختبار غير متوفر.');
      return;
    }

    const confirmed = window.confirm('هل أنت متأكد من حذف هذا العنصر نهائياً؟');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await api.delete(`/quizzes/${id}`);
      alert('تم حذف الاختبار بنجاح.');
      navigate('/teacher-analytics', { replace: true });
    } catch (err) {
      console.error('Delete quiz error:', err);
      alert('تعذّر حذف الاختبار. حاول مرة أخرى.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ ...transition, background: T.bg, minHeight: "100vh", fontFamily: "'Cairo', sans-serif" }} dir="rtl">
      <header
        style={{
          ...transition,
          position: "sticky", top: 0, zIndex: 20,
          background: isDark ? "rgba(11,17,32,0.88)" : "rgba(248,250,252,0.90)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div style={{ maxWidth: "1152px", margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{ fontSize: "1.1rem", fontWeight: 800, color: T.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {quizTitle || 'تعديل الاختبار'}
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                ...transition,
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 12px", borderRadius: "8px",
                background: "transparent", border: "none", cursor: "pointer",
                color: T.textMuted, fontSize: "0.875rem", fontWeight: 700
              }}
              onMouseEnter={e => e.currentTarget.style.color = T.textPrimary}
              onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
            >
              <ArrowRight style={{ width: "16px", height: "16px" }} />
              عودة
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving || isDeleting}
              style={{
                ...transition,
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 24px", borderRadius: "8px",
                background: T.accent, border: "none",
                color: "#FFFFFF", fontSize: "0.875rem", fontWeight: 700, cursor: (isSaving || isDeleting) ? "not-allowed" : "pointer",
                opacity: (isSaving || isDeleting) ? 0.6 : 1,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }}
              onMouseEnter={e => { if(!isSaving && !isDeleting) e.currentTarget.style.opacity = "0.9" }}
              onMouseLeave={e => { if(!isSaving && !isDeleting) e.currentTarget.style.opacity = "1" }}
            >
              {isSaving ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} /> : <Save style={{ width: "16px", height: "16px" }} />}
              {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 24px 128px", display: "flex", flexDirection: "column", gap: "32px" }}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", color: T.textMuted }}>
            <Loader2 style={{ width: "32px", height: "32px", color: T.accent, animation: "spin 1s linear infinite", marginBottom: "12px" }} />
            <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>جارٍ تحميل بيانات الاختبار...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "16px", borderRadius: "12px", border: `1px solid ${T.redBorder}`, background: T.redDim, display: "flex", alignItems: "center", gap: "8px", color: T.redIcon }}>
            <AlertTriangle style={{ width: "20px", height: "20px", flexShrink: 0 }} />
            <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>{error}</p>
          </div>
        ) : (
          <>
            <div style={{ ...glass(T, { padding: "24px" }) }}>
              <label style={{ display: "block", color: T.textMuted, fontSize: "0.875rem", fontWeight: 700, marginBottom: "8px" }}>عنوان الاختبار</label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                style={{
                  ...transition,
                  width: "100%", background: T.bgPanel, border: `1px solid ${T.border}`,
                  borderRadius: "8px", padding: "14px 16px", color: T.textPrimary,
                  fontSize: "1rem", fontWeight: 600, outline: "none"
                }}
                onFocus={e => e.currentTarget.style.border = `1px solid ${T.borderAccent}`}
                onBlur={e => e.currentTarget.style.border = `1px solid ${T.border}`}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {questions.map((q, qIndex) => (
                <div key={qIndex} style={{ ...glass(T, { padding: "32px" }), position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: T.iconBgA, border: `1px solid ${T.iconBorderA}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.iconA, fontSize: "0.875rem", fontWeight: 800 }}>
                        {qIndex + 1}
                      </div>
                      <h3 style={{ fontSize: "1rem", fontWeight: 800, color: T.textPrimary }}>السؤال</h3>
                    </div>
                    <button
                      onClick={() => removeQuestion(qIndex)}
                      style={{
                        ...transition,
                        display: "flex", alignItems: "center", gap: "4px",
                        background: "transparent", border: "none", cursor: "pointer",
                        color: T.textMuted, fontSize: "0.875rem", fontWeight: 700
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = T.redIcon}
                      onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
                    >
                      <Trash2 style={{ width: "16px", height: "16px" }} />
                      إزالة
                    </button>
                  </div>

                  <textarea
                    value={q.question_text}
                    onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                    placeholder="اكتب صيغة السؤال هنا..."
                    style={{
                      ...transition,
                      width: "100%", background: T.bgPanel, border: `1px solid ${T.border}`,
                      borderRadius: "8px", padding: "16px", color: T.textPrimary,
                      fontSize: "0.875rem", fontWeight: 600, outline: "none", resize: "vertical", minHeight: "100px",
                      marginBottom: "24px"
                    }}
                    onFocus={e => e.currentTarget.style.border = `1px solid ${T.borderAccent}`}
                    onBlur={e => e.currentTarget.style.border = `1px solid ${T.border}`}
                  />

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
                    {[1, 2, 3, 4].map((optNum, oIndex) => {
                      const optionKey = `option_${optNum}`;
                      const isCorrect = q.correct_answer === optionKey;
                      return (
                        <div
                          key={optNum}
                          onClick={() => updateCorrectAnswer(qIndex, optionKey)}
                          style={{
                            ...transition,
                            display: "flex", alignItems: "center", gap: "12px",
                            background: isCorrect ? T.greenDim : T.bgPanel,
                            border: `1px solid ${isCorrect ? T.greenBorder : T.border}`,
                            borderRadius: "8px", padding: "12px", cursor: "pointer"
                          }}
                          onMouseEnter={e => {
                            if (!isCorrect) e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)";
                          }}
                          onMouseLeave={e => {
                            if (!isCorrect) e.currentTarget.style.background = T.bgPanel;
                          }}
                        >
                          <button
                            type="button"
                            style={{
                              ...transition,
                              width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0,
                              background: isCorrect ? T.green : "transparent",
                              border: `2px solid ${isCorrect ? T.green : T.border}`,
                              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                            }}
                          >
                            {isCorrect && <Check style={{ width: "14px", height: "14px", color: "#FFF" }} />}
                          </button>
                          <input
                            type="text"
                            value={q.options[oIndex]}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            onKeyDown={(e) => handleOptionEnter(e, qIndex, oIndex)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder={`اختيار ${optNum}`}
                            data-option-input={`${qIndex}-${oIndex}`}
                            style={{
                              flex: 1, background: "transparent", border: "none",
                              color: isCorrect ? (isDark ? T.green : T.textPrimary) : T.textPrimary,
                              fontSize: "0.875rem", fontWeight: 600, outline: "none", cursor: "text"
                            }}
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
              style={{
                ...transition,
                width: "100%", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px",
                background: T.bgCard, border: `2px dashed ${T.border}`, borderRadius: "16px", cursor: "pointer",
                color: T.textMuted
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = T.accentDim;
                e.currentTarget.style.border = `2px dashed ${T.borderAccent}`;
                e.currentTarget.style.color = T.accent;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = T.bgCard;
                e.currentTarget.style.border = `2px dashed ${T.border}`;
                e.currentTarget.style.color = T.textMuted;
              }}
            >
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: T.bgPanel, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: "inherit", ...transition }}>
                <Plus style={{ width: "20px", height: "20px" }} />
              </div>
              <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>إضافة سؤال جديد</span>
            </button>

            {/* Danger Zone */}
            <section style={{ ...glass(T, { padding: "32px", borderColor: "rgba(244, 63, 94, 0.2)" }), marginTop: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: T.redIcon }}>منطقة الخطر (Danger Zone)</h2>
              </div>
              <p style={{ fontSize: "0.875rem", color: T.textMuted, marginBottom: "24px" }}>
                الإجراءات هنا لا يمكن التراجع عنها. سيتم حذف هذا الاختبار نهائياً.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || isSaving}
                  style={{
                    ...transition,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", borderRadius: "10px",
                    background: T.redDim, border: `1px solid ${T.redBorder}`, color: T.redIcon, fontSize: "0.875rem", fontWeight: 700,
                    cursor: (isDeleting || isSaving) ? "not-allowed" : "pointer",
                    opacity: (isDeleting || isSaving) ? 0.6 : 1
                  }}
                  onMouseEnter={e => {
                    if (!isDeleting && !isSaving) {
                      e.currentTarget.style.background = "rgba(244, 63, 94, 0.2)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isDeleting && !isSaving) {
                      e.currentTarget.style.background = T.redDim;
                    }
                  }}
                >
                  <Trash2 style={{ width: "18px", height: "18px" }} />
                  <span>{isDeleting ? 'جاري الحذف...' : 'حذف الاختبار'}</span>
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default EditQuiz;
