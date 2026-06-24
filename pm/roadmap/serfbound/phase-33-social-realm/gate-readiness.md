# SB-33-05 Gate Readiness

**Last updated:** 2026-06-24.
**Status:** in progress.

This is the working gate tracker for SB-33-05. The gate is not complete until
every opt-in sign-in method can reach a rated correspondence result through the
v2 identity path, while accountless local play remains zero-wall, zero-loss, and
zero-network.

## Proven now

| Area | Proof | Status |
|---|---|---|
| Accountless local play | `tests/browser/social-identity-gate.spec.ts` imports generated local data, starts a game, saves it, and asserts zero requests to configured online endpoints. | proven |
| Identity v2 service contracts | `tests/ci/service-identity.test.mjs` covers password accounts, OIDC assertion handoff, passkey proof/sign count, session proofs, recovery, and one-time legacy standing claims without storing device keys as v2 credentials. | proven |
| Email sign-in shell | `tests/browser/online-states.spec.ts` proves the browser can create or open a v2 email/password account through the configured identity service. | proven |
| V2 social authorization adapter | `tests/ci/service-mailbox.test.mjs` and `tests/ci/service-maps.test.mjs` prove identity-issued v2 session proofs authorize mailbox, maps, and rating writes without device keys while the Phase 25 bridge remains available. | proven at service level |
| Browser passkey proof and persistence | `tests/browser/community-maps.spec.ts` proves the passkey path creates a local v2 credential, signs in again after reload through `/v2/sessions/passkey`, and never stores a private key as JWK. | proven for service-compatible passkey proof |
| Browser v2 community-map writes | `tests/browser/community-maps.spec.ts` proves email and passkey v2 sessions can publish, rate, report, and count a played map without device-key payloads. | proven for email and passkey maps |
| Browser v2 rated correspondence | `tests/browser/online-play.spec.ts` proves email and passkey v2 accounts can post/accept a challenge, exchange moves, dual-attest, and rate without device-key payloads. | proven for email and passkey v2 |
| Current rated-match path | `tests/browser/online-play.spec.ts` and `tests/browser/gamification-gate.spec.ts` prove the existing correspondence/rating path through the temporary Phase 25 local match key bridge. | proven as bridge |

## Not yet gate-complete

| Gap | Why it blocks closure |
|---|---|
| Native WebAuthn/provider ceremony decision | The browser now has a persisted service-compatible passkey proof; if launch requires OS/browser WebAuthn attestation, that handoff still needs implementation and coverage. |
| Live provider handoff | At least one real provider registration and OIDC gateway handoff must be configured and tested without accepting raw provider tokens in browser payloads. |
| Provider v2 correspondence/rating journey | Email and passkey v2 are wired in-browser, but provider accounts still need browser coverage for correspondence matches and rated results. |
| Provider social-write coverage | Email and passkey maps are proven in-browser; provider accounts still need browser coverage for the same social-write boundary. |
| Full journey e2e | The gate needs one end-to-end browser proof per sign-in method: sign in -> correspondence match -> dual attestation -> rated result. |

## Stop signals

- Any online request during accountless import, start, save, or local play.
- Any sign-in wall, feature loss, or degraded local play for accountless users.
- Any device key treated as a v2 credential rather than a one-time legacy
  standing claim.
- Any raw provider token accepted by browser code or service payloads.
- Any upload of original game data, local saves, browser fingerprints,
  address books, analytics ids, or exact presence history.

## Next sequence

1. Add a provider handoff harness for the first configured provider assertion.
2. Extend the browser v2 social-write and rated-match proofs across provider
   accounts.
3. Decide whether the launch gate requires native WebAuthn attestation beyond
   the current service-compatible passkey proof.
4. Land the full sign-in-method-to-rated-match e2e gate and only then close
   SB-33-05.
