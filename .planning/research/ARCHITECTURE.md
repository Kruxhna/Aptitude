# Architecture Research: GATE Aptitude Trainer

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native Client                       │
│  (Expo SDK 52+)                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │Sprint UI │ │Dashboard │ │Leaderbd  │ │Skill Progress │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬────────┘  │
│       └─────────────┴────────────┴──────────────┘           │
│                          │ REST API                          │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│              Node.js API Gateway (Express)                   │
│                          │                                   │
│  ┌──────────────┐  ┌─────┴──────┐  ┌────────────────────┐  │
│  │ Quiz Routes  │  │ User Routes│  │ Gamification Routes│  │
│  │ GET /sprint  │  │ GET /me    │  │ GET /leaderboard   │  │
│  │ POST /submit │  │ GET /stats │  │ GET /streak        │  │
│  └──────┬───────┘  └────────────┘  └────────┬───────────┘  │
│         │                                     │              │
│    ┌────┴────────────────┐           ┌───────┴───────┐      │
│    │ Internal HTTP Call  │           │  Redis Client │      │
│    │ to FastAPI Engine   │           │  (ioredis)    │      │
│    └────┬────────────────┘           └───────┬───────┘      │
│         │                                     │              │
└─────────┼─────────────────────────────────────┼──────────────┘
          │                                     │
┌─────────┼──────────────┐         ┌────────────┼─────────────┐
│  FastAPI Adaptive Engine│         │       Redis 7.x          │
│                        │         │                           │
│  POST /calculate-next  │         │  Sorted Set: leaderboard │
│  POST /update-rating   │         │  String+TTL: streaks     │
│  GET  /user-profile    │         │  Hash: session state      │
│                        │         │  Counter: XP              │
│  ┌──────────────────┐  │         └───────────────────────────┘
│  │ ELO Calculator   │  │
│  │ Difficulty Picker │  │
│  │ Performance Anal. │  │
│  └──────────────────┘  │
└────────────────────────┘
          │
┌─────────┼──────────────────────────────────────┐
│                  MongoDB 7.x                    │
│                                                 │
│  Collections:                                   │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │questions │ │users     │ │quiz_sessions   │  │
│  │          │ │          │ │                │  │
│  │- text    │ │- profile │ │- userId        │  │
│  │- type    │ │- ratings │ │- questions     │  │
│  │- options │ │- history │ │- responses     │  │
│  │- answer  │ │- xp      │ │- timestamp     │  │
│  │- images  │ │          │ │                │  │
│  │- diff.   │ │          │ │                │  │
│  └──────────┘ └──────────┘ └────────────────┘  │
└─────────────────────────────────────────────────┘
```

## Component Boundaries

### Node.js API Gateway
- **Owns:** HTTP routing, request validation, auth middleware (mock for v1), response formatting
- **Talks to:** MongoDB (via Mongoose for questions/users/sessions), Redis (via ioredis for XP/streaks/leaderboard), FastAPI (via internal HTTP for difficulty calculations)
- **Does NOT:** Run ELO calculations, generate questions, or make LLM calls

### FastAPI Adaptive Engine
- **Owns:** ELO rating calculations, difficulty selection algorithm, performance analytics computation
- **Talks to:** Node.js API (receives requests from gateway), MongoDB (read-only access for user history if needed, or receives data via API call)
- **Does NOT:** Serve mobile client directly, manage auth, write to Redis

### Redis
- **Owns:** XP counters, streak tracking, weekly leaderboard, quiz session cache
- **Pattern:** Write-through from Node.js after sprint completion; read-heavy for dashboard/leaderboard

### MongoDB
- **Owns:** Question bank, user profiles, quiz session history, user skill ratings (persistent copy)
- **Pattern:** Write after sprint completion; read during sprint setup (fetch questions)

## Data Flow: Daily Sprint

```
1. Client → GET /api/sprint?type=standard
2. Node API → POST http://engine:8000/calculate-next
   Body: { userId, skillRatings: { verbal: 1200, quant: 1050, ... } }
3. Engine → Returns { questions: [...questionIds], difficulties: {...} }
4. Node API → MongoDB.questions.find({ _id: { $in: questionIds } })
5. Node API → Client (sprint payload with questions)
6. Client → POST /api/sprint/submit
   Body: { sessionId, responses: [{ questionId, answer, timeMs }] }
7. Node API → POST http://engine:8000/update-rating
   Body: { userId, responses: [...] }
8. Engine → Returns { newRatings: {...}, xpEarned: 150 }
9. Node API → MongoDB (save session, update user ratings)
10. Node API → Redis (INCRBY xp, update streak, ZADD leaderboard)
11. Node API → Client (results summary)
```

## Communication Pattern: Node ↔ FastAPI

**Protocol:** Internal HTTP (REST) over Docker network

**Why not gRPC:** Simpler to debug, FastAPI generates OpenAPI docs automatically, performance is sufficient for 2-service communication.

**Why not message queue:** The sprint flow is synchronous — user waits for questions and results. No benefit from async decoupling here.

**Implementation:**
```javascript
// Node.js side (axios)
const engineClient = axios.create({
  baseURL: process.env.ENGINE_URL || 'http://engine:8000',
  timeout: 5000
});
```

```python
# FastAPI side
@app.post("/calculate-next")
async def calculate_next(request: NextQuestionRequest) -> NextQuestionResponse:
    ...
```

## Build Order (Suggested)

1. **MongoDB schemas + seed data** — Foundation everything builds on
2. **Node.js API scaffolding** — Express routes, middleware, error handling
3. **FastAPI engine scaffolding** — ELO calculator, endpoint stubs
4. **Node ↔ Engine communication** — Wire the two services together
5. **Redis integration** — XP, streaks, leaderboard
6. **Docker Compose** — Tie everything together
7. **React Native client scaffolding** — Expo setup, navigation, API client
8. **Question generation pipeline** — Batch process, separate from quiz flow

---
*Researched: 2026-07-12*
