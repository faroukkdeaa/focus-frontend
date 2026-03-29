import { useState, useEffect } from 'react';
import { fetchQuizById } from '../api/quizService';

/**
 * Custom hook to fetch and manage quiz data
 * @param {string|number} quizId - The quiz ID from URL params
 * @returns {Object} { quizData, teacher, isLoading, error, refetch }
 */
export const useQuizData = (quizId) => {
  const [quizData, setQuizData] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadQuiz = async () => {
    if (!quizId) {
      setError('Quiz ID is required');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await fetchQuizById(quizId);
      
      // Check if already attempted
      if (result.quiz.quiz_attempt) {
        setError('You have already attempted this quiz.');
        setIsLoading(false);
        return;
      }

      setQuizData(result.quiz);
      setTeacher(result.teacher);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  return {
    quizData,
    teacher,
    isLoading,
    error,
    refetch: loadQuiz,
  };
};
