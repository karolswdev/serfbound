# SB-29-02 — Service Containers and Manifests

- **Project:** serfbound
- **Phase:** 29
- **Status:** done
- **Depends on:** SB-29-01
- **Unblocks:** SB-29-03
- **Owner:** unassigned

## Problem

The identity and mailbox services run as bare Node processes from a
runbook. The cluster needs them as images plus declarative manifests,
without changing a line of their behavior or widening their data
surface.

## Scope

- **In:** Minimal OCI images for `services/identity` and
  `services/mailbox` (Node 22 base, zero added dependencies),
  Kubernetes manifests under `deploy/` (Deployment, Service,
  PersistentVolumeClaim for each JSON store, resource limits,
  liveness/readiness probes against existing endpoints), CI-safe
  manifest validation (kubeconform or equivalent, no cluster needed),
  image publishing to GHCR from CI, the existing service contract
  tests run against containerized instances.
- **Out:** Applying anything to the cluster, DNS/TLS/ingress
  controller install (SB-29-03), the signaling relay (added when
  Phase 27 ships it).

## Acceptance criteria

- [ ] Both images build reproducibly and run the services with stores
  on a mounted volume.
- [ ] The full service contract test suite passes against the
  containerized services (recorded run).
- [ ] Manifests validate in CI and GHCR publishing works from a CI
  run (image digests in evidence).

## Test plan

- **Unit:** Existing service contract tests, target switched to the
  containerized instances locally.
- **Integration / e2e:** Container start → contract suite → restart →
  store-survives proof.
- **Manual / device:** n/a.
- **Design handoff:** n/a — non-visual.

## Notes / open questions

- Preserves: service behavior byte-for-byte — the four-field schema
  contract test and size caps are the regression net.
- Browser boundary: none — packaging.
- .NET reference use: none.
- Phase gate advanced: exit criterion 2.
