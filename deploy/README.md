# Serfbound deployment manifests

Kubernetes manifests for the optional online services, per the
hosting-infrastructure decision record
(`pm/roadmap/serfbound/adoption/hosting-infrastructure-decision.md`).
The game itself is never deployed here — it stays a static artifact.

- `namespace.yaml` — the one namespace Serfbound owns on the shared
  cluster.
- `identity.yaml` / `mailbox.yaml` / `maps.yaml` — Deployment +
  Service + PVC per service. One replica, `Recreate` over the RWO store
  volume (single-node cluster posture), TCP probes so the service code
  is unchanged. `httproute.yaml` path-splits `/identity`, `/mailbox`,
  and `/maps` on `api.serfbound.com`.

Images are published to GHCR by `.github/workflows/services.yml`:
`ghcr.io/karolswdev/serfbound-identity`, `…/serfbound-mailbox`, and
`…/serfbound-maps`.

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

# 3. Smoke test — an empty gallery on a fresh store:
curl -s https://api.serfbound.com/maps          # -> {"maps":[]}
```

Nothing here is applied to the cluster until the maintainer runs the
above. Rollback: `kubectl -n serfbound delete -f deploy/maps.yaml` and
re-apply `httproute.yaml` from the previous revision.
