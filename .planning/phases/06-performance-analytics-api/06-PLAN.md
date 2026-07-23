---
phase: 6
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - api/src/routes/sprint.js
  - api/src/routes/analytics.js
  - api/src/index.js
  - api/tests/analytics.test.js
  - api/src/scripts/test-integration.js
autonomous: true
requirements:
  - ANLT-01
  - ANLT-02
---

<objective>
Implement the Performance Analytics API:
1. Patch sprint.js to save QuizSession documents on submission (D-46).
2. Create analytics.js with GET /api/analytics/progress and GET /api/analytics/history.
3. Register analytics routes in index.js.
4. Write unit tests and update integration test.
</objective>

<tasks>

<task>
<id>06-01-01</id>
<type>code</type>
<files>api/src/routes/sprint.js</files>
<action>
Import QuizSession from models. In POST /api/sprint/submit, inside the fire-and-forget setImmediate block, create and save a new QuizSession document alongside user.save(). Use: userId, sprintType (extracted from session or default 'standard'), responses (from the scored results array), accuracy, totalTimeMs, xpEarned, and ratingsAfter (from engineResponse.newRatings).
</action>
<verify>
npx jest api/tests/analytics.test.js
</verify>
<acceptance_criteria>
- QuizSession is saved to MongoDB after every sprint submission.
- The document contains accuracy, totalTimeMs, xpEarned, and ratingsAfter.
</acceptance_criteria>
</task>

<task>
<id>06-01-02</id>
<type>code</type>
<files>api/src/routes/analytics.js</files>
<action>
Create new file api/src/routes/analytics.js with:
- GET /api/analytics/progress: reads user.ratings and normalizes each skill ELO to 0-100 using linear formula (elo - 800) / (1400 - 800) * 100, clamped to [0, 100].
- GET /api/analytics/history: MongoDB aggregation on QuizSession for last 30 days, grouped by UTC date, computing avgAccuracy, avgSpeed (totalTimeMs / totalQuestions), and avgRating per skill (using ratingsAfter fields). Returns { history: { verbal: [...], quantitative: [...], logical: [...], spatial: [...] } } where each array contains { date, accuracy, avgSpeed, rating }.
</action>
<verify>
npx jest api/tests/analytics.test.js
</verify>
<acceptance_criteria>
- GET /api/analytics/progress returns { skills: { verbal: { elo, score }, ... } } with scores in 0-100.
- GET /api/analytics/history returns per-skill arrays of { date, accuracy, avgSpeed, rating }.
- History window is strictly 30 UTC days.
</acceptance_criteria>
</task>

<task>
<id>06-01-03</id>
<type>code</type>
<files>api/src/index.js</files>
<action>
Import analyticsRoutes from ./routes/analytics and register with app.use(analyticsRoutes).
</action>
<verify>
node -e "require('./api/src/index.js')" 2>&1 | head -5
</verify>
<acceptance_criteria>
- API server starts without errors.
- Analytics routes are accessible at /api/analytics/progress and /api/analytics/history.
</acceptance_criteria>
</task>

<task>
<id>06-01-04</id>
<type>test</type>
<files>api/tests/analytics.test.js</files>
<action>
Write unit tests for the analytics normalization helper and history aggregation. Test: ELO 800 → 0, ELO 1100 → 50, ELO 1400 → 100, ELO 600 → 0 (clamped), ELO 1600 → 100 (clamped). Mock QuizSession.aggregate to test history endpoint response format.
</action>
<verify>
npx jest api/tests/analytics.test.js
</verify>
<acceptance_criteria>
- All normalization boundary tests pass.
- History response shape matches { date, accuracy, avgSpeed, rating }.
</acceptance_criteria>
</task>

<task>
<id>06-01-05</id>
<type>test</type>
<files>api/src/scripts/test-integration.js</files>
<action>
Add integration test steps:
1. After sprint submission, call GET /api/analytics/progress and assert response has skills with scores in 0-100.
2. Call GET /api/analytics/history and assert response has history object with at least verbal key containing an array.
</action>
<verify>
node api/src/scripts/test-integration.js
</verify>
<acceptance_criteria>
- Integration test calls both analytics endpoints and asserts correct response shapes.
- All existing tests continue to pass.
</acceptance_criteria>
</task>

</tasks>

<verification>
Run npx jest api/tests/analytics.test.js and node api/src/scripts/test-integration.js. Both must pass.
</verification>

<success_criteria>
- GET /api/analytics/progress returns normalized 0-100 ELO scores per skill.
- GET /api/analytics/history returns 30-day daily aggregate data per skill.
- QuizSession saved to MongoDB on every sprint submission.
- Unit tests and integration tests pass.
</success_criteria>
