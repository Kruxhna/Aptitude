---
phase: 03
plan: 03B
title: "Spatial Template Generator & Batch Seeding"
wave: 2
depends_on: [03A]
requirements: [CONT-04]
files_modified:
  - api/src/scripts/generate-spatial.js [NEW]
  - api/src/scripts/spatial-templates/ [NEW DIR]
  - api/src/scripts/spatial-templates/rotation.js [NEW]
  - api/src/scripts/spatial-templates/reflection.js [NEW]
  - api/src/scripts/spatial-templates/pattern.js [NEW]
  - api/src/scripts/batch-seed.js [NEW]
  - api/src/scripts/seed.js
  - api/package.json
autonomous: true
---

# Plan 03B: Spatial Template Generator & Batch Seeding

## Objective
Build the programmatic spatial question generator using SVG templates with `sharp` for PNG conversion. Create the unified batch seeding script that imports all validated questions (LLM-generated + spatial) into MongoDB, replacing the placeholder seed data. Includes deduplication to allow repeatable runs.

## Tasks

<task id="03B-T1">
<title>Install sharp and create spatial template infrastructure</title>
<read_first>
- api/package.json
- api/src/models/Question.js (spatial question schema fields: imagePath, imageOptions, correctImageIndex)
- .planning/phases/03-question-generation-pipeline/03-RESEARCH.md (SVG generation approach)
</read_first>
<action>
Add `sharp` to api/package.json dependencies.

Create `api/src/scripts/spatial-templates/` directory with three template modules:

**rotation.js** — Generates rotation series questions. A base shape (square, triangle, arrow, L-shape) is shown in a sequence of 3 positions with incremental rotation (90° or 45°). The 4th position is the question. Four answer options show the shape at different rotations (one correct). Exports `generate(count, difficulty)` returning an array of question objects with SVG strings for the main image and option images.

**reflection.js** — Generates mirror reflection questions. Shows a shape and asks "which is the mirror image?" Four options with one correct mirror and three distorted/rotated distractors.

**pattern.js** — Generates pattern completion questions. A 2x2 or 3x3 grid with one cell missing. Shapes follow a rule (size increase, alternating fill, color rotation). Four options for the missing cell.

Each template generates SVG string content using template literals with `<svg>`, `<rect>`, `<circle>`, `<polygon>`, `<line>`, and CSS transforms.
</action>
<acceptance_criteria>
- api/package.json contains "sharp" in dependencies
- rotation.js exports generate(count, difficulty) returning array of {text, svgMain, svgOptions[], correctIndex, difficulty, explanation}
- reflection.js exports generate(count, difficulty) with same shape
- pattern.js exports generate(count, difficulty) with same shape
- SVG strings are valid XML with proper viewBox and shape elements
</acceptance_criteria>
</task>

<task id="03B-T2">
<title>Build the spatial question generator script</title>
<read_first>
- api/src/scripts/spatial-templates/rotation.js
- api/src/scripts/spatial-templates/reflection.js
- api/src/scripts/spatial-templates/pattern.js
- api/src/models/Question.js
</read_first>
<action>
Create `api/src/scripts/generate-spatial.js`:

1. Accepts CLI args: `--count N` (default 100), `--output generated/`, `--images-dir api/public/spatial/`.
2. Distributes questions across template types: ~40% rotation, ~30% reflection, ~30% pattern.
3. For each generated question:
   a. Converts SVG main image → PNG via `sharp(Buffer.from(svgString)).png().toFile(path)`
   b. Converts each SVG option → PNG
   c. Saves PNGs to `--images-dir` with naming: `spatial_q{N}.png`, `spatial_q{N}_opt{M}.png`
4. Creates question objects matching MongoDB schema:
   - type: "spatial"
   - skill: "spatial"
   - imagePath: relative path to main image
   - imageOptions: array of relative paths to option images
   - correctImageIndex: index of correct option
5. Applies bell curve difficulty distribution (same as LLM generator).
6. Maps difficulty 1-5 to ELO 800-1200.
7. Writes output to `generated/spatial_{timestamp}.json`.
</action>
<acceptance_criteria>
- Running `node api/src/scripts/generate-spatial.js --count 10` creates PNG files in api/public/spatial/
- PNG files are valid images (not empty, > 100 bytes)
- JSON output contains question objects with imagePath, imageOptions, correctImageIndex
- Difficulty distribution follows the bell curve target
- Script completes without errors for counts up to 100
</acceptance_criteria>
</task>

