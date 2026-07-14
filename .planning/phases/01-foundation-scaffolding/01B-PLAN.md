---
phase: 1
plan_id: 01B
title: "MongoDB Schemas & Seed Data"
wave: 2
depends_on: ["01A"]
files_modified:
  - api/src/models/Question.js
  - api/src/models/User.js
  - api/src/models/QuizSession.js
  - api/src/models/index.js
  - api/src/scripts/seed.js
  - api/package.json
autonomous: true
requirements:
  - CONT-02
  - CONT-03
  - INFR-04
---

# Plan 01B: MongoDB Schemas & Seed Data

## Objective

Create Mongoose schemas for questions (supporting MCQ, numerical, image-based formats), users (with embedded ELO ratings), and quiz sessions (with ELO snapshots). Add compound indexes and a seed script to populate initial test data.

## Tasks

<task id="01B-T1">
<title>Create Question model with compound indexes</title>
<read_first>
- .planning/phases/01-foundation-scaffolding/01-RESEARCH.md (Question Schema section)
- .planning/phases/01-foundation-scaffolding/01-CONTEXT.md (D-05, D-06)
- api/src/config/db.js
</read_first>
<action>
Create `api/src/models/Question.js`:
- Single flexible schema with fields:
  - `text` (String, required)
  - `type` (String, enum: ['mcq', 'numerical', 'spatial'], required)
  - `skill` (String, enum: ['verbal', 'quantitative', 'logical', 'spatial'], required)
  - `difficulty` (Number, default: 1000) — ELO-style rating
  - `explanation` (String, required)
  - `active` (Boolean, default: true)
  - `options` ([String]) — MCQ only
  - `correctOptionIndex` (Number) — MCQ only
  - `correctAnswer` (Number) — Numerical only
  - `tolerance` (Number, default: 0) — Numerical only
  - `imagePath` (String) — Spatial only
  - `imageOptions` ([String]) — Spatial only
  - `correctImageIndex` (Number) — Spatial only
  - `timesAnswered` (Number, default: 0)
  - `timesCorrect` (Number, default: 0)
  - timestamps: true

Add compound indexes:
  - `{ skill: 1, difficulty: 1, active: 1 }` — Primary query index for question selection
  - `{ type: 1, skill: 1 }` — Secondary index for type-filtered queries

Export as `mongoose.model('Question', questionSchema)`
</action>
<acceptance_criteria>
- `api/src/models/Question.js` exports Mongoose model named 'Question'
- Schema has `type` field with enum `['mcq', 'numerical', 'spatial']`
- Schema has `skill` field with enum `['verbal', 'quantitative', 'logical', 'spatial']`
- Schema has compound index on `{ skill: 1, difficulty: 1, active: 1 }`
- Schema has `difficulty` field defaulting to 1000
- Optional fields `options`, `correctOptionIndex`, `correctAnswer`, `imagePath` exist
</acceptance_criteria>
</task>

<task id="01B-T2">
<title>Create User model with embedded ELO ratings</title>
<read_first>
- .planning/phases/01-foundation-scaffolding/01-RESEARCH.md (User Schema section)
- .planning/phases/01-foundation-scaffolding/01-CONTEXT.md (D-07)
</read_first>
<action>
Create `api/src/models/User.js`:
- Schema with fields:
  - `name` (String, default: 'Mock User')
  - `email` (String)
  - `ratings` embedded object: `{ verbal: 1000, quantitative: 1000, logical: 1000, spatial: 1000 }` (all Number, default 1000)
  - `totalXp` (Number, default: 0)
  - `currentStreak` (Number, default: 0)
  - `longestStreak` (Number, default: 0)
  - `streakFreezeAvailable` (Boolean, default: true)
  - `lastSprintDate` (Date)
  - `sessionsCompleted` (Number, default: 0)
  - timestamps: true

Export as `mongoose.model('User', userSchema)`
</action>
<acceptance_criteria>
- `api/src/models/User.js` exports Mongoose model named 'User'
- Schema has `ratings` embedded object with `verbal`, `quantitative`, `logical`, `spatial` fields all defaulting to 1000
- Schema has `totalXp`, `currentStreak`, `longestStreak` fields
- Schema has `sessionsCompleted` field for K-factor decay tracking
</acceptance_criteria>
</task>

