---
phase: 6
slug: performance-analytics-api
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-23
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest (API unit + integration) |
| **Config file** | none |
| **Quick run command** | `npx jest api/tests/analytics.test.js` |
| **Full suite command** | `node api/src/scripts/test-integration.js` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest api/tests/analytics.test.js`
- **After every plan wave:** Run `node api/src/scripts/test-integration.js`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | ANLT-01 | — | N/A | unit | `npx jest api/tests/analytics.test.js` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | ANLT-02 | — | N/A | unit | `npx jest api/tests/analytics.test.js` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | ANLT-01, ANLT-02 | — | N/A | integration | `node api/src/scripts/test-integration.js` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `api/tests/analytics.test.js` — stubs for ANLT-01, ANLT-02

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| QuizSession saved to MongoDB | D-46 | Requires live DB connection | Submit sprint, then query MongoDB for QuizSession doc |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
