import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/api';
import {
  ArrowRight, AlertTriangle, CheckCircle2, XCircle,
  Brain, BookOpen, RefreshCcw, TrendingUp, Zap, Home, Target,
} from 'lucide-react';

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
        orangeIcon:   "#F97316",
        orangeDim:    "rgba(249,115,22,0.10)",
        orangeBorder: "rgba(249,115,22,0.20)",
        violetIcon:   "#A855F7",
        violetDim:    "rgba(168,85,247,0.10)",
        violetBorder: "rgba(168,85,247,0.20)"
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
        orangeIcon:   "#D97706",
        orangeDim:    "rgba(217,119,6,0.08)",
        orangeBorder: "rgba(217,119,6,0.18)",
        violetIcon:   "#9333EA",
        violetDim:    "rgba(147,51,234,0.08)",
        violetBorder: "rgba(147,51,234,0.18)"
      };
}

const glass = (T, extra) => ({
  background:   T.bgCard,
  border:       `1px solid ${T.border}`,
  borderRadius: "16px",
  boxShadow:    T.shadowCard,
  ...extra,
});

const transition = { transition: "all 0.25s ease" };

// ─── Sub-components ─────────────────────────────────────────────────────────

const AccuracyPill = ({ correct, total, T }) => {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  if (pct < 60) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, background: T.orangeDim, border: `1px solid ${T.orangeBorder}`, color: T.orangeIcon }}>
        {pct}% فرص تحسين
      </span>
    );
  }
  if (pct <= 80) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, background: T.violetDim, border: `1px solid ${T.violetBorder}`, color: T.violetIcon }}>
        {pct}% جيد
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, background: T.greenDim, border: `1px solid ${T.greenBorder}`, color: T.green }}>
      {pct}% متقن
    </span>
  );
};

