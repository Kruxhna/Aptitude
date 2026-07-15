# Roadmap: GATE Aptitude Trainer

**Created:** 2026-07-12
**Phases:** 7
**Mode:** Vertical MVP — each phase delivers end-to-end working capability

---

### Phase 1: Foundation & Scaffolding

**Goal:** Monorepo structure, Docker Compose dev environment, MongoDB schemas, Express + FastAPI stubs, and inter-service communication working end-to-end.
**Mode:** mvp
**Requirements:** INFR-01, INFR-02, INFR-03, INFR-04, CONT-02, CONT-03, ADPT-05
**Success Criteria:**

1. `docker compose up` starts all 4 services (API, engine, MongoDB, Redis) with passing health checks
2. Node.js API returns questions from MongoDB via a GET endpoint
3. Node.js API successfully calls FastAPI engine and receives a response
4. MongoDB question schema supports MCQ, numerical, and image-based formats with compound indexes
5. Mock user middleware is active on all API routes

---

### Phase 2: Adaptive Engine

**Goal:** ELO-based difficulty calculation working end-to-end — from user profile to question selection to rating updates.
**Mode:** mvp
**Requirements:** ADPT-01, ADPT-02, ADPT-03, ADPT-04
**Success Criteria:**

1. FastAPI endpoint accepts user skill ratings and returns difficulty-matched question IDs
2. ELO ratings update correctly after a simulated quiz (correctness + speed factored in)
3. New users start at ELO 1000 with K=40, decaying to K=20 after 10 sessions
4. Question selection respects difficulty tolerance band (±100 ELO by default)
5. ELO simulator validates rating stability over 1000 virtual sessions

---

### Phase 3: Question Generation Pipeline

**Goal:** Hybrid LLM + template pipeline generates valid questions across all 4 skill categories, with a batch seeding script to populate the database.
**Mode:** mvp
**Requirements:** CONT-01, CONT-04
**Success Criteria:**

1. LLM generates raw questions for Verbal, Quantitative, Logical, and Spatial categories
2. Template validator checks answer correctness, option distinctness, and format compliance
3. Batch seeding script imports 100+ validated questions per category into MongoDB
4. Generated questions include difficulty metadata, skill tags, and explanation text
5. Invalid/ambiguous questions are flagged and excluded automatically

---

### Phase 4: Daily Sprint API

**Goal:** Complete sprint flow works via API — user requests a sprint, receives personalized questions, submits answers, gets scored with ELO updates.
**Mode:** mvp
**Requirements:** SPRT-01, SPRT-02, SPRT-03, SPRT-04, SPRT-05, SPRT-06, SPRT-07, SPRT-08
**Success Criteria:**

1. GET `/api/sprint?type=standard` returns 10 difficulty-matched questions for the mock user
2. Sprint respects requested length (quick=5, standard=10, deep=15)
3. POST `/api/sprint/submit` accepts responses with timing data and returns scored results
4. Results include per-question correctness, correct answers with explanations, and XP earned
5. ELO ratings update after submission via engine call

---

### Phase 5: Gamification System

**Goal:** XP, streaks, and leaderboard working end-to-end — Redis-backed with MongoDB sync.
**Mode:** mvp
**Requirements:** GAME-01, GAME-02, GAME-03, GAME-04, GAME-05, GAME-06
**Success Criteria:**

1. Sprint completion awards XP with speed bonus multiplier (stored in Redis, synced to MongoDB)
2. Daily streak increments on sprint completion and displays correctly
3. Streak freeze can be activated and protects one missed day
4. Weekly leaderboard ranks users by XP earned this week (Redis Sorted Set)
5. Leaderboard resets weekly (automated or via cron endpoint)
6. Redis data survives restart via MongoDB sync-back

---

### Phase 6: Performance Analytics API

**Goal:** Analytics endpoints return per-skill progress and historical trends that the client can graph.
**Mode:** mvp
**Requirements:** ANLT-01, ANLT-02
**Success Criteria:**

1. GET `/api/analytics/progress` returns current per-skill rating normalized to a displayable scale
2. GET `/api/analytics/history` returns time-series data (accuracy, speed) per skill over last 30 days
3. Data is aggregated from quiz session history in MongoDB
4. Response format is chart-ready (arrays of { date, accuracy, avgSpeed, rating })

---

### Phase 7: React Native Mobile Client

**Goal:** Expo-based mobile app connects to the API and delivers the full sprint → results → dashboard → leaderboard flow.
**Mode:** mvp
**UI hint:** yes
**Requirements:** SPRT-01, SPRT-02, SPRT-03, SPRT-04, SPRT-05, SPRT-06, SPRT-07, SPRT-08, GAME-02, GAME-05, ANLT-01, ANLT-02
**Success Criteria:**

1. App launches on Expo Go and navigates between Home, Sprint, Results, Dashboard, and Leaderboard screens
2. Sprint screen displays questions with timer and accepts MCQ/numerical/image answers
3. Results screen shows post-sprint summary with answer review
4. Dashboard screen shows per-skill progress indicators and trend graphs
5. Leaderboard screen shows weekly XP rankings
6. All data flows through the Node.js API (no direct DB access from client)

---

## Summary

| Phase | Name | Requirements | Success Criteria |
|-------|------|-------------|-----------------|
| 1 | Foundation & Scaffolding | INFR-01, INFR-02, INFR-03, INFR-04, CONT-02, CONT-03, ADPT-05 | 5 |
| 2 | 2/2 | Complete    | 2026-07-15 |
| 3 | Question Generation Pipeline | CONT-01, CONT-04 | 5 |
| 4 | Daily Sprint API | SPRT-01 – SPRT-08 | 5 |
| 5 | Gamification System | GAME-01 – GAME-06 | 6 |
| 6 | Performance Analytics API | ANLT-01, ANLT-02 | 4 |
| 7 | React Native Mobile Client | (client for SPRT, GAME, ANLT) | 6 |

**Total:** 7 phases | 29 requirements mapped | 36 success criteria

---
*Roadmap created: 2026-07-12*
