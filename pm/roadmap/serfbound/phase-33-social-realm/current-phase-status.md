# Phase 33 — The Social Realm

**Last updated:** 2026-06-11.
**Status:** scaffolded (from the maintainer's 2026-06-11 product
evolution; see `adoption/social-identity-decision.md`).

## Goal

Open Serfbound's door the way players expect doors to open — email,
Apple, Google, Meta, passkeys — and define the social game that
opt-in unlocks, while the two unbreakables hold: accountless
single-player stays first-class forever, and everything collected is
stated plainly where players see it.

## Scope

- **In:** The identity v2 service (credentials, OAuth/OIDC, passkeys,
  recovery, device-key linking) with its contract-tested schema; the
  shell's familiar sign-in moment; the privacy posture rewritten in
  every place it is printed; the SB-30-04 service hardening pair; the
  social-experience definition (friends, real guild rosters,
  presence — the discovery that shapes later phases); the gate.
- **Out:** The social features themselves beyond definition (they
  get their own phases), analytics of any kind, anything that gates
  accountless play.

## Exit criteria (evidence required)

- [ ] The v2 identity schema and privacy posture are documented,
  contract-tested, and printed consistently everywhere players read
  them. (SB-33-01)
- [ ] A player signs in with email+password, with at least one
  federated provider, and with a passkey — and links an existing
  device-key account without losing standing. (SB-33-02)
- [ ] The shell's sign-in moment is designed per the standard;
  accountless play remains visually primary. (SB-33-03)
- [ ] The social-experience definition exists with the maintainer's
  sign-off, scoping the phases after this one. (SB-33-04)
- [ ] The gate: the full opt-in journey e2e + the accountless
  regression (zero walls, zero degradation, zero network). (SB-33-05)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-33-01 | Identity v2 schema and the honest posture | backlog | story-01-identity-v2-posture.md | — |
| SB-33-02 | Accounts v2: credentials, providers, passkeys, linking | backlog | story-02-accounts-v2-service.md | — |
| SB-33-03 | The sign-in moment | backlog | story-03-sign-in-moment.md | — |
| SB-33-04 | The social experience, defined | backlog | story-04-social-experience-definition.md | — |
| SB-33-05 | Social identity gate | backlog | story-05-social-identity-gate.md | — |

## Where we are

Scaffolded 2026-06-11, the day the maintainer evolved the product.
The superseding decision record is canon; story files are stubs
awaiting the phase's start. OAuth provider registrations (Apple
Developer, Google Cloud, Meta) are maintainer prerequisites for
SB-33-02 — recorded here so they can be prepared in parallel.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Social door shadows the solo game | medium | The unbreakables in the decision record; the gate's accountless regression | Any sign-in wall or feature loss accountless |
| Credential handling becomes a liability | medium | Passkeys-first guidance, hashed passwords, no logs, recovery designed before launch | Any credential in a log or error report |
| Provider review friction (Apple/Meta) | medium | Passkeys + email ship independent of provider approval | A provider blocking the phase gate |
| Scope balloons into the social features | high | SB-33-04 defines; later phases build | Feature code before the definition's sign-off |

## Decisions made (this phase)

- 2026-06-11 — The Phase 25 identity decision is superseded by
  maintainer direction — `adoption/social-identity-decision.md`.

## Decisions deferred

- Which provider ships first (likely passkeys + email, then Google,
  then Apple/Meta per registration friction) — SB-33-02.
- Whether device keys remain offered to NEW players post-v2 —
  SB-33-01.
