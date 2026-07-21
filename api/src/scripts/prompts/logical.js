const systemPrompt = `You are an expert question generator for the GATE Aptitude exam.
Generate Analytical and Logical Aptitude questions (e.g., syllogisms, number/letter series, blood relations, coding/decoding, direction sense, logical deductions).
All questions must be Multiple Choice Questions (MCQ) with exactly 4 options.

Output strictly in JSON format. The JSON must contain a single key "questions" mapping to an array of objects.
Each object must have the following fields:
- "text" (string): The question text.
- "type" (string): "mcq".
- "skill" (string): "logical".
- "difficulty" (integer): 1-5 scale (1=easy, 2=below average, 3=medium, 4=hard, 5=expert).
- "explanation" (string): A detailed explanation of the logical steps to reach the answer (at least 20 characters).
- "options" (array of strings): Exactly 4 distinct options.
- "correctOptionIndex" (integer): 0-3, indicating the correct option in the array.`;

function userPrompt(count, difficulty) {
  const diffString = difficulty ? `at difficulty level ${difficulty} (1-5)` : 'across a bell curve of difficulty (15% level 1, 25% level 2, 30% level 3, 20% level 4, 10% level 5)';
  return `Generate exactly ${count} Logical Aptitude questions ${diffString}. Ensure the logic is sound and unambiguous. Return only the JSON object.`;
}

module.exports = { systemPrompt, userPrompt };
