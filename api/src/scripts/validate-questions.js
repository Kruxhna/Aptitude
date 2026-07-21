const fs = require('fs');
const path = require('path');

const args = require('util').parseArgs({
  options: {
    input: { type: 'string', required: true }
  }
}).values;

const inputPath = path.resolve(__dirname, '../../..', args.input);

let filesToProcess = [];

if (fs.existsSync(inputPath)) {
  const stat = fs.statSync(inputPath);
  if (stat.isDirectory()) {
    const allFiles = fs.readdirSync(inputPath).filter(f => f.endsWith('.json') && !f.startsWith('validated_') && !f.startsWith('rejected_'));
    filesToProcess = allFiles.map(f => path.join(inputPath, f));
  } else {
    filesToProcess = [inputPath];
  }
} else {
  console.error(`Input path does not exist: ${inputPath}`);
  process.exit(1);
}

let totalValid = 0;
let totalInvalid = 0;

for (const file of filesToProcess) {
  let questions = [];
  try {
    const content = fs.readFileSync(file, 'utf8');
    questions = JSON.parse(content);
    if (!Array.isArray(questions)) {
      throw new Error('JSON root is not an array');
    }
  } catch (e) {
    console.error(`Failed to parse ${file}: ${e.message}`);
    continue;
  }

  const validQuestions = [];
  const rejectedQuestions = [];

  questions.forEach((q, index) => {
    const reasons = [];

    // Schema compliance
    if (!q.text || typeof q.text !== 'string' || q.text.length <= 10) reasons.push('Missing or short text');
    if (!['mcq', 'numerical', 'spatial'].includes(q.type)) reasons.push(`Invalid type: ${q.type}`);
    if (!['verbal', 'quantitative', 'logical', 'spatial'].includes(q.skill)) reasons.push(`Invalid skill: ${q.skill}`);
    if (q.difficulty < 800 || q.difficulty > 1200) reasons.push(`Difficulty out of range: ${q.difficulty}`);
    if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.length <= 20) reasons.push('Missing or short explanation');

    // Type specific
    if (q.type === 'mcq') {
      if (!Array.isArray(q.options) || q.options.length !== 4) reasons.push('MCQ must have exactly 4 options');
      else {
        const uniqueOptions = new Set(q.options.map(o => String(o).trim().toLowerCase()));
        if (uniqueOptions.size !== 4) reasons.push('MCQ options must be distinct');
      }
      if (typeof q.correctOptionIndex !== 'number' || q.correctOptionIndex < 0 || q.correctOptionIndex > 3) {
        reasons.push('Invalid correctOptionIndex');
      }
    } else if (q.type === 'numerical') {
      if (typeof q.correctAnswer !== 'number' || !isFinite(q.correctAnswer)) reasons.push('Numerical must have a valid correctAnswer');
    } else if (q.type === 'spatial') {
      if (!q.imagePath) reasons.push('Spatial must have imagePath');
      if (!Array.isArray(q.imageOptions) || q.imageOptions.length !== 4) reasons.push('Spatial must have exactly 4 imageOptions');
      if (typeof q.correctImageIndex !== 'number' || q.correctImageIndex < 0 || q.correctImageIndex > 3) {
        reasons.push('Invalid correctImageIndex');
      }
    }

    if (reasons.length > 0) {
      rejectedQuestions.push({ question: q, index, reasons });
      totalInvalid++;
    } else {
      validQuestions.push(q);
      totalValid++;
    }
  });

  const timestamp = Date.now();
  const dir = path.dirname(file);
  const baseName = path.basename(file, '.json');

  if (validQuestions.length > 0) {
    const validPath = path.join(dir, `validated_${baseName}_${timestamp}.json`);
    fs.writeFileSync(validPath, JSON.stringify(validQuestions, null, 2));
  }

  if (rejectedQuestions.length > 0) {
    const rejectedPath = path.join(dir, `rejected_${baseName}_${timestamp}.json`);
    fs.writeFileSync(rejectedPath, JSON.stringify(rejectedQuestions, null, 2));
  }

  console.log(`Processed ${file}: ${validQuestions.length} valid, ${rejectedQuestions.length} rejected`);
}

console.log(`\nValidation Complete. Total Valid: ${totalValid}, Total Invalid: ${totalInvalid}`);
