# Phase 4: Daily Sprint API - Context

**Gathered:** 2026-07-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete the sprint flow end-to-end via API: user requests a personalized sprint, receives difficulty-matched questions from the adaptive engine, submits answers with timing data, gets scored results with per-question breakdown, ELO rating updates persisted to MongoDB, and double-submit prevention via Redis-backed sprint IDs. The existing stub endpoints (`GET /api/sprint` and `POST /api/sprint/submit`) are upgraded to production logic.

</domain>

<decisions>
## Implementation Decisions

### Answer Scoring Logic
- **D-33:** Strict match across all question types. No tolerance, no partial credit.
  - **MCQ:** Client sends the selected option index (0–3). Server compares against `question.correctOptionIndex`.
  - **Numerical:** Client sends the numeric value as a string. Server parses to number and compares with strict equality (`===`) against `question.correctAnswer`.
  - **Spatial:** Client sends the selected image index (0–3). Server compares against `question.correctImageIndex`.
- **D-34:** Client sends a unified answer format: `{ questionId: "...", answer: "value", timeMs: 12000 }`. The server resolves the correctness check based on `question.type` (mcq → index, numerical → parsed number, spatial → image index).

### Results Response Shape
- **D-35:** `POST /api/sprint/submit` returns a **full breakdown with rating deltas**:
  - **Per-question results array:** Each entry includes `questionId`, `correct` (bool), `userAnswer`, `correctAnswer` (the actual answer text/index), `explanation`, `timeMs`, `skill`.
  - **Summary:** `accuracy` (0–1), `totalCorrect`, `totalQuestions`, `xpEarned`, `timeTotalMs`.
  - **Rating deltas:** `ratingsBefore` and `ratingsAfter` per skill, plus `ratingDeltas` (e.g., `{ verbal: +12, quantitative: -5 }`). Client can show "your verbal went up!" feedback.
- **D-36:** The API persists updated ratings to the User document in MongoDB after engine returns new ratings. Also increments `sessionsCompleted` by 1.

### Sprint Session Management
- **D-37:** Hybrid stateless approach for v1 — no Sprint MongoDB collection.
  - `GET /api/sprint` generates a `sprintId` (e.g., `sprint_{userId}_{timestamp}`), stores it in Redis with a 30-minute TTL, and returns it alongside the questions.
  - `POST /api/sprint/submit` requires `sprintId` in the request body. Server checks Redis: if the key exists, process the submission and delete the key (preventing double-submit). If the key doesn't exist (expired or already submitted), reject with 409 Conflict.
- **D-38:** No mid-sprint resume in v1. If the app crashes, the user starts a new sprint.

### Timer Handling
- **D-39:** Server trusts the client's reported `timeMs` per question. No server-side timer enforcement in v1. The `timeMs` value is passed to the engine for speed bonus calculation (D-13/D-14 from Phase 2).

### Carrying Forward from Prior Phases
- D-13/D-14: ELO calculation with speed factor and per-skill time budgets (engine implemented)
- D-15: K-factor decay from 40 to 20 after 10 sessions (engine implemented)
- D-16/D-17: Difficulty tolerance band ±100 ELO with adaptive widening (engine implemented)
- D-19: API → engine data flow via `engineClient.js` (calculateNext, updateRating)
- D-07/D-08: User schema with embedded ratings, Question schema with type-specific fields
- Mock user middleware active on all routes (INFR-03)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/PROJECT.md` — Tech stack constraints
- `.planning/REQUIREMENTS.md` — SPRT-01 through SPRT-08
- `.planning/ROADMAP.md` — Phase 4 goals and success criteria
- `.planning/phases/02-adaptive-engine/02-CONTEXT.md` — Phase 2 decisions (D-13 through D-19, ELO/speed/K-factor)
- `.planning/phases/03-question-generation-pipeline/03-CONTEXT.md` — Phase 3 decisions (D-25 through D-32, difficulty mapping)
- `api/src/routes/sprint.js` — Existing sprint route stubs (upgrade these, don't create new files)
- `api/src/services/engineClient.js` — API→Engine HTTP client (calculateNext, updateRating)
- `api/src/models/User.js` — User schema with embedded ratings and sessionsCompleted
- `api/src/models/Question.js` — Question schema with type-specific answer fields
- `engine/app/main.py` — FastAPI endpoints (calculate-next, update-rating) and Pydantic models

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `api/src/routes/sprint.js` — GET and POST routes already wired. GET calls `engineClient.calculateNext()`, POST calls `engineClient.updateRating()`. Upgrade the stub logic in-place.
- `api/src/services/engineClient.js` — Axios client already configured for engine communication. Response shapes match engine's Pydantic models.
- `api/src/models/User.js` — Schema has `ratings`, `totalXp`, `sessionsCompleted`, `lastSprintDate`. All fields needed for sprint flow already exist.

### Established Patterns
- Express async error handling with `next(error)` in catch blocks
- Mongoose `findById` + `save()` for user updates
- `Question.find({ _id: { $in: [...] } })` for batch question fetching
- Redis client pattern: `ioredis` (already in package.json from Phase 1)

### Integration Points
- `POST /api/sprint/submit` currently returns `correct: true` for all answers — this is the primary stub to replace with real scoring logic
- User `sessionsCompleted` is never incremented — add increment on submit
- User `lastSprintDate` is never set — add update on submit
- Redis connection needs initialization in the API service (not yet connected for sprint use)

</code_context>

<specifics>
## Specific Ideas

- The scoring function should be a separate utility (e.g., `api/src/utils/scorer.js`) so it can be unit tested independently
- Redis sprint key format: `sprint:{sprintId}` with value `{ userId, questionIds, createdAt }`
- Consider adding a `GET /api/sprint/active` endpoint that checks Redis for an active sprint (nice-to-have, not required)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 4-Daily Sprint API*
*Context gathered: 2026-07-21*
