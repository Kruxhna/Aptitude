# Phase 2: Adaptive Engine — Research

**Date:** 2026-07-15

## ELO Rating System

### Standard ELO Formula
The standard ELO formula calculates the expected score and actual score to determine rating change:

```
Expected Score: E = 1 / (1 + 10^((opponent_rating - player_rating) / 400))
Rating Change:  ΔR = K × (S - E)
```

Where:
- `S` = actual score (1 for correct, 0 for incorrect)
- `E` = expected score (probability of getting it right)
- `K` = sensitivity factor (how much a single result affects rating)

In our context: **player = user**, **opponent = question difficulty**.

### Speed Multiplier (D-13, D-14)
Applied ONLY to gains on correct answers:
```python
speed_factor = clamp(remaining_time / time_budget, 0.5, 1.5)
# Only applied when correct: ΔR = K × (1 - E) × speed_factor
# When incorrect: ΔR = K × (0 - E)  (no speed adjustment)
```

Per-skill time budgets:
| Skill | Budget (seconds) |
|-------|-----------------|
| Verbal | 45 |
| Quantitative | 60 |
| Logical | 90 |
| Spatial | 60 |

### K-Factor Decay (D-15)
```python
K = max(20, 40 - (2 * sessions_completed))
```
| Sessions | K |
|----------|---|
| 0 | 40 |
| 5 | 30 |
| 10+ | 20 |

## Question Selection Algorithm (D-16, D-17)

### Adaptive Band Widening
```
1. Start with band = ±100 ELO from user's skill rating
2. Query MongoDB: { skill, active: true, difficulty: [rating-band, rating+band] }
3. If count < requested_count:
   a. Widen band by 50 (band += 50)
   b. Repeat query
   c. Stop widening at band = 300
4. Random sample from results (up to requested_count)
5. Return question IDs
```

## MongoDB Integration (D-18)

### Motor Async Driver
The engine will use `motor` (async MongoDB driver for Python) to query the `questions` collection directly. This avoids an extra HTTP round-trip back to the API.

Connection string: `MONGO_URI` env var (already in docker-compose.yml).

### Query Pattern
```python
# Using motor with the existing MongoDB questions collection
db = motor_client.aptitude
questions = await db.questions.find({
    "skill": skill,
    "active": True,
    "difficulty": {"$gte": lower, "$lte": upper}
}).to_list(length=None)
```

## Data Flow (D-19)

### /calculate-next
```
API → POST /calculate-next { userId, skillRatings, questionCount }
Engine:
  1. For each skill, query MongoDB for questions in band
  2. Sample random subset
  3. Return { questionIds: [...] }
API → Fetch full question docs by IDs → Return to client
```

### /update-rating
```
API → POST /update-rating { userId, responses: [{questionId, correct, timeMs, skill, questionDifficulty}] }
Engine:
  1. For each response, compute ELO delta with speed multiplier
  2. Aggregate new ratings per skill
  3. Return { newRatings: {...}, xpEarned: N }
```

**Note:** The update-rating endpoint needs `skill` and `questionDifficulty` per response to compute ELO. The API must enrich responses with this data before calling the engine.

## ELO Simulator (Success Criterion #5)

A standalone script that:
1. Simulates a user answering questions across 1000 sessions
2. Simulates correct/incorrect with probability based on ELO difference
3. Tracks rating convergence
4. Validates: rating stabilizes around true skill level (no unbounded drift)

## Dependencies to Add
- `motor` — async MongoDB driver for Python (add to `engine/requirements.txt`)

## Risks
1. **Question pool exhaustion** — With only 20 seed questions, the adaptive widening will quickly hit ±300. This is expected for v1; Phase 3 generates 100+ questions per category.
2. **Request payload change** — `/update-rating` needs `skill` and `questionDifficulty` per response item, which the current Pydantic model doesn't include. Must update both engine models and API client.
