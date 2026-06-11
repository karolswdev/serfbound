# Phase 29 — Hosting Backbone

**Last updated:** 2026-06-11.
**Status:** not started.

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
| SB-29-01 | Infrastructure decision and secrets boundary | backlog | story-01-infrastructure-decision.md | — |
| SB-29-02 | Service containers and manifests | backlog | story-02-service-containers-manifests.md | — |
| SB-29-03 | Cluster deployment, DNS, TLS | backlog | story-03-cluster-deploy-dns-tls.md | — |
| SB-29-04 | Online surface and hosting gate | backlog | story-04-online-surface-hosting-gate.md | — |

## Where we are

Scaffolded 2026-06-11. Inputs in hand: `serfbound.com` registered;
LKE cluster `lke577204` (us-ord) reachable; kubeconfig stored locally
under gitignored `serfbound-local-data/infra/dev-kubeconfig.yaml`.
Services to deploy exist and are CI-proven in-process
(`services/identity`, `services/mailbox`; runbook `services/README.md`).
Can start independently of Phases 27/28; SB-29-04 closes the Phase 25
named gap.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Credential leakage into the repo | medium | Gitignored infra dir, scoped deploy creds, pre-ship secret scan | Any credential-shaped string in a staged diff |
| Hosted dependency erodes serverless-first play | medium | Outage-mode regression test in CI; online surface is additive UI | Shell blocks or degrades offline play when the API is down |
| Single-maintainer ops burden / data loss | medium | One-file-per-service stores, backup cron, restore drill in evidence | A store lost with no restorable backup |
| Cluster cost creep | low | Minimal footprint (two tiny services + ingress); cost noted in the decision record | Monthly cost exceeding the recorded ceiling |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- How `serfbound.com` serves the static game (Pages custom domain vs
  cluster-served static) — decided in SB-29-01; default is Pages
  custom domain to keep the game static and CDN-backed.
- Signaling-relay deployment — added to the manifests when Phase 27
  ships it; the backbone must not wait for it.
- CI-driven deploys vs runbook deploys — default: runbook first,
  automate when the manifests stabilize.
