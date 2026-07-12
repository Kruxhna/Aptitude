# Pitfalls Research: GATE Aptitude Trainer

## Critical Pitfalls

### 1. ELO Cold Start Problem
**Risk:** New users and new questions have no history — initial ratings are random guesses.
**Warning signs:** New users get wildly inappropriate difficulty; ratings swing 200+ points per session.
**Prevention:**
- Initialize user ratings at 1000 (mid-range) for all skills
- Use a higher K-factor (K=40) for first 10 sessions, then decay to K=20
- Tag questions with estimated difficulty during generation; use as initial ELO seed
- **Phase:** Should be addressed in Phase 2 (Adaptive Engine)

### 2. ELO Rating Inflation/Deflation
**Risk:** Over time, ratings drift upward or downward system-wide, making difficulty matching meaningless.
**Warning signs:** Average user rating climbs steadily; all users converge to similar ratings.
**Prevention:**
- ELO is zero-sum in chess but NOT in student-vs-question (questions don't "lose" the same way). Treat question ratings as static anchors initially.
- Run a simulator with 1000 virtual sessions before launch to verify stability
- Monitor average rating drift per skill weekly
- **Phase:** Simulator should be part of Phase 2 verification

### 3. Cross-Skill Rating Incomparability
**Risk:** A 1200 in Verbal means something entirely different from 1200 in Spatial because the question pools are independent.
**Warning signs:** Users see "1200 Verbal, 1200 Spatial" and assume equal skill when they're not.
**Prevention:**
- Normalize displayed ratings to a 1-100 scale per skill (percentile-based)
- Internal ELO can be any range; user-facing display should be normalized
- **Phase:** Phase 5 (Performance Analytics)

### 4. Question Generation Quality
**Risk:** LLM-generated questions may have incorrect answers, ambiguous wording, or inconsistent difficulty.
**Warning signs:** User reports spike; ELO system can't stabilize because question difficulty tags are wrong.
**Prevention:**
- Template validator must check: answer correctness (for math), option distinctness (no duplicates), formatting
- Human review pipeline for initial batch (flag low-confidence generations)
- Track per-question accuracy rates — if 95%+ or <10% get it right, the difficulty tag is wrong
- **Phase:** Phase 3 (Question Generation) — build validation into the pipeline

### 5. Sprint Fatigue / "Grind Trap"
**Risk:** Users feel like they're grinding without progress; daily habit becomes chore not challenge.
**Warning signs:** Completion rate drops after week 2; users do minimum questions per day.
**Prevention:**
- Balance challenge with "easy wins" — don't always push maximum difficulty
- Show progress clearly (not just numbers — "You improved 15% in Verbal this week")
- Streak freeze prevents punishment for occasional misses
- **Phase:** Phase 4 (Gamification) — XP curve and difficulty balance

### 6. MongoDB Query Performance with Growing Question Bank
**Risk:** As questions grow to 10K+, unindexed queries for "questions matching difficulty X in skill Y" become slow.
**Warning signs:** Sprint load time exceeds 2 seconds; API p99 latency spikes.
**Prevention:**
- Compound index on `{ skill: 1, difficulty: 1, active: 1 }` from day one
- Question selection query should use `$gte/$lte` on difficulty range, not exact match
- Cache "question pools" in Redis for frequently-requested difficulty bands
- **Phase:** Phase 1 (Database Schema) — add indexes at schema definition time

### 7. Redis as Single Point of Failure for Gamification
**Risk:** If Redis goes down, XP/streaks/leaderboard are lost. Users see zero XP.
**Warning signs:** Redis OOM or eviction; streaks disappear.
**Prevention:**
- Enable Redis persistence (RDB snapshots + AOF append-only file)
- Periodic sync: write XP totals and streak data back to MongoDB on sprint completion (Redis is cache, MongoDB is source of truth)
- On Redis restart, rehydrate from MongoDB
- **Phase:** Phase 4 (Gamification) — implement sync-back pattern

### 8. Docker Compose Networking Issues
**Risk:** Services can't find each other; `engine:8000` doesn't resolve; port conflicts.
**Warning signs:** `ECONNREFUSED` errors in Node.js logs; FastAPI health check fails.
**Prevention:**
- Use explicit Docker Compose service names and internal network
- Health checks on all services (`/health` endpoint)
- `depends_on` with `condition: service_healthy` (not just `service_started`)
- **Phase:** Phase 1 (Scaffolding) — configure properly from the start

## Pitfall Priority Matrix

| Pitfall | Severity | Likelihood | When to Address |
|---------|----------|------------|----------------|
| ELO Cold Start | High | Certain | Phase 2 |
| Question Quality | High | High | Phase 3 |
| MongoDB Indexes | Medium | High | Phase 1 |
| Docker Networking | Medium | Medium | Phase 1 |
| Redis SPOF | Medium | Medium | Phase 4 |
| Rating Inflation | Medium | Medium | Phase 2 (simulator) |
| Cross-Skill Comparison | Low | Low | Phase 5 |
| Sprint Fatigue | Medium | Medium | Phase 4 |

---
*Researched: 2026-07-12*
