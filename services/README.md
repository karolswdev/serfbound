# Serfbound services — operations

Three zero-dependency Node services back the optional online features.
The game never requires them: accountless, serverless play is
first-class forever, and clients re-verify every move themselves — the
services store and forward; they never referee.

## Running locally

```bash
node services/identity/server.mjs   # :4310, SERFBOUND_IDENTITY_PORT/STORE
node services/mailbox/server.mjs    # :4320, SERFBOUND_MAILBOX_PORT/STORE
node services/maps/server.mjs       # :4330, SERFBOUND_MAPS_PORT/STORE
```

Storage is one JSON file per service (set `*_STORE`). Any host with
Node 22 still works — the deployment below is the maintainer's
activation, not a requirement.

For identity v2 provider handoff tests or a real OIDC gateway, set
`SERFBOUND_IDENTITY_OIDC_ASSERTION_SECRET`; without it, `/v2/accounts/oidc`
returns `oidc-not-configured` instead of accepting unverifiable provider
claims.

Browser provider sign-in uses an explicitly configured `providerHandoffApi`.
That endpoint must verify the real provider server-side, then call
`/v2/accounts/oidc` with `x-serfbound-oidc-assertion`. Browser payloads must
not include `providerSubject`, `idToken`, `accessToken`, `refreshToken`, or
`authorizationCode`.

For identity v2 sessions that can authorize mailbox/maps/rating without device
keys, set the same `SERFBOUND_IDENTITY_V2_SESSION_SECRET` on identity,
mailbox, and maps. Identity then issues short-lived `sbv2` HMAC bearer proofs
on v2 sign-up/sign-in responses; mailbox and maps verify those proofs beside
the legacy signed-key bridge.

## The actual deployment (SB-29-03)

The services run on the maintainer's shared LKE cluster (`lke577204`,
us-ord) in the `serfbound` namespace, per
`pm/roadmap/serfbound/adoption/hosting-infrastructure-decision.md`:

- **Images**: `ghcr.io/karolswdev/serfbound-identity` and
  `…/serfbound-mailbox` (public), published by
  `.github/workflows/services.yml`.
- **Manifests**: `deploy/` (validate with `npm run check:manifests`).
  Stores live on PVCs; one replica with `Recreate` — the store's
  load-mutate-save pattern is not safe for concurrent replicas.
- **Ingress**: listeners for `api.serfbound.com` on the shared
  `catalyst-gateway` (patch:
  `deploy/patches/catalyst-gateway-listeners.json`), path-split
  `/identity` and `/mailbox` via `deploy/httproute.yaml`, TLS from
  cert-manager (`deploy/certificate.yaml`, `letsencrypt-prod`).
- **Credentials**: routine ops use the namespace-scoped
  `serfbound-deployer` ServiceAccount (`deploy/deploy-credentials.yaml`);
  the cluster-admin kubeconfig stays local-only under
  `serfbound-local-data/infra/` (gitignored) for cluster-level
  one-time changes (the gateway patch, the Certificate).

Deploy / upgrade:

```bash
export KUBECONFIG=serfbound-local-data/infra/dev-kubeconfig.yaml
kubectl apply -f deploy/namespace.yaml -f deploy/identity.yaml \
  -f deploy/mailbox.yaml -f deploy/deploy-credentials.yaml
kubectl -n serfbound rollout restart deploy/identity deploy/mailbox  # pull :latest
```

Backups (maintainer-run; zero-cost posture — no paid object storage
at current stakes):

```bash
node scripts/backup-services.mjs backup              # → serfbound-local-data/backups/<stamp>/
node scripts/backup-services.mjs restore <backup-dir>
```

Teardown: `kubectl delete ns serfbound`, remove the two
`serfbound-api-*` listeners from `catalyst-gateway`, and delete the
`serfbound-api-tls` Certificate in `catalyst-api-gateway`.

## What they hold (and don't)

- **Identity**: legacy `/accounts` records still hold the Phase 25
  device-key bridge (`accountId`, `publicKeyJwk`, `name`,
  `createdAtIso`). Identity v2 lives under `/v2`: password credentials
  store email plus scrypt hashes/recovery hashes, OIDC credentials store
  provider + subject after a configured assertion handoff, passkeys store
  public-key credential metadata, and legacy standing claims store only
  `legacyKeyId`, `claimedAtIso`, and `migrationBatchId`. No plaintext
  passwords, reset codes, provider tokens, private keys, analytics ids,
  stored sessions, or game data. When configured, v2 session proofs are issued
  in responses only and are not account records.
- **Mailbox**: challenges (terms + challenger key/name), matches
  (players' keys/names, the move list — world actions and checksums
  only, size-capped — deadlines, state, attestations, ratings).
  The legacy bridge still verifies device-key signatures; the v2 path verifies
  `sbv2` bearer proofs and stores the v2 `accountId` as the player/rating id.
  **Original game data cannot reach these services**: the wire format
  has no field for it.

## Abuse posture (honest limits)

- **Result forgery**: only dual-attested outcomes rate; the final
  checksum is the receipt (both full simulations agreed). One liar →
  `disputed`, quarantined unrated. Two colluding accounts can farm each
  other — modest stakes by design (no rewards, no decay); recorded,
  not defended.
- **Smurfing**: accounts are free keypairs; ratings are reputational
  only. Recorded, not defended.
- **Spam**: payload size caps and structural validation; no rate
  limiting yet — add a reverse-proxy limit when hosting publicly
  (recorded as the deployment checklist item).
- **Deadlines**: evaluated lazily on read — no server clocks, nothing
  to drift; a match nobody looks at forfeits the moment anyone looks.

## Recovery

Lost legacy device key = lost legacy account unless standing was already
claimed into v2. V2 password accounts can rotate through the hashed
recovery flow; passkey/OIDC recovery depends on the chosen credential
provider. Lost service storage file = lost hosted accounts, ladder/open
matches, and v2 standing claims; finished games live in players' local
histories and their own match replays.
