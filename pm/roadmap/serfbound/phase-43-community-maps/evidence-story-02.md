# Evidence — SB-43-02 — Deploy to the Backbone

- **Shipped:** 2026-06-13 (deployed to LKE lke577204)
- **Owner:** KC (maintainer apply, agent-assisted)

## What was applied

The staged manifests, applied to the live cluster with the maintainer's
LKE kubeconfig:

```
kubectl apply -f deploy/maps.yaml      # PVC + Deployment + Service created
kubectl apply -f deploy/httproute.yaml # serfbound-api configured (/maps rule)
kubectl -n serfbound rollout status deploy/maps  # successfully rolled out
```

Image: `ghcr.io/karolswdev/serfbound-maps:latest`, published by
`services.yml` at the SB-43-02 commit (includes SB-43-06 play counts).
Manifests kubeconform-validated (17/17) before apply.

## Verification artifacts

```
kubectl -n serfbound get deploy,svc,pvc:
  deployment.apps/maps   1/1   1   1   (rolled out)
  service/maps           ClusterIP 10.128.158.140  80/TCP
  persistentvolumeclaim/maps-store  Bound  10Gi  RWO  linode-block-storage-retain
  (identity + mailbox unchanged, 2d4h)

Live smoke test (the gateway strips the /maps prefix, the service's own
list route is GET /maps, so the reachable path is /maps/maps):
  curl -s https://api.serfbound.com/maps/maps  -> {"maps":[]}  [HTTP 200]
  identity + mailbox routes unaffected.
```

## Acceptance criteria — re-checked

- [x] `/maps` live on `api.serfbound.com` (behind the catalyst gateway,
  prefix-stripped to the maps service), empty gallery on a fresh store.
- [x] Game-down independence preserved: the maps service is its own
  Deployment/PVC; the static game never depends on it.

## Note

The runbook's smoke-test path was corrected: it read `/maps` (which the
gateway rewrites to `/` → the service's `unknown-route`); the reachable
path is `/maps/maps`. The on-screen gallery still needs the `mapsUrl`
wired into `online-config.ts` — that lands with the gallery shell
(SB-43-05).
