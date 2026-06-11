# Evidence — SB-25-02 — Identity Decision and Account Service

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `pm/roadmap/serfbound/phase-25-community-identity/identity-decision.md`
  — the record: an account IS an ECDSA P-256 keypair (anonymous device
  keys); no email, no password, no OAuth, no recovery (recorded
  plainly; passkeys are the upgrade path); cross-device transfer =
  exporting your key, the same philosophy as your game data; the
  stored schema is four fields, exhaustively.
- `services/identity/server.mjs` — the zero-dependency Node service:
  signed registration (the id is the public key's SHA-256
  fingerprint), GET by id, signed rename, signed verifiable deletion;
  JSON-file storage, CORS for the browser, **unexpected request fields
  reject by contract** (data minimization enforced, not promised);
  deployment is the maintainer's activation step per the SB-20-01
  precedent.
- `packages/app/src/identity-client.ts` — WebCrypto keygen/signing,
  register/rename/delete/fetch with recoverable
  `IdentityServiceError`s, local fingerprint computation.
- `packages/app/src/profile-store.ts` — the profile optionally links an
  account (`withAccount`/`withoutAccount`); accountless play and
  sign-out lose nothing.
- Tests: `tests/ci/service-identity.test.mjs` — driven against a real
  local instance of the service.

## Verification artifacts

```text
npm run test:unit -> # tests 216 / pass 216 / fail 0
npm run test:browser -> 13 passed (1.2m)
npm run check:boundaries -> serfbound-boundaries-ok
npm run check:independence -> serfbound-independence-ok
node --test tests/ci/service-identity.test.mjs ->
  ok 1 - register, fetch, rename, and delete flow end to end, signed
  ok 2 - data minimization is a contract: unexpected fields reject
  ok 3 - unsigned or wrongly-signed mutations reject
  ok 4 - sign-in links the local profile; sign-out loses nothing
```

- The full lifecycle runs signed end-to-end; deletion is verifiable
  (the follow-up fetch is 404/null).
- A registration carrying an `email` field is rejected with the field
  named — the decision record's schema is the contract test.
- An attacker's key can neither rename nor delete an account.

## Deviations from plan

- The auth mechanism is anonymous device keys rather than
  passkeys/OAuth/magic links — the only mechanism that satisfies the
  data-minimization constraint outright (nothing collectable exists);
  recorded with the passkey upgrade path.
- Shell sign-in UI lands with SB-25-03's challenge surface, where
  identity first becomes useful; this story ships the client flows and
  the linkage, CI-proven against the live local service.
- A deployed-service smoke is the maintainer's activation step
  (hosting choice); the service runs from `node
  services/identity/server.mjs` anywhere Node 22 exists.

## Follow-ups

- SB-25-03: challenges and the turn mailbox, where accounts and
  correspondence matches meet.
