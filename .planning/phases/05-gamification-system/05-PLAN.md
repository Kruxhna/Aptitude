---
phase: 5
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - engine/app/main.py
  - api/src/models/User.js
  - api/src/services/gamification.js
  - api/src/routes/sprint.js
autonomous: true
requirements:
  - GAME-01
  - GAME-02
  - GAME-03
  - GAME-04
  - GAME-05
  - GAME-06
---

<objective>
Implement XP speed bonus in FastAPI Engine and daily streak, freeze, and weekly Redis leaderboards with MongoDB background sync in Node API.
</objective>

<tasks>
<task>
<id>05-01-01</id>
<type>code</type>
<files>engine/app/main.py</files>
<action>
Update update_rating endpoint in main.py to calculate XP speed bonus. Base XP is 10 per correct response, with up to 1.5x bonus for fast answers under a 30s par time.
</action>
<verify>
pytest engine/tests/
</verify>
<acceptance_criteria>
- Fast correct answers grant >10 XP up to 15 XP.
- Incorrect answers grant 0 XP regardless of speed.
</acceptance_criteria>
</task>

<task>
<id>05-01-02</id>
<type>code</type>
<files>api/src/models/User.js, api/src/services/gamification.js, api/src/routes/sprint.js</files>
<action>
Add leagueId to User schema. Implement gamification.js to handle streak logic (Strict UTC midnight), streak freeze consumption, and Redis leaderboard operations (ZINCRBY, ZREVRANGE). Integrate into sprint.js with fire-and-forget Mongo sync.
</action>
<verify>
npm test
</verify>
<acceptance_criteria>
- Streak updates respect UTC midnight.
- Freeze is consumed when a single day is missed.
- Leaderboard is populated in Redis under key leaderboard:{year_week}:{leagueId}.
- User model syncs to Mongo in background.
</acceptance_criteria>
</task>
</tasks>

<verification>
Run end-to-end integration test verifying XP bonus, streak calculation, and Redis leaderboard state.
</verification>

<success_criteria>
- Engine calculates XP with speed bonus correctly.
- Streak increments on consecutive UTC days and handles freezes.
- Redis Leaderboard updates via sorted set.
</success_criteria>