<task id="01B-T3">
<title>Create QuizSession model with ELO snapshots</title>
<read_first>
- .planning/phases/01-foundation-scaffolding/01-RESEARCH.md (Quiz Session Schema section)
- .planning/phases/01-foundation-scaffolding/01-CONTEXT.md (D-08)
</read_first>
<action>
Create `api/src/models/QuizSession.js`:
- Schema with fields:
  - `userId` (ObjectId, ref: 'User', required)
  - `sprintType` (String, enum: ['quick', 'standard', 'deep'], required)
  - `responses` array of subdocuments:
    - `questionId` (ObjectId, ref: 'Question')
    - `answer` (Schema.Types.Mixed) — String for MCQ index, Number for numerical
    - `correct` (Boolean)
    - `timeMs` (Number) — response time in ms
  - `accuracy` (Number) — 0-1 percentage
  - `totalTimeMs` (Number)
  - `xpEarned` (Number)
  - `ratingsAfter` embedded object: `{ verbal, quantitative, logical, spatial }` — ELO snapshot per D-08
  - `completedAt` (Date, default: Date.now)

Add index: `{ userId: 1, completedAt: -1 }`

Export as `mongoose.model('QuizSession', quizSessionSchema)`
</action>
<acceptance_criteria>
- `api/src/models/QuizSession.js` exports Mongoose model named 'QuizSession'
- Schema has `responses` array with `questionId`, `answer`, `correct`, `timeMs` subdoc fields
- Schema has `ratingsAfter` embedded object for ELO history tracking
- Schema has index on `{ userId: 1, completedAt: -1 }`
- `sprintType` enum includes `['quick', 'standard', 'deep']`
</acceptance_criteria>
</task>

<task id="01B-T4">
<title>Create model index and seed script</title>
<read_first>
- api/src/models/Question.js
- api/src/models/User.js
- api/src/config/db.js
</read_first>
<action>
Create `api/src/models/index.js`:
- Re-export all models: Question, User, QuizSession

Create `api/src/scripts/seed.js`:
- Connect to MongoDB using MONGO_URI from .env
- Create mock user with _id '000000000000000000000001' (matching mockUser middleware)
- Create 20 sample questions (5 per skill category):
  - 5 Verbal MCQs with 4 options each
  - 5 Quantitative numerical questions with correctAnswer and tolerance
  - 5 Logical MCQs
  - 5 Spatial MCQs with imagePath placeholders
- All questions have: difficulty: 1000, active: true, explanation text
- Log counts after seeding
- Disconnect after completion

Add script to api/package.json: `"seed": "node src/scripts/seed.js"`
</action>
<acceptance_criteria>
- `api/src/models/index.js` exports Question, User, QuizSession
- `api/src/scripts/seed.js` connects to MongoDB and creates mock user with ID `000000000000000000000001`
- Seed script creates 20 questions across 4 skill categories (5 each)
- Running `cd api && node src/scripts/seed.js` completes without errors
- After seeding, `db.questions.countDocuments()` returns 20
- After seeding, `db.users.countDocuments()` returns at least 1
</acceptance_criteria>
</task>

## Verification

```bash
# Start services
docker compose up -d

# Run seed script
docker compose exec api node src/scripts/seed.js

# Verify data in MongoDB
docker compose exec mongo mongosh aptitude --eval "db.questions.countDocuments()"
# Expected: 20

docker compose exec mongo mongosh aptitude --eval "db.users.findOne({_id: ObjectId('000000000000000000000001')})"
# Expected: Mock User document with ratings embedded

# Verify indexes
docker compose exec mongo mongosh aptitude --eval "db.questions.getIndexes()"
# Expected: compound index on {skill, difficulty, active}
```

## must_haves
- [ ] Question schema supports MCQ, numerical, and spatial formats via optional fields
- [ ] Compound index `{ skill, difficulty, active }` exists on questions collection
- [ ] User model has embedded per-skill ELO ratings defaulting to 1000
- [ ] QuizSession stores ELO snapshots in `ratingsAfter` field
- [ ] Seed script creates 20 questions and 1 mock user

## Artifacts this phase produces
- `/api/src/models/Question.js` — Question Mongoose model
- `/api/src/models/User.js` — User Mongoose model  
- `/api/src/models/QuizSession.js` — QuizSession Mongoose model
- `/api/src/models/index.js` — Model barrel export
- `/api/src/scripts/seed.js` — Database seed script
