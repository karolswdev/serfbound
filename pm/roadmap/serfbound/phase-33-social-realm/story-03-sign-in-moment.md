# SB-33-03 — The Sign-In Moment

- **Project:** serfbound
- **Phase:** 33
- **Status:** done
- **Depends on:** SB-33-02
- **Unblocks:** SB-33-04
- **Owner:** KC (agent-assisted)

## Problem

The shell's familiar login per the design standard - provider buttons, email flow, passkey prompt - with accountless play visually primary and the collected-data sentence in view. All states designed.

## Scope

- **In:** Per the problem statement, `../adoption/social-identity-decision.md`,
  and the privacy posture from `../adoption/identity-v2-schema.md`.
- **Out:** Anything gating accountless play; analytics; social features beyond definition (later phases).

## Acceptance criteria

- [x] The Online panel exposes the familiar methods: email, passkey,
  Google, Apple, and Meta.
- [x] The email flow creates a v2 password account, or opens the existing one,
  through the configured identity service.
- [x] Provider and passkey states are designed and keep the collected-data
  sentence in view without accepting unverifiable tokens.
- [x] Accountless play remains visually primary: the local-play sentence is
  explicit, and no account is required before import/start/save.
- [x] The legacy correspondence bridge is separated from v2 sign-in and remains
  explicit until SB-33-05 moves the full journey.

## Test plan

- Browser coverage: online surface spec verifies method switching, real v2
  email account readiness, the accountless sentence, and the legacy bridge
  still signing in for correspondence play.
- Regression coverage: outage, online play, gamification gate, and community
  maps specs cover accountless resilience and legacy bridge behavior.
- Gate note: SB-33-05 still carries the full opt-in journey and zero-network
  accountless regression.

## Notes / open questions

- Canon: `../adoption/social-identity-decision.md` (supersedes Phase 25
  identity by maintainer direction, 2026-06-11) and the privacy posture in
  `../adoption/identity-v2-schema.md`.
- Provider registrations and browser passkey ceremonies remain SB-33-05
  prerequisites; this story designs their shell states and keeps email live.
