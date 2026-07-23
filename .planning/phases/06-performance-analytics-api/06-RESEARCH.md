# Phase 6: Performance Analytics API - Research

## Context Summary
- **Domain:** Two analytics endpoints: progress (current normalized ELO) and history (30-day daily aggregated trend data per skill).
- **Key Decisions:** Linear ELO normalization 800–1400 → 0–100 (D-43), 30 days fixed, daily UTC aggregates (D-44), no caching (D-45), QuizSession must be saved on sprint submit (D-46).

## Codebase Discoveries

### 1. QuizSession Gap (D-46)
`POST /api/sprint/submit` in `api/src/routes/sprint.js` currently:
- Computes `accuracy`, `totalTimeMs`, `xpEarned`, and `engineResponse.newRatings`
- Saves `user` document (fire-and-forget via `setImmediate`)
- **Does NOT create a `QuizSession` document**

`QuizSession` model at `api/src/models/QuizSession.js` already has the exact fields needed:
- `userId`, `sprintType`, `responses[]`, `accuracy`, `totalTimeMs`, `xpEarned`, `ratingsAfter`, `completedAt`
- Compound index `{ userId: 1, completedAt: -1 }` already set up

**Fix:** In `sprint.js`, after computing `accuracy` and `timeTotalMs`, create a `QuizSession` document inside the fire-and-forget `setImmediate` block alongside `user.save()`.

### 2. Analytics Query Design (D-43, D-44)

**Progress endpoint** (`GET /api/analytics/progress`):
- Read `user.ratings` directly (no aggregation needed)
- Normalize: `score = Math.min(100, Math.max(0, (elo - 800) / (1400 - 800) * 100))`
- Return `{ skills: { verbal: { elo, score }, quantitative: ..., logical: ..., spatial: ... } }`

**History endpoint** (`GET /api/analytics/history`):
- MongoDB aggregation pipeline on QuizSession:
  ```js
  [
    { $match: { userId: ObjectId(userId), completedAt: { $gte: thirtyDaysAgo } } },
    { $unwind: "$responses" },
    // Group by UTC date string and skill
    { $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt", timezone: "UTC" } },
          // skill info comes from responses, but QuizSession responses don't have skill field...
        }
      }
    }
  ]
  ```
- **Problem:** `QuizSession.responses[]` stores `{ questionId, answer, correct, timeMs }` but NOT `skill`. We need skill for per-skill breakdown.
- **Solution options:**
  A) Add `skill` field to `QuizSession.responses[]` at save time — best option, self-contained.
  B) Populate the question doc to get skill — expensive for aggregation.
  C) Aggregate per-session from `ratingsAfter` only (no per-response skill breakdown) — simpler.

**Recommendation:** Option A — add `skill` to `QuizSession.responses[]` when saving. We already have `formattedResponses` with `skill` in `sprint.js`, so it's trivially available.

**Alternative simpler history approach:** Since `ratingsAfter` tracks per-skill ELO per session, we can compute daily average ELO per skill from `ratingsAfter` (no responses unwind needed). Accuracy can be averaged at the session level (not per skill). This is much simpler and matches the chart format `{ date, accuracy, avgSpeed, rating }`.

**Final approach for history:** Aggregate by `{ date, skill }` using session-level `ratingsAfter` and `accuracy`/`totalTimeMs`. No need to unwind responses at all. The aggregation key per skill becomes:
```js
// One pipeline per skill (verbal, quantitative, logical, spatial)
[
  { $match: { userId, completedAt: { $gte: thirtyDaysAgo } } },
  { $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt", timezone: "UTC" } },
      avgAccuracy: { $avg: "$accuracy" },
      avgSpeed: { $avg: { $divide: ["$totalTimeMs", { $size: "$responses" }] } },
      avgRating: { $avg: `$ratingsAfter.${skill}` }
  }},
  { $sort: { _id: 1 } }
]
```

Or in a single pipeline with `$project` to emit all 4 skills. Either way, this avoids the missing `skill` field problem entirely.

### 3. Response Format
As per success criteria and ROADMAP.md, history returns `{ date, accuracy, avgSpeed, rating }` per skill. Progress returns normalized per-skill scores.

### 4. Route Structure
New file: `api/src/routes/analytics.js` with:
- `GET /api/analytics/progress`
- `GET /api/analytics/history`

Register in `api/src/index.js`.

## Validation Requirements (Nyquist)
- Verify QuizSession is saved after sprint submission (can check DB).
- Verify `/api/analytics/progress` returns normalized scores in 0–100 range.
- Verify `/api/analytics/history` returns correct array format.
- Integration test: submit a sprint, then call analytics endpoints and verify data flows through.
