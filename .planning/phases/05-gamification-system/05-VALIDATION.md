---
phase: 5
slug: gamification-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-23
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest (API) / pytest (Engine) |
| **Config file** | none |
| **Quick run command** | `npm test` / `pytest` |
| **Full suite command** | `node api/src/scripts/test-integration.js` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test` or `pytest`
- **After every plan wave:** Run `node api/src/scripts/test-integration.js`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | GAME-01 | — | N/A | unit | `pytest` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | GAME-02 | — | N/A | unit | `npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `engine/tests/test_gamification.py` — stubs for GAME-01
- [ ] `api/tests/gamification.test.js` — stubs for GAME-02

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Leaderboard Sync | GAME-04 | Redis/Mongo background sync | Check DB manually after sprint completion |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
