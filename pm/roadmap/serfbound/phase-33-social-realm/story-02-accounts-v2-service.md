# SB-33-02 — Accounts V2 - Credentials, Providers, Passkeys, Linking

- **Project:** serfbound
- **Phase:** 33
- **Status:** backlog
- **Depends on:** SB-33-01
- **Unblocks:** SB-33-03
- **Owner:** unassigned

## Problem

Implement the identity v2 service: email+password (hashed, recovery), OAuth/OIDC for Apple, Google, and Meta, WebAuthn passkeys, and device-key account linking that preserves ladder standing. Contract tests for the v2 schema; provider registrations are maintainer prerequisites.

## Scope

- **In:** Per the problem statement and `adoption/social-identity-decision.md`.
- **Out:** Anything gating accountless play; analytics; social features beyond definition (later phases).

## Acceptance criteria

- [ ] Detailed at phase start per the decision record; the unbreakables hold.

## Test plan

- Defined at phase start; the gate (SB-33-05) carries the journey e2e and the accountless regression.

## Notes / open questions

- Canon: `adoption/social-identity-decision.md` (supersedes Phase 25 identity by maintainer direction, 2026-06-11).
