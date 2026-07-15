# Phase 3: Question Generation Pipeline - Context

**Gathered:** 2026-07-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a hybrid question generation pipeline that produces valid questions across all 4 GATE Aptitude skill categories (Verbal, Quantitative, Logical, Spatial). The LLM generates questions for Verbal, Quantitative, and Logical; spatial questions are generated programmatically using handcrafted template patterns with SVG image generation. A batch seeding script imports validated questions into MongoDB, replacing the existing hardcoded placeholder seed data.

</domain>

<decisions>
## Implementation Decisions

### LLM Provider & Generation Strategy
- **D-20:** Use **OpenAI API (GPT-4o)** as the LLM provider for question generation. Well-documented function calling for structured JSON output.
- **D-21:** Generate questions in **batches of 5–10 per prompt**. Each prompt requests N questions in a JSON array format. This balances efficiency (fewer API calls) with quality (manageable output size).
- **D-22:** LLM generates questions for **Verbal, Quantitative, and Logical** categories only. **Spatial questions are not LLM-generated** — they use handcrafted programmatic templates.

### Spatial Question Generation
- **D-23:** Spatial questions are generated using **handcrafted template patterns** (rotation, reflection, series completion) with **programmatic SVG image generation in Node.js** (e.g., `sharp` or `svg-builder`). Generated SVG/PNG images are stored as static files.
- **D-24:** Spatial templates define transformation rules (rotate 90°, mirror, translate, scale) applied to base shapes. Each template produces a question with correct answer and distractors.

### Difficulty Calibration
- **D-25:** Initial difficulty is **LLM-estimated with ELO mapping**. The LLM rates each question's difficulty on a 1–5 scale, mapped to ELO ranges:
  - Level 1 (Easy) → ELO 800
  - Level 2 (Below Average) → ELO 900
  - Level 3 (Medium) → ELO 1000
  - Level 4 (Hard) → ELO 1100
  - Level 5 (Expert) → ELO 1200
- **D-26:** Target a **bell curve distribution** concentrated around ELO 1000 (medium), with fewer questions at extremes. Approximate target per skill: ~15% easy, ~25% below-average, ~30% medium, ~20% hard, ~10% expert.
- **D-27:** The adaptive engine's ELO system will further calibrate question difficulty over time as users answer them. Initial LLM estimates are starting points, not final ratings.

### Validation & Quality
- **D-28:** The template validator checks: answer correctness (for numerical: verify math), option distinctness (no duplicate MCQ options), format compliance (required fields present), and explanation quality (non-empty, relevant). Questions failing validation are excluded from the database and logged.
- **D-29:** Fully automated pipeline — no manual review step for v1. The validator serves as the quality gate.

### Seeding & Batch Process
- **D-30:** Target **100+ validated questions per skill category** (400+ total across 4 skills).
- **D-31:** The seeding script is a **repeatable pipeline** — can be run multiple times to add more questions without duplicating existing ones. Uses a deduplication check (e.g., text similarity or hash).
- **D-32:** Raw LLM output is stored as intermediate JSON files in a `generated/` directory before validation and import. This allows re-validation without re-generating.

### Carrying Forward from Prior Phases
- D-07: Questions stored in MongoDB with schema supporting MCQ, numerical, and spatial formats
- D-08: Each question has: `text`, `type`, `skill`, `difficulty`, `explanation`, `active`, plus type-specific fields
- Existing `seed.js` inserts 20 hardcoded placeholder questions — this phase replaces/supplements with generated content
- Question schema fields: `options`, `correctOptionIndex`, `correctAnswer`, `tolerance`, `imagePath`, `imageOptions`, `correctImageIndex`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/PROJECT.md` — Tech stack constraints (OpenAI API for question gen)
- `.planning/REQUIREMENTS.md` — CONT-01, CONT-04
- `.planning/ROADMAP.md` — Phase 3 goals and success criteria
- `.planning/phases/02-adaptive-engine/02-CONTEXT.md` — Phase 2 decisions (D-13 through D-19, ELO ranges inform difficulty mapping)
- `api/src/models/Question.js` — Question schema and indexes (target format for generated questions)
- `api/src/scripts/seed.js` — Existing seed script (replace with generated content pipeline)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `api/src/models/Question.js` — Mongoose schema defines the exact shape generated questions must match.
- `api/src/scripts/seed.js` — Existing seeding pattern with MongoDB connection, `Question.insertMany()`. Extend or replace.
- `engine/requirements.txt` — Python environment available if any generation logic needs to live in the engine.

### Established Patterns
- Mongoose models with `insertMany()` for bulk operations
- `require('dotenv').config()` for environment variable loading
- Docker Compose services with `MONGO_URI` for database connectivity

### Integration Points
- `OPENAI_API_KEY` environment variable must be added to `.env` and `docker-compose.yml`
- Generated questions must match the `questionSchema` exactly (required fields: `text`, `type`, `skill`, `difficulty`, `explanation`, `active`)
- Spatial images stored as static files, referenced by `imagePath` and `imageOptions` paths in the question document

</code_context>

<specifics>
## Specific Ideas

- Separate prompt templates per skill category (Verbal: synonyms/antonyms/analogies/comprehension; Quantitative: algebra/arithmetic/geometry/probability; Logical: syllogisms/sequences/puzzles)
- Include GATE-specific question patterns (e.g., "previous year" style questions)
- Spatial templates: rotation series, mirror reflection, pattern completion, odd-one-out

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 3-Question Generation Pipeline*
*Context gathered: 2026-07-15*
