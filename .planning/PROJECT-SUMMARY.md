# GATE Aptitude Trainer — Master System Summary & Agent Architecture Guide

## 1. Executive Summary & Core Value

The **GATE Aptitude Trainer** is a gamified, adaptive testing platform for Graduate Aptitude Test in Engineering (GATE) exam preparation, modeled after the Elevate/Duolingo progression framework.

- **Core Value:** Keeps students in the optimal learning sweet spot via daily personalized question sprints (Quick 5m, Standard 10m, Deep 15m).
- **Adaptive Progression:** Adapts per-skill difficulty (Verbal, Quantitative, Logical, Spatial) using a Python-powered ELO rating system (`K=32`).
- **Gamification:** Rewards speed and consistency via XP multipliers, UTC midnight streak mechanics (with streak freezes), and real-time Redis Sorted Set weekly leaderboards.
- **Client Experience:** Built on React Native (Expo SDK 52) with custom Duolingo bounce spring animations (`cubic-bezier(0.175, 0.885, 0.320, 1.275)`), SPRINTY robot mascot sprite sheets, and visual skill path progression.

---

## 2. System Architecture & Tech Stack

```
                        ┌────────────────────────────────────────┐
                        │      React Native Client (Expo 52)     │
                        │        /client (Expo Router)           │
                        └───────────────────┬────────────────────┘
                                            │ HTTP / REST
                                            ▼
                        ┌────────────────────────────────────────┐
                        │       Node.js / Express API Gateway    │
                        │           /api (Port 3000)             │
                        └─────────┬───────────────────┬──────────┘
                                  │                   │
                     FastAPI Async│                   │Redis Commands &
                     HTTP Client  │                   │Mongo Mongoose ODM
                                  ▼                   ▼
      ┌──────────────────────────────────┐      ┌───────────────────────────────┐
      │     Python / FastAPI Engine      │      │  Redis (Leaderboards & Cache) │
      │   /engine (ELO & Speed Math)     │      │  MongoDB (Questions & Stats)  │
      └──────────────────────────────────┘      └───────────────────────────────┘
```

| Layer | Technology | Primary Role / Package |
|---|---|---|
| **Mobile Client** | React Native (Expo SDK 52) | `expo-router`, `react-native-reanimated`, `react-native-svg` |
| **API Gateway** | Node.js 22 LTS + Express 5.x | `mongoose` (MongoDB ODM), `ioredis`, `axios`, `zod` |
| **Adaptive Engine** | Python 3.12+ + FastAPI 0.115+ | `pydantic`, `numpy` (ELO & speed multiplier calculations) |
| **Primary Database** | MongoDB 7.x | Stores questions, user profiles, ELO ratings, and historical sessions |
| **Cache & Real-time** | Redis 7.x | Redis Sorted Sets (`ZADD`/`ZREVRANGE`) for weekly leaderboard ranking |
| **Containerization** | Docker Compose v2.x | Orchestrates MongoDB, Redis, API, and Python Engine services |

---

## 3. Comprehensive Phase-by-Phase Breakdown

### Phase 01: Foundation & Monorepo Scaffolding
- **Deliverables:** Configured monorepo directory layout (`/client`, `/api`, `/engine`), Docker Compose container definitions, Mongoose database connections, and mock user authorization middleware.
- **Key Files:** `docker-compose.yml`, `api/src/index.js`, `api/src/models/User.js`, `api/src/models/Question.js`.

### Phase 02: Python Adaptive Engine
- **Deliverables:** Built FastAPI service for computing ELO deltas (`K=32`) per skill category and normalizing ratings to a 0–100 scale using linear mapping `(elo - 800) / (1400 - 800) * 100`.
- **Endpoints:** `POST /engine/calculate-elo`, `POST /engine/normalize-scores`.
- **Key Files:** `engine/app/main.py`, `engine/tests/test_gamification.py`.

### Phase 03: Batch Question Generation Pipeline
- **Deliverables:** Offline batch generation scripts using Gemini API LLM prompts to populate MongoDB with GATE aptitude questions across 4 categories (Verbal, Quantitative, Logical, Spatial) supporting MCQ, Numerical, and Visual pattern formats with automated JSON schema validation.
- **Key Files:** `api/src/scripts/seed.js`, `api/src/scripts/prompts/*.js`.

