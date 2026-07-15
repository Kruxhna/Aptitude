# Plan 02B: Wire Endpoints, Update API Client & ELO Simulator

**Phase:** 02 — Adaptive Engine
**Wave:** 2 (depends on 02A)
**Objective:** Replace stub endpoints with real ELO logic, update the Node.js API client to send enriched data, and create the ELO simulator for validation.
**Requirements:** ADPT-01, ADPT-02, ADPT-03, ADPT-04

## Tasks

### 02B-T1: Wire /calculate-next endpoint
**What:** Replace the stub in `engine/app/main.py` with real logic:
1. Initialize MongoDB connection on app startup
2. Call `question_selector.select_questions()` with user skill ratings
3. Return the list of question IDs

**Files:**
- `engine/app/main.py` — Replace `/calculate-next` stub with real implementation

### 02B-T2: Wire /update-rating endpoint
**What:** Replace the stub in `engine/app/main.py` with real logic:
1. Call `elo.update_ratings()` with the enriched response data
2. Return updated ratings per skill and XP earned (placeholder XP for now — full XP logic is Phase 5)

**Files:**
- `engine/app/main.py` — Replace `/update-rating` stub with real implementation

### 02B-T3: Update Node.js API to enrich responses before calling engine
**What:** Update `api/src/routes/sprint.js` POST handler to:
1. Look up each submitted question by ID from MongoDB
2. Enrich each response with `skill` and `questionDifficulty` before calling the engine
3. Update the engine client call with the enriched payload

**Files:**
- `api/src/routes/sprint.js` — Enrich responses with skill/difficulty data

### 02B-T4: Create ELO simulator script
**What:** Create `engine/scripts/elo_simulator.py` that:
1. Simulates a user with true skill levels across 4 categories
2. Runs 1000 virtual sessions, each with 10 questions
3. Uses the actual `elo.py` functions for rating calculation
4. Outputs final ratings vs true skill, convergence data, and a pass/fail result
5. Pass criterion: final rating within ±50 of true skill for all categories

Run with: `python engine/scripts/elo_simulator.py`

**Files:**
- `engine/scripts/elo_simulator.py` — [NEW] ELO validation simulator

## must_haves
- [ ] `/calculate-next` returns real difficulty-matched question IDs from MongoDB
- [ ] `/update-rating` computes real ELO rating changes
- [ ] ELO ratings update correctly after a simulated quiz (correctness + speed factored in)
- [ ] Node.js API enriches responses with skill and difficulty before calling engine
- [ ] ELO simulator validates rating stability over 1000 sessions
- [ ] Response shape remains backward-compatible with `engineClient.js`

## Artifacts this plan produces
- `engine/app/main.py` — Fully working endpoints
- `api/src/routes/sprint.js` — Updated with response enrichment
- `engine/scripts/elo_simulator.py` — ELO validation script
