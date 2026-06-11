# Hosting Infrastructure Decision

**Status:** accepted for the Phase 29 baseline.
**Date:** 2026-06-11.
**Story:** SB-29-01.

## Decision

Serfbound's optional online backbone runs on infrastructure the
maintainer already owns: the `serfbound.com` domain (registered
2026-06) and the existing Linode LKE cluster `lke577204` (us-ord).
The game stays a static artifact; only the optional services are
hosted. Serverless, accountless play remains first-class forever —
nothing in this record changes that.

## Domain plan

| Host | Serves | How |
|---|---|---|
| `serfbound.com` (+ `www`) | The game (static `dist/`) | GitHub Pages custom domain on the existing Pages deployment |
| `api.serfbound.com` | Identity + mailbox services (and the Phase 27 signaling relay when it ships) | LKE cluster ingress, TLS via the cluster's cert-manager |
| `assets.serfbound.com` | Reserved — licensed asset packages | Phase 31 only, after SB-31-01; not provisioned before |

Pages custom domain over cluster-served static: the game is already
released and cache-audited as a static Pages artifact (Phase 9/24);
putting it behind the cluster would add an availability dependency to
the one thing that must never have one. The cluster hosts only what
is optional by design.

## Cluster inventory (verified read-only, 2026-06-11)

- LKE `lke577204`, control plane v1.34.7, region us-ord.
- One node pool: 1 × `g6-standard-6` (Debian 12, containerd 2.2.1),
  96 days old at verification.
- **The cluster is shared.** Existing tenants include other projects
  (`pantrybot`, `catalyst-*`, `bmb`) and platform namespaces:
  `cert-manager` (88d) and `envoy-gateway-system` (69d) are already
  installed.

Consequences Phase 29 must honor:

- Serfbound deploys into its **own namespace** (`serfbound`) and
  touches nothing outside it.
- **Reuse the platform pieces:** TLS through the existing
  cert-manager, ingress through the cluster's existing Envoy
  Gateway (Gateway API), not a new ingress-nginx install. SB-29-03
  verifies the existing Gateway/issuer configuration at deploy time
  and records it; installing duplicates of either is a stop-and-ask.
- **Single-node reality:** a node drain cannot reschedule anywhere;
  node maintenance means brief downtime, which is acceptable at
  these stakes (the game never depends on the services). SB-29-03's
  resilience criterion is therefore pod-restart + backup/restore
  proof, not multi-node failover theater.

## Secrets boundary

- The kubeconfig lives at
  `serfbound-local-data/infra/dev-kubeconfig.yaml` — inside the
  long-standing gitignored local-data boundary. Verified:
  `git check-ignore` passes.
- No credential, token, or kubeconfig is ever committed. Full-history
  secret scan (gitleaks) recorded clean as of this story.
- The current credential is a cluster-admin service-account token.
  Routine deploys must not use it: SB-29-03 creates a
  namespace-scoped ServiceAccount (role limited to the `serfbound`
  namespace) for day-to-day operations, after which the admin token
  is set aside for cluster-level changes only. Rotation of the admin
  token is recommended once the scoped credential exists (it
  predates this boundary).
- If CI-driven deploys arrive later (deferred), the scoped
  credential — never the admin token — goes into CI secrets.

## Data and privacy posture (restated for hosting)

Hosting changes where the services run, not what they hold:

- Identity: the four-field schema (`accountId`, `publicKeyJwk`,
  `name`, `createdAtIso`), enforced by contract test.
- Mailbox: challenges and size-capped match records; original game
  data cannot reach the services — the wire format has no field for
  it.
- No analytics, no play logs, no telemetry — on the cluster exactly
  as in-process. Ingress access logs follow the cluster default and
  are not shipped anywhere by Serfbound.
- Rate limiting lands at the ingress per the recorded abuse-posture
  checklist item (SB-29-03).

## Backups

Each service persists one JSON store file on a PVC. Backup posture:
a CronJob snapshots both stores off-cluster (Linode Object Storage
or equivalent) daily; 14 daily snapshots retained (SB-29-03 records
the final choice); one restore drill is part of SB-29-03's evidence.
Loss tolerance is the Phase 25 recorded posture: finished games live
in players' local histories; a lost store loses ladder state and
open matches, nothing irreplaceable.

## Cost ceiling

The cluster pre-exists Serfbound and is shared; Serfbound's marginal
cost is approximately zero (two tiny Node services well within the
existing node's headroom). The recorded ceiling: **no new node
pools, no LoadBalancer beyond the cluster's existing one, no paid
managed add-ons** for Phase 29 — Serfbound-attributable spend is
domain renewal plus negligible object-storage for backups. Exceeding
that requires a new decision record.

## Stop signals

- Any credential-shaped string in a staged diff → halt, scrub,
  rotate.
- Serfbound workloads needing resources that would grow the shared
  cluster → stop and decide (it may belong on its own cluster).
- The shell blocking or degrading offline play when
  `api.serfbound.com` is down → the backbone has overreached
  (Phase 29 non-negotiable).
