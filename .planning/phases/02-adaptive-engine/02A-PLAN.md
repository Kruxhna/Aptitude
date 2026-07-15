# Plan 02A: ELO Core & MongoDB Integration

**Phase:** 02 — Adaptive Engine
**Wave:** 1
**Objective:** Implement the ELO calculation module, MongoDB connection via motor, and question selection algorithm inside the FastAPI engine.
**Requirements:** ADPT-01, ADPT-02, ADPT-04

## Tasks

### 02A-T1: Add motor dependency and MongoDB connection
**What:** Add `motor` to `requirements.txt`, create a `db.py` module in `engine/app/` that initializes the async MongoDB client using `MONGO_URI`.
**Files:**
- `engine/requirements.txt` — Add `motor>=3.6`
- `engine/app/db.py` — [NEW] Async MongoDB client singleton

### 02A-T2: Implement ELO calculation module
**What:** Create `engine/app/elo.py` with pure functions for:
- `expected_score(user_rating, question_difficulty)` — Standard ELO expected score
- `calculate_speed_factor(time_ms, skill, is_correct)` — Per-skill speed multiplier (D-14), only applied on correct answers
- `compute_k_factor(sessions_completed)` — Linear decay K=40→K=20 (D-15)
- `calculate_rating_change(user_rating, question_difficulty, is_correct, time_ms, skill, sessions_completed)` — Full ELO delta with speed adjustment
- `update_ratings(current_ratings, responses, sessions_completed)` — Batch update across multiple responses, returns new ratings per skill

All functions use NumPy where beneficial. Pure functions with no side effects for testability.

**Files:**
- `engine/app/elo.py` — [NEW] Core ELO calculation functions

### 02A-T3: Implement question selection service
**What:** Create `engine/app/question_selector.py` with:
- `select_questions(skill_ratings, question_count, db)` — For each skill, query MongoDB for active questions within the difficulty band (D-16), with adaptive widening (D-17). Distributes questions evenly across skills. Returns list of question ID strings.

**Files:**
- `engine/app/question_selector.py` — [NEW] Difficulty-band question selection

### 02A-T4: Update Pydantic models for enriched responses
**What:** Update `ResponseItem` in `engine/app/main.py` to include `skill` and `questionDifficulty` fields (needed for ELO calculation). Update `UpdateRatingRequest` response to include per-question rating deltas.

**Files:**
- `engine/app/main.py` — Update Pydantic models

## must_haves
- [ ] `elo.py` correctly computes ELO deltas with speed multiplier
- [ ] K-factor decays from 40 to 20 over 10 sessions
- [ ] Speed factor is clamped to [0.5, 1.5]
- [ ] Incorrect answers are NOT speed-adjusted
- [ ] MongoDB connection works via motor async driver
- [ ] Question selector uses adaptive band widening (±100 → ±300)

## Artifacts this plan produces
- `engine/app/db.py` — Async MongoDB connection
- `engine/app/elo.py` — Core ELO functions
- `engine/app/question_selector.py` — Question selection service
- `engine/app/main.py` — Updated Pydantic models
- `engine/requirements.txt` — Updated with motor
