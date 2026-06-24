# SB-33-05 — Social Identity Gate

- **Project:** serfbound
- **Phase:** 33
- **Status:** in progress
- **Depends on:** SB-33-04
- **Unblocks:** none
- **Owner:** KC (agent-assisted)

## Problem

The full opt-in journey e2e (each sign-in method to a rated match) plus the accountless regression: zero walls, zero feature loss, zero network - the unbreakables, proven.

## Scope

- **In:** Per the problem statement, `../adoption/social-identity-decision.md`,
  and the contracts completed before the gate.
- **Out:** Anything gating accountless play; analytics; social features beyond definition (later phases).

## Acceptance criteria

- [x] Gate criteria are detailed and tracked in `gate-readiness.md`.
- [x] Accountless import -> start -> save has a browser regression proving zero
  online requests, even when online endpoints are configured.
- [x] Existing service contracts prove v2 password, OIDC assertion, passkey,
  recovery, and legacy standing claim without storing forbidden secrets.
- [x] Existing browser coverage proves the email v2 shell moment can create or
  open an account, and the legacy correspondence bridge can still reach a
  rated match.
- [ ] Browser passkey ceremony and persistence are implemented and gate-tested.
- [ ] Live provider handoff is configured for at least one provider and
  gate-tested without accepting raw provider tokens in the browser.
- [ ] The mailbox/maps/rating bridge accepts v2 identity for email, provider,
  and passkey accounts, with no device key as a v2 credential.
- [ ] Full opt-in journey e2e passes: each sign-in method -> correspondence
  match -> dual attestation -> rated result.

## Test plan

- Browser:
  - `tests/browser/social-identity-gate.spec.ts` — accountless zero-network
    regression.
  - `tests/browser/online-states.spec.ts` — v2 email shell moment + legacy
    correspondence bridge state.
  - `tests/browser/online-play.spec.ts` and `tests/browser/gamification-gate.spec.ts`
    — current rated-match path through the legacy bridge.
- Service:
  - `tests/ci/service-identity.test.mjs` — v2 password, OIDC assertion,
    passkey, recovery, and legacy standing claim contracts.
- Remaining before closure: browser passkey, live provider handoff, v2 mailbox
  identity bridge, full sign-in-method-to-rated-match e2e.

## Notes / open questions

- Canon: `../adoption/social-identity-decision.md` (supersedes Phase 25
  identity by maintainer direction, 2026-06-11).
- Gate tracker: `gate-readiness.md`.