<task id="03B-T3">
<title>Build the batch seeding script</title>
<read_first>
- api/src/scripts/seed.js (existing seed script pattern)
- api/src/scripts/validate-questions.js (validated output format)
- api/src/scripts/generate-spatial.js (spatial output format)
- api/src/models/Question.js
- api/src/models/index.js
</read_first>
<action>
Create `api/src/scripts/batch-seed.js`:

1. Accepts CLI args: `--input generated/` (reads validated_*.json and spatial_*.json), `--clear` (optional: clear existing questions first), `--dry-run` (optional: validate only, don't insert).
2. Connects to MongoDB using MONGO_URI from env.
3. Reads all validated question JSON files from input directory.
4. Deduplication: For each question, compute a hash of `text + skill + type`. Skip if a question with the same hash already exists in MongoDB. Use a new `contentHash` field on the question or check by text similarity.
5. Inserts new questions using `Question.insertMany()` in batches of 50.
6. Reports: total read, duplicates skipped, new inserted, by skill category.
7. If `--clear` flag: runs `Question.deleteMany({})` before insert (with confirmation prompt).

Update `api/src/scripts/seed.js` to add a note that batch-seed.js is the primary seeding mechanism for generated content.
</action>
<acceptance_criteria>
- Running `node api/src/scripts/batch-seed.js --input generated/` inserts questions into MongoDB
- Running the same command again skips duplicates (0 new inserted)
- --dry-run flag reports what would be inserted without modifying the database
- --clear flag removes existing questions before inserting
- Console output shows per-skill breakdown (verbal: N, quantitative: N, logical: N, spatial: N)
- All inserted questions match the Question model schema
</acceptance_criteria>
</task>

<task id="03B-T4">
<title>Create npm scripts for the generation pipeline</title>
<read_first>
- api/package.json
</read_first>
<action>
Add npm scripts to api/package.json:
- `"generate:verbal"`: `"node src/scripts/generate-questions.js --skill verbal --count 100"`
- `"generate:quantitative"`: `"node src/scripts/generate-questions.js --skill quantitative --count 100"`
- `"generate:logical"`: `"node src/scripts/generate-questions.js --skill logical --count 100"`
- `"generate:spatial"`: `"node src/scripts/generate-spatial.js --count 100"`
- `"generate:all"`: `"npm run generate:verbal && npm run generate:quantitative && npm run generate:logical && npm run generate:spatial"`
- `"validate"`: `"node src/scripts/validate-questions.js --input generated/"`
- `"seed:batch"`: `"node src/scripts/batch-seed.js --input generated/"`
- `"pipeline"`: `"npm run generate:all && npm run validate && npm run seed:batch"`
</action>
<acceptance_criteria>
- `npm run generate:verbal` invokes the generator for verbal questions
- `npm run pipeline` runs the full generation → validation → seeding pipeline
- All script paths resolve correctly from the api/ directory
</acceptance_criteria>
</task>

## Verification
- `node api/src/scripts/generate-spatial.js --count 10` generates PNG images and spatial question JSON
- `node api/src/scripts/batch-seed.js --input generated/ --dry-run` reports expected inserts without modifying DB
- `node api/src/scripts/batch-seed.js --input generated/` inserts questions; re-running skips duplicates
- `npm run pipeline` (from api/) runs the full pipeline end-to-end

## Must Haves
- [x] Spatial questions generated with SVG→PNG conversion
- [x] Three template types: rotation, reflection, pattern
- [x] Batch seeding with deduplication
- [x] Repeatable pipeline (can run multiple times safely)
- [x] npm scripts for each pipeline stage

## Artifacts This Phase Produces
- `api/src/scripts/generate-spatial.js` — CLI script for spatial question generation
- `api/src/scripts/spatial-templates/rotation.js` — Rotation series template
- `api/src/scripts/spatial-templates/reflection.js` — Mirror reflection template
- `api/src/scripts/spatial-templates/pattern.js` — Pattern completion template
- `api/src/scripts/batch-seed.js` — MongoDB batch seeding with deduplication
- `api/public/spatial/` directory — Generated PNG images for spatial questions
