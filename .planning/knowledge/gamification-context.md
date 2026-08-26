# Gamification Context — Social & Competitive Features

## Task 0 Inventory (August 2026)

### 1. Gamification Service (`api/src/services/gamification.js`)

**Current exports:**
- `getUtcWeekKey(date)` — returns `"YYYY_WW"` ISO week string
- `getUtcDayDiff(d1, d2)` — UTC day difference
- `calculateStreakUpdates(user, date)` — streak logic with freeze support
- `getOrAssignLeague(userId, existingLeagueId)` — Redis-only league pools (50-user buckets)
- `updateRedisLeaderboard(userId, leagueId, xpEarned)` — `zincrby` on `leaderboard:{weekKey}:{leagueId}`
- `getLeaderboard(leagueId)` — top-50 from `zrevrange`

**Current Redis keys:**
- `active_league:{weekKey}` — current league bucket ID
- `leaderboard:{weekKey}:{leagueId}` — ZSET of user XP within a bucket

**Important:** The current "league" is just a 50-user anonymous bucket, NOT a named tier system (Bronze/Silver/etc). The new Task A league system is a separate concept layered on top.

### 2. User Schema (`api/src/models/User.js`)

```javascript
{
  authId: String,          // unique, indexed
  displayName: String,     // required
  xpTotal: Number,         // lifetime XP
  elo: { verbal, quantitative, logical, spatial }, // per-skill ELO, default 1000
  streak: { current, freezesAvailable, lastCompletedUTCDate },
  onboardingCompleted: Boolean,
  placementCompleted: Boolean,
  dailyGoal: Number,       // enum [10, 20, 30]
  dailyXPTarget: Number,
  preferences: { hapticsEnabled, soundEnabled, soundVolume },
  createdAt: Date,
}
```

No `currentLeague`, `weeklyXP`, `leagueHistory`, `socialOptOut`, `battleStats`, or `clubId` fields exist yet.

### 3. Auth Pattern

**Mock user middleware** (`api/src/middleware/mockUser.js`):
- Every request gets `req.userId = '000000000000000000000001'` (hardcoded ObjectId string)
- All routes reference `req.userId` — no JWT/session parsing
- For social features with multiple users, tests must manually set different `req.userId` values

### 4. Push Notifications

**None configured.** No `expo-notifications` import exists anywhere. The `goals.tsx` file has a filename match but no actual notification code. Task D will need to install and configure `expo-notifications` from scratch.

### 5. Client Tab Structure

Current tabs (`client/src/app/(tabs)/`):
1. `index.tsx` — Home (GATE Aptitude header)
2. `sprint.tsx` — Daily Sprint
3. `leaderboard.tsx` — Weekly Standings (single global leaderboard)
4. `dashboard.tsx` — Performance/Profile
5. `settings.tsx` — Settings (haptics/sound preferences)

Navigation: `expo-router` with `<Tabs>` layout. No drawer, no nested navigators beyond the sprint flow (`sprint/[type].tsx`, `sprint/results.tsx`).

### 6. Model Index Pattern

`api/src/models/index.js` re-exports all models. New models must be added here.

### 7. Route Registration Pattern

`api/src/index.js` imports each route file and calls `app.use(routeModule)`. New route files must be imported and registered here.

### 8. XP Award Flow (sprint submit)

In `api/src/routes/sprint.js` POST `/api/sprint/submit`:
1. Score each answer → calculate `totalXP`
2. `User.findByIdAndUpdate` with `$inc: { xpTotal }` and streak updates
3. `gamification.updateRedisLeaderboard(userId, leagueId, xpEarned)` — fire-and-forget via `setImmediate`
4. Returns `{ score, xp, newElo, streak }` to client

**Hook point for social features:** After step 2, also update `friend_leaderboard:{friendId}` ZSETs and `league:{tierName}` ZSET.

### 9. Redis Client

`api/src/config/redis.js`: ioredis with Proxy fallback to MockRedis. MockRedis only has `get/set/del/exists` — does NOT have `zincrby/zrevrange/zcard/zadd/zrank/smembers/sadd/srem`. Tests using sorted sets must either:
- Use real Redis, or
- Extend MockRedis with sorted set stubs
