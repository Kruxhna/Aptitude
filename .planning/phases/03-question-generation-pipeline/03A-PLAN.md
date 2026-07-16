---
phase: 03
plan: 03A
title: "LLM Question Generator & Validator (OpenRouter/Llama 3.3)"
wave: 1
depends_on: []
requirements: [CONT-01]
files_modified:
  - api/src/scripts/generate-questions.js [NEW]
  - api/src/scripts/validate-questions.js [NEW]
  - api/src/scripts/prompts/ [NEW DIR]
  - api/src/scripts/prompts/verbal.js [NEW]
  - api/src/scripts/prompts/quantitative.js [NEW]
  - api/src/scripts/prompts/logical.js [NEW]
  - api/package.json
  - .env.example
  - docker-compose.yml
autonomous: true
---

# Plan 03A: LLM Question Generator & Validator

## Objective
Build the question generation pipeline using the OpenRouter API (Llama 3.3 70b instruct) for Verbal, Quantitative, and Logical skill categories. Includes per-skill prompt templates, structured JSON output parsing, and an automated validation step that checks schema compliance, option distinctness, answer correctness, and explanation quality.

## Tasks

<task id="03A-T1">
<title>Install OpenAI SDK and configure environment for OpenRouter</title>
<read_first>
- api/package.json
- .env.example
- docker-compose.yml
</read_first>
<action>
Add `openai` npm package to api/package.json dependencies.
Add `OPENROUTER_API_KEY` to `.env.example` with a placeholder value.
Add `OPENROUTER_API_KEY` environment variable to the `api` service in `docker-compose.yml` (read from host env).
</action>
<acceptance_criteria>
- api/package.json contains "openai" in dependencies
- .env.example contains OPENROUTER_API_KEY=
- docker-compose.yml api service has OPENROUTER_API_KEY in environment section
</acceptance_criteria>
</task>

<task id="03A-T2">
<title>Create per-skill prompt templates</title>
<read_first>
- api/src/models/Question.js (target schema)
- .planning/phases/03-question-generation-pipeline/03-RESEARCH.md (GATE question patterns)
- .planning/phases/03-question-generation-pipeline/03-CONTEXT.md (decisions D-20 through D-27)
</read_first>
<action>
Create `api/src/scripts/prompts/` directory with three files:

**verbal.js** — System prompt instructs the model to generate GATE verbal aptitude questions (synonyms, antonyms, analogies, sentence completion, reading comprehension). Each question is MCQ with 4 options. Prompt requests a difficulty rating (1-5 scale).

**quantitative.js** — System prompt for GATE quantitative aptitude (ratios, percentages, algebra, probability, series). Questions can be MCQ (4 options) or numerical type. For numerical, include `correctAnswer` and `tolerance`. Prompt asks model to verify its own math.

**logical.js** — System prompt for GATE analytical/logical aptitude (syllogisms, number series, blood relations, coding/decoding, direction sense). All MCQ with 4 options.

Each module exports: `{ systemPrompt, userPrompt(count, difficulty) }` where `count` is number of questions per batch (5-10) and `difficulty` is 1-5.
</action>
<acceptance_criteria>
- api/src/scripts/prompts/verbal.js exports systemPrompt and userPrompt function
- api/src/scripts/prompts/quantitative.js exports systemPrompt and userPrompt function
- api/src/scripts/prompts/logical.js exports systemPrompt and userPrompt function
- Each userPrompt function accepts (count, difficulty) parameters
- Prompts reference GATE-specific question patterns
</acceptance_criteria>
</task>

<task id="03A-T3">
<title>Build the LLM question generator script (OpenRouter)</title>
<read_first>
- api/src/scripts/prompts/verbal.js
- api/src/scripts/prompts/quantitative.js
- api/src/scripts/prompts/logical.js
- api/src/models/Question.js
</read_first>
<action>
Create `api/src/scripts/generate-questions.js`:

