# Phase 2: Adaptive Engine - Context

**Gathered:** 2026-07-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the ELO-based adaptive difficulty engine inside the Python/FastAPI `engine/` service. This includes the core ELO calculation, speed-weighted rating updates, difficulty-band question selection (querying MongoDB directly), and K-factor decay for new users. The engine's existing stub endpoints (`/calculate-next` and `/update-rating`) will be replaced with working implementations.

</domain>

<decisions>
## Implementation Decisions

### ELO Calculation
- **D-13:** Use standard chess ELO formula for base rating change, with a speed multiplier applied to the gain/loss. Fast correct answers earn up to 1.5x the base gain; slow correct answers earn as low as 0.5x. Incorrect answers are not speed-adjusted (a wrong answer is wrong regardless of speed).
- **D-14:** Speed factor is calculated per-skill using per-skill time budgets: Verbal: 45s, Quantitative: 60s, Logical: 90s, Spatial: 60s. Formula: `speed_factor = remaining_time / total_time`, clamped to `[0.5, 1.5]`.
- **D-15:** K-factor starts at K=40 for new users and decays linearly to K=20 after 10 completed sessions. Formula: `K = max(20, 40 - (2 * sessions_completed))`.

### Question Selection
- **D-16:** Default difficulty tolerance band is ±100 ELO from the user's current skill rating.
- **D-17:** Adaptive widening: if fewer than the requested question count are found within the band, widen by 50 ELO increments until enough questions are found, capping at ±300 ELO. Band is fixed once per sprint (no mid-sprint adjustment).
- **D-18:** The engine queries MongoDB directly (via `motor` async driver) for question selection. The API makes a single HTTP call to the engine, which handles the full selection logic internally.

### Data Flow
- **D-19:** The Node.js API sends user skill ratings and requested question count to the engine. The engine queries MongoDB for matching questions, selects the best subset, and returns question IDs. The API then fetches full question documents by ID and returns them to the client.

### Carrying Forward from Phase 1
- D-07: ELO ratings are embedded in User doc `{ verbal, quantitative, logical, spatial }`
- D-08: Updated ratings are snapshotted per quiz session
- Existing Pydantic models: `SkillRatings`, `NextQuestionRequest`, `ResponseItem`, `UpdateRatingRequest`
- Existing endpoints: `/calculate-next`, `/update-rating` (currently stubs)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/PROJECT.md` — Tech stack constraints (FastAPI, NumPy for ELO math)
- `.planning/REQUIREMENTS.md` — ADPT-01, ADPT-02, ADPT-03, ADPT-04
- `.planning/ROADMAP.md` — Phase 2 goals and success criteria
- `.planning/phases/01-foundation-scaffolding/01-CONTEXT.md` — Phase 1 decisions (D-01 through D-12)
- `engine/app/main.py` — Existing stub endpoints and Pydantic models
- `api/src/models/Question.js` — Question schema and indexes
- `api/src/models/User.js` — User schema with embedded ratings
- `api/src/services/engineClient.js` — API→Engine HTTP client

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `engine/app/main.py` — Pydantic models already define the request/response shapes. Replace stub logic, keep models.
- `engine/requirements.txt` — Already includes `numpy` for ELO math and `pydantic` for validation.

### Established Patterns
- FastAPI async endpoints with Pydantic request validation
- Docker Compose service `engine` with bind mount for live reload

### Integration Points
- `api/src/services/engineClient.js` — Currently calls `/calculate-next` and `/update-rating`. Response shape must remain compatible.
- `docker-compose.yml` — Engine service needs `MONGO_URI` env var (already configured).

</code_context>

<specifics>
## Specific Ideas

- ELO simulator script to validate rating stability over 1000 virtual sessions (success criterion #5)
- The engine should log rating changes for debugging during development

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 2-Adaptive Engine*
*Context gathered: 2026-07-15*
