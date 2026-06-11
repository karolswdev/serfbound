# Serfbound deployment manifests

Kubernetes manifests for the optional online services, per the
hosting-infrastructure decision record
(`pm/roadmap/serfbound/adoption/hosting-infrastructure-decision.md`).
The game itself is never deployed here — it stays a static artifact.

- `namespace.yaml` — the one namespace Serfbound owns on the shared
  cluster.
- `identity.yaml` / `mailbox.yaml` — Deployment + Service + PVC per
  service. One replica, `Recreate` over the RWO store volume
  (single-node cluster posture), TCP probes so the Phase 25 service
  code is unchanged.

Images are published to GHCR by `.github/workflows/services.yml`:
`ghcr.io/karolswdev/serfbound-identity` and
`ghcr.io/karolswdev/serfbound-mailbox`.

Validate without a cluster:

```bash
npm run check:manifests   # kubeconform -strict
```

Ingress (Gateway API routes via the cluster's existing Envoy Gateway),
TLS, DNS, rate limiting, and backups land in SB-29-03 — nothing here
is applied to the cluster until that story.
