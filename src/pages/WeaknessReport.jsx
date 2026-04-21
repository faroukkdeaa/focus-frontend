import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/api';
import {
  ArrowRight, AlertTriangle, CheckCircle2, XCircle,
  Brain, BookOpen, RefreshCcw, TrendingUp, Zap, Home, Target,
} from 'lucide-react';

// ─── Sub-components ─────────────────────────────────────────────────────────

const AccuracyPill = ({ correct, total }) => {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  if (pct < 60) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
        🔴 {pct}% ضعيف
      </span>
    );
  }
  if (pct <= 80) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
        🟡 {pct}% متوسط
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
      🟢 {pct}% قوي
    </span>
  );
};

const SkillTag = ({ skill }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
    <Brain className="w-3 h-3" />
    {skill}
  </span>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const WeaknessReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLanguage();
  const [subtopicsMap, setSubtopicsMap] = useState({});
  const routerState = location.state || {};
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
  const maxScore = Number(total ?? reportData.total ?? 5) || 5;
  const correctAnswers = Number(score ?? reportData.score ?? 0) || 0;
  const wrongAnswers = Math.max(0, maxScore - correctAnswers);
  const percentage = Number(
    fallbackPayload?.percentage ??
    reportData.percentage ??
    (maxScore > 0 ? Math.round((correctAnswers / maxScore) * 100) : 0)
  ) || 0;

  // ── Compute subtopics ────────────────────────────────────────────────────
  // Priority 1 → explicit `subtopics` array passed in state (pre-computed / from backend)
  // Priority 2 → derive from `questions` + `userAnswers` when questions carry subtopic/skill
  // Priority 3 → null (no subtopic data available for this quiz)
  // eslint-disable-next-line react-hooks/rules-of-hooks
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
    if (lesson && subjectId) {
      navigate('/course-details', { state: { lesson, subjectId } });
    } else {
      navigate('/dashboard');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 font-['Cairo']"
      dir="rtl"
    >
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#103B66] transition text-sm font-medium"
          >
            <ArrowRight className="w-4 h-4" />
            رجوع
          </button>

          <div className="flex flex-col items-center text-center">
            <h1 className="text-xl font-bold text-[#103B66] dark:text-white">
              تقرير الأداء التفصيلي
            </h1>
            {(subjectName || lesson?.title) && (
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {subjectName && <span>{subjectName}</span>}
                {subjectName && lesson?.title && <span> · </span>}
                {lesson?.title && <span>{lesson.title}</span>}
              </span>
            )}
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-400 hover:text-[#103B66] transition"
            title="الرئيسية"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>

        {/* ── Overall Score Card ──────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center relative overflow-hidden">
          {/* Color bar */}
          <div
            className={`absolute top-0 left-0 w-full h-2 ${
              passed ? 'bg-green-500' : 'bg-red-500'
            }`}
          />

          {/* Pass / Fail badge */}
          <div className="flex justify-center mb-5 mt-1">
            <span
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold ${
                passed
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {passed ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {passed ? t('passed_label') : t('failed_label')}
            </span>
          </div>

          {/* Circular progress */}
          <div className="w-36 h-36 mx-auto relative mb-6">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 144 144"
            >
              <circle
                cx="72"
                cy="72"
                r={radius}
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-gray-100 dark:text-gray-700"
              />
              <circle
                cx="72"
                cy="72"
                r={radius}
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                className={passed ? 'text-green-500' : 'text-red-500'}
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-extrabold text-[#103B66]">
                {percentage}%
              </span>
            </div>
          </div>

          <p className="text-gray-700 dark:text-gray-200 text-base">
            {t('correct_of_prefix')}{' '}
            <span className="font-extrabold text-[#103B66] text-lg">{correctAnswers}</span>
            {' '}{t('correct_of_middle')}{' '}
            <span className="font-extrabold text-[#103B66] text-lg">{maxScore}</span>
            {' '}{t('correct_of_suffix')}
          </p>

          {/* Stats strip */}
          <div className="mt-5 grid grid-cols-3 divide-x divide-x-reverse divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="py-3 px-4 text-center">
              <p className="text-2xl font-bold text-green-600">{correctAnswers}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('correct_label')}</p>
            </div>
            <div className="py-3 px-4 text-center">
              <p className="text-2xl font-bold text-red-500">{wrongAnswers}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('wrong_label')}</p>
            </div>
            <div className="py-3 px-4 text-center">
              <p className="text-2xl font-bold text-orange-500">
                {weakSubtopics.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('weak_point_label')}</p>
            </div>
          </div>
        </div>

        {/* ── Subtopic Breakdown ──────────────────────────────────────────── */}
        {subtopics && subtopics.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#103B66]" />
              {t('subtopic_analysis')}
            </h2>

            <div className="space-y-3">
              {subtopics.map((s, idx) => {
                const acc =
                  s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                const barColor =
                  acc < 60
                    ? 'bg-red-400'
                    : acc <= 80
                    ? 'bg-yellow-400'
                    : 'bg-green-400';
                const trackColor =
                  acc < 60
                    ? 'bg-red-100'
                    : acc <= 80
                    ? 'bg-yellow-100'
                    : 'bg-green-100';

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-colors ${
                      acc < 60
                        ? 'border-red-200 bg-red-50/40 dark:border-red-800 dark:bg-red-900/10'
                        : 'border-gray-100 bg-gray-50/40 dark:border-gray-700 dark:bg-gray-700/20'
                    }`}
                  >
                    {/* Top row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#103B66] shrink-0" />
                        <span className="font-bold text-gray-800 dark:text-white text-sm">
                          {s.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <SkillTag skill={s.skill} />
                        <AccuracyPill correct={s.correct} total={s.total} />
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div
                      className={`h-2 rounded-full ${trackColor} overflow-hidden mb-3`}
                    >
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-700`}
                        style={{ width: `${acc}%` }}
                      />
                    </div>

                    {/* Correct / Wrong */}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-green-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="font-bold">{s.correct}</span> {t('correct_label')}
                      </span>
                      <span className="flex items-center gap-1.5 text-red-600">
                        <XCircle className="w-3.5 h-3.5" />
                        <span className="font-bold">{s.wrong}</span> {t('wrong_label')}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 text-xs">
                        {t('correct_of_middle')} {s.total} {t('quiz_question')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <Target className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <div className="space-y-4 w-full">
              {detailedErrors.length > 0 ? (
                detailedErrors.map((err, idx) => (
                  <div key={idx} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-5 text-right shadow-sm">
                    <p className="text-gray-800 dark:text-gray-200 font-semibold mb-4 leading-relaxed">
                      <span className="text-red-500 font-bold ml-1">أخطأت في:</span>
                      {err.question}
                    </p>
                    <div className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg">
                      <span className="font-bold text-sm">💡 تحتاج لمراجعة:</span>
                      <span className="font-bold">{err.subtopic}</span>
                    </div>
                  </div>
                ))
              ) : isLoading ? (
                <div className="text-center text-gray-500 dark:text-gray-400 font-semibold py-6">
                  جارٍ تحميل بيانات المحاولة...
                </div>
              ) : showNoWeaknessMessage ? (
                <div className="text-center text-green-600 dark:text-green-400 font-bold py-6">
                  🎉 ممتاز! لا توجد نقاط ضعف واضحة.
                </div>
              ) : (
                <div className="text-center text-amber-600 dark:text-amber-400 font-bold py-6">
                  {loadError || 'لا تتوفر بيانات كافية لعرض تقرير نقاط الضعف.'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Detected Weaknesses ─────────────────────────────────────────── */}
        {weakSubtopics.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/50 p-6">
            <h2 className="text-lg font-bold text-red-700 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {t('weakness_detected_title')}
            </h2>
            <p className="text-sm text-red-500 mb-5">
              {t('weakness_detected_desc')}{' '}
              <span className="font-bold">{weakSubtopics.length}</span>{' '}
              {weakSubtopics.length > 1 ? t('topics_label') : t('topic_label')}{' '}
              {t('need_review')}
            </p>

            <div className="space-y-3">
              {weakSubtopics.map((s, idx) => {
                const acc = Math.round((s.correct / s.total) * 100);
                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white text-sm">
                          {s.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <SkillTag skill={s.skill} />
                          <span className="text-xs text-red-600 font-semibold">
                            {t('avg_score')} {acc}%
                          </span>
                          <span className="text-xs text-gray-400">
                            ({s.correct}/{s.total} {t('correct_label')})
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleGetRecommendations(s)}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-[#103B66] text-white text-sm font-bold rounded-xl hover:bg-[#0c2d4d] active:scale-95 transition-all shrink-0 w-full sm:w-auto justify-center shadow-md shadow-blue-900/15"
                    >
                      <Zap className="w-4 h-4" />
                      {t('get_recommendations')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── No Weaknesses — success banner ──────────────────────────────── */}
        {!isLoading && hasValidQuestions && hasAnswerData && subtopics && weakSubtopics.length === 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="font-bold text-green-700 dark:text-green-400 text-base">
              {t('no_weakness_title')}
            </p>
            <p className="text-sm text-green-600 mt-1">
              {t('no_weakness_desc')}
            </p>
          </div>
        )}

        {/* ── Action Buttons ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-8">
          <button
            onClick={handleTryAgain}
            disabled
            style={{ opacity: 0.5, cursor: 'not-allowed' }}
            className="bg-[#103B66] text-white py-4 rounded-xl font-bold hover:bg-[#0c2d4d] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10"
          >
            <RefreshCcw className="w-5 h-5" />
            {t('try_again')}
          </button>
          <button
            onClick={handleBackToLesson}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-4 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ArrowRight className={`w-5 h-5 ${lang === 'en' ? 'rotate-180' : ''}`} />
            {t('back_to_lesson')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default WeaknessReport;
