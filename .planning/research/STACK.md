# Stack Research: GATE Aptitude Trainer

## Recommended Stack (2025)

| Layer | Technology | Version | Confidence |
|-------|-----------|---------|------------|
| **Mobile Client** | React Native (Expo SDK) | SDK 52+ | ✓ High |
| **API Gateway** | Node.js + Express | Node 22 LTS, Express 5.x | ✓ High |
| **Adaptive Engine** | Python + FastAPI | Python 3.12+, FastAPI 0.115+ | ✓ High |
| **Primary Database** | MongoDB | 7.x via MongoDB Atlas or Docker | ✓ High |
| **Cache / Real-time** | Redis | 7.x (Redis Stack for Sorted Sets) | ✓ High |
| **Container Orchestration** | Docker Compose | v2.x | ✓ High |
| **Question Gen (LLM)** | Google Gemini API / OpenAI API | Latest | Medium |

## Rationale

### React Native (Expo)
- **Why:** Single codebase for iOS/Android. Expo managed workflow simplifies builds, OTA updates, and native module management.
- **Why not Flutter:** User explicitly chose React Native. JS ecosystem aligns with Node.js backend.
- **Key packages:** `expo-router` (navigation), `react-native-reanimated` (animations), `@tanstack/react-query` (data fetching/caching).

### Node.js/Express (API Gateway)
- **Why:** Non-blocking I/O is ideal for the gateway pattern — routing requests, managing sessions, handling concurrent WebSocket connections if needed later.
- **Why not NestJS:** Heavier framework with more ceremony. Express is lighter for a gateway that delegates heavy logic to Python.
- **Key packages:** `mongoose` (MongoDB ODM), `ioredis` (Redis client), `axios` (HTTP to FastAPI), `zod` (validation), `helmet` + `cors` (security).

### Python/FastAPI (Adaptive Engine)
- **Why:** Python's scientific ecosystem (NumPy) is ideal for ELO calculations. FastAPI provides automatic OpenAPI docs, Pydantic validation, and async support.
- **Why not Flask:** FastAPI is significantly faster and provides built-in data validation.
- **Key packages:** `pydantic` (data models), `numpy` (ELO math), `httpx` (async HTTP), `uvicorn` (ASGI server).

### MongoDB
- **Why:** Flexible document schema is perfect for varied question formats (MCQ, numerical, image-based). Each question type can have different fields without schema migrations.
- **Why not PostgreSQL:** The question schema varies significantly by type — documents handle this more naturally than relational tables with many nullable columns.
- **Key driver:** `mongoose` (Node.js), `motor` or `pymongo` (Python — only if engine needs direct DB access).

### Redis
- **Why:** Sub-millisecond reads for XP, streaks, leaderboards. Sorted Sets (`ZADD`/`ZRANK`) are purpose-built for leaderboard ranking.
- **Key patterns:**
  - `Sorted Sets` for leaderboards
  - `INCR`/`INCRBY` for XP counters
  - `String` with TTL for streak tracking (key expires at midnight)
  - `Hash` for session-scoped quiz state

## What NOT to Use

| Technology | Reason |
|-----------|--------|
| **GraphQL** | Adds complexity without clear benefit — REST is sufficient for this API surface |
| **Kafka/RabbitMQ** | Over-engineered for 2-service communication — direct HTTP or Redis pub/sub suffices |
| **PostgreSQL** | Question schema variability makes document DB more natural |
| **Firebase** | Vendor lock-in; doesn't support the Python microservice pattern cleanly |
| **Socket.IO** | Not needed for v1 — leaderboards can poll or use short polling initially |

---
*Researched: 2026-07-12*
