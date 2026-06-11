# Evidence — SB-29-01 — Infrastructure Decision and Secrets Boundary

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `pm/roadmap/serfbound/adoption/hosting-infrastructure-decision.md` —
  new decision record: domain plan, shared-cluster inventory, secrets
  boundary, data posture, backups, cost ceiling, stop signals.
- `pm/roadmap/serfbound/README.md` — source-canon entry for the new
  record.
- `pm/roadmap/serfbound/phase-29-hosting-backbone/story-01-infrastructure-decision.md` —
  status → done.
- `pm/roadmap/serfbound/phase-29-hosting-backbone/current-phase-status.md` —
  story row, decisions, "Where we are".

## Verification artifacts

Kubeconfig is inside the gitignored boundary:

```
$ git check-ignore serfbound-local-data/infra/dev-kubeconfig.yaml
serfbound-local-data/infra/dev-kubeconfig.yaml   (exit 0 → ignored)
```

Full-history secret scan, clean:

```
$ gitleaks detect --source . --no-banner
1:32AM INF 13 commits scanned.
1:32AM INF scanned ~2787358 bytes (2.79 MB) in 266ms
1:32AM INF no leaks found
```

Cluster reachability, read-only only (`kubectl version`,
`get nodes`, `get namespaces` — no workloads applied):

```
$ KUBECONFIG=serfbound-local-data/infra/dev-kubeconfig.yaml kubectl version
Client Version: v1.34.1
Server Version: v1.34.7

$ KUBECONFIG=... kubectl get nodes -o wide
NAME                            STATUS   ROLES    AGE   VERSION
lke577204-843420-08e975840000   Ready    <none>   96d   v1.34.3
  (Debian 12, containerd 2.2.1, instance type g6-standard-6)

$ KUBECONFIG=... kubectl get namespaces
cert-manager           Active   88d
envoy-gateway-system   Active   69d
default / kube-*       Active   96d
bmb, catalyst-api-gateway, catalyst-infra, cnpg-system, pantrybot
  (other tenants — shared cluster)
```

The shared-cluster discovery (existing cert-manager + Envoy Gateway,
other tenants, single node) materially shaped the record: reuse
platform pieces, own namespace only, pod-restart resilience rather
than multi-node failover.

## Acceptance criteria — re-checked

- [x] Decision record answers domain, secrets, data posture, backups,
  and cost ceiling — `adoption/hosting-infrastructure-decision.md`,
  all six sections present.
- [x] `git check-ignore` passes and the secret scan of history-to-date
  is recorded clean — output above.
- [x] Cluster reachability verified read-only with output in
  evidence, no workloads applied — output above; the only `kubectl`
  verbs used were `version`, `get nodes`, `get namespaces`,
  `get node -o jsonpath` (instance type label).

## Deviations from plan

The story assumed a dedicated cluster; verification found a shared
one with platform components already installed. The record adapts:
namespace isolation, reuse of cert-manager and Envoy Gateway
(SB-29-03 verifies their configuration instead of installing
ingress-nginx), and a single-node resilience posture. SB-29-03's
"node drain" criterion is consciously narrowed to pod-restart +
backup/restore proof; noted in that story's Notes.

## Follow-ups

- Rotate the cluster-admin token after SB-29-03 creates the
  namespace-scoped deploy credential (recorded in the decision
  record's secrets boundary).
- `.tmp/` housekeeping: the maintainer should delete the
  `~/Downloads/dev-kubeconfig.yaml` copy now that the canonical
  local copy lives in the gitignored boundary.
