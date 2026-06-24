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
- [x] Service-level identity v2 sessions authorize mailbox, maps, and rating
  writes without device keys, while the Phase 25 bridge remains available.
- [x] Browser community-map publish, rate, report, and play-count writes can
  use an email v2 session proof without device-key payloads.
- [x] Browser email v2 accounts can reach a correspondence match, dual
  attestation, and a rated ladder result without device-key payloads.
- [x] Browser passkey proof and local persistence are implemented and
  gate-tested for community-map social writes without device-key payloads.
- [x] Browser passkey accounts can reach a correspondence match, dual
  attestation, and a rated ladder result without device-key payloads.
- [x] Configured provider handoff is browser-gate-tested without accepting raw
  provider tokens or provider subjects in browser payloads.
- [x] Browser provider-handoff accounts can publish/rate/report/play community
  maps and reach a correspondence match, dual attestation, and rated ladder
  result through v2 identity without device-key payloads.
- [ ] Live provider handoff is configured for at least one provider and
  gate-tested without accepting raw provider tokens in the browser.
- [ ] Full opt-in journey e2e passes: each sign-in method -> correspondence
  match -> dual attestation -> rated result.

## Test plan

- Browser:
  - `tests/browser/social-identity-gate.spec.ts` — accountless zero-network
    regression.
  - `tests/browser/community-maps.spec.ts` — existing device-key map flow plus
    email, passkey, and configured provider-handoff v2 session map
    publish/rate/report/play-count writes without device keys.
  - `tests/browser/online-play.spec.ts` — existing device-key rated match plus
    email, passkey, and configured provider-handoff v2 session
    correspondence/rating without device keys.
  - `tests/browser/online-states.spec.ts` — v2 email shell moment + legacy
    correspondence bridge state.
  - `tests/browser/gamification-gate.spec.ts` — current rated-match gamification
    path through the legacy bridge.
- Service:
  - `tests/ci/service-identity.test.mjs` — v2 password, OIDC assertion,
    passkey, recovery, session proof, and legacy standing claim contracts.
  - `tests/ci/service-mailbox.test.mjs` — v2 session challenge, moves, dual
    attestation, and rated ladder identity without device keys.
  - `tests/ci/service-maps.test.mjs` — v2 session publish, rate, report,
    play count, and delete without device keys.
- Remaining before closure: live provider registration/gateway configuration,
  native provider/WebAuthn handoff decisions, and the final
  sign-in-method-to-rated-match e2e.

## Notes / open questions

- Canon: `../adoption/social-identity-decision.md` (supersedes Phase 25
  identity by maintainer direction, 2026-06-11).
- Gate tracker: `gate-readiness.md`.
