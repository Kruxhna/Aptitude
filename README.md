Here's a production-ready `README.md` tailored for your project. It balances technical depth with recruiter-friendly storytelling:

```markdown
# 🚀 GATE Aptitude Trainer

> A gamified, adaptive testing platform for GATE exam preparation — built with the engagement DNA of Duolingo and the precision of an ELO-driven adaptive engine.

[![Expo SDK 52](https://img.shields.io/badge/Expo-SDK%2052-000020?logo=expo)](https://expo.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Node.js](https://img.shields.io/badge/Node.js-22%20LTS-339933?logo=nodedotjs)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?logo=mongodb)](https://mongodb.com)
[![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?logo=redis)](https://redis.io)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ✨ Why This Exists

GATE aptitude prep is broken. Students either drown in static question banks or get bored by one-size-fits-all mock tests. This platform keeps every student in their **optimal learning sweet spot** through:

- ⚡ **Adaptive ELO Engine** — Per-skill difficulty that evolves with you (Verbal, Quantitative, Logical, Spatial)
- 🎯 **Daily Sprints** — Quick 5m, Standard 10m, or Deep 15m sessions that fit your schedule
- 🔥 **Streak Mechanics** — UTC midnight streak tracking with freeze protection
- 🏆 **Real-time Leaderboards** — Weekly league competitions via Redis Sorted Sets
- 🤖 **SPRINTY** — Your robot mascot companion with emotional states and unlockable costumes

---

## 🏗️ Architecture

```mermaid
flowchart TB
    subgraph Client[" "]
        A["📱 React Native Client<br/>Expo SDK 52 · Expo Router · Reanimated"]
    end

    A -->|"HTTP / REST"| B

    subgraph Gateway[" "]
        B["⚡ Node.js API Gateway<br/>Express 5.x · Port 3000 · Zod Validation"]
    end

    B -->|"Async HTTP"| C
    B -->|"Redis + Mongo"| D
    B -->|"Redis + Mongo"| E

    subgraph Backend[" "]
        C["🐍 Python Adaptive Engine<br/>FastAPI · ELO Math (K=32) · NumPy"]
        D["🔴 Redis Cache & Leaderboards<br/>Sorted Sets · Weekly Ranks · Real-time"]
        E["🍃 MongoDB Primary Database<br/>Questions · User Profiles · Sessions"]
    end

    C -.->|"cache"| D
    E -.->|"cache"| D

    style A fill:#00C4B420,stroke:#00C4B4,stroke-width:2px,color:#fff
    style B fill:#58a6ff20,stroke:#58a6ff,stroke-width:2px,color:#fff
    style C fill:#f0883e20,stroke:#f0883e,stroke-width:2px,color:#fff
    style D fill:#dc382d20,stroke:#dc382d,stroke-width:2px,color:#fff
    style E fill:#47a24820,stroke:#47a248,stroke-width:2px,color:#fff

### Tech Stack

| Layer | Technology | Key Packages |
|-------|-----------|--------------|
| **Mobile Client** | React Native (Expo SDK 52) | `expo-router`, `react-native-reanimated`, `react-native-svg`, `zustand` |
| **API Gateway** | Node.js 22 LTS + Express 5.x | `mongoose`, `ioredis`, `axios`, `zod`, `bullmq` |
| **Adaptive Engine** | Python 3.12 + FastAPI 0.115+ | `pydantic`, `numpy` |
| **Database** | MongoDB 7.x | Questions, user profiles, ELO ratings, session history |
| **Cache & Real-time** | Redis 7.x | Sorted Sets (`ZADD`/`ZREVRANGE`) for weekly leaderboards |
| **Containerization** | Docker Compose v2.x | Orchestrates all services |

---

## 🎮 Core Features

### Adaptive ELO System
- **K-factor:** 32 per skill category
- **Normalization:** Linear mapping to 0–100 mastery scale
- **Speed Bonus:** 1.0x–1.5x XP multiplier for answers under 30s par time
- **Microservice:** Dedicated FastAPI engine for rating calculations

### Gamification
- 🔥 **Streak Tracking** — UTC midnight resets with automatic 1-day freeze protection
- ⚡ **XP Multipliers** — Speed-based bonus rewards
- 🏅 **Weekly Leagues** — Bronze → Silver → Gold → Diamond → Titan progression
- 🎨 **SPRINTY Mascot** — Emotional state animations (happy, sad, worried, sleeping)

