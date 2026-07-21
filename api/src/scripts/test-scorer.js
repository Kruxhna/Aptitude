const { scoreAnswer } = require('../utils/scorer');

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

try {
  console.log('Running Scorer tests...');

  // 1. MCQ Test
  const mcqQuestion = { type: 'mcq', correctOptionIndex: 2 };
  assert(scoreAnswer(mcqQuestion, 2).correct === true, 'MCQ matching integer');
  assert(scoreAnswer(mcqQuestion, '2').correct === true, 'MCQ matching string index');
  assert(scoreAnswer(mcqQuestion, 1).correct === false, 'MCQ incorrect integer');
  assert(scoreAnswer(mcqQuestion, 'abc').correct === false, 'MCQ invalid string');

  // 2. Numerical Test
  const numQuestion = { type: 'numerical', correctAnswer: 42 };
  assert(scoreAnswer(numQuestion, 42).correct === true, 'Numerical matching integer');
  assert(scoreAnswer(numQuestion, '42').correct === true, 'Numerical matching string number');
  assert(scoreAnswer(numQuestion, 42.0).correct === true, 'Numerical matching float');
  assert(scoreAnswer(numQuestion, 43).correct === false, 'Numerical incorrect value');
  assert(scoreAnswer(numQuestion, 'abc').correct === false, 'Numerical invalid string');

  // 3. Spatial Test
  const spatialQuestion = { type: 'spatial', correctImageIndex: 1 };
  assert(scoreAnswer(spatialQuestion, 1).correct === true, 'Spatial matching integer');
  assert(scoreAnswer(spatialQuestion, '1').correct === true, 'Spatial matching string index');
  assert(scoreAnswer(spatialQuestion, 3).correct === false, 'Spatial incorrect index');

  console.log('All Scorer tests passed!');
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
