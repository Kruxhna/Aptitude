# Phase 6: Performance Analytics API - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-23
**Phase:** 06-Performance Analytics API
**Areas discussed:** Rating Normalization, History Window & Granularity, Caching Strategy

---

## Rating Normalization

| Option | Description | Selected |
|--------|-------------|----------|
| Linear 800–1400 → 0–100 | Simple math, chart-friendly. Clamps at bounds. | ✓ |
| Level system | Map ELO to discrete levels (1–10). Motivating but less precise. | |
| Raw ELO | Return ELO directly. Let the client display it. | |

**User's choice:** Linear 800–1400 → 0–100 (recommended)
**Notes:** None

---

## History Window & Granularity

| Option | Description | Selected |
|--------|-------------|----------|
| 30 days fixed | Simple, matches success criteria. No user config. | ✓ |
| 7 / 30 / 90 days selectable | Query param ?range=. More flexible. | |
| All time | Full history. Could be slow. | |

**User's choice:** 30 days fixed (recommended)
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Daily aggregates | Group by UTC date, average accuracy/speed per skill. Smooth chart. | ✓ |
| Session-by-session | One dot per sprint. More detailed but noisy. | |

**User's choice:** Daily aggregates (recommended)
**Notes:** None

---

## Caching Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| No caching (live queries) | Simple. Fine for v1. QuizSession index is optimized. | ✓ |
| Redis cache with TTL | Fast repeat views but adds complexity. | |

**User's choice:** No caching — live MongoDB queries (recommended)
**Notes:** None

---

## the agent's Discretion

None

## Deferred Ideas

None
