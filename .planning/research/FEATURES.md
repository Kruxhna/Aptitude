# Features Research: GATE Aptitude Trainer

## Feature Categories

### Table Stakes (Users expect these — must have for v1)

| Feature | Complexity | Description |
|---------|-----------|-------------|
| **Daily Quiz Sprint** | Medium | Configurable timed quiz session (quick/standard/deep) |
| **Question Variety** | Medium | MCQ, numerical input, image-based formats |
| **Per-Question Timer** | Low | Countdown timer per question, varies by skill category |
| **XP Rewards** | Low | Points awarded for correct answers, speed bonuses |
| **Daily Streak** | Low | Consecutive day tracking with visual counter |
| **Skill Categories** | Medium | Verbal, Quantitative, Logical, Spatial with independent tracking |
| **Performance Summary** | Medium | Post-sprint results showing accuracy, speed, XP earned |
| **Answer Review** | Low | After sprint, review each question with correct answer and explanation |
| **Progress Indicators** | Low | Per-skill level/rating visible to user |

### Differentiators (Competitive advantage)

| Feature | Complexity | Description |
|---------|-----------|-------------|
| **Adaptive Difficulty** | High | ELO-based per-skill difficulty adjustment |
| **Weekly Leaderboard** | Medium | Redis-backed real-time ranking with weekly reset |
| **Skill Performance Graphs** | Medium | Historical accuracy/speed trends per category |
| **Sprint Length Choice** | Low | User picks quick (5q) / standard (10q) / deep (15q) |
| **Hybrid Question Generation** | High | LLM + template pipeline for fresh question content |
| **Speed Bonus Multiplier** | Low | Extra XP for fast correct answers |
| **Streak Freeze** | Low | One free "missed day" protection (common in Duolingo/Elevate) |

### Anti-Features (Do NOT build)

| Feature | Reason |
|---------|--------|
| **Real-time multiplayer quizzes** | Massive complexity (WebSockets, matchmaking, sync) — not core value |
| **Social feed / comments** | Distraction from learning focus |
| **In-app purchases for power-ups** | Corrupts learning integrity |
| **AI tutor chat** | Scope creep — focus on quiz mechanics first |
| **Offline mode** | Requires complex sync logic — defer to v2+ |

## Feature Dependencies

```
Question Bank Schema → Question Generation Pipeline → Daily Sprint (needs questions)
                    ↓
Adaptive Engine ← User Performance Data ← Sprint Completion
                    ↓
Per-Skill ELO Ratings → Question Selection (difficulty matching)
                    ↓
XP/Streak System ← Sprint Completion → Leaderboard Updates
```

## GATE Aptitude-Specific Features

| Category | Sub-Skills | Question Considerations |
|----------|-----------|----------------------|
| **Verbal** | Grammar, vocabulary, reading comprehension | Text-heavy, longer time per question |
| **Quantitative** | Arithmetic, algebra, data interpretation | Needs numerical input format, math rendering |
| **Logical Reasoning** | Syllogisms, sequences, logical deduction | Pattern-based, medium complexity |
| **Spatial Aptitude** | Pattern recognition, figure series, mirror images | Image-heavy, requires pre-rendered images |

---
*Researched: 2026-07-12*
