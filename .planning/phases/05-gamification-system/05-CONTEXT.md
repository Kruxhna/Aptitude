# Phase 5: Gamification System - Context

**Gathered:** 2026-07-23
**Status:** Ready for planning

<domain>
## Phase Boundary

XP, streaks, and leaderboard working end-to-end — Redis-backed with MongoDB sync.

</domain>

<decisions>
## Implementation Decisions

### Streak Definition
- **D-40:** Streak day rollovers and weekly leaderboard resets use Strict UTC midnight (global reset for everyone).

### Redis/Mongo Sync
- **D-41:** Fire-and-forget sync strategy: API updates Redis instantly, then sends an async message (or background worker) to update MongoDB.

### Leaderboard Scope
- **D-42:** Weekly leaderboards are scoped to Static Leagues/Groups. Users are assigned to groups of 50 randomly each week.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/PROJECT.md` — Tech stack constraints
- `.planning/REQUIREMENTS.md` — GAME-01 through GAME-06
- `.planning/ROADMAP.md` — Phase 5 goals and success criteria
- `.planning/phases/04-daily-sprint-api/04-CONTEXT.md` — API payload conventions and MongoDB User schema decisions
- `api/src/services/engineClient.js` — For communication with engine (speed bonus, ELO)
- `api/src/models/User.js` — Schema has totalXp, sessionsCompleted, lastSprintDate

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `engineClient.js` — For communication with engine.
- Mongoose Models — `User` schema will need gamification fields (like streakCount, leagueId) or we store them in Redis.

### Established Patterns
- Express async error handling with `next(error)` in catch blocks
- Redis client pattern: `ioredis` (already in package.json from Phase 1)

### Integration Points
- `POST /api/sprint/submit` (from Phase 4) is where XP is earned and streaks are updated.
- Engine returns `xpEarned` from `updateRating` endpoint (D-35), so gamification logic might just read it and store it.

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

*Phase: 05-Gamification System*
*Context gathered: 2026-07-23*
