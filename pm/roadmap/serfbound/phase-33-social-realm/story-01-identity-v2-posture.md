# SB-33-01 — Identity V2 Schema and the Honest Posture

- **Project:** serfbound
- **Phase:** 33
- **Status:** done
- **Depends on:** none
- **Unblocks:** SB-33-02
- **Owner:** unassigned

## Problem

Document the v2 identity schema (credentials, providers, passkeys, linking), retire the four-field ceiling formally, and rewrite the privacy posture in every place players read it — the README, the shell copy, the player guide — truthfully and consistently. Folds in the SB-30-04 service hardening pair (reject nameless challenges; lobby challenger keyId).

## Scope

- **In:** The identity v2 schema/posture contract, player-visible privacy
  wording in README/player guide/shell, and the SB-30-04 hardening pair
  (nameless challenges reject; lobby carries challenger key id).
- **Out:** Anything gating accountless play; analytics; social features beyond definition (later phases).

## Acceptance criteria

- [x] The v2 identity schema is recorded in a machine-readable contract and a
  human-readable adoption note; the Phase 25 four-field identity record is
  formally retired as a ceiling and device keys are migration-only, not v2
  credentials.
- [x] The privacy posture is rewritten consistently in README, player guide,
  and shell copy: online identity is optional, only chosen-method credential
  data plus the public name is stored, local play never needs an account, and
  game data never uploads.
- [x] Contract tests pin credential kinds, forbidden secret fields, accountless
  guarantees, the player-facing copy, and the mailbox challenge hardening.
- [x] The SB-30-04 service hardening pair is implemented: nameless challenges
  and acceptances reject, and lobby entries expose `challengerKeyId` without
  exposing public keys or credential details.

## Test plan

- `node --test tests/ci/identity-v2-schema.test.mjs`
- `node --test tests/ci/service-mailbox.test.mjs tests/ci/online-surface.test.mjs`
- `npm run test:docs`
- `npm run test:unit`
- `npm run build:web && npx playwright test tests/browser/online-states.spec.ts`
- SB-33-05 still carries the full sign-in journey e2e and the accountless
  regression after SB-33-02/SB-33-03.

## Evidence

- `evidence-story-01.md`

## Notes / open questions

- Canon: `../adoption/social-identity-decision.md` (supersedes Phase 25
  identity by maintainer direction, 2026-06-11).
- Schema canon: `../adoption/identity-v2-schema.md` and
  `../../../../services/identity/identity-v2-schema.json`.