const SkillTag = ({ skill, T }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, background: T.iconBgA, border: `1px solid ${T.iconBorderA}`, color: T.iconA }}>
    <Brain style={{ width: "12px", height: "12px" }} />
    {skill}
  </span>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const WeaknessReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const T = buildTheme(isDark);
  const [subtopicsMap, setSubtopicsMap] = useState({});
  const routerState = location.state || {};
  const fallbackData = routerState?.reportData && typeof routerState.reportData === 'object' ? routerState.reportData : null;
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  // Router payload (direct navigation from Quiz)
  const routerQuestions = Array.isArray(routerState.questions) ? routerState.questions : [];
  const routerUserAnswers = routerState.userAnswers && typeof routerState.userAnswers === 'object'
    ? routerState.userAnswers
    : {};

  // Other router metadata
  const {
    score: stateScore = 0,
    total: stateTotal = 0,
    correctAnswersFromServer: stateCorrectAnswersFromServer = [],
    lesson: stateLesson,
    lesson_id: stateLessonId,
    lessonId: stateLessonIdAlt,
    subjectId: stateSubjectId,
    teacherId: stateTeacherId,
    subjectName: stateSubjectName,
    reportData = {},
    subtopics: stateSubtopics = [],
    attempt_id: stateAttemptId,
    attemptId: stateAttemptIdAlt,
    result_id: stateResultId,
    resultId: stateResultIdAlt,
    quiz_attempt_id: stateQuizAttemptId,
    quizAttemptId: stateQuizAttemptIdAlt,
    quiz_id: stateQuizId,
    quizId: stateQuizIdAlt,
  } = routerState;

  const [fallbackPayload, setFallbackPayload] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const attemptIdentifier =
    stateAttemptId ??
    stateAttemptIdAlt ??
    stateResultId ??
    stateResultIdAlt ??
    stateQuizAttemptId ??
    stateQuizAttemptIdAlt ??
    queryParams.get('attempt_id') ??
    queryParams.get('result_id') ??
    null;

  const quizIdentifier =
    stateQuizId ??
    stateQuizIdAlt ??
    reportData?.quiz_id ??
    queryParams.get('quiz_id') ??
    null;

  const hasDirectPayload =
    routerQuestions.length > 0 &&
    Object.keys(routerUserAnswers).length > 0;

  // Runtime payload: direct router state first, then fallback API payload
  const questions = fallbackPayload?.questions ?? routerQuestions;
  const userAnswers = fallbackPayload?.userAnswers ?? routerUserAnswers;
  const score = fallbackPayload?.score ?? stateScore;
  const total = fallbackPayload?.total ?? stateTotal;
  const correctAnswersFromServer = fallbackPayload?.correctAnswersFromServer ?? stateCorrectAnswersFromServer;
  const lesson = fallbackPayload?.lesson ?? stateLesson;
  const subjectId = fallbackPayload?.subjectId ?? stateSubjectId;
  const teacherId = fallbackPayload?.teacherId ?? stateTeacherId;
  const runtimeSubtopics = fallbackPayload?.subtopics ?? stateSubtopics;
  const hasAnswerData =
    fallbackPayload?.hasAnswerData ??
    (Object.keys(routerUserAnswers).length > 0);
  const subjectName =
    fallbackPayload?.subjectName ||
    reportData.subjectName ||
    stateSubjectName ||
    '';

  const summaryScore = Number(
    fallbackData?.score ??
    fallbackData?.score ??
    reportData?.score ??
    stateScore ??
    0
  ) || 0;
  const summaryTotal = Number(
    fallbackData?.total_marks ??
    fallbackData?.totalMarks ??
    reportData?.total_marks ??
    reportData?.totalMarks ??
    stateTotal ??
    0
  ) || 0;
  const summaryPercentage = Number(
    fallbackData?.percentage ??
    reportData?.percentage ??
    (summaryTotal > 0 ? Math.round((summaryScore / summaryTotal) * 100) : 0)
  ) || 0;
  const hasSummaryData = Boolean(fallbackData || summaryTotal > 0 || summaryScore > 0);

  useEffect(() => {
    if (hasDirectPayload || fallbackPayload) return;

    if (!attemptIdentifier && !quizIdentifier) {
      setLoadError('تعذّر تحميل بيانات التقرير: لا يوجد معرف للمحاولة.');
      return;
    }

    let cancelled = false;

    const toArray = (payload) => {
      const candidate =
        payload?.data?.data ??
        payload?.data ??
        payload?.attempts?.data ??
        payload?.attempt?.data ??
        payload?.attempt ??
        payload?.quizAttempt ??
        payload?.quiz_attempt ??
        payload?.quizzesAttempt?.data ??
        payload?.quizzesAttempt ??
        payload?.attempts ??
        payload;

      if (Array.isArray(candidate)) return candidate;
      if (candidate && typeof candidate === 'object') {
        return Object.values(candidate).filter((item) => item && typeof item === 'object');
      }
      return [];
    };

    const firstArrayInObject = (obj) => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
      const nestedArray = Object.values(obj).find((value) => Array.isArray(value));
      return Array.isArray(nestedArray) ? nestedArray : null;
    };

    const unwrapCollectionCandidate = (candidate) => {
      if (candidate === null || candidate === undefined) return [];
      if (Array.isArray(candidate)) return candidate;

      if (typeof candidate === 'object') {
        const unwrapped =
          candidate?.data?.data ??
          candidate?.data?.items ??
          candidate?.data ??
          candidate?.items ??
          candidate?.results ??
          candidate?.records ??
          candidate?.attempts ??
          candidate?.questions ??
          candidate?.answers ??
          candidate;

        if (Array.isArray(unwrapped)) return unwrapped;
        if (unwrapped && typeof unwrapped === 'object') {
          const nestedArray = firstArrayInObject(unwrapped);
          if (nestedArray) return nestedArray;
          const values = Object.values(unwrapped).filter((item) => item && typeof item === 'object');
          return values.length > 0 ? values : [];
        }
      }
      return [];
    };

    const pickFirstCollection = (...candidates) => {
      for (const candidate of candidates) {
        const extracted = unwrapCollectionCandidate(candidate);
        if (Array.isArray(extracted) && extracted.length > 0) {
          return extracted;
        }
      }
      for (const candidate of candidates) {
        const extracted = unwrapCollectionCandidate(candidate);
        if (Array.isArray(extracted)) {
          return extracted;
        }
      }
      return [];
    };

    const normalizeQuestionsForReport = (rawQuestions) => {
      const list = pickFirstCollection(
        rawQuestions,
        rawQuestions?.questions,
        rawQuestions?.quiz_questions,
        rawQuestions?.attempt?.questions,
        rawQuestions?.attempt?.quiz_questions,
        rawQuestions?.quiz?.questions,
        rawQuestions?.quizAttempt?.questions,
        rawQuestions?.quiz_attempt?.questions,
      );
      if (!Array.isArray(list) || list.length === 0) return [];

      return list.map((q, idx) => {
        const base = (q?.question && typeof q.question === 'object') ? q.question : q;
        let options = [];
        let optionKeys = [];

        if (Array.isArray(base?.options)) {
          options = base.options.map((opt) => {
            if (opt && typeof opt === 'object') {
              return opt.text ?? opt.answer_text ?? opt.value ?? '';
            }
            return opt;
          }).filter((opt) => opt !== null && opt !== undefined && String(opt).trim() !== '').map(String);
        }

        if (options.length === 0 && Array.isArray(base?.choices)) {
          options = base.choices.map((choice) => choice?.text ?? choice?.answer_text ?? '').filter(Boolean);
        }

        if (options.length === 0) {
          const rawOptionKeys = ['option_1', 'option_2', 'option_3', 'option_4', 'option_a', 'option_b', 'option_c', 'option_d'];
          rawOptionKeys.forEach((key) => {
            const value = base?.[key] ?? q?.[key];
            if (value !== null && value !== undefined && String(value).trim() !== '') {
              optionKeys.push(key);
              options.push(String(value));
            }
          });
        }

        if (optionKeys.length === 0 && options.length > 0) {
          optionKeys = options.map((_, index) => `option_${index + 1}`);
        }

        return {
          ...q,
          ...base,
          id: base?.id ?? base?.question_id ?? q?.id ?? q?.question_id ?? idx,
          question_id: base?.question_id ?? base?.id ?? q?.question_id ?? q?.id ?? idx,
          question: base?.question ?? base?.question_text ?? q?.question ?? q?.question_text ?? base?.title ?? `Q${idx + 1}`,
          question_text: base?.question_text ?? base?.question ?? q?.question_text ?? q?.question ?? base?.title ?? `Q${idx + 1}`,
          options,
          optionKeys,
          correct_answer: base?.correct_answer ?? q?.correct_answer,
          correct_answer_index: base?.correct_answer_index ?? q?.correct_answer_index,
          subtopic_id: base?.subtopic_id ?? q?.subtopic_id ?? base?.subtopic?.id ?? q?.subtopic?.id ?? null,
          lesson_id: base?.lesson_id ?? q?.lesson_id ?? null,
        };
      });
    };

    const resolveAnswerValue = (rawValue, question) => {
      if (rawValue === null || rawValue === undefined || rawValue === '') return null;
      if (typeof rawValue === 'number' && Number.isFinite(rawValue)) return rawValue;

      const normalized = String(rawValue).trim();
      if (normalized === '') return null;

      if (/^-?\d+$/.test(normalized)) {
        return Number(normalized);
      }

      if (/^option_[1-4]$/i.test(normalized)) {
        return Number(normalized.split('_')[1]) - 1;
      }

      const keyIndex = Array.isArray(question?.optionKeys)
        ? question.optionKeys.findIndex((key) => String(key).toLowerCase() === normalized.toLowerCase())
        : -1;
      if (keyIndex >= 0) return keyIndex;

      const textIndex = Array.isArray(question?.options)
        ? question.options.findIndex((opt) => String(opt).trim() === normalized)
        : -1;
      if (textIndex >= 0) return textIndex;

      return normalized;
    };

    const normalizeAnswersForReport = (rawAnswers, normalizedQuestions) => {
      const mapped = {};
      if (!rawAnswers) return mapped;

      const safeSet = (key, value) => {
        if (key === null || key === undefined || String(key).trim() === '') return;
        if (value === undefined || value === null || Number.isNaN(value)) return;
        mapped[key] = value;
      };

      const processAnswerEntries = (entries) => {
        if (!Array.isArray(entries)) return;
        entries.forEach((entry, index) => {
          const question = normalizedQuestions[index];
          const valueSource =
            (entry && typeof entry === 'object')
              ? (
                entry.selected_index ??
                entry.answer_index ??
                entry.user_answer_index ??
                entry.selected_option ??
                entry.selected_answer ??
                entry.option ??
                entry.option_key ??
                entry.answer_key ??
                entry.choice ??
                entry.answer ??
                entry.answer_text ??
                entry.user_answer ??
                entry.student_answer ??
                entry.value ??
                entry?.answer?.selected_index ??
                entry?.answer?.answer_index ??
                entry?.answer?.option ??
                entry?.answer?.answer_text ??
                entry?.answer?.value
              )
              : entry;
          const resolvedValue = resolveAnswerValue(valueSource, question);
          const questionId =
            (entry && typeof entry === 'object')
              ? (
                entry.question_id ??
                entry.questionId ??
                entry.question?.id ??
                entry?.question?.question_id ??
                entry.id ??
                question?.id ??
                question?.question_id
              )
              : (question?.id ?? question?.question_id);

          safeSet(index, resolvedValue);
          safeSet(questionId, resolvedValue);
          if (question?.id !== undefined) safeSet(question.id, resolvedValue);
          if (question?.question_id !== undefined) safeSet(question.question_id, resolvedValue);
        });
      };

      const arrayLikeAnswers = pickFirstCollection(
        rawAnswers,
        rawAnswers?.answers,
        rawAnswers?.user_answers,
        rawAnswers?.submitted_answers,
        rawAnswers?.student_answers,
        rawAnswers?.answer_details,
        rawAnswers?.attempt?.answers,
        rawAnswers?.attempt?.user_answers,
        rawAnswers?.attempt?.submitted_answers,
      );
      if (arrayLikeAnswers.length > 0) {
        processAnswerEntries(arrayLikeAnswers);
        return mapped;
      }

      if (Array.isArray(rawAnswers)) {
        processAnswerEntries(rawAnswers);
        return mapped;
      }

      if (rawAnswers && typeof rawAnswers === 'object') {
        const nestedArray = firstArrayInObject(rawAnswers);
        if (Array.isArray(nestedArray) && nestedArray.length > 0) {
          processAnswerEntries(nestedArray);
          return mapped;
        }

        Object.entries(rawAnswers).forEach(([key, value]) => {
          const keyAsIndex = Number(key);
          const question = Number.isNaN(keyAsIndex)
            ? normalizedQuestions.find((q) => String(q?.id) === String(key) || String(q?.question_id) === String(key))
            : normalizedQuestions[keyAsIndex];
          const valueSource =
            (value && typeof value === 'object')
              ? (value.selected_index ?? value.answer_index ?? value.user_answer_index ?? value.answer ?? value.answer_text ?? value.user_answer)
              : value;
          const resolvedValue = resolveAnswerValue(valueSource, question);

          safeSet(key, resolvedValue);
          if (!Number.isNaN(keyAsIndex)) {
            safeSet(keyAsIndex, resolvedValue);
          }
        });
      }

      return mapped;
    };

    const pickAttemptRecord = (items) => {
      if (!Array.isArray(items) || items.length === 0) return null;

      if (attemptIdentifier) {
        const matchByAttempt = items.find((item) => {
          const candidateId = item?.attempt_id ?? item?.result_id ?? item?.id;
          return candidateId !== null && candidateId !== undefined && String(candidateId) === String(attemptIdentifier);
        });
        if (matchByAttempt) return matchByAttempt;
      }

      if (quizIdentifier) {
        const matchByQuiz = items.find((item) => {
          const candidateQuizId = item?.quiz_id ?? item?.quizId ?? item?.quiz?.id;
          return candidateQuizId !== null && candidateQuizId !== undefined && String(candidateQuizId) === String(quizIdentifier);
        });
        if (matchByQuiz) return matchByQuiz;
      }

      return items[0];
    };

    const fetchFallbackReport = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        let attemptRecord = null;
        let quizPayload = null;
        let attemptAnswerPayload = null;

        const tryAttemptsRequest = async (params) => {
          try {
            const response = await api.get('/students/attempts', { params });
            console.log("FETCHED RAW DATA:", response.data);
            const attempts = toArray(response.data);
            const picked = pickAttemptRecord(attempts);
            if (picked) attemptRecord = picked;
          } catch (err) {
            console.warn('⚠️ Failed to fetch attempts with params:', params, err);
          }
        };

        if (attemptIdentifier && !attemptRecord) {
          await tryAttemptsRequest({ attempt_id: attemptIdentifier });
        }
        if (attemptIdentifier && !attemptRecord) {
          await tryAttemptsRequest({ id: attemptIdentifier });
        }
        if (quizIdentifier && !attemptRecord) {
          await tryAttemptsRequest({ quiz_id: quizIdentifier });
        }

        if (!attemptRecord && attemptIdentifier) {
          try {
            const response = await api.get(`/students/attempts/${attemptIdentifier}`);
            console.log("FETCHED RAW DATA:", response.data);
            const attempts = toArray(response.data);
            attemptRecord = pickAttemptRecord(attempts) || (response.data?.data || response.data);
          } catch (err) {
            console.warn('⚠️ Failed to fetch attempt by ID route:', err);
          }
        }

        if (attemptIdentifier) {
          try {
            const response = await api.get(`/attempts/${attemptIdentifier}/answer`);
            console.log("FETCHED RAW DATA:", response.data);
            attemptAnswerPayload = response.data?.data ?? response.data;

            if (attemptAnswerPayload?.attempt && typeof attemptAnswerPayload.attempt === 'object') {
              attemptRecord = attemptRecord
                ? { ...attemptRecord, ...attemptAnswerPayload.attempt }
                : attemptAnswerPayload.attempt;
            }
          } catch (err) {
            console.warn('⚠️ Failed to fetch attempt answer details:', err);
          }
        }

        if (quizIdentifier) {
          try {
            const response = await api.get(`/quizzes-details/${quizIdentifier}`);
            console.log("FETCHED RAW DATA:", response.data);
            const payload = response.data?.data || response.data || {};
            quizPayload = payload?.quiz || payload;
            if (!attemptRecord) {
              const attempts = toArray(payload?.attempts || payload?.students || quizPayload?.attempts || quizPayload?.quiz_attempts || []);
              attemptRecord = pickAttemptRecord(attempts);
            }
          } catch (err) {
            console.warn('⚠️ Failed to fetch quiz details fallback:', err);
          }
        }

        if (!attemptRecord && !quizPayload && !attemptAnswerPayload) {
          throw new Error('No attempt payload found.');
        }

        const rawQuestions =
          attemptRecord?.questions ??
          attemptRecord?.attempt?.questions ??
          attemptRecord?.data?.questions ??
          attemptRecord?.quiz?.questions ??
          attemptRecord?.quiz_questions ??
          attemptAnswerPayload?.questions ??
          attemptAnswerPayload?.attempt?.questions ??
          attemptAnswerPayload?.data?.questions ??
          attemptAnswerPayload?.quiz?.questions ??
          attemptAnswerPayload?.quiz_questions ??
          quizPayload?.questions ??
          quizPayload?.data?.questions ??
          quizPayload?.attempt?.questions ??
          quizPayload?.quiz_questions ??
          [];
        const normalizedQuestions = normalizeQuestionsForReport(rawQuestions);

        const rawAnswers =
          attemptRecord?.user_answers ??
          attemptRecord?.answers ??
          attemptRecord?.student_answers ??
          attemptRecord?.answer_details ??
          attemptRecord?.submitted_answers ??
          attemptRecord?.attempt?.answers ??
          attemptRecord?.attempt?.user_answers ??
          attemptRecord?.attempt?.submitted_answers ??
          attemptAnswerPayload?.answers ??
          attemptAnswerPayload?.user_answers ??
          attemptAnswerPayload?.submitted_answers ??
          attemptAnswerPayload?.answer_details ??
          attemptAnswerPayload?.attempt?.answers ??
          attemptAnswerPayload?.attempt?.user_answers ??
          attemptAnswerPayload?.attempt?.submitted_answers ??
          quizPayload?.user_answers ??
          quizPayload?.answers ??
          quizPayload?.attempt?.answers ??
          null;
        const normalizedAnswers = normalizeAnswersForReport(rawAnswers, normalizedQuestions);
        const hasFetchedAnswers = Object.keys(normalizedAnswers).length > 0;

        console.log('[WeaknessReport] normalized fallback payload:', {
          questionsCount: normalizedQuestions.length,
          answerKeysCount: Object.keys(normalizedAnswers).length,
          hasAttemptRecord: !!attemptRecord,
          hasAttemptAnswerPayload: !!attemptAnswerPayload,
          hasQuizPayload: !!quizPayload,
        });

        const rawCorrectAnswers =
          attemptRecord?.correct_answers_quiz ??
          attemptRecord?.correct_answers ??
          attemptAnswerPayload?.correct_answers_quiz ??
          attemptAnswerPayload?.correct_answers ??
          attemptAnswerPayload?.attempt?.correct_answers_quiz ??
          quizPayload?.correct_answers_quiz ??
          quizPayload?.correct_answers ??
          [];

        const derivedLessonId =
          attemptRecord?.lesson_id ??
          attemptRecord?.lesson?.id ??
          attemptAnswerPayload?.lesson_id ??
          attemptAnswerPayload?.lesson?.id ??
          quizPayload?.lesson_id ??
          stateLessonId ??
          stateLessonIdAlt ??
          (normalizedQuestions[0]?.lesson_id ?? normalizedQuestions[0]?.question?.lesson_id ?? null);

        const derivedLesson =
          stateLesson ||
          attemptRecord?.lesson ||
          attemptAnswerPayload?.lesson ||
          quizPayload?.lesson ||
          (derivedLessonId
            ? {
              id: derivedLessonId,
              title:
                attemptRecord?.lesson_title ||
                attemptAnswerPayload?.lesson_title ||
                quizPayload?.lesson_name ||
                quizPayload?.title
            }
            : undefined);

        const derivedScore = Number(
          attemptRecord?.score ??
          attemptAnswerPayload?.score ??
          reportData?.score ??
          stateScore ??
          0
        ) || 0;
        const derivedTotal = Number(
          attemptRecord?.max_score ??
          attemptRecord?.total ??
          attemptRecord?.total_questions ??
          attemptAnswerPayload?.max_score ??
          attemptAnswerPayload?.total ??
          attemptAnswerPayload?.total_questions ??
          quizPayload?.max_score ??
          reportData?.total ??
          stateTotal ??
          normalizedQuestions.length
        ) || normalizedQuestions.length || 0;

        if (!cancelled) {
          setFallbackPayload({
            questions: normalizedQuestions,
            userAnswers: normalizedAnswers,
            hasAnswerData: hasFetchedAnswers,
            score: derivedScore,
            total: derivedTotal,
            percentage: derivedTotal > 0 ? Math.round((derivedScore / derivedTotal) * 100) : 0,
            correctAnswersFromServer: Array.isArray(rawCorrectAnswers) ? rawCorrectAnswers : [],
            lesson: derivedLesson,
            lesson_id: derivedLessonId,
            subjectId: attemptRecord?.subject_id ?? attemptRecord?.subjectId ?? stateSubjectId,
            teacherId: attemptRecord?.teacher_id ?? attemptRecord?.teacherId ?? stateTeacherId,
            subjectName:
              attemptRecord?.subject_name ||
              attemptAnswerPayload?.subject_name ||
              quizPayload?.subject_name ||
              reportData.subjectName ||
              stateSubjectName ||
              '',
            subtopics: Array.isArray(attemptRecord?.subtopics)
              ? attemptRecord.subtopics
              : (
                Array.isArray(attemptAnswerPayload?.subtopics)
                  ? attemptAnswerPayload.subtopics
                  : (Array.isArray(quizPayload?.subtopics) ? quizPayload.subtopics : [])
              ),
          });

          if (normalizedQuestions.length === 0) {
            setLoadError('تعذّر تحميل أسئلة المحاولة من السجل.');
          } else if (!hasFetchedAnswers) {
            setLoadError('تعذّر تحميل إجابات المحاولة من السجل.');
          }
        }
      } catch (err) {
        console.error('❌ Failed to initialize weakness report fallback:', err);
        if (!cancelled) {
          setLoadError('تعذّر تحميل بيانات التقرير من السجل. حاول مرة أخرى من صفحة النتائج.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchFallbackReport();

    return () => {
      cancelled = true;
    };
  }, [
    attemptIdentifier,
    fallbackPayload,
    hasDirectPayload,
    quizIdentifier,
    reportData?.score,
    reportData?.subjectName,
    reportData?.total,
    stateLesson,
    stateLessonId,
    stateLessonIdAlt,
    stateScore,
    stateSubjectId,
    stateSubjectName,
    stateTeacherId,
    stateTotal,
  ]);

  // Safe lesson ID extraction flow: explicit state first, then questions payload
  const explicitLessonId =
    fallbackPayload?.lesson_id ??
    stateLessonId ??
    stateLessonIdAlt ??
    lesson?.id ??
    reportData?.lesson_id ??
    null;
  const lessonId =
    explicitLessonId ??
    (questions.length > 0
      ? (questions[0]?.lesson_id ?? questions[0]?.question?.lesson_id ?? null)
      : null);

  useEffect(() => {
    if (!lessonId) {
      console.warn('⚠️ Cannot fetch subtopics: lesson ID is missing.');
      return;
    }

    const fetchSubtopicsMap = async () => {
      try {
        // Fetch subtopics specific to this lesson
        console.log(`🔥 Fetching subtopics for lesson ID: ${lessonId}`);
        const { data } = await api.get(`/lesson/${lessonId}/subtopics`);

        // Handle various response structures
        let rawData = [];
        const payload = data?.data || data;

        if (Array.isArray(payload)) {
          rawData = payload;
        } else if (payload && typeof payload === 'object') {
          // Look for common nested array keys
          rawData = payload.subtopics || payload.sub_topics || payload.topics || payload.children || payload.lessons || [];

          // Fallback: auto-detect ANY array inside the object
          if (rawData.length === 0) {
            const arrayKeys = Object.keys(payload).filter(k => Array.isArray(payload[k]));
            if (arrayKeys.length > 0) {
              console.warn(`⚠️ Auto-detected array using key: ${arrayKeys[0]}`);
              rawData = payload[arrayKeys[0]];
            }
          }
        }

        // Build the map
        const map = {};
        if (Array.isArray(rawData)) {
          rawData.forEach(item => {
            const itemId = item?.id ?? item?.subtopic_id ?? item?.sub_topic_id;
            const itemName = item?.name || item?.title || item?.subtopic_name || item?.lesson_name;
            if (itemId !== null && itemId !== undefined && itemId !== '' && itemName) {
              map[String(itemId)] = itemName;
            }
          });
        }

        console.log('✅ SUBTOPICS MAP:', map);
        setSubtopicsMap(map);
      } catch (err) {
        console.warn(`⚠️ Failed to fetch subtopics for lesson ${lessonId}:`, err);
        setSubtopicsMap({});
      }
    };

    fetchSubtopicsMap();
  }, [lessonId]);

  // Safe fallback calculations to prevent NaN
  const maxScore = summaryTotal;
  const correctAnswers = summaryScore;
  const wrongAnswers = Math.max(0, summaryTotal - summaryScore);
  const percentage = summaryPercentage;

  // ── Compute subtopics ────────────────────────────────────────────────────
  // Priority 1 → explicit `subtopics` array passed in state (pre-computed / from backend)
  // Priority 2 → derive from `questions` + `userAnswers` when questions carry subtopic/skill
  // Priority 3 → null (no subtopic data available for this quiz)
  const subtopics = useMemo(() => {
    // 1. Explicit array from navigation state
    if (runtimeSubtopics.length > 0) {
      return runtimeSubtopics.map((s) => ({
        name: s.name,
        skill: s.skill || 'فهم',
        correct: s.correct,
        wrong: s.total - s.correct,
        total: s.total,
      }));
    }

    // 2. Derive from questions data
    if (questions?.length > 0 && questions.some((q) => q.subtopic)) {
      const map = {};
      questions.forEach((q, idx) => {
        const key = q.subtopic || 'عام';
        if (!map[key]) {
          map[key] = { name: key, skill: q.skill || 'فهم', correct: 0, wrong: 0, total: 0 };
        }
        map[key].total++;
        const userAns = userAnswers?.[idx] ?? null;
        if (userAns === q.correct) {
          map[key].correct++;
        } else {
          map[key].wrong++;
        }
      });
      return Object.values(map);
    }

    return null; // no subtopic data
  }, [runtimeSubtopics, questions, userAnswers]);

  const passed = percentage >= 50;

  const weakSubtopics =
    subtopics?.filter(
      (s) => s.total > 0 && Math.round((s.correct / s.total) * 100) < 60
    ) || [];

  const detailedErrors = useMemo(() => {
    console.log("🔥 THE RAW QUESTION TRUTH:", questions[0]);
    const qs = questions || [];
    const ans = userAnswers || {};
    if (qs.length === 0 || !hasAnswerData) return [];

    const errors = [];
    let actualErrors = 0;

    qs.forEach((q, index) => {
      // 1. Deep unnesting of the question object
      const actualQ = (q.question && typeof q.question === 'object') ? q.question : q;

      const userAnswer = ans[index] ?? ans[q.id] ?? ans[actualQ.id] ?? ans[actualQ.question_id];
      let isCorrect = false;

      // 2. Find REAL correct answer
      let realCorrectAnswer = actualQ.correct_answer || actualQ.correct_answer_index || q.correct_answer;
      if (correctAnswersFromServer && correctAnswersFromServer.length > 0) {
        const srvAns = correctAnswersFromServer[index] || correctAnswersFromServer.find(c => c?.question_id === actualQ.id || c?.id === actualQ.id);
        if (srvAns) {
          realCorrectAnswer = typeof srvAns === 'object' ? (srvAns.correct_answer || srvAns.answer || srvAns.correct || srvAns.correct_option) : srvAns;
        }
      }

      // 3. Evaluation
      if (userAnswer !== undefined && userAnswer !== null) {
        const standardKeys = ['option_1', 'option_2', 'option_3', 'option_4'];
        const selectedKey = actualQ.optionKeys ? actualQ.optionKeys[userAnswer] : standardKeys[userAnswer];
        const selectedText = actualQ.options ? actualQ.options[userAnswer] : null;

        if (String(userAnswer) === String(realCorrectAnswer)) isCorrect = true;
        if (realCorrectAnswer && selectedKey && String(realCorrectAnswer).toLowerCase() === String(selectedKey).toLowerCase()) isCorrect = true;
        if (realCorrectAnswer && selectedText && String(realCorrectAnswer).trim() === String(selectedText).trim()) isCorrect = true;
      }

      // 4. Log errors with bulletproof text extraction
      if (!isCorrect) {
        actualErrors++;

        // Ultra-robust Question Text Extraction
        let qText = actualQ.question_text || actualQ.question || actualQ.title || actualQ.text || q.question_text || q.question || `السؤال رقم ${index + 1}`;
        if (typeof qText === 'object') qText = qText.text || qText.title || `السؤال رقم ${index + 1}`;

        const subtopicIdCandidates = [
          actualQ?.subtopic_id,
          actualQ?.sub_topic_id,
          actualQ?.question?.subtopic_id,
          actualQ?.question?.sub_topic_id,
          actualQ?.subtopic?.id,
          actualQ?.sub_topic?.id,
          q?.subtopic_id,
          q?.sub_topic_id,
          q?.question?.subtopic_id,
          q?.question?.sub_topic_id,
          q?.subtopic?.id,
          q?.sub_topic?.id,
          actualQ?.lesson_id,
          q?.lesson_id,
        ];
        const extractedSubtopicId = subtopicIdCandidates.find(
          (value) => value !== null && value !== undefined && String(value).trim() !== ''
        );
        const normalizedSubtopicId =
          extractedSubtopicId !== null && extractedSubtopicId !== undefined && String(extractedSubtopicId).trim() !== ''
            ? String(extractedSubtopicId).trim()
            : null;
        const numericSubtopicId = Number(normalizedSubtopicId);
        const mappedSubtopicName = normalizedSubtopicId
          ? (
            subtopicsMap[normalizedSubtopicId] ??
            (Number.isNaN(numericSubtopicId) ? undefined : subtopicsMap[String(numericSubtopicId)])
          )
          : null;
        const subtopicName = normalizedSubtopicId
          ? (mappedSubtopicName || `موضوع فرعي (كود: ${normalizedSubtopicId})`)
          : 'غير مربوط بموضوع فرعي';

        errors.push({
          question: String(qText),
          subtopic: String(subtopicName)
        });
      }
    });

    if (score === total || actualErrors === 0) return [];
    return errors;
  }, [questions, userAnswers, hasAnswerData, correctAnswersFromServer, score, total, subtopicsMap]);

  const hasValidQuestions = Array.isArray(questions) && questions.length > 0;
  const showNoWeaknessMessage =
    !isLoading &&
    hasValidQuestions &&
    hasAnswerData &&
    detailedErrors.length === 0;

  // ── Circular SVG params ──────────────────────────────────────────────────
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (circumference * percentage) / 100;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleGetRecommendations = (subtopic) => {
    navigate('/remediation', {
      state: {
        weakSubtopic: {
          name: subtopic.name,
          skill: subtopic.skill,
          subject: subjectName || lesson?.title || 'غير محدد',
          subjectId: subjectId,
          lessonId: lesson?.id,
          accuracy: Math.round((subtopic.correct / subtopic.total) * 100),
        },
      },
    });
  };

  const handleTryAgain = () => {
    if (lesson?.id && teacherId && subjectId) {
      navigate(`/quiz/${lesson.id}/${teacherId}/${subjectId}`, { 
        state: { lesson, subjectId, teacherId } 
      });
    } else {
      // fallback: old format
      navigate('/dashboard');
    }
  };

  const handleBackToLesson = () => {
    const resolvedLessonTeacherId = teacherId ?? lesson?.teacher_id ?? lesson?.teacherId ?? null;
    if (lesson && subjectId && resolvedLessonTeacherId != null) {
      const courseDetailsPath = `/course-details?lessonId=${encodeURIComponent(String(lesson.id))}&teacherId=${encodeURIComponent(String(resolvedLessonTeacherId))}&subjectId=${encodeURIComponent(String(subjectId))}`;
      navigate(courseDetailsPath, {
        state: {
          lesson,
          subjectId,
          subjectName,
          teacherId: resolvedLessonTeacherId,
        },
      });
    } else {
      navigate('/dashboard');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ ...transition, minHeight: "100vh", background: T.bg, padding: "32px 16px", fontFamily: "'Cairo', sans-serif" }} dir="rtl">
      <div style={{ maxWidth: "768px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={() => navigate(-1)}
            style={{ ...transition, display: "flex", alignItems: "center", gap: "8px", background: "transparent", border: "none", cursor: "pointer", color: T.textMuted, fontSize: "0.875rem", fontWeight: 700 }}
            onMouseEnter={e => e.currentTarget.style.color = T.textPrimary}
            onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
          >
            <ArrowRight style={{ width: "16px", height: "16px" }} />
            رجوع
          </button>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: T.textPrimary }}>
              تقرير فرص النمو
            </h1>
            {(subjectName || lesson?.title) && (
              <span style={{ fontSize: "0.75rem", color: T.textMuted, marginTop: "4px" }}>
                {subjectName && <span>{subjectName}</span>}
                {subjectName && lesson?.title && <span> · </span>}
                {lesson?.title && <span>{lesson.title}</span>}
              </span>
            )}
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            style={{ ...transition, background: "transparent", border: "none", cursor: "pointer", color: T.textMuted }}
            onMouseEnter={e => e.currentTarget.style.color = T.textPrimary}
            onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
            title="الرئيسية"
          >
            <Home style={{ width: "20px", height: "20px" }} />
          </button>
        </div>

        {/* ── Overall Score Card ──────────────────────────────────────────── */}
        <div style={{ ...glass(T, { padding: "32px", position: "relative", overflow: "hidden", textAlign: "center" }) }}>
          {/* Color bar */}
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: passed ? T.green : T.orangeIcon }} />

          {/* Pass / Fail badge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", marginTop: "4px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 16px", borderRadius: "999px", fontSize: "0.875rem", fontWeight: 800, background: passed ? T.greenDim : T.orangeDim, color: passed ? T.green : T.orangeIcon, border: `1px solid ${passed ? T.greenBorder : T.orangeBorder}` }}>
              {passed ? <CheckCircle2 style={{ width: "16px", height: "16px" }} /> : <Target style={{ width: "16px", height: "16px" }} />}
              {passed ? t('passed_label') : "فرص التحسين متاحة"}
            </span>
          </div>

          {/* Circular progress */}
          <div style={{ width: "144px", height: "144px", margin: "0 auto 24px", position: "relative" }}>
            <svg style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 144 144">
              <circle cx="72" cy="72" r={radius} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} strokeWidth="6" fill="transparent" />
              <circle cx="72" cy="72" r={radius} stroke={passed ? T.green : T.orangeIcon} strokeWidth="6" fill="transparent" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeOffset} style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "2rem", fontWeight: 800, color: T.textPrimary }}>{percentage}%</span>
            </div>
          </div>

          <p style={{ color: T.textPrimary, fontSize: "1rem", fontWeight: 700 }}>
            أجبت بشكل صحيح على <span style={{ color: T.accent, fontSize: "1.25rem" }}>{correctAnswers}</span> من أصل <span style={{ color: T.textMuted }}>{maxScore}</span>
          </p>

          {/* Stats strip */}
          <div style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1px", background: T.border, border: `1px solid ${T.border}`, borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", textAlign: "center", background: T.bgPanel }}>
              <p style={{ fontSize: "1.25rem", fontWeight: 800, color: T.green }}>{correctAnswers}</p>
              <p style={{ fontSize: "0.75rem", fontWeight: 700, color: T.textMuted, marginTop: "2px" }}>إجابات صحيحة</p>
            </div>
            <div style={{ padding: "12px 16px", textAlign: "center", background: T.bgPanel }}>
              <p style={{ fontSize: "1.25rem", fontWeight: 800, color: T.violetIcon }}>{wrongAnswers}</p>
              <p style={{ fontSize: "0.75rem", fontWeight: 700, color: T.textMuted, marginTop: "2px" }}>غير صحيحة</p>
            </div>
            <div style={{ padding: "12px 16px", textAlign: "center", background: T.bgPanel }}>
              <p style={{ fontSize: "1.25rem", fontWeight: 800, color: T.orangeIcon }}>{weakSubtopics.length}</p>
              <p style={{ fontSize: "0.75rem", fontWeight: 700, color: T.textMuted, marginTop: "2px" }}>فرص للنمو</p>
            </div>
          </div>
        </div>

        {/* ── Subtopic Breakdown ──────────────────────────────────────────── */}
        {subtopics && subtopics.length > 0 ? (
          <div style={{ ...glass(T, { padding: "24px" }) }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: T.textPrimary, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: T.iconBgA, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp style={{ width: "16px", height: "16px", color: T.iconA }} />
              </div>
              تحليل المهارات
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {subtopics.map((s, idx) => {
                const acc = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                const barColor = acc < 60 ? T.orangeIcon : acc <= 80 ? T.violetIcon : T.green;
                const trackColor = acc < 60 ? T.orangeDim : acc <= 80 ? T.violetDim : T.greenDim;
                const isWeak = acc < 60;

                return (
                  <div key={idx} style={{ padding: "16px", borderRadius: "12px", border: `1px solid ${isWeak ? T.orangeBorder : T.border}`, background: isWeak ? T.orangeDim : T.bgPanel }}>
                    {/* Top row */}
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <BookOpen style={{ width: "16px", height: "16px", color: T.textMuted, flexShrink: 0 }} />
                        <span style={{ fontWeight: 800, color: T.textPrimary, fontSize: "0.875rem" }}>{s.name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <SkillTag skill={s.skill} T={T} />
                        <AccuracyPill correct={s.correct} total={s.total} T={T} />
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: "4px", borderRadius: "2px", background: trackColor, overflow: "hidden", marginBottom: "12px" }}>
                      <div style={{ height: "100%", borderRadius: "2px", background: barColor, transition: "width 0.7s ease", width: `${acc}%` }} />
                    </div>

                    {/* Correct / Wrong */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.75rem", fontWeight: 700 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", color: T.green }}>
                        <CheckCircle2 style={{ width: "14px", height: "14px" }} />
                        <span>{s.correct} صحيح</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", color: T.textMuted }}>
                        <Target style={{ width: "14px", height: "14px" }} />
                        <span>{s.wrong} فرصة للتحسين</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ ...glass(T, { padding: "32px", textAlign: "center" }) }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: T.iconBgA, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Target style={{ width: "24px", height: "24px", color: T.iconA }} />
            </div>
            <div style={{ width: "100%" }}>
              {detailedErrors.length > 0 ? (
                detailedErrors.map((err, idx) => (
                  <div key={idx} style={{ background: T.orangeDim, border: `1px solid ${T.orangeBorder}`, borderRadius: "12px", padding: "20px", textAlign: "right", marginBottom: "12px" }}>
                    <p style={{ color: T.textPrimary, fontWeight: 700, marginBottom: "16px", lineHeight: 1.6, fontSize: "0.875rem" }}>
                      <span style={{ color: T.orangeIcon, fontWeight: 800, marginLeft: "4px" }}>فرصة للنمو:</span>
                      {err.question}
                    </p>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: T.bgPanel, border: `1px solid ${T.border}`, color: T.textPrimary, padding: "8px 16px", borderRadius: "8px" }}>
                      <span style={{ fontWeight: 800, fontSize: "0.75rem", color: T.textMuted }}>💡 راجع:</span>
                      <span style={{ fontWeight: 800, fontSize: "0.75rem" }}>{err.subtopic}</span>
                    </div>
                  </div>
                ))
              ) : isLoading ? (
                <div style={{ textAlign: "center", color: T.textMuted, fontWeight: 700, padding: "24px 0" }}>
                  جارٍ تحميل بيانات المحاولة...
                </div>
              ) : showNoWeaknessMessage ? (
                <div style={{ textAlign: "center", color: T.green, fontWeight: 800, padding: "24px 0" }}>
                  🎉 ممتاز! لا توجد نقاط ضعف واضحة.
                </div>
              ) : hasSummaryData ? (
                <div style={{ textAlign: "center", color: T.textMuted, fontWeight: 800, padding: "24px 0", lineHeight: 1.8 }}>
                  <div style={{ fontSize: "0.95rem", color: T.textPrimary, marginBottom: "6px" }}>
                    جاري تجهيز التحليلات الذكية للمواضيع الفرعية...
                  </div>
                  <div style={{ fontSize: "0.8rem" }}>
                    تظهر هنا الآن بيانات المحاولة الأساسية فقط حتى يكتمل تحليل المواضيع الفرعية من الخلفية.
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", color: T.orangeIcon, fontWeight: 800, padding: "24px 0" }}>
                  {loadError || 'لا تتوفر بيانات كافية لعرض تقرير فرص النمو.'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Detected Weaknesses ─────────────────────────────────────────── */}
        {weakSubtopics.length > 0 && (
          <div style={{ ...glass(T, { padding: "24px", border: `1px solid ${T.orangeBorder}` }) }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: T.orangeIcon, marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: T.orangeDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Target style={{ width: "16px", height: "16px", color: T.orangeIcon }} />
              </div>
              مجالات مقترحة للتحسين
            </h2>
            <p style={{ fontSize: "0.875rem", color: T.textMuted, marginBottom: "20px" }}>
              تم تحديد <span style={{ fontWeight: 800, color: T.textPrimary }}>{weakSubtopics.length}</span> {weakSubtopics.length > 1 ? "موضوعات" : "موضوع"} يمكن التركيز عليها لرفع مستواك.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {weakSubtopics.map((s, idx) => {
                const acc = Math.round((s.correct / s.total) * 100);
                return (
                  <div key={idx} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "16px", background: T.bgPanel, border: `1px solid ${T.border}`, borderRadius: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: T.orangeDim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <AlertTriangle style={{ width: "16px", height: "16px", color: T.orangeIcon }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, color: T.textPrimary, fontSize: "0.875rem" }}>{s.name}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
                          <SkillTag skill={s.skill} T={T} />
                          <span style={{ fontSize: "0.75rem", color: T.orangeIcon, fontWeight: 700 }}>الإتقان الحالي: {acc}%</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleGetRecommendations(s)}
                      style={{
                        ...transition,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                        padding: "10px 16px", background: "transparent", border: `1px solid ${T.accent}`, borderRadius: "10px",
                        color: T.accent, fontSize: "0.875rem", fontWeight: 800, cursor: "pointer", width: "100%", flex: "1 1 auto"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.accent; e.currentTarget.style.color = "#FFFFFF"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.accent; }}
                    >
                      <Zap style={{ width: "16px", height: "16px" }} />
                      خطط التطوير
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── No Weaknesses — success banner ──────────────────────────────── */}
        {!isLoading && hasValidQuestions && hasAnswerData && subtopics && weakSubtopics.length === 0 && (
          <div style={{ ...glass(T, { padding: "24px", border: `1px solid ${T.greenBorder}`, background: T.greenDim, textAlign: "center" }) }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: T.green, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <CheckCircle2 style={{ width: "24px", height: "24px", color: "#FFF" }} />
            </div>
            <p style={{ fontWeight: 800, color: T.green, fontSize: "1rem", marginBottom: "4px" }}>
              لا توجد مجالات ضعف جوهرية
            </p>
            <p style={{ fontSize: "0.875rem", color: T.textMuted }}>
              استمر في الأداء المتميز، أنت على الطريق الصحيح!
            </p>
          </div>
        )}

        {/* ── Action Buttons ───────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", paddingBottom: "32px" }}>
          <button
            onClick={handleTryAgain}
            disabled
            style={{
              ...transition,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              padding: "16px", background: T.accent, border: "none", borderRadius: "12px",
              color: "#FFF", fontSize: "0.875rem", fontWeight: 800, opacity: 0.5, cursor: 'not-allowed'
            }}
          >
            <RefreshCcw style={{ width: "20px", height: "20px" }} />
            {t('try_again')}
          </button>
          <button
            onClick={handleBackToLesson}
            style={{
              ...transition,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              padding: "16px", background: T.bgPanel, border: `1px solid ${T.border}`, borderRadius: "12px",
              color: T.textPrimary, fontSize: "0.875rem", fontWeight: 800, cursor: "pointer"
            }}
            onMouseEnter={e => e.currentTarget.style.border = `1px solid ${T.textMuted}`}
            onMouseLeave={e => e.currentTarget.style.border = `1px solid ${T.border}`}
          >
            <ArrowRight style={{ width: "20px", height: "20px", ...(lang === 'en' ? { transform: "rotate(180deg)" } : {}) }} />
            {t('back_to_lesson')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default WeaknessReport;
