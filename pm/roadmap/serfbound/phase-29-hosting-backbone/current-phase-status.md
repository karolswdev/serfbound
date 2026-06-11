# Phase 29 — Hosting Backbone

**Last updated:** 2026-06-11 (after SB-29-01).
**Status:** in progress.

## Goal

Activate the optional online backbone the maintainer now owns: the
registered `serfbound.com` domain and a Linode LKE cluster. Deploy the
Phase 25 identity and mailbox services (and the Phase 27 signaling
relay once it exists) behind HTTPS at a public URL, point
`serfbound.com` at the game, and land the shell online surface —
closing the named follow-up from the Phase 25 final summary.
Serverless, accountless play remains first-class forever.

## Scope

- **In:** An infrastructure decision record (what runs where, the
  secrets boundary, cost/backup posture), container images and
  Kubernetes manifests for the services, the cluster deployment with
  DNS, TLS, and ingress rate limiting at `api.serfbound.com`, the game
  served at `serfbound.com`, the shell online surface (sign-in, lobby,
  your-turn badge) wired to the public URL, the operations runbook.
- **Out:** Rankings/gamification surfaces (Phase 30), TURN relay
  (Phase 27 stop-signal gated), analytics/telemetry of any kind,
  multi-region or autoscaling ceremony.

## Non-negotiable constraints

- The game stays fully playable with zero hosted services; the shell
  must never block play when `api.serfbound.com` is down.
- No credential is ever committed: kubeconfig and tokens live under
  gitignored `serfbound-local-data/infra/` (or CI secrets), and the
  repo is scanned before each shipping commit.
- The services' data posture is unchanged: the four-field identity
  schema and size-capped mailbox payloads; original game data cannot
  reach the services; no new logging of play.
- Gameplay traffic never terminates at the cluster — services store
  and forward; clients re-verify everything (Phase 23/25 model).

## Exit criteria (evidence required)

- [ ] The infrastructure decision record exists; the kubeconfig is
  local-only and provably ignored; no secret is in the repo.
  (SB-29-01)
- [ ] Container images build and the manifests validate; the services
  pass their contract tests running containerized. (SB-29-02)
- [ ] `https://api.serfbound.com` serves both services with TLS,
  ingress rate limiting, persistent stores that survive pod
  restarts, and a working backup/restore path. (SB-29-03)
- [ ] `serfbound.com` serves the game, the shell online surface works
  against the public URL, and a real correspondence match completes
  through it end to end — the Phase 25 follow-up is closed.
  (SB-29-04)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-29-01 | Infrastructure decision and secrets boundary | done | story-01-infrastructure-decision.md | evidence-story-01.md |
| SB-29-02 | Service containers and manifests | in-progress | story-02-service-containers-manifests.md | — |
| SB-29-03 | Cluster deployment, DNS, TLS | backlog | story-03-cluster-deploy-dns-tls.md | — |
| SB-29-04 | Online surface and hosting gate | backlog | story-04-online-surface-hosting-gate.md | — |

## Where we are

SB-29-01 shipped: the hosting-infrastructure decision record is in
`adoption/`, the kubeconfig is provably inside the gitignored
boundary, the history-wide secret scan is clean, and the cluster is
verified reachable read-only. Key finding: the cluster is shared —
cert-manager and Envoy Gateway already installed, other tenants
present, single `g6-standard-6` node — so Serfbound deploys into its
own namespace, reuses the platform TLS/ingress, and the resilience
criterion is pod-restart + backup/restore. Next: SB-29-02 (container
images + manifests).

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Credential leakage into the repo | medium | Gitignored infra dir, scoped deploy creds, pre-ship secret scan | Any credential-shaped string in a staged diff |
| Hosted dependency erodes serverless-first play | medium | Outage-mode regression test in CI; online surface is additive UI | Shell blocks or degrades offline play when the API is down |
| Single-maintainer ops burden / data loss | medium | One-file-per-service stores, backup cron, restore drill in evidence | A store lost with no restorable backup |
| Cluster cost creep | low | Minimal footprint (two tiny services + ingress); cost noted in the decision record | Monthly cost exceeding the recorded ceiling |

## Decisions made (this phase)

- 2026-06-11 — `serfbound.com` serves the game via GitHub Pages
  custom domain; `api.serfbound.com` via the cluster — keeps the
  always-works path static — SB-29-01, decision record.
- 2026-06-11 — Reuse the shared cluster's existing cert-manager and
  Envoy Gateway; Serfbound stays inside its own namespace — found at
  verification; installing duplicates is a stop-and-ask — SB-29-01.
- 2026-06-11 — Cost ceiling: no new node pools, no new paid add-ons;
  Serfbound rides existing headroom — SB-29-01, decision record.

## Decisions deferred
- Signaling-relay deployment — added to the manifests when Phase 27
  ships it; the backbone must not wait for it.
- CI-driven deploys vs runbook deploys — default: runbook first,
  automate when the manifests stabilize.
