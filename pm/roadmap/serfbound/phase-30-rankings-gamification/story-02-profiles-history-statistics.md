# SB-30-02 — Profiles, History, Statistics

- **Project:** serfbound
- **Phase:** 30
- **Status:** done
- **Depends on:** none
- **Unblocks:** SB-30-03, SB-30-04
- **Owner:** unassigned

## Problem

Phase 25's local-first profiles store a name and raw match history.
A player's sense of progress needs more: a profile surface that turns
local history into statistics — wins and losses, streaks, campaign
progress — owned entirely by the player, with or without an account.

## Scope

- **In:** A profile view in the shell built from local data: match
  history (opponent, mode, outcome, date), win/loss and streak
  statistics, campaign/mission completion progress, hours-equivalent
  play indicators if cheaply derivable from existing records; the
  signed-in case additionally shows the account's rating; explicit
  local-only framing (this data never uploads).
- **Out:** Any new server-side field or upload path, achievements
  (SB-30-03), shareable profile cards (deferred).

## Acceptance criteria

- [ ] The profile renders fully populated from accountless offline
  play — history, statistics, campaign progress.
- [ ] Statistics are computed from the existing local records (no new
  tracking is introduced) and match a hand-checked fixture history.
- [ ] Nothing on the profile path performs a network call in
  accountless mode (verified in test).

## Test plan

- **Unit:** Statistics derivation against fixture histories (empty,
  single-match, streaks, disputed).
- **Integration / e2e:** Playwright: play → profile reflects the
  match; reload → persists.
- **Manual / device:** Profile on desktop + phone viewport, captured
  under phase artifacts.
- **Design handoff:** Profile screenshots under phase artifacts.

## Notes / open questions

- Preserves: Phase 25 local-first profile model and the no-new-
  tracking posture; statistics are derived, not collected.
- Browser boundary: persistence (existing local stores only).
- .NET reference use: none.
- Phase gate advanced: exit criterion 2.
- Open: surface placement — dedicated popup in original art vs DOM
  shell panel; decide with the SB-30-03 art direction.
