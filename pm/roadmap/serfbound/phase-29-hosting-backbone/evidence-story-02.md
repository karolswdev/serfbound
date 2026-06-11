# Evidence — SB-29-02 — Service Containers and Manifests

- **Shipped:** 2026-06-11
- **Commit:** 344e78d (implementation) + this commit (flip)
- **Owner:** KC (agent-assisted)

## Files touched

- `services/identity/Dockerfile`, `services/mailbox/Dockerfile` —
  Node 22 Alpine, zero added dependencies, non-root, `/data` store
  volume.
- `deploy/namespace.yaml`, `deploy/identity.yaml`,
  `deploy/mailbox.yaml`, `deploy/README.md` — Deployment + Service +
  PVC per service; one replica, `Recreate` over RWO, TCP probes
  (service code unchanged), resource limits.
- `tests/ci/service-{identity,mailbox,ladder}.test.mjs` —
  URL-override mode (`SERFBOUND_IDENTITY_URL` /
  `SERFBOUND_MAILBOX_URL`) so the same contract suites target
  external instances; in-process default unchanged.
- `scripts/test-services-containers.mjs` + `npm run
  test:services:containers` — opt-in docker harness.
- `.github/workflows/services.yml` — manifest validation +
  GHCR publish; `npm run check:manifests` for local validation.

## Verification artifacts

Manifest validation (local and in CI run 27331718108):

```
Summary: 7 resources found in 3 files - Valid: 7, Invalid: 0, Errors: 0, Skipped: 0
```

In-process contract suites after the URL-override change (no
regression): `# tests 10 / # pass 10 / # fail 0`.

Containerized run (`npm run test:services:containers`):

```
== building images
== starting containers (stores on mounted volumes)
== running the contract suites against the containers
# tests 4  # pass 4  # fail 0      (identity)
# tests 3  # pass 3  # fail 0      (mailbox)
# tests 3  # pass 3  # fail 0      (ladder)
== proving the store survives a container restart
   account e0e37ce7abc8… survived the restart
test-services-containers: all checks passed.
```

CI publish — workflow "Services" run 27331718108 on 344e78d, all
jobs green. Published images (public, digests fetched from the
registry):

```
ghcr.io/karolswdev/serfbound-identity:latest
  sha256:0961d257ec1af4002ee62f6516272da8c895d7d0ed6e8744c3caebf200f3614a
ghcr.io/karolswdev/serfbound-mailbox:latest
  sha256:277d7f7ed27db57c1547e8cf932f606bc51d621345d741db112c137500260664
```

Main CI (run 27331718102) also green on 344e78d — the full
data-free release gate passed with the test changes.

## Acceptance criteria — re-checked

- [x] Both images build reproducibly and run the services with
  stores on a mounted volume — built by the harness and by CI;
  containers ran with `.tmp` volume mounts.
- [x] The full service contract test suite passes against the
  containerized services — 4+3+3 recorded above. Each mailbox-backed
  suite gets a fresh container store, mirroring the per-file
  isolation of the in-process mode.
- [x] Manifests validate in CI and GHCR publishing works from a CI
  run — kubeconform 7/7 in run 27331718108; image digests above.

## Deviations from plan

Running the mailbox and ladder suites in one `node --test`
invocation against a single shared container surfaced cross-suite
interference (the in-process mode isolates per file; `node --test`
parallelizes files). The harness now resets the mailbox container
store between suites. Noted: the services' load-mutate-save store
pattern is not safe under concurrent interleaved writes — fine at
Phase 25 stakes and single-replica deployments (manifests pin
`replicas: 1`, `Recreate`), recorded here rather than silently.

## Follow-ups

- SB-29-03 deploys these manifests; the GHCR images are public —
  no imagePullSecret needed.
- The CI digest summary lands in the workflow step summary; the
  registry is the canonical digest source.
