# Evidence — SB-33-02 — Accounts V2 Service

- **Shipped:** 2026-06-23
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `services/identity/server.mjs` — keeps the Phase 25 `/accounts` API as the
  legacy bridge and adds `/v2` account credentials: password, configured OIDC
  assertion, passkey public-key proof, safe account reads, and one-time legacy
  standing claims.
- `services/identity/identity-v2-schema.json` and
  `pm/roadmap/serfbound/adoption/identity-v2-schema.md` — make password
  recovery explicit: hash metadata only, no plaintext recovery codes or reset
  tokens.
- `tests/ci/service-identity.test.mjs` — service contract coverage for v2
  password hashing/recovery, OIDC token rejection, passkey sign-count replay
  rejection, and legacy standing migration without a device-key credential.
- `tests/ci/identity-v2-schema.test.mjs` — schema coverage for the recovery
  contract.
- `scripts/test-services-containers.mjs` — runs the same identity contract
  suite against the container with an OIDC assertion secret configured.
- `services/README.md` — operations posture for v2 credential storage,
  provider assertion configuration, and recovery.

## Acceptance criteria — re-checked

- [x] Legacy device-key `/accounts` registration, fetch, rename, and delete
  still pass; v2 stores no `deviceKey` credential kind.
- [x] Password accounts use scrypt hashes; plaintext passwords and recovery
  codes do not persist or leave the service response.
- [x] Recovery verifies the stored recovery hash and rotates the password hash.
- [x] The OIDC path is provider-assertion gated, supports the accepted
  provider set, signs into the same account by provider subject, and rejects
  token fields such as `idToken`.
- [x] Passkey accounts verify a public-key proof and reject replayed sign
  counts.
- [x] Legacy standing migration verifies a signed Phase 25 key proof, records a
  one-time claim, and stores no legacy public/private key material in the v2
  account record.

## Verification

```text
node --test tests/ci/service-identity.test.mjs tests/ci/identity-v2-schema.test.mjs
# tests 12
# pass 12

npm run test:docs
serfbound-docs-ok: player, developer, static hosting, contributor, and GitHub templates cover required topics.

npm run test:unit
# tests 352
# pass 352

npm run check:boundaries
serfbound-boundaries-ok

npm run check:independence
serfbound-independence-ok: zero .NET artifacts in the tree.

npm run check:links
serfbound-public-doc-links-ok: 16 local targets and 7 external URLs in README/CONTRIBUTING.
```

`npm run test:services:containers` was not run locally because Docker was not
available (`docker info` failed). The container harness was updated so the
identity contract suite configures `SERFBOUND_IDENTITY_OIDC_ASSERTION_SECRET`
when Docker is available.

## Remaining Phase 33 work

SB-33-03 is the next practical story: wire the player-facing sign-in moment to
the v2 account service while keeping accountless play visually primary. Live
Apple/Google/Meta registrations and production OIDC gateway secrets remain
maintainer-operated prerequisites; the service refuses unverifiable provider
claims when the assertion secret is absent.
