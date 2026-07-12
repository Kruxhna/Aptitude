# GATE Aptitude Trainer

## What This Is

A gamified, adaptive testing platform for GATE Aptitude exam preparation, modeled on the Elevate app's progression model. Students get a daily personalized quiz sprint that adapts difficulty per-skill using an ELO rating system, tracks streaks and XP, and provides skill-level performance analytics. The system is a monorepo with a React Native mobile client, a Node.js/Express API, and a Python/FastAPI adaptive engine, backed by MongoDB and Redis.

## Core Value

Students maintain a daily practice habit through engaging, difficulty-matched quizzes that keep them in the learning sweet spot — never bored, never overwhelmed.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Daily Sprint Loop — configurable timed quiz (quick/standard/deep) pulling personalized questions
- [ ] Adaptive Engine — ELO-style per-skill difficulty rating with nudge up/down based on speed + accuracy
- [ ] Question Bank — MongoDB schema supporting MCQ, numerical input, and image-based spatial puzzle formats
- [ ] Hybrid Question Generation — LLM generates questions → template validator/normalizer pipeline
- [ ] Skill Categories — standard GATE Aptitude syllabus: Verbal (grammar, vocabulary, comprehension), Quantitative (arithmetic, algebra, data interpretation), Logical Reasoning, Spatial Aptitude
- [ ] Per-Skill Progression — ELO rating tracked per skill category with progressive difficulty tiers
- [ ] Gamification — XP system, daily streaks, weekly leaderboard (Redis-backed)
- [ ] Performance Analytics — per-skill accuracy, speed trends, historical metrics
- [ ] Node ↔ Python Communication — API gateway routes requests to FastAPI adaptive engine
- [ ] Docker Compose — full local dev environment (Node API, Python engine, MongoDB, Redis, React Native Metro)

### Out of Scope

- User authentication — deferred; mock user/hardcoded user ID for v1
- UI polish and branding — backend scaffolding first
- Push notifications — future feature
- Social features (friends, challenges) — future feature
- Payment/subscription system — future feature
- Offline mode — future feature
- Web client — mobile-first, React Native only for v1

## Context

- **Target exam**: GATE Aptitude section — a standardized component of the Graduate Aptitude Test in Engineering (India)
- **Inspiration**: Elevate app — daily micro-training, skill categorization, performance graphs, progressive difficulty within each skill
- **Adaptive approach**: ELO-style rating (simple, well-understood) rather than IRT (complex, needs calibrated question parameters). Per-skill ELO adjusted based on response speed and accuracy.
- **Question generation**: Hybrid pipeline — LLM (Gemini/OpenAI API) generates raw questions, then template-based validators normalize format, verify answer correctness, and tag difficulty. This runs as a batch/admin process, not real-time during quizzes.
- **Question formats**: MCQ (4 options, 1 correct), numerical input (type-a-number for quantitative), image-based (spatial puzzles rendered as static images stored in the question document or external storage)
- **Sprint configurability**: Users pick sprint length — quick (~5 questions), standard (~10 questions), deep (~15 questions) — with per-question time limits varying by skill category
- **Architecture**: Monorepo (`/client`, `/api`, `/engine`) with Docker Compose for local dev. Node.js API is the gateway; Python engine is called via internal HTTP for difficulty calculations.

## Constraints

- **Tech stack**: React Native (Expo) for mobile, Node.js/Express for API, Python/FastAPI for adaptive engine, MongoDB for persistence, Redis for real-time state
- **Auth**: Deferred — all API routes use a mock user middleware for v1
- **Local dev**: Must run entirely via Docker Compose — no external service dependencies
- **Question generation**: Batch process only — no real-time LLM calls during quiz sessions (latency/cost)
- **Monorepo**: Single repository with `/client`, `/api`, `/engine` directory structure

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| ELO over IRT for adaptive difficulty | Simpler to implement, doesn't require pre-calibrated question parameters, well-understood algorithm | — Pending |
| Monorepo over separate repos | Easier to coordinate changes across services during early development, shared Docker Compose | — Pending |
| Deferred auth with mock user | Lets us build and test all core flows without auth complexity; add auth layer later without changing business logic | — Pending |
| Hybrid question generation (LLM + template) | Pure LLM is unreliable for answer correctness; pure template is too rigid for varied question types. Hybrid gets variety + reliability | — Pending |
| Redis for gamification state | XP, streaks, leaderboards need sub-millisecond reads; Redis avoids hammering MongoDB on every quiz completion | — Pending |
| Docker Compose for local dev | All services + databases in one `docker compose up` — no "works on my machine" issues | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-12 after initialization*