1. Accepts CLI args: `--skill verbal|quantitative|logical`, `--count N` (default 10), `--difficulty 1-5` (default all levels), `--output generated/` (default directory).
2. Initializes OpenAI client configured for OpenRouter: `new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY })`.
3. Calls the Chat Completions API with model `meta-llama/llama-3.3-70b-instruct`.
4. Uses `response_format: { type: "json_object" }` (or schema if fully supported by OpenRouter/Llama 3.3, otherwise instruct it to output strict JSON). We will use `response_format: { type: "json_object" }` to be safe and instruct the system prompt to return a specific JSON schema.
5. Generates questions in batches of 5-10 per API call.
6. For bell curve distribution (when --difficulty is omitted): generates 15% easy, 25% below-avg, 30% medium, 20% hard, 10% expert.
7. Writes raw LLM output to `generated/{skill}_{difficulty}_{timestamp}.json`.
8. Maps LLM difficulty (1-5) to ELO: 1→800, 2→900, 3→1000, 4→1100, 5→1200.
9. Logs progress and API call count.
</action>
<acceptance_criteria>
- Running `node api/src/scripts/generate-questions.js --skill verbal --count 5 --difficulty 3` creates a JSON file in generated/ directory
- OpenRouter API is called using Llama 3.3 70b instruct
- JSON file contains an array of question objects with text, type, skill, difficulty (ELO-mapped), explanation, options, correctOptionIndex fields
- Bell curve distribution is applied when --difficulty is omitted
</acceptance_criteria>
</task>

<task id="03A-T4">
<title>Build the question validator script</title>
<read_first>
- api/src/models/Question.js (schema reference)
- api/src/scripts/generate-questions.js (output format)
</read_first>
<action>
Create `api/src/scripts/validate-questions.js`:

1. Accepts CLI arg: `--input generated/` (reads all JSON files in directory) or `--input path/to/file.json`.
2. For each question, validates:
   - Schema compliance: required fields present (text, type, skill, difficulty, explanation, active)
   - Type-specific fields: MCQ must have options (4) + correctOptionIndex; numerical must have correctAnswer
   - Option distinctness: no duplicate MCQ options (case-insensitive, trimmed)
   - Answer validity: correctOptionIndex < options.length, correctAnswer is a finite number
   - Explanation quality: non-empty, > 20 characters
   - Difficulty range: ELO between 800 and 1200
   - Text length: question text > 10 characters
3. Outputs a validation report: total, valid, invalid (with reasons per question).
4. Writes validated questions to `generated/validated_{skill}_{timestamp}.json`.
5. Writes rejected questions to `generated/rejected_{timestamp}.json` with failure reasons.
</action>
<acceptance_criteria>
- Running `node api/src/scripts/validate-questions.js --input generated/` processes all JSON files
- Valid questions are written to validated_*.json
- Rejected questions are written to rejected_*.json with specific failure reasons
- Duplicate options are caught and reported
- Missing required fields are caught and reported
- Console output shows total/valid/invalid counts
</acceptance_criteria>
</task>

## Verification
- `node api/src/scripts/generate-questions.js --skill verbal --count 5 --difficulty 3` produces valid JSON output via OpenRouter
- `node api/src/scripts/validate-questions.js --input generated/` reports validation results
- Generated questions match the MongoDB Question schema structure

## Must Haves
- [x] OpenAI SDK configured to point to OpenRouter
- [x] Uses Llama 3.3 70b instruct
- [x] Per-skill prompt templates covering GATE patterns
- [x] Bell curve difficulty distribution
- [x] Automated validation with clear pass/fail per question
- [x] Raw LLM output preserved in generated/ directory

## Artifacts This Phase Produces
- `api/src/scripts/generate-questions.js` — CLI script for LLM question generation
- `api/src/scripts/validate-questions.js` — CLI script for question validation
- `api/src/scripts/prompts/verbal.js` — Verbal prompt template
- `api/src/scripts/prompts/quantitative.js` — Quantitative prompt template
- `api/src/scripts/prompts/logical.js` — Logical prompt template
- `generated/` directory — Raw and validated question JSON files
