# Requirements: GATE Aptitude Trainer

**Defined:** 2026-07-12
**Core Value:** Students maintain a daily practice habit through engaging, difficulty-matched quizzes that keep them in the learning sweet spot

## v1 Requirements

### Sprint

- [ ] **SPRT-01**: User can start a daily quiz sprint from the home screen
- [ ] **SPRT-02**: User can choose sprint length — quick (5 questions), standard (10 questions), or deep (15 questions)
- [ ] **SPRT-03**: Each question displays a countdown timer that varies by skill category
- [ ] **SPRT-04**: User can answer MCQ questions by selecting one of four options
- [ ] **SPRT-05**: User can answer numerical questions by typing a number
- [ ] **SPRT-06**: User can answer image-based spatial questions by selecting from visual options
- [ ] **SPRT-07**: User sees a post-sprint results summary showing accuracy, speed, and XP earned
- [ ] **SPRT-08**: User can review each question after the sprint with the correct answer and explanation

### Adaptive

- [ ] **ADPT-01**: System tracks an independent ELO rating per skill category per user (Verbal, Quantitative, Logical, Spatial)
- [ ] **ADPT-02**: System selects questions matching the user's current skill ELO rating (±tolerance band)
- [ ] **ADPT-03**: System updates user and question ELO ratings after each answered question based on correctness and response time
- [ ] **ADPT-04**: New users start with a default ELO rating (1000) with a higher K-factor (K=40) that decays to K=20 after 10 sessions
- [ ] **ADPT-05**: Node.js API communicates with FastAPI engine via internal HTTP to request difficulty calculations

### Gamification

- [ ] **GAME-01**: User earns XP for each correct answer, with a speed bonus multiplier for fast responses
- [ ] **GAME-02**: User sees their daily streak count (consecutive days with at least one completed sprint)
- [ ] **GAME-03**: User can activate a streak freeze to protect their streak for one missed day
- [ ] **GAME-04**: XP and streak data are stored in Redis for instant reads, with sync-back to MongoDB
- [ ] **GAME-05**: User can view a weekly leaderboard ranked by XP earned that week
- [ ] **GAME-06**: Leaderboard resets weekly using Redis Sorted Sets

### Analytics

- [ ] **ANLT-01**: User can see their current per-skill progress indicator (normalized rating/level)
- [ ] **ANLT-02**: User can view historical accuracy and speed trend graphs per skill category

### Content

- [ ] **CONT-01**: System supports a hybrid question generation pipeline — LLM generates questions, template validator normalizes and verifies
- [ ] **CONT-02**: Questions are stored in MongoDB with schema supporting MCQ, numerical, and image-based formats
- [ ] **CONT-03**: Each question has metadata: skill category, difficulty rating, explanation text, and active/inactive flag
- [ ] **CONT-04**: A seeding script can batch-import generated questions into the database

### Infrastructure

- [ ] **INFR-01**: Monorepo structure with `/client` (React Native), `/api` (Node.js/Express), `/engine` (Python/FastAPI)
- [ ] **INFR-02**: Docker Compose configuration runs all services (API, engine, MongoDB, Redis) with health checks
- [ ] **INFR-03**: Mock user middleware on all API routes (hardcoded user ID, no auth)
- [ ] **INFR-04**: MongoDB compound indexes on questions collection `{ skill, difficulty, active }`

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
| INFR-01 | Phase 1 | Pending |
| INFR-02 | Phase 1 | Pending |
| INFR-03 | Phase 1 | Pending |
| INFR-04 | Phase 1 | Pending |
| CONT-02 | Phase 1 | Pending |
| CONT-03 | Phase 1 | Pending |
| ADPT-05 | Phase 1 | Pending |
| ADPT-01 | Phase 2 | Pending |
| ADPT-02 | Phase 2 | Pending |
| ADPT-03 | Phase 2 | Pending |
| ADPT-04 | Phase 2 | Pending |
| CONT-01 | Phase 3 | Pending |
| CONT-04 | Phase 3 | Pending |
| SPRT-01 | Phase 4 | Pending |
| SPRT-02 | Phase 4 | Pending |
| SPRT-03 | Phase 4 | Pending |
| SPRT-04 | Phase 4 | Pending |
| SPRT-05 | Phase 4 | Pending |
| SPRT-06 | Phase 4 | Pending |
| SPRT-07 | Phase 4 | Pending |
| SPRT-08 | Phase 4 | Pending |
| GAME-01 | Phase 5 | Pending |
| GAME-02 | Phase 5 | Pending |
| GAME-03 | Phase 5 | Pending |
| GAME-04 | Phase 5 | Pending |
| GAME-05 | Phase 5 | Pending |
| GAME-06 | Phase 5 | Pending |
| ANLT-01 | Phase 6 | Pending |
| ANLT-02 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-12*
*Last updated: 2026-07-12 after initial definition*
