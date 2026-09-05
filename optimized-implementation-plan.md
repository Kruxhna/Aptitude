# Quiz App — Optimized Implementation Plan

## What changed, and why (read first)

1. **Async infra moved to Phase 0.** BullMQ/Redis/rate-limiting was originally Phase 4, but Phase 2 (achievements) and Phase 3 (notifications) both implicitly depend on it. Building the infra first means those features get written once, correctly, instead of being rewritten when the queue arrives.
2. **Gem economy made transactional, not a raw counter.** A bare `Number` field with direct mutation invites race conditions on concurrent purchases and gives you no audit trail for disputes.
3. **One real-time transport, not two.** SSE is dropped — it's one-directional and battles need the client to submit answers in the same exchange. WebSocket everywhere.
4. **Push notifications split into local vs. remote.** Only "Streak Preservation" can be a purely on-device scheduled notification. "League Relegation" and "Decayed Skill" depend on server state and need push-token registration + a server-side sender — this was an unaddressed gap in the original plan.
5. **Decay formula's missing piece defined**, and the compute model changed from an implied batch job to lazy-on-read plus a lightweight scheduled scan (reused for the notification trigger).
6. **Idempotency and anti-cheat called out** where they were silently absent: shop purchases, matchmaking races, client-reported battle timing, locally cached correct answers.

---

## Phase 0 (new): Core Async & Rate-Limiting Infrastructure
*Pulled forward from the original Phase 4 — everything else in Phases 2–3 leans on it.*

`api/src/config/queue.js`
- Stand up BullMQ + Redis before any feature writes to it.
- Define one generic job contract now — `{ type, payload, idempotencyKey }` — so achievement evaluation, decay scans, notification sends, and sprint evaluation all share worker plumbing instead of each phase inventing its own.
- Apply `express-rate-limit` (Redis store) to **all** mutating endpoints — shop and battles included, not just sprint submission. Purchase retries are exactly the failure mode rate-limiting and idempotency exist for.

**Why this has to come first:** if achievement hooks are written as synchronous code inside the submit handler (the original Phase 2 scoping) and sprint submission moves to a queue in Phase 4, that's a rewrite. Writing hooks against the worker interface from day one avoids it.

---

## Phase 1: Dual Economy & Learn/Sprint Mode

**Gem economy — made transactional.** Original: `gems: { type: Number, default: 100 }`, mutated directly. Problems: concurrent `buy-item` calls can race past a balance check (double-spend), there's no audit trail, and retries (network blips, later, queued jobs) can double-charge.
- Atomic `findOneAndUpdate` with `gems: { $gte: cost }` + `$inc: { gems: -cost }` — reject on no match, don't check-then-write.
- A minimal `GemTransaction` log (`userId, delta, reason, refId, createdAt`). Every gem change — purchase, achievement, battle win — writes one row. You'll want this the first time a balance is disputed.
- Require an `Idempotency-Key` header on `buy-item` / `activate-boost`; store recent keys in Redis with a short TTL so retries are no-ops.

**Inventory — generalize the shape.** The fixed `{ streakFreezes, doubleXpTokens, hintTokens }` object bakes every future item into a schema migration. Prefer `inventory: [{ itemId, quantity }]`, with item definitions (cost, effect) living in config, not the schema.

**`activeBoosts` — define the stacking behavior.** The spec doesn't say what happens if a user activates Double XP while one is already running. Add a check: reject, or extend `expiresAt` — pick one, don't leave it implicit.

**Learn vs. Sprint — config object, not branching.** Replace scattered `if (mode === 'learn')` checks with a single `SPRINT_MODE_CONFIG` map consumed by the component, so mode behavior is data. Also: Learn Mode shouldn't just suppress the ELO *penalty* on error — it shouldn't call the ELO service at all, so Learn attempts never touch rating history.

---

## Phase 2: Achievements & Spaced Repetition Decay

**Achievement engine — async from day one.** Write evaluation as pure functions `(sessionResult) => Achievement[]`, invoked from a Phase 0 BullMQ worker rather than inline in `POST /api/sprint/submit`. This is the exact piece the original ordering would have forced a rewrite of.

**Night Owl / timezone handling.** "11 PM–2 AM local time" taken from a client string is spoofable — trivially unlocks the badge. Fix: store the user's IANA timezone once (captured from device settings), evaluate server-side against `UTC timestamp + stored tz`.

