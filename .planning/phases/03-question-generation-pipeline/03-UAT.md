---
status: diagnosing
phase: 03-question-generation-pipeline
source: [03A-PLAN.md, 03B-PLAN.md]
started: 2026-07-18T12:53:00Z
updated: 2026-07-18T12:54:00Z
---

## Tests

### 1. Verbal Question Generation
expected: Running `npm run generate:verbal` in the `api` directory successfully calls the OpenRouter API and creates a JSON file in the `generated/` directory containing Verbal aptitude questions matching the Mongoose schema.
result: issue
reported: "npm run generate:verbal fails with Missing script error (ran in Aptitude root instead of api directory)"
severity: major

### 2. Quantitative Question Generation
expected: Running `npm run generate:quantitative` in the `api` directory successfully calls the OpenRouter API and creates a JSON file in the `generated/` directory containing Quantitative aptitude questions (including numerical type).
result: pass

### 3. Logical Question Generation
expected: Running `npm run generate:logical` in the `api` directory successfully calls the OpenRouter API and creates a JSON file in the `generated/` directory containing Logical aptitude questions.
result: pass

### 4. Spatial Question Generation
expected: Running `npm run generate:spatial` in the `api` directory generates programmatic SVG-to-PNG images, saves them to `public/spatial/`, and creates a JSON file in the `generated/` directory with the spatial questions and correct image paths.
result: pass

### 5. Automated Question Validation
expected: Running `npm run validate` parses all raw JSON files in the `generated/` directory, checks them against the schema rules (4 options, valid correct answer index, etc.), and outputs `validated_*.json` files.
result: pass

### 6. MongoDB Batch Seeding
expected: Running `npm run seed:batch` reads the validated questions and inserts them into the MongoDB database. Running it a second time skips insertion because of content hash deduplication.
result: pass

### 7. End-to-End Pipeline
expected: Running `npm run pipeline` successfully executes generation, validation, and seeding in sequence without errors.
result: pass

## Summary

total: 7
passed: 6
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Running `npm run generate:verbal` in the `api` directory successfully calls the OpenRouter API and creates a JSON file in the `generated/` directory containing Verbal aptitude questions matching the Mongoose schema."
  status: failed
  reason: "User reported: npm run generate:verbal fails with Missing script error (ran in Aptitude root instead of api directory)"
  severity: major
  test: 1
  artifacts: []
  missing: []

