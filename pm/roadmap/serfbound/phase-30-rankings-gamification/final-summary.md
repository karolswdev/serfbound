# Phase 30 — Final Summary

- **Phase opened:** 2026-06-11
- **Phase closed:** 2026-06-11
- **Chunks shipped:** 5 (the planned four + the maintainer-directed
  identity library)

## Goal — was it met?

> Make competition visible and progress feel owned … surface the
> ladder and leaderboard in the shell, give players a profile with
> match history and statistics, and add local-first achievements …
> without eroding the privacy posture or making accountless play
> feel second-class.

**Yes.** The Phase 25 Elo table is a product surface (rank rows,
your row in gold, the designed empty state, disputes counted out
loud, the honest-limits line built in); the Chronicle is a profile
(derived statistics, the recent record, the campaign ledger, a
rating that appears only after the player reads the ladder); twelve
deeds unlock from real play, speak through the original 1993 notice
in both languages, and render as the player's own decoded DOS
icons; and players carry a face and a banner from the 16-piece
PixelLab identity library. The gate proved the loop end to end —
twice (CI and the public backbone) — and the privacy sweep counted
zero accountless network calls and exactly three local stores.

## Exit criteria — final state

- [x] Ladder/leaderboard live, own row locatable, disputes visible —
  [evidence-story-01](./evidence-story-01.md).
- [x] The profile populated from accountless offline play —
  [evidence-story-02](./evidence-story-02.md).
- [x] Achievements unlock from real play, original art, persistent —
  [evidence-story-03](./evidence-story-03.md).
- [x] The gamification gate + privacy regression —
  [evidence-story-04](./evidence-story-04.md).

## Stories shipped

| ID | Title | Date |
|---|---|---|
| SB-30-01 | Ladder and leaderboard surface | 2026-06-11 |
| SB-30-02 | Profiles, history, statistics | 2026-06-11 |
| SB-30-03 | Achievements in original art | 2026-06-11 |
| SB-30-04 | Gamification gate | 2026-06-11 |
| SB-30-05 | Avatars and guild heraldry (maintainer-added) | 2026-06-11 |

## Decisions and honest records

- The campaign ledger exists (mission victories persist locally) —
  created because two stories assumed a record nothing had written.
- Lobby ratings resolve by unique name; the additive challenger
  keyId field + server-side rejection of nameless challenges are a
  recorded stop-and-decide pair (service changes travel together).
- The gate found a real field defect: a nameless production
  challenge let a player pair against a ghost — the client ghost
  guard ships; the origin was not reproduced under logging.
- Stale-bundle false signals (a TS error short-circuiting build:web)
  bit twice and are now a recorded reflex: capture exit codes
  directly, never through pipes.

## Handoff

- The maintainer has superseded the Phase 25 identity decision:
  Serfbound is also a social game for those who opt in (accountless
  single-player remains first-class forever). The social-identity
  decision record and the Phase 33 scaffold carry that forward.
- SB-30-04's stop-and-decide service pair belongs early in any
  social phase.

## Final asset / test posture

- Unit 244+ tests; browser 24+ specs including the gate loop, the
  no-network chronicle, deeds, identity, ladder.
- The identity library (16 pieces) + 12 deeds with decoded-icon
  badges; production stores wiped pristine after every test run.
