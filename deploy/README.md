# Serfbound deployment manifests

Kubernetes manifests for the optional online services, per the
hosting-infrastructure decision record
(`pm/roadmap/serfbound/adoption/hosting-infrastructure-decision.md`).
The game itself is never deployed here — it stays a static artifact.

- `namespace.yaml` — the one namespace Serfbound owns on the shared
  cluster.
- `identity.yaml` / `mailbox.yaml` / `maps.yaml` / `reports.yaml` —
  Deployment + Service + PVC per service. One replica, `Recreate` over
  the RWO store volume (single-node cluster posture), TCP probes so the
  service code is unchanged. `httproute.yaml` path-splits `/identity`,
  `/mailbox`, `/maps`, and `/reports` on `api.serfbound.com`.

Images are published to GHCR by `.github/workflows/services.yml`:
`ghcr.io/karolswdev/serfbound-identity`, `…/serfbound-mailbox`,
`…/serfbound-maps`, and `…/serfbound-reports`.

Validate without a cluster:

```bash
npm run check:manifests   # kubeconform -strict
```

Ingress (Gateway API routes via the cluster's existing Envoy Gateway),
TLS, DNS, rate limiting, and backups land in SB-29-03 — nothing here
is applied to the cluster until that story.

## Deploying the maps service (SB-43-02)

Staged and manifest-validated; the apply is the maintainer's outward
action (needs the LKE kubeconfig, gitignored under
`serfbound-local-data/infra/`). The image builds and pushes
automatically when a commit touching `services/**` or `deploy/**` lands
on `main` (`services.yml`). To deploy:

```bash
# 1. Confirm the image is published (or build it):
#    GHCR: ghcr.io/karolswdev/serfbound-maps:latest  (built by services.yml)
#    or local:
docker build -t ghcr.io/karolswdev/serfbound-maps:latest services/maps
docker push ghcr.io/karolswdev/serfbound-maps:latest

# 2. Point at the cluster and apply (maps workload + the updated routes):
export KUBECONFIG=serfbound-local-data/infra/<lke577204-kubeconfig>.yaml
kubectl apply -f deploy/maps.yaml
kubectl apply -f deploy/httproute.yaml          # now carries the /maps rule
kubectl -n serfbound rollout status deploy/maps

# 3. Smoke test — an empty gallery on a fresh store. The gateway strips
#    the /maps prefix (ReplacePrefixMatch -> /) and the service's own
#    list route is GET /maps, so the reachable path is /maps/maps (the
#    maps client's base is .../maps and it appends /maps — the same
#    shape as identity's .../identity + /accounts):
curl -s https://api.serfbound.com/maps/maps     # -> {"maps":[]}
```

**Deployed 2026-06-13** (SB-43-02 done): maps Deployment 1/1, Service +
10Gi PVC bound, `serfbound-api` HTTPRoute carrying the /maps rule;
`GET https://api.serfbound.com/maps/maps` -> `{"maps":[]}` (HTTP 200),
identity/mailbox routes unaffected. Rollback:
`kubectl -n serfbound delete -f deploy/maps.yaml` and re-apply
`httproute.yaml` from the previous revision.

## Deploying the reports service (SB-44-06)

The gate-verification deck submits playtest reports here; `npm run
pull:reports` writes them into the repo. Staged and manifest-validated;
the apply is the maintainer's outward action.

```sh
# 1. The image is built + pushed by services.yml on push to services/**.
#    GHCR: ghcr.io/karolswdev/serfbound-reports:latest

# 2. Create the submit token secret (the maintainer holds this; it gates
#    write + read). Skippable — with optional:true the pod starts and runs
#    open until the secret exists, then gating activates on next rollout.
kubectl -n serfbound create secret generic reports-token \
  --from-literal=token="$(openssl rand -hex 24)"

# 3. Apply the workload + the updated routes:
kubectl apply -f deploy/reports.yaml
kubectl apply -f deploy/httproute.yaml          # now carries the /reports rule
kubectl -n serfbound rollout status deploy/reports

# 4. Smoke. The route strips /reports (ReplacePrefixMatch -> /), so the
#    health path is /reports/health.
curl -s https://api.serfbound.com/reports/health   # -> {"service":"serfbound-reports","ok":true}

# 5. Read the token back to paste into the deck + the pull script:
kubectl -n serfbound get secret reports-token -o jsonpath='{.data.token}' | base64 -d
```

Rollback: `kubectl -n serfbound delete -f deploy/reports.yaml` and
re-apply `httproute.yaml` from the previous revision.
