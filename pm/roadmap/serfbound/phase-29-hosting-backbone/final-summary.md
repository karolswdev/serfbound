# Phase 29 — Final Summary

- **Phase opened:** 2026-06-11
- **Phase closed:** 2026-06-11
- **Chunks shipped:** 4

## Goal — was it met?

> Activate the optional online backbone the maintainer now owns: the
> registered `serfbound.com` domain and a Linode LKE cluster. Deploy
> the Phase 25 identity and mailbox services behind HTTPS at a public
> URL, point `serfbound.com` at the game, and land the shell online
> surface — closing the named follow-up from the Phase 25 final
> summary. Serverless, accountless play remains first-class forever.

**Yes.** `https://serfbound.com` serves the game (own certificate,
HTTPS enforced); `https://api.serfbound.com` serves the identity and
mailbox services from the cluster; the shell's online surface
(device-key sign-in, challenge lobby, your-turn badge) plays real
correspondence matches through the public backbone to dual
attestation; and the outage regression proves a dead backbone costs
accountless play nothing. The Phase 25 named gap — "the shell's
online UI awaits a deployed service URL" — is closed (the ladder view
within it was scoped to Phase 30 at scaffold time and is unblocked,
not outstanding).

## Exit criteria — final state

- [x] Decision record, secrets boundary, clean history scan, read-only
  cluster verification — [evidence-story-01](./evidence-story-01.md).
- [x] Images + manifests validate; contract suites pass containerized
  with a store-restart proof; GHCR digests from CI —
  [evidence-story-02](./evidence-story-02.md).
- [x] `api.serfbound.com` live: TLS, redirect, all ten contract tests
  over the public internet, edge rate limiting (59× 429), pod-restart
  persistence, backup/wipe/restore drill —
  [evidence-story-03](./evidence-story-03.md).
- [x] `serfbound.com` serves the game; a real public-backbone match to
  dual attestation (boundary 1088464342 agreed both sides); outage
  regression green; accountless play untouched —
  [evidence-story-04](./evidence-story-04.md).

## Stories shipped

| ID | Title | Commit | Date |
|---|---|---|---|
| SB-29-01 | Infrastructure decision and secrets boundary | 1446778 | 2026-06-11 |
| SB-29-02 | Service containers and manifests | 344e78d + de04800 | 2026-06-11 |
| SB-29-03 | Cluster deployment, DNS, TLS | 17b0e35 + 1ec1115 | 2026-06-11 |
| SB-29-04 | Online surface and hosting gate | 896dd12 + this commit | 2026-06-11 |

## Stories cut or deferred

None cut. Scoped-forward at scaffold time: ladder/leaderboard view
(SB-30-01), online match resume-after-reload (Phase 30/27), the
signaling relay deployment (when Phase 27 ships it).

## Surprises and lessons

- **The cluster was shared**, with cert-manager and Envoy Gateway
  already installed and other tenants present — the phase adapted to
  namespace isolation, platform reuse, and a single-node resilience
  posture instead of installing duplicates.
- **Two Cloudflare zones for one domain**: records created in the
  non-delegated zone do nothing; the tell is the authoritative SOA
  serial never moving. Cost one DNS round-trip with the maintainer.
- **Order matters for Pages certificates**: registering the custom
  domain before DNS exists stalls issuance; clear and re-set the
  cname to re-trigger. The maintainer's "black page" was a browser
  HTTPS auto-upgrade against the not-yet-issued certificate.
- **Per-suite store isolation** matters once services persist: suites
  written against fresh in-process instances interfere through a
  shared live store (`node --test` parallelism, rating residue). The
  container harness resets stores between suites; the public ladder
  run needed the same.
- **Rate limiting found its home at the Cloudflare edge** (free rule)
  because the shared cluster has no gateway policy CRDs — recorded
  with its trade-off (the edge sees signed, trustless payloads).

## Handoff to phase 30

- Now available: `https://api.serfbound.com` (identity + mailbox,
  pristine stores), `https://serfbound.com` (the game, current build),
  the shell online surface with sign-in/lobby/badge, the
  `SerfboundOnlineMatch` controller, `fetchLadder` and rating data
  flowing on dual-attested results.
- Contract/canon changes: `adoption/hosting-infrastructure-decision.md`
  is new canon; `services/README.md` documents the actual deployment;
  the kubeconfig lives only in `serfbound-local-data/infra/`.
- Read first: this summary, evidence-story-03/04, the decision record.

## Final asset / test posture

- Unit: 234 tests (was 225 at phase open). Browser: 16 specs in 11
  files (was 14 suites), including the online gate and outage
  regression. Service contract suites runnable in-process,
  containerized, and against the public URL.
- Hosted footprint: one namespace on the shared LKE cluster, two
  Deployments/Services/PVCs, two gateway listeners, one Certificate,
  GHCR images `serfbound-identity` / `serfbound-mailbox` (public).
- Phase artifacts: four screenshots (public lobby, your-turn badge,
  ended match, serfbound.com landing).
