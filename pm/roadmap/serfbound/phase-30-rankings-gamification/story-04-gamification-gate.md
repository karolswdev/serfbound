# SB-30-04 — Gamification Gate

- **Project:** serfbound
- **Phase:** 30
- **Status:** backlog
- **Depends on:** SB-30-01, SB-30-02, SB-30-03
- **Unblocks:** none
- **Owner:** unassigned

## Problem

The phase claims a loop: play → rating moves → leaderboard shows it →
profile records it → achievements mark it. The gate proves the whole
loop in one run and proves the loop's absence costs nothing — the
privacy and accountless postures survive gamification intact.

## Scope

- **In:** An e2e run where a rated correspondence match completes,
  the rating change appears on the leaderboard, both profiles record
  the match, and at least one achievement unlocks along the way; a
  privacy regression sweep (accountless offline run touches no
  network, schema contract tests unchanged, no new persisted fields
  beyond the recorded local stores); deferred decisions (seasons,
  decay, rewards) re-confirmed in the final summary.
- **Out:** New surfaces or triggers (this story proves, it does not
  add).

## Acceptance criteria

- [ ] The full-loop e2e passes in CI against the in-process services
  and is additionally recorded once against the deployed URL.
- [ ] The privacy regression sweep is green: identity schema contract
  unchanged, zero network in accountless mode, local stores
  enumerated and matching the recorded list.
- [ ] Phase exit criteria 1–3 re-verified from the gate run's
  artifacts; screenshots land under phase artifacts.

## Test plan

- **Unit:** n/a — gate story.
- **Integration / e2e:** The full-loop Playwright run (two contexts,
  rated match, leaderboard/profile/achievement assertions).
- **Manual / device:** The deployed-URL loop on two machines,
  captured.
- **Design handoff:** Loop screenshots (leaderboard delta, profile,
  unlock) under phase artifacts.

## Notes / open questions

- Preserves: every posture this phase could have eroded — trustless
  rating, local-first data, accountless-first UX.
- Browser boundary: network + persistence (proof only).
- .NET reference use: none.
- Phase gate advanced: exit criterion 4 (re-proving 1–3).
