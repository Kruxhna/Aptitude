---
phase: 6
plan: 1
subsystem: analytics-api
tags: [analytics, mongodb, aggregation]
key-files:
  - api/src/routes/analytics.js
  - api/src/routes/sprint.js
  - api/tests/analytics.test.js
---

# Phase 6 Summary

## Work Completed

1. **QuizSession Recording (D-46):** Updated `api/src/routes/sprint.js` to import `QuizSession` and save a document (inside the fire-and-forget `setImmediate` block) after every sprint submission. Document captures: `userId`, `sprintType`, `responses`, `accuracy`, `totalTimeMs`, `xpEarned`, `ratingsAfter`, `completedAt`.

2. **Progress Endpoint (ANLT-01):** Created `GET /api/analytics/progress` in `api/src/routes/analytics.js`. Reads `user.ratings`, normalizes each skill ELO using linear formula `(elo - 800) / (1400 - 800) * 100`, clamped to [0, 100]. Returns `{ skills: { verbal: { elo, score }, ... } }`.

3. **History Endpoint (ANLT-02):** Created `GET /api/analytics/history`. MongoDB aggregation on QuizSession for last 30 UTC days. Groups by UTC date string, computes `avgAccuracy`, `avgSpeedPerQ` (totalTimeMs / questionCount), and `avgRating` per skill (from `ratingsAfter`). Returns `{ history: { verbal: [{ date, accuracy, avgSpeed, rating }], ... } }`.

4. **Route Registration:** Registered analytics routes in `api/src/index.js`.

## Verification

- **Unit tests:** `npx jest api/tests/analytics.test.js` → 7/7 PASSED
- **Integration tests:** `node api/src/scripts/test-integration.js` → 10/10 PASSED

## Self-Check: PASSED
