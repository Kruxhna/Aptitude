# Phase 4: Daily Sprint API - Research

## Objective
Research how to implement Phase 4: Daily Sprint API.
What do I need to know to PLAN this phase well?

## Architecture & Data Flow
- **Sprint Generation (`GET /api/sprint`)**:
  - Currently fetches user to get ELO ratings (`user.ratings`).
  - Calls `engineClient.calculateNext` with `(userId, ratings, count)`.
  - Engine returns `questionIds`.
  - API fetches those questions from MongoDB and returns them to the client.
  - **Upgrade needed**: Must generate a `sprintId`, save to Redis with a TTL (e.g. `sprint_{userId}_{timestamp}` -> 30 mins) along with the question IDs, and return `sprintId` in the response to prevent double-submissions.

- **Sprint Submission (`POST /api/sprint/submit`)**:
  - Currently a stub that accepts `responses: [{ questionId, answer, timeMs }]`.
  - **Upgrade needed**: 
    1. Read `sprintId` from request, check Redis. If not exists -> 409 Conflict. If exists, delete it (double-submit prevention).
    2. Score the answers:
       - `mcq`: Compare `answer` (Number) to `question.correctOptionIndex`.
       - `numerical`: Parse `answer` to Number, compare strictly to `question.correctAnswer`.
       - `spatial`: Compare `answer` (Number) to `question.correctImageIndex`.
    3. Update `timesAnswered` and `timesCorrect` on the Question docs in MongoDB.
    4. Call `engineClient.updateRating` with enriched formatted responses (must include `correct` boolean, `skill`, `questionDifficulty`).
    5. Update User document:
       - Update `user.ratings` with the new ratings from the engine.
       - Increment `user.totalXp` with the XP earned.
       - Increment `user.sessionsCompleted`.
       - Update `user.lastSprintDate` to now.
       - (Streak logic is technically Phase 5, but maybe increment here or wait for Phase 5. The CONTEXT says "increments sessionsCompleted in MongoDB", but Phase 5 covers gamification. Let's just do `sessionsCompleted` and `lastSprintDate` for now).
    6. Return the rich response:
       - Per-question array: `questionId, correct, userAnswer, correctAnswer, explanation, timeMs, skill`.
       - Summary: `accuracy, totalCorrect, totalQuestions, xpEarned, timeTotalMs`.
       - Deltas: `ratingsBefore, ratingsAfter, ratingDeltas`.

## Schema Context
- `User.js` has `ratings`, `totalXp`, `sessionsCompleted`, `lastSprintDate`.
- `Question.js` has `type`, `skill`, `difficulty`, `correctOptionIndex`, `correctAnswer`, `correctImageIndex`, `explanation`, `timesAnswered`, `timesCorrect`.

## Reusable Components
- `api/src/services/engineClient.js` handles all API <-> Engine communications.
- Redis client (`ioredis`) is in package.json but we need to instantiate it (e.g. `api/src/services/redisClient.js`).

## Next Steps for Planning
1. Add `redisClient.js` to `api/src/services/` for Redis connection and export.
2. Build a scoring utility (e.g. `api/src/utils/scorer.js`) with unit tests.
3. Update `GET /api/sprint` to create the Redis key.
4. Update `POST /api/sprint/submit` to consume the Redis key, score the answers, update the db, call the engine, and return the rich response payload.
