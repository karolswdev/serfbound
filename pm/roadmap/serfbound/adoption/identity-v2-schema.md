# Identity V2 Schema

**Status:** accepted contract for Phase 33.
**Story:** SB-33-01.
**Machine-readable schema:** `services/identity/identity-v2-schema.json`.
**Decision record:** `social-identity-decision.md`.

## Purpose

Phase 25's identity service intentionally stopped at anonymous device-key
accounts: `accountId`, `publicKeyJwk`, `name`, and `createdAtIso`. That
four-field record remains valid as legacy data, but it is no longer the ceiling
for Serfbound identity.

By maintainer decision on 2026-06-23, identity v2 does **not** make device keys
a credential kind. Existing Phase 25 standing can be claimed once during
migration, but v2 sign-in uses email/password, Apple/Google/Meta OIDC, or
passkeys. The contract exists before SB-33-02 service work so implementation can
be tested against a stable shape instead of rediscovering the privacy boundary
in code.

## Account Record

The v2 account record carries:

- `accountId` — stable server-issued account id.
- `displayName` — game-font-safe public name.
- `createdAtIso` and `updatedAtIso` — account timestamps.
- `credentials` — one or more credential records.
- `legacyStandingClaim` — optional one-time migration proof from a Phase 25
  device-key account; it preserves standing but is not a sign-in credential.
- `recovery` — optional recovery state; never plaintext secrets.

Forbidden account fields: original game data, raw archives, analytics ids, and
tracking ids. Local import, local saves, campaign play, and accountless play do
not depend on this record.

## Credential Kinds

- **Password:** stores email, verification timestamp, password hash,
  algorithm, and timestamps. It never stores a plaintext password, reset token,
  access token, or refresh token.
- **OIDC:** supports Apple, Google, and Meta. It stores provider, provider
  subject, optional email metadata, and timestamps. It never stores access
  tokens, refresh tokens, ID tokens, or authorization codes.
- **Passkey:** stores credential id, public key, sign count, transports, user
  handle, and timestamps. It never stores private key material.

Device keys are explicitly absent from the v2 credential list. The migration
claim may remember `legacyKeyId`, `claimedAtIso`, and `migrationBatchId`, but it
must not store public or private key material and must not be accepted for
sign-in.

## Player-Visible Privacy Posture

Online identity is optional. Serfbound stores only the credential data required
for the sign-in method the player chooses and the public name they play under.
Local play never needs an account, and game data never uploads.

This posture must appear consistently in the README, player guide, and shell.
The old "nothing to leak" sentence is retired from player-facing copy because
v2 deliberately supports credential-bearing sign-in methods.

## Mailbox Hardening Folded In

SB-33-01 also absorbs the SB-30-04 service hardening pair:

- Challenge creation and acceptance require a player-visible name.
- The lobby response includes `challengerKeyId`, while still hiding public keys
  and credential details.

The lobby key id lets clients join challenge cards and ladder entries by stable
identity instead of by display name.
