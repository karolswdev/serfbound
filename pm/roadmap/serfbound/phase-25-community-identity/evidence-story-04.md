# Evidence — SB-25-04 — Ladder and Operations Gate

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `services/mailbox/server.mjs` — dual-attested results: both seats
  sign the outcome (winner + final checksum — the receipt determinism
  already provides); agreement ends and rates the match (Elo, K=32,
  base 1500, no decay, no rewards); disagreement quarantines it as
  `disputed`, unrated; forfeits rate the player who showed up;
  `GET /ladder` returns ratings best-first; double-rating is
  impossible.
- `packages/app/src/mailbox-client.ts` — `submitResult` and
  `fetchLadder`.
- `services/README.md` — the operations runbook: running, storage,
  HTTPS-before-announcing, the exhaustive data inventory, and the
  honest abuse posture (collusion farming and smurfing recorded as
  undefended by design at these stakes; rate limiting recorded as the
  public-deployment checklist item).
- `docs/player-guide.md` — the online-correspondence section; docs
  gate passes.
- Tests: `tests/ci/service-ladder.test.mjs`.

## Verification artifacts

```text
npm run test:unit -> # tests 222 / pass 222 / fail 0
npm run test:browser -> 13 passed (1.2m)
docs / boundaries / independence -> all ok
node --test tests/ci/service-ladder.test.mjs ->
  ok 1 - a dual-attested result ends and rates the match
  ok 2 - disagreeing attestations quarantine the match unrated
  ok 3 - a forfeit rates the player who showed up
```

- The rated-match fixture is end-to-end real: a played mailbox match
  (signed moves, client re-verification) attested by both seats →
  ended, Elo 1516/1484, ladder sorted; a second rating attempt
  rejects.
- One seat claiming a different winner → `disputed`, nobody rated.
- A missed pickup rates the opponent automatically.

## Deviations from plan

- The shell's online surface (sign-in button, challenge lobby UI,
  your-turn badge, ladder display) is **deferred to a follow-up story
  recorded in the phase summary** — it requires a deployed service URL
  to mean anything to players, and deployment is the maintainer's
  activation step. Every flow it will call is shipped and proven
  against the real service from the client library. This is the
  recorded honest gap in this phase's exit; the phase closes with it
  named, not hidden.
- "Opponent-verified results" = dual attestation with checksum
  agreement; richer receipts (e.g. signed move chains) are unnecessary
  while clients re-verify full matches anyway.

## Follow-ups

- Shell online surface once a public service URL exists (recorded in
  the final summary).
- Phase 26: data breadth and localization.
