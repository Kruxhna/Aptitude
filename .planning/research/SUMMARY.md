# Research Summary: GATE Aptitude Trainer

## Stack Decision

**Confirmed stack:** React Native (Expo SDK 52+) → Node.js/Express 5.x → FastAPI (Python 3.12+) → MongoDB 7.x + Redis 7.x

All technologies align well with the project requirements. Key validations:
- MongoDB's flexible schema handles varied question formats (MCQ, numerical, image) without migration headaches
- Redis Sorted Sets are purpose-built for the leaderboard use case
- FastAPI's Pydantic models enforce clean contracts between Node.js and the engine
- Docker Compose ties the local dev experience together cleanly

**No stack changes recommended.** User's chosen stack is well-suited.

## Table Stakes for v1

These features are expected by users of gamified learning apps and must ship:

1. **Daily quiz sprint** with configurable length (quick/standard/deep)
2. **Per-question timer** varying by skill category
3. **XP rewards** with speed bonuses
4. **Daily streak** tracking with visual counter
5. **4 skill categories** (Verbal, Quantitative, Logical, Spatial) with independent tracking
6. **Post-sprint results** showing accuracy, speed, XP earned
7. **Answer review** with correct answers and explanations
8. **Progress indicators** per skill

## Key Differentiators

1. **Adaptive difficulty** (ELO-based, per-skill) — this is the core differentiator
2. **Hybrid question generation** (LLM + template validation) — enables unlimited fresh content
3. **Weekly leaderboard** with reset — drives competitive re-engagement

## Critical Watch-Outs

| Risk | Mitigation | Phase |
|------|-----------|-------|
| **ELO cold start** | K-factor decay (K=40 → K=20 over 10 sessions); seed question difficulty from generation metadata | Phase 2 |
| **Question quality** | Template validator checks answer correctness and option distinctness; track per-question accuracy rates | Phase 3 |
| **MongoDB performance** | Compound index `{ skill, difficulty, active }` from day one | Phase 1 |
| **Redis data loss** | Sync-back pattern: Redis is cache, MongoDB is source of truth for XP/streaks | Phase 4 |
| **Rating inflation** | Run ELO simulator (1000 virtual sessions) before launch to verify stability | Phase 2 |

## Architecture Highlights

- **Communication:** Node.js → FastAPI via internal HTTP (Docker network). Synchronous — user waits for results.
- **Data flow:** Client → Node API → Engine (difficulty calc) → Node API → MongoDB (persist) + Redis (gamification) → Client
- **Build order:** Schema → API scaffolding → Engine scaffolding → Wire services → Redis integration → Docker Compose → Mobile client → Question pipeline

## Recommendation for Roadmap

Build in this order:
1. **Foundation** — MongoDB schemas, Docker Compose, Express + FastAPI scaffolding, inter-service communication
2. **Adaptive Engine** — ELO calculator, question selection, cold start handling
3. **Question Pipeline** — LLM generation + template validation + seed data
4. **Gamification** — XP, streaks, leaderboard (Redis-backed with MongoDB sync)
5. **Performance Analytics** — Per-skill graphs, historical trends
6. **Mobile Client** — Sprint UI, dashboard, leaderboard views
7. **Polish** — Sprint configurability, streak freeze, speed bonuses

---
*Synthesized: 2026-07-12*
