# Phase 03: Question Generation Pipeline — Research

**Date:** 2026-07-16
**Status:** Complete

## 1. OpenAI GPT-4o Structured Output

### Best Approach: Structured Outputs + Batch API
- **Structured Outputs** with `strict: true` constrains the model to follow an exact JSON schema — no parsing/regex needed.
- **Batch API** processes `.jsonl` files asynchronously at 50% cost reduction. Typically completes within 24 hours.
- Use model version `gpt-4o-2024-08-06` or later for full Structured Outputs support.

### Implementation Pattern
1. Define a JSON schema matching the MongoDB `questionSchema` fields.
2. For v1, use the standard Chat Completions API (simpler for dev). Batch API can be added later for large-scale generation.
3. Use the `openai` npm package in Node.js with `response_format: { type: "json_schema", json_schema: { name: "questions", strict: true, schema: {...} } }`.

### Schema Design
```json
{
  "type": "object",
  "properties": {
    "questions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "text": { "type": "string" },
          "type": { "type": "string", "enum": ["mcq", "numerical"] },
          "skill": { "type": "string", "enum": ["verbal", "quantitative", "logical"] },
          "difficulty": { "type": "integer", "minimum": 1, "maximum": 5 },
          "explanation": { "type": "string" },
          "options": { "type": "array", "items": { "type": "string" } },
          "correctOptionIndex": { "type": "integer" },
          "correctAnswer": { "type": "number" },
          "tolerance": { "type": "number" }
        },
        "required": ["text", "type", "skill", "difficulty", "explanation"]
      }
    }
  },
  "required": ["questions"]
}
```

## 2. SVG Generation in Node.js

### Recommended Stack
- **`svg-builder`** — fluent chainable API for constructing SVG markup (`svgBuilder.create().width(200).height(200).circle({...}).render()`)
- **`sharp`** — NOT an SVG generator; use it AFTER to convert SVG buffer → PNG for storage as static files
- Pattern: Generate SVG string → pass to `sharp` for PNG conversion → save to disk

### Alternative: Direct SVG string templates
For simple geometric patterns (GATE spatial questions), direct string template literals may be simpler than importing a library:
```js
const svg = `<svg width="200" height="200">
  <rect x="10" y="10" width="80" height="80" fill="blue" transform="rotate(${angle}, 50, 50)"/>
</svg>`;
```

### Decision: Use direct SVG string templates + `sharp` for PNG conversion
- GATE spatial patterns are simple geometric shapes (circles, squares, triangles, arrows)
- Template literals with transform attributes handle rotation/reflection/scaling
- `sharp` converts to PNG for cross-platform rendering in React Native

## 3. GATE Aptitude Question Patterns

### Verbal Aptitude (MCQ)
- **Synonyms/Antonyms**: "What is the synonym/antonym of X?"
- **Analogies**: "X is to Y as Z is to ?"
- **Sentence Completion**: Fill in the blank with the correct word
- **Reading Comprehension**: Short passage with inference questions
- **Verbal Reasoning**: Evaluate argument validity

### Quantitative Aptitude (MCQ + Numerical)
- **Ratios & Percentages**: "If 30% of X is Y, find Z"
- **Algebra**: Solve equations (linear, quadratic)
- **Probability**: "In how many ways can N items be arranged?"
- **Data Interpretation**: Read from bar/pie charts (text descriptions for v1)
- **Series & Sequences**: "Find the next number: 2, 6, 12, 20, ?"

### Analytical/Logical Aptitude (MCQ)
- **Syllogisms**: "All A are B, Some B are C, therefore..."
- **Number Series**: Pattern recognition in sequences
- **Blood Relations**: "A is the father of B who is..."
- **Coding/Decoding**: "If GATE = 7143, then EXAM = ?"
- **Direction Sense**: "X walks 5km north, then turns left..."

### Spatial Aptitude (Image-based MCQ)
- **Rotation Series**: Shape rotates 90°/45° each step
- **Mirror Reflection**: Find the mirror image
- **Pattern Completion**: Fill in the missing quadrant
- **Paper Folding**: Predict the result of unfolding punched paper
- **Odd One Out**: Which shape doesn't belong

## 4. Validation Strategy

### Automated Checks
1. **Schema compliance**: All required fields present, correct types
2. **Option distinctness**: No duplicate MCQ options (case-insensitive)
3. **Answer validity**: `correctOptionIndex` < `options.length`, `correctAnswer` is a number for numerical
4. **Explanation quality**: Non-empty, > 20 characters
5. **Difficulty range**: Must be 1-5
6. **Deduplication**: Text similarity hash to avoid near-duplicate questions

### Difficulty → ELO Mapping
| Level | Label | ELO |
|-------|-------|-----|
| 1 | Easy | 800 |
| 2 | Below Average | 900 |
| 3 | Medium | 1000 |
| 4 | Hard | 1100 |
| 5 | Expert | 1200 |

### Bell Curve Target Distribution (per skill, 100 questions)
| Level | Count | % |
|-------|-------|---|
| 1 | 15 | 15% |
| 2 | 25 | 25% |
| 3 | 30 | 30% |
| 4 | 20 | 20% |
| 5 | 10 | 10% |

## 5. Dependencies

### New npm packages needed
- `openai` — OpenAI Node.js SDK
- `sharp` — SVG-to-PNG conversion
- `dotenv` — Already in use

### Environment variables
- `OPENAI_API_KEY` — Required for LLM generation

## RESEARCH COMPLETE