### Daily Sprints
| Type | Duration | Questions | Best For |
|------|----------|-----------|----------|
| Quick | 5 min | 5 | Morning warm-up |
| Standard | 10 min | 10 | Daily practice |
| Deep | 15 min | 15 | Weekend focus |

### Question Types
- **MCQ** — Multiple choice with immediate per-option feedback
- **Numerical** — Integer/float input with tolerance checking
- **Visual Pattern** — Spatial reasoning with SVG pattern recognition

---

## 🚀 Getting Started

### Prerequisites
- Node.js 22 LTS
- Python 3.12+
- Docker & Docker Compose
- Expo Go app (iOS/Android) or simulator

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/gate-aptitude-trainer.git
cd gate-aptitude-trainer
```

### 2. Start Infrastructure
```bash
docker compose up -d
# Spins up MongoDB (27017) and Redis (6379)
```

### 3. Seed Questions
```bash
cd api
npm install
npm run seed
# Generates GATE aptitude questions across 4 categories using LLM prompts
```

### 4. Start API Gateway
```bash
npm run dev
# Runs on http://localhost:3000
```

### 5. Start Python Engine
```bash
cd ../engine
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 6. Start Mobile Client
```bash
cd ../client
npm install
npx expo start
# Scan QR code with Expo Go or press 'i' / 'a' for simulator
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users/me` | Current user profile, streak, total XP |
| `GET` | `/api/sprint?type=quick\|standard\|deep` | Personalized questions by ELO |
| `POST` | `/api/sprint/submit` | Submit answers, trigger ELO + XP |
| `GET` | `/api/leaderboard` | Weekly league standings |
| `GET` | `/api/analytics/progress` | Per-skill mastery (0–100) |
| `GET` | `/api/analytics/history` | 30-day trend data |
| `POST` | `/engine/calculate-elo` | ELO delta calculation |
| `POST` | `/engine/normalize-scores` | Rating normalization |

---

## 🌿 Branch Strategy

We use **feature-branch workflow** with domain prefixes for clarity:

```bash
# Foundation & Core
feature/onboarding-placement-test
arch/offline-cache-zustand
arch/async-elo-queue

# Quiz & Learning Loop
feature/learn-mode-hints
ui/quiz-feedback-haptics
ui/sound-design
feature/spaced-repetition-decay

# Visual Polish
ui/skill-path-branching
ui/sprinty-mascot-states
ui/accessibility-a11y

# Gamification
feature/currency-economy
feature/achievements-badges
feature/league-progression

# Social
feature/social-battles
feature/push-notifications

# Analytics
ui/dashboard-analytics-polish
```

**Workflow:**
1. Branch from `develop`
2. Open PR against `develop`
3. Squash-merge after review
4. `main` is production-only

---

## 🧪 Testing

```bash
# API Tests
npx jest api/tests/gamification.test.js
npx jest api/tests/analytics.test.js

# Python Engine Tests
cd engine
pytest

# E2E (Client)
cd client
npm run test
```

---

## 🎨 Design Tokens

```json
{
  "theme": {
    "primary": "#00C4B4",
    "backgroundLight": "#EDF2F7",
    "cardBackground": "#FFFFFF"
  },
  "shapes": {
    "borderRadius": "20px"
  },
  "animation": {
    "spring": "cubic-bezier(0.175, 0.885, 0.320, 1.275)",
    "stiffness": 300,
    "damping": 15
  }
}
```

---

## 🗺️ Roadmap

- [x] Monorepo scaffolding & Docker setup
- [x] Python ELO engine
- [x] Batch question generation pipeline
- [x] Daily sprint API
- [x] Gamification (XP, streaks, leaderboards)
- [x] React Native client (Expo 52)
- [ ] Onboarding & placement test
- [ ] Offline-first question cache
- [ ] Haptics & sound design
- [ ] Spaced repetition skill decay
- [ ] Social battles & friend leaderboards
- [ ] Push notifications
- [ ] Achievement system
- [ ] SPRINTY costume unlocks

---

## 🤝 Contributing

1. Check existing issues or open a new one
2. Branch from `develop` using our naming convention
3. Write tests for new features
4. Ensure `npm run lint` and `pytest` pass
5. Open a PR with screenshots/GIFs for UI changes

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with 💚 for GATE aspirants everywhere.<br>
  <em>"Consistency beats intensity. Sprint daily."</em>
</p>
