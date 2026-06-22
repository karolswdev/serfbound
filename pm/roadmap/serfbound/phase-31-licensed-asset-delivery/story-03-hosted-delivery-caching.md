# SB-31-03 — Hosted Delivery and Local Caching

- **Project:** serfbound
- **Phase:** 31
- **Status:** done
- **Depends on:** SB-31-02, SB-29-03
- **Unblocks:** SB-31-04
- **Owner:** unassigned

## Problem

A converted package is only faster onboarding if it is somewhere
players can get it. This story hosts the package within the documented
permission scope, and teaches the app to download it once, verify it,
cache it locally, and reuse it offline — exactly the lifecycle the
imported-data path already has after its first import.

## Scope

- **In:** Package hosting per the Phase 29 backbone decision
  (`assets.serfbound.com` or static/CDN — decided against the SB-29-01
  record and the SB-31-01 conditions), integrity-verified download
  (checksum from the provenance block before activation), storage in
  the existing local persistence layer alongside (never replacing)
  imported data, offline reuse after first download, a visible
  source indicator (hosted package vs your imported data) with the
  messaging split from SB-31-01, cache versioning/invalidation when a
  new package version publishes, the documented-permission conditions
  enforced as release-gate checks (e.g. allowed domains, attribution).
- **Out:** Zero-import onboarding UX as the gate (SB-31-04), removing
  or demoting the import path, hosting raw archives.

## Acceptance criteria

- [x] First visit downloads the package once; reload and offline
  restart use the local copy (no re-download), proven in e2e.
- [x] A corrupted or checksum-mismatched download is rejected
  recoverably and never activates.
- [x] Import-your-own-data still works end to end and visibly
  coexists; the source indicator is honest about which is in use.
- [x] The permission-condition checks run in the release gate and
  pass.

## Test plan

- **Unit:** Download/verify/activate state machine; version
  invalidation; corruption rejection (fixture packages).
- **Integration / e2e:** CI against a locally served fixture package:
  download-once, offline reuse, import coexistence. Recorded run
  against the real hosted URL as manual evidence.
- **Manual / device:** First-visit flow on desktop + phone via the
  public URL, captured.
- **Design handoff:** Source-indicator and first-visit screenshots
  under phase artifacts.

## Notes / open questions

- Preserves: imported data never uploads — unchanged and re-asserted;
  hosted delivery is one-directional (server → player).
- Browser boundary: network (package download), persistence (cache
  storage of the package).
- .NET reference use: none.
- Phase gate advanced: exit criterion 3.

## Outcome

Shipped 2026-06-22. The app now accepts a configured licensed package
URL/checksum, verifies the `sb31-runtime-v1` package before activation,
stores it in a dedicated IndexedDB cache, restores it without a second
download, reconstructs the existing decoded render/audio assets from
the package, and records the active source as either `Licensed package`
or `Imported data`. Importing local `SPAU.PA` still works and overrides
the hosted package without uploading anything.

Evidence: `evidence-story-03.md`.
