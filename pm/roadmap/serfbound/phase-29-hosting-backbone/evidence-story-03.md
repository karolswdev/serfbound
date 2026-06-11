# Evidence — SB-29-03 — Cluster Deployment, DNS, TLS

- **Shipped:** 2026-06-11
- **Commit:** 17b0e35 (deployment) + this commit (verification + flip)
- **Owner:** KC (agent-assisted)

## Files touched

- `deploy/namespace.yaml` — `catalyst.io/gateway-access` label.
- `deploy/certificate.yaml` — cert-manager Certificate in the gateway
  namespace (letsencrypt-prod).
- `deploy/httproute.yaml` — path-split routes (`/identity`,
  `/mailbox`, prefix rewrite) + HTTP→HTTPS redirect.
- `deploy/patches/catalyst-gateway-listeners.json` — the two
  `api.serfbound.com` listeners on the shared catalyst-gateway
  (maintainer-approved this session).
- `deploy/deploy-credentials.yaml` — namespace-scoped
  `serfbound-deployer` ServiceAccount/Role/RoleBinding/token.
- `scripts/backup-services.mjs` — backup/restore tooling.
- `services/README.md` — runbook rewritten to the actual deployment
  (deploy, upgrade, backup, restore, teardown).

## Verification artifacts

**Deployment** (admin kubeconfig, gitignored): apply + rollout
success for both services; PVCs bound on Linode block storage.
Contract suites green via port-forward against the deployed pods
before any DNS existed: identity 4/4, mailbox 3/3.

**DNS**: `api.serfbound.com` A → 172.234.209.38 (gateway
LoadBalancer), proxied through Cloudflare — public resolution returns
edge IPs `104.21.3.92` / `172.67.130.136`. (Incident recorded below:
the record first landed in a second Cloudflare zone; the authoritative
SOA serial never moving was the tell.)

**TLS**: ACME HTTP-01 completed through the proxy as soon as DNS
resolved:

```
NAME                READY   SECRET              AGE
serfbound-api-tls   True    serfbound-api-tls   18m
serfbound-api-https listener: Programmed=True
```

**Public endpoint checks**:

```
GET https://api.serfbound.com/identity/accounts/<unknown> -> 404 (TLS ok)
GET http://api.serfbound.com/identity/x -> 301 https://api.serfbound.com/identity/x
GET https://api.serfbound.com/mailbox/x -> 404 (service answers)
```

**Contract suites over the public internet**: identity 4/4,
mailbox 3/3, ladder 3/3. The ladder suite first failed (2/3,
`1516 !== 1484`) from rating residue accumulated in the persistent
live store across repeated runs — the same per-suite isolation lesson
SB-29-02's container harness recorded. Fresh store → clean pass.

**Rate limiting** (Cloudflare rule: 50 req / 10 s per IP on
`api.serfbound.com`, action Block — the free-plan rule):

```
before rule:  80 parallel requests -> 80x 404 (all reached origin)
after rule:  120 parallel requests -> 61x 404, 59x 429
RATE LIMIT TRIPPED
```

**Persistence + backup/restore drill on the live cluster**:

```
1. registered account f9f2294c8a40…  (deployed service)
2. backup -> serfbound-local-data/backups/2026-06-11T07-58-22-353Z/
3. pod deleted, rescheduled -> FOUND name=DRILL      (PVC persistence)
4. store wiped -> NOT FOUND                          (simulated loss)
5. restore + rollout restart -> FOUND name=DRILL     (restore works)
```

**Launch hygiene**: both stores wiped pristine after verification —
`GET /mailbox/ladder` → `{"ladder":[]}`, no accounts.

## Acceptance criteria — re-checked

- [x] `https://api.serfbound.com` answers for both services with a
  valid certificate; HTTP redirects to HTTPS — outputs above.
- [x] Rate limiting demonstrably throttles a burst — 59× 429
  recorded; pod restart loses no store data — drill step 3. (Node
  drain consciously narrowed to pod-restart + backup/restore per the
  SB-29-01 single-node finding, recorded in the story Notes and the
  decision record.)
- [x] A backup exists off-cluster (maintainer machine, gitignored
  boundary) and a restore drill brought a store back — drill steps
  2–5; the runbook documents deploy, upgrade, backup, restore, and
  teardown — `services/README.md`.

## Deviations from plan

- **Rate limiting moved to the Cloudflare edge** (proxied DNS + the
  free rate-limiting rule) instead of the cluster ingress: the shared
  cluster has no Envoy Gateway policy CRDs installed, and installing
  them is shared-platform surgery the decision record classifies as
  stop-and-ask. Trade-off recorded: Cloudflare's edge terminates
  client TLS and sees service payloads — acceptable because the
  protocol is trustless by design (signed moves, client re-simulation,
  dual attestation; nothing secret crosses the wire).
- **Backups are maintainer-pulled** to the local gitignored boundary
  rather than a paid object store — the cost ceiling (no new paid
  pieces) decided this; revisit if stakes rise.
- **DNS two-zone incident**: the A record was first created in a
  Cloudflare zone whose nameservers were not the pair the `.com`
  registry delegates to (`emerson`/`kami`); diagnosis was the
  authoritative SOA serial never changing. Re-created in the
  delegated zone → resolved within seconds.

## Follow-ups

- SB-29-04: shell online surface against this URL; `serfbound.com`
  → the game (Pages custom domain).
- Rotate the cluster-admin token now that `serfbound-deployer`
  exists (decision-record commitment).
- Cloudflare configuration (the DNS record, the rate-limiting rule)
  is dashboard-managed by the maintainer; an API token would let it
  be config-as-code later — optional.
