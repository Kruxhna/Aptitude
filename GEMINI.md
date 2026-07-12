<!-- GSD:project-start source:PROJECT.md -->

## Project

**GATE Aptitude Trainer**

A gamified, adaptive testing platform for GATE Aptitude exam preparation, modeled on the Elevate app's progression model. Students get a daily personalized quiz sprint that adapts difficulty per-skill using an ELO rating system, tracks streaks and XP, and provides skill-level performance analytics. The system is a monorepo with a React Native mobile client, a Node.js/Express API, and a Python/FastAPI adaptive engine, backed by MongoDB and Redis.

**Core Value:** Students maintain a daily practice habit through engaging, difficulty-matched quizzes that keep them in the learning sweet spot — never bored, never overwhelmed.

### Constraints

- **Tech stack**: React Native (Expo) for mobile, Node.js/Express for API, Python/FastAPI for adaptive engine, MongoDB for persistence, Redis for real-time state
- **Auth**: Deferred — all API routes use a mock user middleware for v1
- **Local dev**: Must run entirely via Docker Compose — no external service dependencies
- **Question generation**: Batch process only — no real-time LLM calls during quiz sessions (latency/cost)
- **Monorepo**: Single repository with `/client`, `/api`, `/engine` directory structure

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

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

## What NOT to Use

| Technology | Reason |
|-----------|--------|
| **GraphQL** | Adds complexity without clear benefit — REST is sufficient for this API surface |
| **Kafka/RabbitMQ** | Over-engineered for 2-service communication — direct HTTP or Redis pub/sub suffices |
| **PostgreSQL** | Question schema variability makes document DB more natural |
| **Firebase** | Vendor lock-in; doesn't support the Python microservice pattern cleanly |
| **Socket.IO** | Not needed for v1 — leaderboards can poll or use short polling initially |
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agent/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
