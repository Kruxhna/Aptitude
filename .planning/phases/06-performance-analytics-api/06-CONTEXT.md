# Phase 6: Performance Analytics API - Context

**Gathered:** 2026-07-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Analytics endpoints return per-skill ELO progress (normalized to 0–100 scale) and 30-day historical accuracy/speed trends per skill — data that the Phase 7 mobile client can use to render charts.

</domain>

<decisions>
## Implementation Decisions

### Rating Normalization
- **D-43:** ELO ratings are normalized using a linear 800–1400 → 0–100 scale for `GET /api/analytics/progress`. Simple math, chart-friendly. ELO values below 800 clamp to 0; above 1400 clamp to 100.

### History Window & Granularity
- **D-44:** `GET /api/analytics/history` looks back a fixed 30 days (no user-configurable range). Data is aggregated into daily buckets by UTC date — one data point per day per skill, averaging accuracy and speed across all sessions that day. Chart shape: `[{ date, accuracy, avgSpeed, rating }]` per skill.

### Caching Strategy
- **D-45:** No caching — analytics endpoints always query MongoDB live. QuizSession's compound index `{ userId: 1, completedAt: -1 }` makes date-ranged queries fast enough for v1 traffic.

### QuizSession Recording (prerequisite)
- **D-46:** `POST /api/sprint/submit` currently does NOT save a `QuizSession` document. Phase 6 must add this — saving a `QuizSession` with `userId`, `sprintType`, `responses`, `accuracy`, `totalTimeMs`, `xpEarned`, and `ratingsAfter` — so analytics has a data source to aggregate from.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Data Source
- `api/src/models/QuizSession.js` — Schema for session history. Has `{ userId, completedAt, accuracy, totalTimeMs, xpEarned, ratingsAfter, responses[] }`. Index: `{ userId: 1, completedAt: -1 }`.
- `api/src/models/User.js` — Has current per-skill `ratings` object (verbal, quantitative, logical, spatial).

### Existing API Context
- `api/src/routes/sprint.js` — `POST /api/sprint/submit` handler. Must be updated to save a QuizSession document.
- `.planning/REQUIREMENTS.md` — ANLT-01, ANLT-02
- `.planning/ROADMAP.md` — Phase 6 success criteria (progress + history endpoints, chart-ready format)

### Patterns
- `api/src/routes/leaderboard.js` — Example of a read-only analytics-style route using User model.
- `api/src/routes/users.js` — Example route for user-specific reads with mockUser middleware.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `api/src/models/QuizSession.js` — Already has the right schema. Just needs to be populated on sprint submit.
- `api/src/models/User.js` — `ratings` field is the source for the progress endpoint.
- `api/src/middleware/mockUser.js` — Injects `req.userId` — all analytics routes use this.

### Established Patterns
- Express async error handling with `next(error)` in catch blocks (all routes follow this).
- MongoDB aggregation pipeline (`$match`, `$group`, `$sort`) for date-range queries.

### Integration Points
- `POST /api/sprint/submit` → must additionally save `QuizSession` after rating update.
- `GET /api/analytics/progress` → reads `user.ratings`, normalizes via linear formula.
- `GET /api/analytics/history` → aggregates QuizSession documents over last 30 days.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-Performance Analytics API*
*Context gathered: 2026-07-23*
