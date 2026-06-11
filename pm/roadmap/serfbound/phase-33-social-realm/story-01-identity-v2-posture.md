# SB-33-01 — Identity V2 Schema and the Honest Posture

- **Project:** serfbound
- **Phase:** 33
- **Status:** backlog
- **Depends on:** none
- **Unblocks:** SB-33-02
- **Owner:** unassigned

## Problem

Document the v2 identity schema (credentials, providers, passkeys, linking), retire the four-field ceiling formally, and rewrite the privacy posture in every place players read it — the README, the shell copy, the player guide — truthfully and consistently. Folds in the SB-30-04 service hardening pair (reject nameless challenges; lobby challenger keyId).

## Scope

- **In:** Per the problem statement and `adoption/social-identity-decision.md`.
- **Out:** Anything gating accountless play; analytics; social features beyond definition (later phases).

## Acceptance criteria

- [ ] Detailed at phase start per the decision record; the unbreakables hold.

## Test plan

- Defined at phase start; the gate (SB-33-05) carries the journey e2e and the accountless regression.

## Notes / open questions

- Canon: `adoption/social-identity-decision.md` (supersedes Phase 25 identity by maintainer direction, 2026-06-11).
