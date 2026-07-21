# Phase 4: Daily Sprint API - Verification

## Target
Verify the sprint flow works correctly.

## Verification Steps
1. **[TEST]** Send `GET /api/sprint`. Ensure `sprintId` is returned and stored in Redis.
2. **[TEST]** Send `POST /api/sprint/submit` with valid answers and `sprintId`. Check response for accuracy, total XP, and rating deltas.
3. **[TEST]** Send `POST /api/sprint/submit` again with the same `sprintId`. Verify it fails with 409 Conflict.

status: pass
