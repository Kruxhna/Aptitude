# Requirements: GATE Aptitude Trainer

**Defined:** 2026-07-12
**Core Value:** Students maintain a daily practice habit through engaging, difficulty-matched quizzes that keep them in the learning sweet spot

## v1 Requirements

### Sprint

- [x] **SPRT-01**: User can start a daily quiz sprint from the home screen
- [x] **SPRT-02**: User can choose sprint length — quick (5 questions), standard (10 questions), or deep (15 questions)
- [x] **SPRT-03**: Each question displays a countdown timer that varies by skill category
- [x] **SPRT-04**: User can answer MCQ questions by selecting one of four options
- [x] **SPRT-05**: User can answer numerical questions by typing a number
- [x] **SPRT-06**: User can answer image-based spatial questions by selecting from visual options
- [x] **SPRT-07**: User sees a post-sprint results summary showing accuracy, speed, and XP earned
- [x] **SPRT-08**: User can review each question after the sprint with the correct answer and explanation

### Adaptive

- [x] **ADPT-01**: System tracks an independent ELO rating per skill category per user (Verbal, Quantitative, Logical, Spatial)
- [x] **ADPT-02**: System selects questions matching the user's current skill ELO rating (±tolerance band)
- [x] **ADPT-03**: System updates user and question ELO ratings after each answered question based on correctness and response time
- [x] **ADPT-04**: New users start with a default ELO rating (1000) with a higher K-factor (K=40) that decays to K=20 after 10 sessions
- [x] **ADPT-05**: Node.js API communicates with FastAPI engine via internal HTTP to request difficulty calculations

### Gamification

- [x] **GAME-01**: User earns XP for each correct answer, with a speed bonus multiplier for fast responses
- [x] **GAME-02**: User sees their daily streak count (consecutive days with at least one completed sprint)
- [x] **GAME-03**: User can activate a streak freeze to protect their streak for one missed day
- [x] **GAME-04**: XP and streak data are stored in Redis for instant reads, with sync-back to MongoDB
- [x] **GAME-05**: User can view a weekly leaderboard ranked by XP earned that week
- [x] **GAME-06**: Leaderboard resets weekly using Redis Sorted Sets

### Analytics

- [x] **ANLT-01**: User can see their current per-skill progress indicator (normalized rating/level)
- [x] **ANLT-02**: User can view historical accuracy and speed trend graphs per skill category

### Content

- [x] **CONT-01**: System supports a hybrid question generation pipeline — LLM generates questions, template validator normalizes and verifies
- [x] **CONT-02**: Questions are stored in MongoDB with schema supporting MCQ, numerical, and image-based formats
- [x] **CONT-03**: Each question has metadata: skill category, difficulty rating, explanation text, and active/inactive flag
- [x] **CONT-04**: A seeding script can batch-import generated questions into the database

### Infrastructure

- [x] **INFR-01**: Monorepo structure with `/client` (React Native), `/api` (Node.js/Express), `/engine` (Python/FastAPI)
- [x] **INFR-02**: Docker Compose configuration runs all services (API, engine, MongoDB, Redis) with health checks
- [x] **INFR-03**: Mock user middleware on all API routes (hardcoded user ID, no auth)
- [x] **INFR-04**: MongoDB compound indexes on questions collection `{ skill, difficulty, active }`

## v2 Requirements

### Authentication

- **AUTH-01**: User can sign up with email and password
- **AUTH-02**: User can log in and stay logged in across sessions (JWT)
- **AUTH-03**: User can log out from any screen

### Notifications

- **NOTF-01**: User receives a push notification reminder if they haven't completed today's sprint
- **NOTF-02**: User receives a notification when their streak is about to expire

### Social

- **SOCL-01**: User can share their sprint results to social media
- **SOCL-02**: User can challenge a friend to beat their sprint score

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time multiplayer quizzes | Massive WebSocket/matchmaking complexity — not core value |
| In-app purchases / monetization | Focus on learning integrity first |
| AI tutor chat | Scope creep — quiz mechanics are the priority |
| Offline mode | Complex sync logic — defer to v2+ |
| Web client | Mobile-first with React Native only |
| OAuth / Google sign-in | Auth entirely deferred for v1 |
| Custom avatar / profile customization | Cosmetic — not core learning value |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFR-01 | Phase 1 | Complete |
| INFR-02 | Phase 1 | Complete |
| INFR-03 | Phase 1 | Complete |
| INFR-04 | Phase 1 | Complete |
| CONT-02 | Phase 1 | Complete |
| CONT-03 | Phase 1 | Complete |
| ADPT-05 | Phase 1 | Complete |
| ADPT-01 | Phase 2 | Complete |
| ADPT-02 | Phase 2 | Complete |
| ADPT-03 | Phase 2 | Complete |
| ADPT-04 | Phase 2 | Complete |
| CONT-01 | Phase 3 | Complete |
| CONT-04 | Phase 3 | Complete |
| SPRT-01 | Phase 4 / 7 | Complete |
| SPRT-02 | Phase 4 / 7 | Complete |
| SPRT-03 | Phase 4 / 7 | Complete |
| SPRT-04 | Phase 4 / 7 | Complete |
| SPRT-05 | Phase 4 / 7 | Complete |
| SPRT-06 | Phase 4 / 7 | Complete |
| SPRT-07 | Phase 4 / 7 | Complete |
| SPRT-08 | Phase 4 / 7 | Complete |
| GAME-01 | Phase 5 | Complete |
| GAME-02 | Phase 5 / 7 | Complete |
| GAME-03 | Phase 5 | Complete |
| GAME-04 | Phase 5 | Complete |
| GAME-05 | Phase 5 / 7 | Complete |
| GAME-06 | Phase 5 | Complete |
| ANLT-01 | Phase 6 / 7 | Complete |
| ANLT-02 | Phase 6 / 7 | Complete |

**Coverage:**

- v1 requirements: 29 total
- Completed: 29 / 29 (100%) ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-12*
*All 29 v1 requirements completed: 2026-07-24*
