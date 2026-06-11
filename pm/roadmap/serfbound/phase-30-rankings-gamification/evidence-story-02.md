# Evidence — SB-30-02 — Profiles, History, Statistics

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/app/src/profile-stats.ts` — pure derivation:
  `deriveProfileStatistics` (won/lost/completed/abandoned, current
  and best win streaks, last-played) over the history the profile
  already keeps, plus the player-facing mode labels.
- `packages/app/src/profile-store.ts` — the campaign ledger:
  additive `missionsCompleted` + `withMissionCompleted` (dedup).
- `packages/app/src/main.ts` — the Chronicle grown into a profile
  surface: a disclosure with the local-only framing ("Kept on this
  device, like your saves — never uploaded."), the statistics grid,
  the campaign line ("N of 31 missions won"), the recent record
  (result-accented rows: meadow for wins, banner-red for losses),
  and the rating line that appears only once the ladder has been
  read (never fetched on the profile's account). Mission victories
  write the ledger from the running game: every rival's castle
  fallen, yours standing — recorded once.
- `packages/app/src/styles.css` + the standard — token-only
  chronicle components.
- `tests/ci/profile-stats.test.mjs` (4 tests, hand-computed
  fixtures) + `tests/browser/profile-chronicle.spec.ts`.

## Verification artifacts

```
profile-stats unit: # tests 4 / # pass 4 / # fail 0
  (mixed-history fixture hand-checked: 7W/2L/1A, current streak 2,
   best streak 3; ledger dedup proven)
profile-chronicle.spec: 1 passed
  (seeded store -> stats grid, campaign 3 of 31, 3 accented rows,
   rating hidden, AND zero requests to the online origin across the
   whole journey — counted, not assumed)
npm run ci:release -> exit=0 (captured directly)
```

The no-network spec first failed on its own filter (the page URL
contains the dead-API param as a substring) — fixed to match the
origin; the recorded zero is real.

Real-data captures (local `SPAU.PA`) under `artifacts/`:
`story-02-chronicle-{desktop,mobile}.png`.

## Acceptance criteria — re-checked

- [x] The profile renders fully populated from accountless local
  data — history, statistics, campaign progress (spec + captures).
- [x] Statistics derive from existing local records and match the
  hand-checked fixture; the one new record (the campaign ledger) is
  a local game record like the saves, decided openly: mission
  completion was never persisted anywhere, and both this story and
  SB-30-03 assumed it — recorded as this phase's decision.
- [x] Zero network calls on the profile path in accountless mode —
  asserted by counting requests to the online origin.

## Deviations from plan

- The campaign ledger is technically new local state (the story said
  "no new tracking"); the constraint's spirit — no collection, no
  upload, no telemetry — holds: it is a device-local game record the
  derivation reads, created because the assumed record did not exist.
- Hours-equivalent play indicators: skipped — nothing existing
  records duration, and inventing it would be actual new tracking.
- Surface placement decided: the DOM shell chronicle (the SB-32
  standard's components); an original-art popup remains SB-30-03's
  option for celebrations.

## Follow-ups

- SB-30-03 reads `missionsCompleted` for campaign milestones.
- A victory-moment e2e (conquest in a browser run) lands with
  SB-30-03's milestone proof — the watcher's logic is exercised
  there.