### Phase 04: Daily Sprint API & Orchestration
- **Deliverables:** API gateway routing that orchestrates question fetching matched to user ELO, session submission handling, and microservice delegation.
- **Endpoints:** `GET /api/sprint?type=quick|standard|deep`, `POST /api/sprint/submit`.
- **Key Files:** `api/src/routes/sprint.js`, `api/src/services/sprintOrchestrator.js`.

### Phase 05: Gamification System
- **Deliverables:** Implemented 1.0x–1.5x XP speed bonus for rapid answers (<30s par time), strict UTC midnight streak tracking with automatic 1-day streak freeze protection, and real-time Redis Sorted Set leaderboards with fire-and-forget MongoDB persistence.
- **Endpoints:** `GET /api/leaderboard`.
- **Key Files:** `api/src/services/gamification.js`, `api/src/routes/leaderboard.js`, `api/tests/gamification.test.js`.

### Phase 06: Performance Analytics API
- **Deliverables:** Asynchronous `QuizSession` document recording (`userId`, `accuracy`, `avgSpeedPerQ`, `ratingsAfter`, `completedAt`), per-skill 0-100 mastery scoring, and 30-day historical trend aggregations.
- **Endpoints:** `GET /api/analytics/progress`, `GET /api/analytics/history`.
- **Key Files:** `api/src/routes/analytics.js`, `api/models/QuizSession.js`, `api/tests/analytics.test.js`.

### Phase 07: React Native Mobile Client (Expo SDK 52)
- **Deliverables:** Complete Expo managed application featuring:
  - **Design System & Tokens (`client/theme.js` & `client/src/theme.ts`):** 20px border-radius, Cyan/Teal primary accent (`#00C4B4`), light/dark support, and Duolingo bounce spring tokens (`stiffness: 300, damping: 15`).
  - **Home Hub (`client/src/app/(tabs)/index.tsx`):** Tech Boost header, mascot robot, 60% goal ring, 2x2 skill module cards, and vertical path connector track.
  - **Interactive Skill Paths (`client/src/components/SkillPaths.tsx`):** Node press spring scale (`scale: 0.95 -> 1.0`) and 800ms smooth SVG bezier path line drawing on node unlock.
  - **Quiz Feedback Banner (`client/src/components/QuizFeedback.tsx`):** Bottom banner with translateY slide-up, simultaneous SPRINTY robot jump animation, button press lock (`isDismissing`), rapid slide-right dismissal, and horizontal question fade-in (`translateX: 80 -> 0`).
  - **Leagues / Leaderboard (`client/src/app/(tabs)/leaderboard.tsx`):** Titan League lavender hero banner with 3D diamond badge and highlighted user rank card.
  - **Reviews & Stats Dashboard (`client/src/app/(tabs)/dashboard.tsx`):** Profile card, 3-metric summary, weekly bar chart, topics to strengthen, and 30-day skill trend line charts.

---

## 4. Key Design & Animation Contract

```json
{
  "THEME": {
    "PRIMARY": "#00C4B4",
    "backgroundLight": "#EDF2F7",
    "cardBackground": "#FFFFFF"
  },
  "SHAPES": {
    "borderRadius": "20px"
  },
  "ANIMATION_CURVE": {
    "customEase": "cubic-bezier(0.175, 0.885, 0.320, 1.275)",
    "duolingoSpring": {
      "stiffness": 300,
      "damping": 15
    }
  },
  "PERFORMANCE": {
    "gpuAcceleratedOnly": ["transform", "opacity"],
    "prohibitedAnimations": ["width", "height", "margin"]
  }
}
```

---

## 5. Primary API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/me` | Fetches current user profile, active streak, and total XP |
| `GET` | `/api/sprint?type=quick\|standard\|deep` | Fetches personalized questions based on user ELO ratings |
| `POST` | `/api/sprint/submit` | Submits sprint responses, triggers ELO math, awards XP & updates streak |
| `GET` | `/api/leaderboard` | Returns current weekly league standings from Redis Sorted Sets |
| `GET` | `/api/analytics/progress` | Returns per-skill ELO and normalized 0–100 mastery scores |
| `GET` | `/api/analytics/history` | Returns 30-day historical trend data (accuracy, rating, speed) |

---

## 6. Commands & Verification Guide

### Local Development Startup
```bash
# Start all microservices, MongoDB, and Redis via Docker Compose
docker compose up -d

# Run mobile Expo dev client
cd client
npm start
```

### Running Test Suites
```bash
# Node.js API Unit & Integration Tests
npx jest api/tests/gamification.test.js
npx jest api/tests/analytics.test.js

# Python Engine Unit Tests
cd engine
pytest
```
