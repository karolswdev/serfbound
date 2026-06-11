# Evidence — SB-25-03 — Challenges and the Turn Mailbox

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `services/mailbox/server.mjs` — the correspondence post office:
  signed challenges with validated match terms (seed, map, supplies,
  window length, pickup deadline; `pickupSeconds: 0` = no clock), the
  open-challenge lobby, signed acceptance creating the match, signed
  window-move posting with whose-turn and window-sequence enforcement,
  lazily-evaluated pickup deadlines with forfeit (no server-side
  clocks), per-player match listings by key fingerprint ("your turn"),
  and the wire pinned to moves-and-checksums-only (structural
  validation + a size cap). Zero dependencies, JSON-file storage,
  self-hostable; deployment is the maintainer's activation step.
- `packages/app/src/mailbox-client.ts` — create/list/accept challenges,
  fetch matches, post signed moves, list a player's matches; recoverable
  service errors; signing shared with the identity client.
- Tests: `tests/ci/service-mailbox.test.mjs`.

## Verification artifacts

```text
npm run test:unit -> # tests 219 / pass 219 / fail 0
npm run test:browser -> 13 passed (1.2m)
boundaries / independence / docs -> all ok
node --test tests/ci/service-mailbox.test.mjs ->
  ok 1 - a real correspondence match plays through the mailbox
  ok 2 - out-of-turn and wrongly-signed moves reject
  ok 3 - a missed pickup deadline forfeits the match
```

- The headline fixture is the real thing end to end: Alice challenges
  with terms, Bob finds it in the lobby and accepts, both build the
  deterministic game from the terms, Alice's window 0 (castle founding)
  posts signed and Bob's client **re-verifies it by re-simulation** on
  fetch, Bob's window 1 comes back the same way, both checksums agree
  exactly, and the listing shows Alice it is her turn again.
- Bob cannot post Alice's window (signature enforcement); fabricated
  window indices reject as out-of-turn.
- A 1-second pickup deadline forfeits the challenger who never moved;
  posting into a forfeited match rejects with the match state attached.

## Deviations from plan

- The shell's challenge/turn UI (service URL configuration, sign-in
  button, lobby list, "your turn" badge with the countdown) lands with
  SB-25-04's gate surface — this story proves every flow against the
  real service from the client library the shell will call. Recorded
  against the acceptance wording ("the shell surfaces whose turn it
  is": the listing carries `nextPlayer`/`nextDeadlineIso`/`yourSeat`
  ready for it).
- Turn notifications are the listing on open (per scope); push/email
  remain a recorded separate decision.
- The mailbox is identity-decoupled by design: challenges carry public
  keys directly, so accountless players can still be challenged by key
  — account linkage adds discoverability, not permission.

## Follow-ups

- SB-25-04: the ladder, the ops posture, and the shell surface close
  the phase.
