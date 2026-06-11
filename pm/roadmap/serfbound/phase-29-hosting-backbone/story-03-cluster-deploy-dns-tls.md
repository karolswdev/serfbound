# SB-29-03 — Cluster Deployment, DNS, TLS

- **Project:** serfbound
- **Phase:** 29
- **Status:** backlog
- **Depends on:** SB-29-02
- **Unblocks:** SB-29-04
- **Owner:** unassigned

## Problem

The services need to exist at a public HTTPS URL before any shell
surface can call them. The runbook's own deployment checklist —
"put them behind HTTPS, add a reverse-proxy rate limit before
announcing a public URL" — becomes real here.

## Scope

- **In:** Ingress controller and cert-manager (Let's Encrypt) on the
  LKE cluster, the SB-29-02 manifests applied to a dedicated
  namespace, DNS for `api.serfbound.com`, ingress rate limiting (the
  recorded abuse-posture checklist item), persistent stores proven
  across pod restarts and node drains, a backup CronJob shipping
  store snapshots off-cluster with one restore drill performed,
  `services/README.md` updated from generic runbook to the actual
  deployment.
- **Out:** The game at `serfbound.com` and the shell surface
  (SB-29-04), monitoring stacks (a simple uptime check is enough at
  these stakes).

## Acceptance criteria

- [ ] `https://api.serfbound.com` answers for both services with a
  valid certificate; HTTP redirects to HTTPS.
- [ ] Rate limiting demonstrably throttles a burst (recorded), and a
  pod restart plus a node drain lose no store data.
- [ ] A backup exists off-cluster and a restore drill brought a store
  back (recorded); the runbook documents deploy, upgrade, backup,
  restore, and teardown.

## Test plan

- **Unit:** n/a — operations.
- **Integration / e2e:** Service contract tests run against
  `https://api.serfbound.com` (recorded).
- **Manual / device:** Restart/drain/backup/restore drills with
  command output in evidence.
- **Design handoff:** n/a — non-visual.

## Notes / open questions

- Preserves: the abuse posture's stated limits — rate limiting lands;
  collusion/smurfing remain recorded-not-defended.
- Browser boundary: network (the public service endpoint).
- .NET reference use: none.
- Phase gate advanced: exit criterion 3.
- Open: TTL/retention for backups — default 14 daily snapshots;
  record the choice in the runbook.
- SB-29-01 finding: the cluster is shared, with cert-manager and
  Envoy Gateway already installed — reuse them (no ingress-nginx
  install), deploy only into the `serfbound` namespace. Single-node
  pool: the drain criterion narrows to pod-restart + backup/restore
  proof per the hosting-infrastructure decision record.
