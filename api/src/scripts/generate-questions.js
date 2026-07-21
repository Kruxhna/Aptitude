require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const { getModel, getLabel } = require('./model-router');

const args = require('util').parseArgs({
  options: {
    skill: { type: 'string' },
    count: { type: 'string', default: '10' },
    difficulty: { type: 'string' },
    output: { type: 'string', default: 'generated' }
  }
}).values;

if (!args.skill || !['verbal', 'quantitative', 'logical'].includes(args.skill)) {
  console.error('Usage: node generate-questions.js --skill <verbal|quantitative|logical> [--count N] [--difficulty 1-5] [--output dir]');
  process.exit(1);
}

const count = parseInt(args.count, 10);
const difficulty = args.difficulty ? parseInt(args.difficulty, 10) : null;
const outputDir = path.resolve(__dirname, '../../..', args.output);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function mapToElo(level) {
  const map = { 1: 800, 2: 900, 3: 1000, 4: 1100, 5: 1200 };
  return map[level] || 1000;
}

const promptModule = require(`./prompts/${args.skill}`);

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY
});

async function callApi(messages, model) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out after 90s')), 90000);
    openai.chat.completions.create({
      model,
      messages,
      response_format: { type: 'json_object' },
      max_tokens: 2048
    }).then(result => {
      clearTimeout(timer);
      resolve(result);
    }).catch(err => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function generateBatch() {
  const primaryModel = getModel(args.skill, false);
  const fallbackModel = getModel(args.skill, true);
  const modelLabel = getLabel(args.skill);

  console.log(`\n🤖 Model Router`);
  console.log(`  Skill:    ${args.skill}`);
  console.log(`  Primary:  ${primaryModel} (${modelLabel})`);
  console.log(`  Fallback: ${fallbackModel}`);
  console.log(`  Target:   ${count} questions in batches of 5\n`);

  const batchSize = 5;
  const allQuestions = [];
  const totalBatches = Math.ceil(count / batchSize);

  for (let i = 0; i < count; i += batchSize) {
    const currentBatchSize = Math.min(batchSize, count - i);
    const batchNum = Math.floor(i / batchSize) + 1;
    console.log(`Batch ${batchNum}/${totalBatches} — ${currentBatchSize} questions...`);

    const messages = [
      { role: 'system', content: promptModule.systemPrompt },
      { role: 'user', content: promptModule.userPrompt(currentBatchSize, difficulty) }
    ];

    let success = false;

    // Try primary model
    try {
      console.log(`  → ${primaryModel}`);
      const completion = await callApi(messages, primaryModel);
      const data = JSON.parse(completion.choices[0].message.content);
      if (!data.questions || !Array.isArray(data.questions)) throw new Error('Missing "questions" array');
      data.questions.forEach(q => { q.difficulty = mapToElo(q.difficulty) || 1000; q.active = true; q._model = primaryModel; });
      allQuestions.push(...data.questions);
      console.log(`  ✓ Primary succeeded. Total: ${allQuestions.length}/${count}`);
      success = true;
    } catch (primaryErr) {
      console.error(`  ✗ Primary failed: ${primaryErr.message}`);
    }

    // Fallback if primary failed
    if (!success && fallbackModel) {
      try {
        console.log(`  → Fallback: ${fallbackModel}`);
        const completion = await callApi(messages, fallbackModel);
        const data = JSON.parse(completion.choices[0].message.content);
        if (!data.questions || !Array.isArray(data.questions)) throw new Error('Missing "questions" array');
        data.questions.forEach(q => { q.difficulty = mapToElo(q.difficulty) || 1000; q.active = true; q._model = fallbackModel; });
        allQuestions.push(...data.questions);
        console.log(`  ✓ Fallback succeeded. Total: ${allQuestions.length}/${count}`);
      } catch (fallbackErr) {
        console.error(`  ✗ Fallback also failed: ${fallbackErr.message}. Skipping batch.`);
      }
    }
  }

  const timestamp = Date.now();
  const diffLabel = difficulty ? `diff${difficulty}` : 'bellcurve';
  const filePath = path.join(outputDir, `${args.skill}_${diffLabel}_${timestamp}.json`);

  if (allQuestions.length > 0) {
    fs.writeFileSync(filePath, JSON.stringify(allQuestions, null, 2));
    // Model usage stats
    const modelStats = allQuestions.reduce((acc, q) => {
      acc[q._model || 'unknown'] = (acc[q._model || 'unknown'] || 0) + 1;
      return acc;
    }, {});
    console.log(`\n✅ Done! Wrote ${allQuestions.length} questions → ${filePath}`);
    console.log('📊 Model usage:');
    Object.entries(modelStats).forEach(([m, n]) => console.log(`   ${m}: ${n} questions`));
  } else {
    console.log('No questions generated.');
  }
}

generateBatch();
