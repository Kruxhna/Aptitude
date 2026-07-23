# Phase 5: Gamification System - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-23
**Phase:** 5-Gamification System
**Areas discussed:** Streak Definition, Redis/Mongo Sync, Leaderboard Scope

---

## Streak Definition

| Option | Description | Selected |
|--------|-------------|----------|
| Strict UTC midnight | easiest to implement, global reset for everyone | ✓ |
| User's local timezone | better UX, but requires client to send timezone and server to calculate localized rollovers | |

**User's choice:** Strict UTC midnight (easiest to implement, global reset for everyone)
**Notes:** None

---

## Redis/Mongo Sync

| Option | Description | Selected |
|--------|-------------|----------|
| Write-through | Update Redis and MongoDB simultaneously on every sprint completion (safest, but slower API response). | |
| Lazy sync | Read from Redis, write to Redis, and only sync to Mongo via a background cron job (e.g., hourly). (faster API response, but risks data loss on Redis crash). | |
| Fire-and-forget | API updates Redis, then sends async message to engine or a worker to update Mongo (best of both, but more complex). | ✓ |

**User's choice:** Fire-and-forget: API updates Redis, then sends async message to engine or a worker to update Mongo (best of both, but more complex).
**Notes:** None

---

## Leaderboard Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Top 50 Global | Everyone competes on a single global leaderboard. (Simple, but discouraging for new players). | |
| Surrounding Users | Show the user's rank +/- 10 players. (Encouraging, but requires calculating rank across entire userbase dynamically). | |
| Static Leagues/Groups | Assign users to groups of 50 randomly each week. (Good balance, standard gamification approach). | ✓ |

**User's choice:** Static Leagues/Groups: Assign users to groups of 50 randomly each week. (Good balance, standard gamification approach).
**Notes:** None

---

## the agent's Discretion

None

## Deferred Ideas

None
