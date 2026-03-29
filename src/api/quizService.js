import api from './api';

/**
 * Fetch a single quiz with all related data (teacher, lesson, questions)
 * @param {number|string} quizId - The ID of the quiz
 * @returns {Promise<Object>} Quiz data with teacher and questions
 */
export const fetchQuizById = async (quizId) => {
  try {
    const response = await api.get(`/quizzes-details/${quizId}`);
    return {
      success: true,
      data: response.data,
      teacher: response.data.teacher,
      quiz: response.data.quiz,
    };
  } catch (error) {
    console.error('[Quiz API] Fetch error:', error);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please login.');
    }
    if (error.response?.status === 404) {
      throw new Error('Quiz not found.');
    }
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to access this quiz.');
    }
    
    throw new Error(error.response?.data?.message || 'Failed to load quiz data.');
  }
};

/**
 * Submit quiz answers
 * @param {number|string} quizId - The ID of the quiz
 * @param {Array} answers - Array of {question_id, answer_text}
 * @returns {Promise<Object>} Score and results
 */
export const submitQuizAnswers = async (quizId, answers) => {
  try {
    const response = await api.post(`/quiz/${quizId}/answer`, { answers });
    return {
      success: true,
      score: response.data.score,
      answers: response.data.answers,
      message: response.data.message,
    };
  } catch (error) {
    console.error('[Quiz API] Submit error:', error);
    
    if (error.response?.status === 422) {
      throw new Error('Invalid answers format. Please try again.');
    }
    if (error.response?.status === 409) {
      throw new Error('You have already attempted this quiz.');
    }
    
    throw new Error(error.response?.data?.message || 'Failed to submit quiz.');
  }
};
