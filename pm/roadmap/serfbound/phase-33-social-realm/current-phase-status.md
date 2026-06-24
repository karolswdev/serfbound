# Phase 33 — The Social Realm

**Last updated:** 2026-06-23.
**Status:** in progress (SB-33-01 and SB-33-02 complete; the player-facing
sign-in moment starts at SB-33-03).

## Goal

Open Serfbound's door the way players expect doors to open — email,
Apple, Google, Meta, passkeys — and define the social game that
opt-in unlocks, while the two unbreakables hold: accountless
single-player stays first-class forever, and everything collected is
stated plainly where players see it.

## Scope

- **In:** The identity v2 service (credentials, OAuth/OIDC, passkeys,
  recovery, one-time legacy device-key standing migration) with its
  contract-tested schema; the
  shell's familiar sign-in moment; the privacy posture rewritten in
  every place it is printed; the SB-30-04 service hardening pair; the
  social-experience definition (friends, real guild rosters,
  presence — the discovery that shapes later phases); the gate.
- **Out:** The social features themselves beyond definition (they
  get their own phases), analytics of any kind, anything that gates
  accountless play.

## Exit criteria (evidence required)

- [x] The v2 identity schema and privacy posture are documented,
  contract-tested, and printed consistently everywhere players read
  them. (SB-33-01)
- [x] A player signs in with email+password, with at least one
  federated provider, and with a passkey — and migrates existing
  device-key standing without keeping device keys as v2 credentials.
  (SB-33-02)
- [ ] The shell's sign-in moment is designed per the standard;
  accountless play remains visually primary. (SB-33-03)
- [ ] The social-experience definition exists with the maintainer's
  sign-off, scoping the phases after this one. (SB-33-04)
- [ ] The gate: the full opt-in journey e2e + the accountless
  regression (zero walls, zero degradation, zero network). (SB-33-05)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-33-01 | Identity v2 schema and the honest posture | done | story-01-identity-v2-posture.md | evidence-story-01.md |
| SB-33-02 | Accounts v2: credentials, providers, passkeys, migration | done | story-02-accounts-v2-service.md | evidence-story-02.md |
| SB-33-03 | The sign-in moment | backlog | story-03-sign-in-moment.md | — |
| SB-33-04 | The social experience, defined | backlog | story-04-social-experience-definition.md | — |
| SB-33-05 | Social identity gate | backlog | story-05-social-identity-gate.md | — |

## Where we are

Scaffolded 2026-06-11, the day the maintainer evolved the product. SB-33-01
started the phase on 2026-06-23 by accepting the v2 identity schema contract,
rewriting the privacy posture in README/player-guide/shell copy, and folding in
the SB-30-04 service hardening pair (nameless challenges reject; lobby entries
carry `challengerKeyId`). SB-33-02 then shipped the service-side v2 account
contract: password hashing/recovery, configured OIDC assertion handoff,
passkey public-key proof/sign-count checks, and one-time legacy standing
migration without retaining device keys as v2 credentials.

Next practical start: SB-33-03. OAuth provider registrations (Apple Developer,
Google Cloud, Meta) remain maintainer prerequisites for provider-backed
sign-in; the service refuses provider claims unless an OIDC assertion handoff
secret is configured.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Social door shadows the solo game | medium | The unbreakables in the decision record; the gate's accountless regression | Any sign-in wall or feature loss accountless |
| Credential handling becomes a liability | medium | Passkeys-first guidance, hashed passwords, no logs, recovery designed before launch | Any credential in a log or error report |
| Provider review friction (Apple/Meta) | medium | Passkeys + email ship independent of provider approval | A provider blocking the phase gate |
| Scope balloons into the social features | high | SB-33-04 defines; later phases build | Feature code before the definition's sign-off |

## Decisions made (this phase)

- 2026-06-11 — The Phase 25 identity decision is superseded by
  maintainer direction — `../adoption/social-identity-decision.md`.
- 2026-06-23 — `../adoption/identity-v2-schema.md` and
  `../../../../services/identity/identity-v2-schema.json` accepted as the
  SB-33-02 schema contract; the v1 "nothing to leak" player-facing phrase is
  retired.
- 2026-06-23 — Maintainer decision: device keys do not survive as v2
  credentials. The Phase 25 device-key service is a legacy bridge only; v2
  accepts at most a one-time standing migration.
- 2026-06-23 — SB-33-02 service contract: OIDC provider claims require a
  configured assertion handoff; the service rejects provider token fields and
  refuses OIDC account creation when the assertion secret is absent.

## Decisions deferred

- Which live provider registration ships first (likely Google, then
  Apple/Meta per registration friction) — SB-33-03/SB-33-05.
- Exact standing-migration cutoff and whether the legacy bridge remains online
  read-only after v2 launch — SB-33-02.
