---
phase: 1
plan_id: 01C
title: "Inter-Service Communication & API Routes"
wave: 3
depends_on: ["01A", "01B"]
files_modified:
  - api/src/routes/sprint.js
  - api/src/routes/users.js
  - api/src/routes/leaderboard.js
  - api/src/services/engineClient.js
  - api/src/index.js
autonomous: true
requirements:
  - ADPT-05
---

# Plan 01C: Inter-Service Communication & API Routes

## Objective

Wire the Node.js API to communicate with the FastAPI engine via internal HTTP, create initial API route stubs that query MongoDB and call the engine, and verify the full request chain works end-to-end.

## Tasks

<task id="01C-T1">
<title>Create engine HTTP client service</title>
<read_first>
- .planning/phases/01-foundation-scaffolding/01-RESEARCH.md (Inter-Service Communication section)
- api/src/config/db.js (pattern reference for config module)
</read_first>
<action>
Create `api/src/services/engineClient.js`:
- Import axios
- Create axios instance with:
  - baseURL: `process.env.ENGINE_URL || 'http://engine:8000'`
  - timeout: 5000
  - headers: `{ 'Content-Type': 'application/json' }`
- Export helper functions:
  - `calculateNext(userId, skillRatings)` — POST `/calculate-next` with `{ userId, skillRatings }`
  - `updateRating(userId, responses)` — POST `/update-rating` with `{ userId, responses }`
- Handle errors: wrap calls in try/catch, log error, re-throw with descriptive message
</action>
<acceptance_criteria>
- `api/src/services/engineClient.js` exports `calculateNext` and `updateRating` functions
- axios instance uses `process.env.ENGINE_URL` with fallback to `http://engine:8000`
- timeout is set to 5000ms
- Errors are caught and re-thrown with descriptive messages
</acceptance_criteria>
</task>

<task id="01C-T2">
<title>Create sprint API route with engine integration</title>
<read_first>
- api/src/services/engineClient.js
- api/src/models/Question.js
- api/src/models/User.js
- api/src/middleware/mockUser.js
</read_first>
<action>
Create `api/src/routes/sprint.js`:
- GET `/api/sprint` — Accepts query param `type` (quick|standard|deep, default: standard)
  - Map type to question count: quick=5, standard=10, deep=15
  - Fetch user by `req.userId` from MongoDB
  - Call `engineClient.calculateNext(userId, user.ratings)`
  - If engine returns questionIds, fetch those questions from MongoDB
  - If engine returns empty (stub), fallback: fetch random questions from MongoDB matching count
  - Return `{ sprintId, type, questions: [...], questionCount }`

- POST `/api/sprint/submit` — Accepts body `{ responses: [{ questionId, answer, timeMs }] }`
  - Validate responses array exists and is non-empty
  - Call `engineClient.updateRating(userId, responses)`
  - Return stub result: `{ accuracy: 0, xpEarned: 0, ratingsAfter: {}, results: [] }`
  - (Full scoring logic will be implemented in Phase 4)
</action>
<acceptance_criteria>
- `GET /api/sprint?type=standard` returns JSON with `questions` array of 10 items (from seed data)
- `GET /api/sprint?type=quick` returns 5 questions
- `GET /api/sprint?type=deep` returns 15 questions
- `POST /api/sprint/submit` accepts responses and returns stub result without error
- Sprint route calls `engineClient.calculateNext` (engine communication verified)
</acceptance_criteria>
</task>

<task id="01C-T3">
<title>Create user and leaderboard API routes</title>
<read_first>
- api/src/models/User.js
- api/src/config/redis.js
- api/src/middleware/mockUser.js
</read_first>
<action>
Create `api/src/routes/users.js`:
- GET `/api/users/me` — Fetch current user by `req.userId`, return user profile (name, ratings, xp, streak)
- GET `/api/users/stats` — Return stub analytics data: `{ ratings: user.ratings, sessionsCompleted: user.sessionsCompleted }`

Create `api/src/routes/leaderboard.js`:
- GET `/api/leaderboard` — Return stub leaderboard: `{ entries: [], resetDate: nextMonday }`
  - (Real leaderboard via Redis Sorted Sets will be implemented in Phase 5)

Update `api/src/index.js`:
- Import and mount all route files:
  - `app.use(sprintRoutes)`
  - `app.use(userRoutes)`
  - `app.use(leaderboardRoutes)`
- Add global error handler middleware at the end of the middleware chain
</action>
<acceptance_criteria>
- `GET /api/users/me` returns mock user with `ratings`, `totalXp`, `currentStreak` fields
- `GET /api/users/stats` returns user ratings and session count
- `GET /api/leaderboard` returns stub response with empty entries array
- `api/src/index.js` mounts sprint, users, and leaderboard routes
- Global error handler returns `{ error: message }` with appropriate status code
</acceptance_criteria>
</task>

<task id="01C-T4">
<title>End-to-end verification of full request chain</title>
<read_first>
- docker-compose.yml
- api/src/routes/sprint.js
- engine/app/main.py
</read_first>
<action>
Verify the complete request chain works:
1. `docker compose up -d` — all 4 services start
2. Run seed script to populate questions
3. Test the full flow:
   - Client → GET /api/sprint → API → POST /calculate-next → Engine → Response back to API → Questions from MongoDB → Client
   - Client → POST /api/sprint/submit → API → POST /update-rating → Engine → Response back to API → Client

Add a simple smoke test that can be run with curl commands documented in the verification section.
</action>
<acceptance_criteria>
- `docker compose up -d` starts all services with healthy status
- `curl localhost:3000/api/sprint?type=standard` returns 10 questions
- `curl -X POST localhost:3000/api/sprint/submit -H "Content-Type: application/json" -d '{"responses":[]}' ` returns stub result
- `curl localhost:3000/api/users/me` returns mock user profile
- `curl localhost:8000/health` returns `{ status: "ok", service: "engine" }`
- API logs show successful HTTP call to engine service
</acceptance_criteria>
</task>

## Verification

```bash
# Full end-to-end test sequence
docker compose up -d
docker compose exec api node src/scripts/seed.js

# 1. Health checks
curl http://localhost:3000/health
curl http://localhost:8000/health

# 2. Sprint flow
curl http://localhost:3000/api/sprint?type=standard
# Expected: { sprintId, type: "standard", questions: [...10 items], questionCount: 10 }

curl http://localhost:3000/api/sprint?type=quick
# Expected: questionCount: 5

# 3. Submit flow (tests API → Engine communication)
curl -X POST http://localhost:3000/api/sprint/submit \
  -H "Content-Type: application/json" \
  -d '{"responses": [{"questionId": "test", "answer": "0", "timeMs": 5000}]}'
# Expected: stub result (no error)

# 4. User routes
curl http://localhost:3000/api/users/me
# Expected: mock user with ratings

# 5. Leaderboard
curl http://localhost:3000/api/leaderboard
# Expected: { entries: [], resetDate: "..." }
```

## must_haves
- [ ] Node.js API successfully calls FastAPI engine via internal HTTP
- [ ] GET /api/sprint returns questions from MongoDB
- [ ] POST /api/sprint/submit processes without errors
- [ ] All API routes are protected by mock user middleware
- [ ] Full request chain works: Client → API → Engine → MongoDB → Response

## Artifacts this phase produces
- `/api/src/services/engineClient.js` — HTTP client for FastAPI engine
- `/api/src/routes/sprint.js` — Sprint endpoints (GET, POST)
- `/api/src/routes/users.js` — User profile endpoints
- `/api/src/routes/leaderboard.js` — Leaderboard endpoint stub
