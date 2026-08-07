const axios = require('axios');

const engineUrl = process.env.ENGINE_URL || 'http://engine:8000';

const client = axios.create({
  baseURL: engineUrl,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Call the adaptive engine to calculate the next set of questions.
 * @param {string} userId - The user ID
 * @param {object} skillRatings - The user's current ELO ratings { verbal, quantitative, logical, spatial }
 * @param {number} questionCount - Number of questions requested (optional)
 * @returns {Promise<object>} The engine's response
 */
async function calculateNext(userId, skillRatings, questionCount = 10) {
  try {
    const response = await client.post('/calculate-next', {
      userId,
      skillRatings,
      questionCount,
    });
    return response.data;
  } catch (error) {
    console.error('Error calling engine /calculate-next:', error.message);
    throw new Error(`Engine calculation failed: ${error.message}`);
  }
}

/**
 * Call the adaptive engine to update user ratings after a sprint.
 * @param {string} userId - The user ID
 * @param {Array} responses - Array of response items { questionId, skill, questionDifficulty, answer, correct, timeMs }
 * @param {object} currentRatings - The user's current ELO ratings
 * @param {number} sessionsCompleted - Number of sessions user has completed
 * @param {number|undefined} kFactorOverride - Optional K-factor override (e.g. 16 for Learn mode)
 * @returns {Promise<object>} The engine's response (new ratings and XP)
 */
async function updateRating(userId, responses, currentRatings, sessionsCompleted, kFactorOverride) {
  try {
    const payload = {
      userId,
      responses,
      currentRatings,
      sessionsCompleted: sessionsCompleted || 0,
    };
    if (kFactorOverride !== undefined && kFactorOverride !== null) {
      payload.kFactorOverride = kFactorOverride;
    }
    const response = await client.post('/update-rating', payload);
    return response.data;
  } catch (error) {
    console.error('Error calling engine /update-rating:', error.message);
    throw new Error(`Engine rating update failed: ${error.message}`);
  }
}

module.exports = {
  calculateNext,
  updateRating,
};
