# SB-29-01 — Infrastructure Decision and Secrets Boundary

- **Project:** serfbound
- **Phase:** 29
- **Status:** backlog
- **Depends on:** none
- **Unblocks:** SB-29-02
- **Owner:** unassigned

## Problem

The maintainer owns `serfbound.com` and an LKE cluster, but nothing
records what runs where, how credentials are handled, or what this
costs. Deploying before those decisions are written is how secrets
get committed and posture erodes silently.

## Scope

- **In:** A decision record under `adoption/` covering: the domain
  plan (`serfbound.com` → static game, `api.serfbound.com` → cluster
  ingress for identity/mailbox/relay), the secrets boundary
  (kubeconfig and tokens under gitignored `serfbound-local-data/infra/`,
  never committed; a namespace-scoped deploy credential to replace
  routine use of the cluster-admin token), the data/privacy posture
  restated for hosting (what the services hold, no play logs, no
  analytics), backup expectations, and a monthly cost ceiling.
- **Out:** Any cluster mutation beyond read-only verification
  (SB-29-03), image building (SB-29-02).

## Acceptance criteria

- [ ] The decision record exists and answers domain, secrets, data
  posture, backups, and cost ceiling.
- [ ] `git check-ignore serfbound-local-data/infra/dev-kubeconfig.yaml`
  passes and a secret scan of the repo history-to-date is recorded
  clean.
- [ ] Cluster reachability is verified read-only (`kubectl version`,
  node list) with output in evidence — no workloads applied.

## Test plan

- **Unit:** n/a — decision record.
- **Integration / e2e:** Read-only `kubectl` verification against the
  cluster.
- **Manual / device:** n/a.
- **Design handoff:** n/a — non-visual.

## Notes / open questions

- Preserves: the Phase 25 identity decision and the services' honest
  abuse posture; hosting changes where they run, not what they hold.
- Browser boundary: none — operations canon.
- .NET reference use: none.
- Phase gate advanced: exit criterion 1.
- Open: rotate the current cluster-admin token after the scoped deploy
  credential exists (it predates the secrets boundary).
