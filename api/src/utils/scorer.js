/**
 * Helper to score user answers strictly based on question type.
 * 
 * MCQ: Match option index (0-3).
 * Numerical: Match exact numeric value.
 * Spatial: Match image option index (0-3).
 * 
 * @param {Object} question - The question document from DB
 * @param {string|number} userAnswer - The user's submitted answer
 * @returns {Object} { correct: boolean, correctAnswer: any }
 */
function scoreAnswer(question, userAnswer) {
  if (!question || !question.type) {
    return { correct: false, correctAnswer: null };
  }

  let correct = false;
  let correctAnswer = null;

  switch (question.type) {
    case 'mcq':
      correctAnswer = question.correctOptionIndex;
      if (userAnswer !== null && userAnswer !== undefined && userAnswer !== '') {
        const userIndex = parseInt(userAnswer, 10);
        correct = !isNaN(userIndex) && userIndex === question.correctOptionIndex;
      }
      break;

    case 'numerical':
      correctAnswer = question.correctAnswer;
      if (userAnswer !== null && userAnswer !== undefined && userAnswer !== '') {
        const userNum = Number(userAnswer);
        correct = !isNaN(userNum) && userNum === question.correctAnswer;
      }
      break;

    case 'spatial':
      correctAnswer = question.correctImageIndex;
      if (userAnswer !== null && userAnswer !== undefined && userAnswer !== '') {
        const userIndex = parseInt(userAnswer, 10);
        correct = !isNaN(userIndex) && userIndex === question.correctImageIndex;
      }
      break;

    default:
      break;
  }

  return { correct, correctAnswer };
}

module.exports = { scoreAnswer };
