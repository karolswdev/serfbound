# SB-33-02 — Accounts V2 - Credentials, Providers, Passkeys, Migration

- **Project:** serfbound
- **Phase:** 33
- **Status:** done
- **Depends on:** SB-33-01
- **Unblocks:** SB-33-03
- **Owner:** unassigned

## Problem

Implement the identity v2 service: email+password (hashed, recovery),
OAuth/OIDC for Apple, Google, and Meta, WebAuthn passkeys, and one-time
migration from legacy device-key standing. Device keys do not survive as v2
credentials. Contract tests for the v2 schema; provider registrations are
maintainer prerequisites.

## Scope

- **In:** Per the problem statement, `../adoption/social-identity-decision.md`,
  and `../adoption/identity-v2-schema.md`.
- **Out:** Anything gating accountless play; analytics; social features beyond
  definition (later phases); browser sign-in UX (SB-33-03); live provider
  registration/secrets, which remain maintainer-operated prerequisites.

## Acceptance criteria

- [x] The legacy Phase 25 `/accounts` device-key API still works as a
  bridge, but device keys are not accepted as v2 credentials.
- [x] Identity v2 creates/signs in password accounts, stores scrypt hashes
  instead of plaintext, and rotates passwords through a hashed recovery code.
- [x] Identity v2 creates/signs in at least one OIDC-backed account path
  through a configured provider-assertion handoff, rejects provider token
  fields, and keeps Apple/Google/Meta as the accepted provider set.
- [x] Identity v2 creates/signs in passkey accounts by verifying public-key
  proofs and rejecting replayed sign counts.
- [x] Identity v2 claims Phase 25 standing once by signed legacy key proof and
  stores only `legacyKeyId`, `claimedAtIso`, and `migrationBatchId`.

## Test plan

- `node --test tests/ci/service-identity.test.mjs tests/ci/identity-v2-schema.test.mjs`
  covers the service contract. SB-33-05 still carries the full browser journey
  and the accountless no-network regression.

## Notes / open questions

- Canon: `../adoption/social-identity-decision.md` (supersedes Phase 25
  identity by maintainer direction, 2026-06-11) and
  `../adoption/identity-v2-schema.md`.
- Provider registrations and production OIDC gateway configuration remain
  maintainer-operated; the service refuses `/v2/accounts/oidc` unless
  `SERFBOUND_IDENTITY_OIDC_ASSERTION_SECRET` is configured.
