# Phase 4: Daily Sprint API - Plan

## Target
Upgrade the existing `GET /api/sprint` and `POST /api/sprint/submit` routes to production logic. Implement strict answer scoring, Redis-backed sprint sessions to prevent double-submissions, and a rich results payload with per-question breakdowns and ELO rating deltas.

## Implementation Steps

### 1. Redis Client Initialization
- **[NEW] `api/src/services/redisClient.js`**
  - Initialize and export an `ioredis` client using `process.env.REDIS_URL` (defaulting to `redis://localhost:6379`).
  - Add basic error handling for connection issues.

### 2. Answer Scoring Utility
- **[NEW] `api/src/utils/scorer.js`**
  - Export a `scoreAnswer(question, userAnswer)` function.
  - Implement strict matching based on `question.type`:
    - `mcq`: parse `userAnswer` as Number and compare to `question.correctOptionIndex`.
    - `numerical`: parse `userAnswer` as Number and compare to `question.correctAnswer`.
    - `spatial`: parse `userAnswer` as Number and compare to `question.correctImageIndex`.
  - Return `{ correct: Boolean, correctAnswer: any }`.

### 3. Upgrade Sprint Routes
- **[MODIFY] `api/src/routes/sprint.js`**
  - **GET /api/sprint**:
    - Import `redisClient`.
    - Generate a `sprintId` (e.g. `sprint_${req.userId}_${Date.now()}`).
    - Extract the `questionIds` from the selected questions.
    - Store `{ userId, questionIds, createdAt: Date.now() }` in Redis at key `sprint:${sprintId}` with a 30-minute expiration (using `EX 1800`).
    - Return `sprintId` in the response body.
  - **POST /api/sprint/submit**:
    - Require `sprintId` in `req.body`.
    - Use `redisClient.getdel(sprint:${sprintId})` to fetch and delete the session atomically.
    - If null/missing, return `409 Conflict` (sprint expired or already submitted).
    - If valid, verify `session.userId === req.userId.toString()`.
    - Map through `responses` array using `scorer.js` to determine `correct`.
    - Build `formattedResponses` array for the `engineClient.updateRating` call.
    - Bulk update `timesAnswered` and `timesCorrect` on the `Question` model.
    - Call `engineClient.updateRating(...)`.
    - Update the `User` document: apply new ratings, add `xpEarned` to `totalXp`, increment `sessionsCompleted`, and set `lastSprintDate` to `new Date()`.
    - Build the final rich response object (per-question array, summary, and rating deltas) and return it.

### 4. Integration Tests
- **[NEW] `api/src/tests/sprint.test.js`** (or manual testing instructions)
  - Verify `GET /api/sprint` creates a Redis key.
  - Verify `POST /api/sprint/submit` rejects if `sprintId` is invalid or missing.
  - Verify `POST /api/sprint/submit` processes scoring correctly and updates the database.

## Verification
- Start API, Engine, MongoDB, Redis using Docker Compose (or locally).
- Make a GET request to `/api/sprint` and check Redis for the key.
- Submit a POST request with the correct answers and verify the returned results match expectations (accuracy=1.0, XP earned, rating deltas).
- Submit a second POST request with the same `sprintId` and verify it returns a 409 Conflict.
