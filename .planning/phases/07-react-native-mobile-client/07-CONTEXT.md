# Phase 7: React Native Mobile Client - Context

**Gathered:** 2026-07-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Expo-based mobile app (`/client`) that connects to the Node.js API and delivers the full user flow: Home screen → Sprint (questions with timer, MCQ/numerical/spatial) → Results (post-sprint answer review) → Dashboard (per-skill progress rings + 30-day trend charts) → Leaderboard (weekly XP rankings). All data flows through the API — no direct DB access from client.

</domain>

<decisions>
## Implementation Decisions

### Navigation & Screen Structure
- **D-47:** Bottom tab bar with 4 tabs: Home, Sprint, Dashboard, Leaderboard. Sprint results show as a stack modal pushed from the Sprint tab. Uses Expo Router (file-based routing) with `app/` directory convention.
- **D-48:** Expo Router for navigation — built into Expo SDK 52+, file-based routing with convention-over-config, handles deep linking automatically.

### Sprint UI
- **D-49:** Per-question timer displayed as a countdown bar — animated horizontal bar that shrinks with time remaining. Turns red in last 25% for visual urgency.
- **D-50:** Auto-advance on answer — user taps an MCQ option or submits a number, brief flash of selected state (~300ms), then automatically advances to the next question. No explicit "Next" button.

### Visual Design
- **D-51:** Dark mode only — deep navy/charcoal background with vibrant accent colors. Modern, eye-friendly for study sessions. Elevate-inspired gradient accents.
- **D-52:** Per-skill gradient color coding used consistently across the app:
  - Verbal: purple → blue
  - Quantitative: teal → green
  - Logical: orange → amber
  - Spatial: pink → red

### Dashboard Charts
- **D-53:** Charting library: `react-native-gifted-charts` — pure JS, no native dependencies, works with Expo Go out of the box.
- **D-54:** Dashboard layout: Four radial progress rings (one per skill, colored per gradient accent) showing 0–100 score. Below, a multi-line chart with 30-day accuracy/rating trends per skill.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API Endpoints (the client consumes these)
- `api/src/routes/sprint.js` — `GET /api/sprint?type=standard`, `POST /api/sprint/submit`
- `api/src/routes/analytics.js` — `GET /api/analytics/progress`, `GET /api/analytics/history`
- `api/src/routes/leaderboard.js` — `GET /api/leaderboard`
- `api/src/routes/users.js` — `GET /api/users/me`
- `api/src/routes/health.js` — `GET /api/health`

### Data Contracts (response shapes)
- `.planning/phases/04-daily-sprint-api/04-CONTEXT.md` — Sprint answer format (D-34), results response shape (D-35), sprint session management (D-37)
- `.planning/phases/06-performance-analytics-api/06-CONTEXT.md` — Analytics normalization (D-43), history format (D-44)
- `.planning/phases/05-gamification-system/05-CONTEXT.md` — Streak/leaderboard decisions (D-40, D-41, D-42)

### Project Constraints
- `.planning/PROJECT.md` — Tech stack: React Native (Expo) for mobile
- `.planning/REQUIREMENTS.md` — SPRT-01 through SPRT-08, GAME-02, GAME-05, ANLT-01, ANLT-02
- `.planning/ROADMAP.md` — Phase 7 success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No `/client` directory exists — building from scratch with `npx create-expo-app`.
- API is fully tested and running on port 3000 (or 3001 for integration tests).

### Established Patterns
- All API routes use mock user middleware (hardcoded `req.userId`) — no auth needed in client.
- Sprint submit format: `{ sprintId, responses: [{ questionId, answer, timeMs }] }`.
- Progress response: `{ skills: { verbal: { elo, score }, ... } }`.
- History response: `{ history: { verbal: [{ date, accuracy, avgSpeed, rating }], ... } }`.
- Leaderboard response: `{ leaderboard: [{ userId, xp, rank }], userRank: { ... } }`.

### Integration Points
- Client connects to `http://localhost:3000` (API Gateway) for all data.
- Sprint flow: `GET /api/sprint?type={type}` → display questions → `POST /api/sprint/submit` → show results.
- Dashboard flow: `GET /api/analytics/progress` + `GET /api/analytics/history`.
- Leaderboard: `GET /api/leaderboard`.

</code_context>

<specifics>
## Specific Ideas

- Use `@tanstack/react-query` for data fetching/caching (from stack decision in PROJECT.md).
- Use `react-native-reanimated` for smooth animations (timer bar, screen transitions).
- Home screen shows: streak count, today's sprint status, quick-start button, and skill summary cards.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-React Native Mobile Client*
*Context gathered: 2026-07-24*