**Decay — the formula was incomplete.** $R = e^{-\Delta t / S}$ is given, but $S$ ("stability derived from prior accuracy") is never defined — that's the actual algorithm. Minimal concrete version:
```
S = BASE_STABILITY * (1 + accuracyBonus)
accuracyBonus = clamp((historicalAccuracy - 0.5) * 2, -0.5, 1.5)
```
Tune `BASE_STABILITY` per topic difficulty empirically.

**Decay — fix the compute model.** Don't nightly-scan every node for every user; most aren't looked at daily and it's wasted work at scale.
- **Lazy**: compute $R$ on read, when the path view opens.
- **Scheduled** (Phase 0's repeatable jobs): a lightweight daily scan *only* to fire the "Decayed Skill Prompt" notification — since that one genuinely needs to be proactive rather than read-triggered.

This also resolves a real gap in the original Phase 3: "triggered when a node decays" has nothing to trigger it without a scheduled check.

---

## Phase 3: Notifications & Path UX

**Split local vs. remote push — this was missing.** The original treats all three notification types as one `expo-notifications` integration; they aren't the same thing:

| Notification | Trigger source | Mechanism |
|---|---|---|
| Streak Preservation | Known entirely on-device | **Local** scheduled notification |
| League Relegation | Server-side standings | **Remote** push — needs a push-token registration endpoint + server-side Expo Push API call, driven by a Sunday-evening scheduled job |
| Decayed Skill Prompt | Server-side decay state | **Remote** push, driven by the daily decay scan above |

Add the missing endpoint: `POST /api/notifications/register-token` to store each device's Expo push token, plus a small server-side sender module the BullMQ workers call into.

**Scroll-snapping path view.** `FlatList` + `snapToInterval` + `getItemLayout` + `initialScrollIndex` is the right approach — keep it. Add `initialNumToRender` tuned to viewport height, and a `viewabilityConfig` callback if the "active node" pulse should track manual scrolling, not just launch position.

---

## Phase 4: Local Question Caching & Offline Sprint
*(Narrowed from the original "Async Processing" phase — that infra is now Phase 0; this is just the caching piece.)*

- Keep the `expo-sqlite` prefetch buffer (50 questions, stale-while-revalidate).
- Add a content/schema version check so an app update or question-bank edit invalidates the local cache instead of serving stale questions.
- **Flag, don't silently ship:** caching correct answers locally makes them extractable on rooted/jailbroken devices. Probably acceptable for casual Learn mode; worth an explicit decision for ELO-ranked Sprint and Battles rather than an omission — keep authoritative correctness checking server-side even when the question came from cache, so a tampered local answer can't inflate rating.
- Since evaluation now goes through BullMQ (Phase 0), the client needs immediate right/wrong feedback without waiting on the queue. Cheapest fix: check against the cached question's answer for instant UI feedback; the async job stays the source of truth for XP/streak/rating, and any mismatch gets logged, not silently trusted.

---

## Phase 5: 1v1 Battles

**Matchmaking — fix the race and the starvation case.** Original: `LPUSH`/`RPOP` on a Redis list per ELO bracket.
- Two concurrent `RPOP` calls can each grab a user without atomically pairing them — pop both entries inside a Lua script or Redis transaction.
- A fixed ±100 bracket can starve users in sparse ELO ranges. Widen it the longer a user waits (±100 → ±250 → ±500 at 10s/20s/30s).
- Add a queue-entry TTL/heartbeat so a disconnected client doesn't sit in the pool indefinitely.

**Real-time transport — WebSocket, not "WebSocket or SSE."** SSE is server→client only; battles need the client submitting answers in the same real-time exchange. Commit to WebSocket (`socket.io` fits the rest of the stack) for both directions.

**Server-authoritative timing.** "Fastest aggregate time" must come from server-received timestamps, not client-reported elapsed time, or it's trivially gameable.

**Reuse the ELO service, in both directions.** The Phase 0 worker already calls the FastAPI ELO service for Sprint mode — reuse that function for battles instead of reimplementing rating math, and make sure **both** players' ratings move (the original only specifies the winner's boost).

**Missing: disconnect handling.** Define a forfeiture rule (e.g., 15s no-response = forfeit) and whether a reconnect grace period exists — unaddressed in the original.

---

## Net effect of the reordering

| Original | Optimized | Why |
|---|---|---|
| 1 → 2 → 3 → 4 → 5 | **0 (new)** → 1 → 2 → 3 → 4 → 5 | Async infra first so nothing downstream is rewritten |
| Achievements sync (P2), queue arrives later (P4) | Achievements built against the worker interface from the start | Avoids the rewrite |
| Notifications as one mechanism (P3) | Split local vs. remote, remote depends on Phase 0's scheduler | Closes an unaddressed dependency gap in the original |
