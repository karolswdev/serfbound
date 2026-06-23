# Evidence — SB-33-01 — Identity V2 Schema and the Honest Posture

- **Shipped:** 2026-06-23
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `services/identity/identity-v2-schema.json` — machine-readable v2 contract:
  account record, credential kinds, forbidden secret fields, accountless
  guarantees, privacy posture, legacy standing migration, and mailbox
  challenge hardening.
- `pm/roadmap/serfbound/adoption/identity-v2-schema.md` — human-readable schema
  and privacy posture companion for SB-33-02.
- `README.md`, `docs/player-guide.md`, `packages/app/src/main.ts` — player
  surfaces now share the same posture: online identity is optional; Serfbound
  stores only the credential data required for the chosen sign-in method and
  the public name; local play never needs an account; game data never uploads.
- `services/mailbox/server.mjs` — nameless challenge creation/acceptance now
  rejects; lobby entries now include `challengerKeyId` and still hide raw public
  keys/credential details.
- `packages/app/src/mailbox-client.ts`, `packages/app/src/online-surface.ts`,
  `packages/app/src/main.ts` — the client carries `challengerKeyId`; lobby
  cards use key-based rating lookup and expose the key id as a DOM data
  attribute for the browser gate.
- `tests/ci/identity-v2-schema.test.mjs`,
  `tests/ci/service-mailbox.test.mjs`,
  `tests/ci/online-surface.test.mjs`, `tests/browser/online-states.spec.ts`,
  `scripts/check-docs.mjs` — contract coverage for schema posture, mailbox
  hardening, online surface propagation, browser copy, and docs drift.

## Acceptance criteria — re-checked

- [x] The Phase 25 four-field identity service record is formally retired as a
  ceiling; device keys are a legacy bridge only and do not survive as v2
  credentials.
- [x] The v2 schema includes password, OIDC (Apple/Google/Meta), and passkey
  credentials; a one-time legacy standing claim preserves ladder standing
  without storing key material as a sign-in credential.
- [x] README, player guide, and shell copy no longer use the v1 "nothing to
  leak" posture; they state the minimum-data v2 posture consistently.
- [x] Mailbox challenges require player-visible names, and lobby entries expose
  `challengerKeyId` without exposing raw public keys or credential details.

## Verification

```text
node --test tests/ci/identity-v2-schema.test.mjs
# tests 4
# pass 4

node --test tests/ci/service-mailbox.test.mjs tests/ci/online-surface.test.mjs
# tests 6
# pass 6

npm run test:docs
serfbound-docs-ok: player, developer, static hosting, contributor, and GitHub templates cover required topics.

npm run test:unit
# tests 348
# pass 348

npm run build:web && npx playwright test tests/browser/online-states.spec.ts
1 passed
```

## Remaining Phase 33 work

SB-33-02 is the next practical implementation story: build the v2 account
service against `identity-v2-schema.json`, with email/password and passkeys able
to proceed before provider registrations land. It must replace device-key
sign-in with the v2 credentials and provide at most a one-time standing
migration from legacy Phase 25 accounts. SB-33-03 must keep accountless play
visually primary when the sign-in moment expands.
