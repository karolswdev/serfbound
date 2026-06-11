# Evidence — SB-30-04 — Gamification Gate

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `tests/browser/gamification-gate.spec.ts` — the full loop in CI
  against real spawned services: rated match → the rating change on
  the leaderboard (1516, own row) → both chronicles record the match
  → ENVOY, RATED, and VICTOR unlock along the way → the privacy
  sweep: `indexedDB.databases()` equals exactly the recorded set
  (`serfbound-imported-data`, `serfbound-local-game-saves`,
  `serfbound-profile`) — nothing new appeared under gamification.
- `packages/app/src/main.ts` + `styles.css` — the ghost guard (a
  gate finding, below): a nameless challenge renders as an
  unclaimable card, never offered for pairing.

## Verification artifacts

```
gamification-gate.spec (CI, in-process services): 1 passed (26.0s)
public-backbone run (the same loop, api=https://api.serfbound.com,
  pristine stores): 1 passed (54.3s)
  ALICE POST accounts body name: ALICE
  ALICE POST challenges body: {... "name":"ALICE" ...}
npm run ci:release -> exit=0 (captured directly)
```

The zero-network accountless regression remains continuously proven
by `profile-chronicle.spec` (requests to the online origin counted:
zero) and the outage spec; the identity schema contract by the
service suites — all inside the same green gate.

**The gate earned its keep — a real field finding.** The first
public runs failed: the production lobby held a challenge with a
NULL challenger name (origin: an earlier half-failed run; the
mailbox accepts nameless challenges since the challenge signature
covers terms, not the name), and the spec's accept click paired BOB
against a ghost while ALICE's discovery correctly found nothing.
Diagnosed by reading the production store directly; reproduced
shape recorded; the run on a pristine store passed cleanly with
correct names on the wire. Hardenings: the client ghost guard
shipped here; server-side rejection of nameless challenges is
recorded as a stop-and-decide alongside the lobby keyId field
(service changes travel together, deliberately). Production stores
wiped pristine after all runs (`{"ladder":[]}` verified).

## Acceptance criteria — re-checked

- [x] The full-loop e2e passes in CI against in-process services and
  was additionally recorded against the deployed URL (54.3s pass,
  request bodies logged).
- [x] The privacy regression sweep is green: schema contract suites
  unchanged and green, zero network in accountless mode (counted),
  local stores enumerated and matching the recorded list exactly.
- [x] Exit criteria 1–3 re-verified by the gate run itself: the
  ladder rendered the rating change (1), both chronicles recorded
  the match (2), and three deeds unlocked from the loop (3).

## Deviations from plan

- The public-run screenshot was lost to an instrumentation rewrite;
  the recorded console output and the CI-run artifacts stand as the
  evidence, with SB-30-01's ladder capture as the visual.
- The ghost guard slightly exceeds the gate's prove-don't-add scope —
  it neutralizes the gate's own finding and is recorded here.

## Follow-ups

- Stop-and-decide (service pair): reject nameless challenges
  server-side + add the challenger keyId to the lobby payload.
- The intermittent origin of the nameless POST was not reproduced
  under logging — watch for recurrence; the guard makes it harmless.
