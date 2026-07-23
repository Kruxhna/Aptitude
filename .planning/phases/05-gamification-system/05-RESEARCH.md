# Phase 5: Gamification System - Research

## Context Summary
- **Domain:** XP, streaks, and leaderboard working end-to-end — Redis-backed with MongoDB sync.
- **Key Decisions:** Strict UTC midnight for streaks (D-40), Fire-and-forget Mongo sync (D-41), Static Leagues/Groups of 50 users for leaderboards (D-42).

## Codebase Discoveries
1. **Engine XP Logic:** `engine/app/main.py` currently has placeholder XP logic (`10 XP per correct answer`). We need to implement the speed bonus in Python based on the `timeMs` and per-skill time budgets.
2. **User Schema (`api/src/models/User.js`):** Already has gamification fields: `totalXp`, `currentStreak`, `longestStreak`, `streakFreezeAvailable`, `lastSprintDate`. We will likely need to add `leagueId` to support D-42.
3. **Redis:** `api/src/config/redis.js` sets up `ioredis` with a Mock fallback. We need to implement Redis Sorted Sets (`ZADD`, `ZREVRANGE`) for the leaderboards, keyed by `leagueId` and the current week.
4. **API Integration:** `POST /api/sprint/submit` (implemented in Phase 4) receives the engine's `xpEarned` response. This route must be updated to apply the XP, calculate streaks (UTC midnight logic), and update the Redis leaderboard before responding to the user. Then, it fires a background task to update MongoDB (D-41).

## Technical Approach & Challenges

### 1. XP Speed Bonus (GAME-01)
- **Where:** `engine/app/main.py` (or a dedicated `gamification.py` module).
- **How:** The engine receives `responses` containing `timeMs`. It must compare `timeMs` against a par time for the question/skill, adding a multiplier (e.g., 1.5x) if answered significantly faster than par, but only if `correct == true`.

### 2. Streak Logic (GAME-02, GAME-03)
- **Where:** Node.js API (`api/src/routes/sprint.js` or a new `api/src/services/gamification.js`).
- **How:** On sprint completion, check the user's `lastSprintDate`. Compare the UTC date of `lastSprintDate` with the current UTC date.
  - Same UTC day: No streak change.
  - Next UTC day: Increment `currentStreak`, update `longestStreak`.
  - Missed a day: If `streakFreezeAvailable` is true, consume the freeze, keep the streak, reset `streakFreezeAvailable` to false (or keep it consumed until next week). If false, reset `currentStreak` to 1.

### 3. Redis Leaderboard (GAME-05, GAME-06)
- **Where:** Node.js API.
- **How:** Use Redis Sorted Sets. Key format: `leaderboard:{year_week}:{league_id}`.
  - `ZINCRBY leaderboard:2026_30:league_A {xpEarned} {userId}`
  - To view the leaderboard: `ZREVRANGE leaderboard:2026_30:league_A 0 49 WITHSCORES`
- **League Assignment (D-42):** Users need to be assigned to a league (group of 50). This could happen on their first sprint of the week. The system checks Redis for active leagues with < 50 users and assigns the user, storing the `leagueId` in Redis and MongoDB.

### 4. Fire-and-forget Mongo Sync (D-41)
- **How:** In Express, after updating Redis, we don't `await` the Mongoose `save()`. We can use `setImmediate` or just execute the Promise without returning it to the response chain. (Or use a more robust queue like Bull if we wanted, but for v1, standard async execution is fine).

## Validation Requirements (Nyquist)
- Must verify that XP is actually influenced by speed.
- Must verify UTC rollover accurately increments or breaks streaks.
- Must verify streak freeze consumption.
- Must verify users are bucketed into max-50 size leagues in Redis.
- Must verify Mongo sync occurs successfully in the background.
