# Evidence — SB-30-01 — Ladder and Leaderboard Surface

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/app/src/online-surface.ts` — `loadLadder()` (explicit
  request only — the zero-traffic posture holds until the player
  asks), `ladder`, `disputedCount` (quarantine, counted out loud),
  `ratingForName()` (lobby ratings by unique name; ambiguity shows
  nothing, honestly — the lobby wire format carries names, not keys,
  and the service does not change).
- `packages/app/src/main.ts` — the ladder disclosure in the Online
  group: rank rows from the live service, the player's own row keyed
  by accountId (the ladder's keyId *is* the key fingerprint — exact,
  not name-matched), the designed empty state, the disputed-count
  note, the honest-limits line as part of the component; lobby cards
  now show the challenger's rating in gold when resolvable.
- `packages/app/src/styles.css` + `docs/design/design-standard.md` —
  the Ladder list entered §3 first; token-only styling, own-row gold
  accent.
- `tests/browser/online-play.spec.ts` — the gate e2e now ends on the
  ladder: dual-attested result → rank 1 "ALICE (you)" 1516, BOB 1484,
  no disputed note.
- `tests/browser/online-states.spec.ts` — the accountless read:
  opening the ladder without an account renders the designed empty
  state and the honest-limits line.

## Verification artifacts

```
online-play + online-states + online-outage: 3 passed (24.4s)
  (the rated-ladder assertions ride the real two-device match)
npm run ci:release -> exit=0 (captured directly)
serfbound-design-tokens-ok: 44/44, 0 reserved, ratchet 0/0
```

One found-by-the-gate note: a strict-index TS error initially
short-circuited `build:web`, so the first suite run executed against
a stale bundle (only the outage spec genuinely passed) — caught by
reading the failures, fixed, re-run clean. Recorded because stale-
bundle false signals are worth remembering.

Real-data capture (local `SPAU.PA`, two contexts, local services):
`artifacts/story-01-ladder.png` — the rated ladder after the
ceremony, own row in gold. (The same run refreshed phase 32's
story-04 captures onto the material chrome.)

## Acceptance criteria — re-checked

- [x] The leaderboard renders live ladder data; the player's own row
  is locatable — gold border + "(you)", keyed by account fingerprint.
- [x] Challenges show opponent ratings (unique-name resolution,
  recorded limitation); disputed matches are visible as quarantined —
  the counted note (asserted hidden at zero in the e2e; the rendering
  path is exercised by the same sync).
- [x] The surface degrades recoverably (loadLadder rides the same
  unavailable posture) and accountless players read the ladder
  without sign-in pressure — online-states assertion.

## Deviations from plan

- Opponent ratings on challenges resolve by unique name because the
  lobby payload has no key field and the story's Out forbids service
  changes — ambiguous names show no rating. Exact per-challenger
  ratings need one additive lobby field: recorded as a Phase 30
  stop-and-decide candidate, not smuggled in.

## Follow-ups

- SB-30-02 (profiles) and SB-30-03 (achievements) remain; SB-30-04
  gates the loop.
- The lobby keyId field decision (above).
