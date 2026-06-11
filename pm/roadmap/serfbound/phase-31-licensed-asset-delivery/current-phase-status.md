# Phase 31 — Licensed Asset Delivery

**Last updated:** 2026-06-11.
**Status:** not started — **blocked at SB-31-01 until the
rights-holder permission exists in writing.**

## Goal

Remove the last onboarding friction with the rights-holder's blessing:
convert the original Settlers asset files into a deterministic,
inspectable browser-native cache package and host it for players, so
the browser downloads it once, stores it locally, and the game starts
with zero import steps — where, and only where, that permission is
documented.

## Background

On 2026-06-11 the maintainer reported a phone conversation with
Blue Byte: rights-holder confirmation that Serfbound may translate the
original asset files into a browser-native cache format and host the
converted assets for players **where that permission is documented**.
This phase exists to act on that — and its first story exists to turn
a phone call into a document. The project's asset boundary
(`adoption/asset-and-legal-boundary.md`) has been load-bearing since
Phase 0 and is restated across the README, services, and player docs;
it is revised only on written evidence, never on a verbal report.

## Scope

- **In:** Obtaining and committing the written permission record
  (scope, parties, what may be hosted, conditions), the revision of
  the asset/legal boundary canon it authorizes, a deterministic
  conversion pipeline (original archives → versioned, checksummed,
  inspectable runtime package), hosted delivery of the package over
  the Phase 29 backbone with download-once local caching, the
  zero-import play gate.
- **Out:** Anything shipping before the written record lands,
  redistribution of raw original archives (the permission as reported
  covers the converted format), changes to the identity/mailbox
  services (asset delivery is static content, not a service surface),
  monetization of any kind.

## Non-negotiable constraints

- **The verbal report unblocks nothing.** Until a written grant is
  committed (or stored with a committed faithful record if the
  document itself cannot be published), every other story in this
  phase stays blocked, and no converted asset leaves a developer
  machine.
- The import-your-own-data path remains first-class forever — players
  who prefer their own files lose nothing.
- The converted package carries provenance: format version, source
  checksums, the permission reference, and a license note inside the
  artifact.
- Hosting scope follows the document exactly: if the grant names
  conditions (domains, formats, attribution), they become contract
  tests or release-gate checks, not good intentions.

## Exit criteria (evidence required)

- [ ] The written permission record is committed, and the asset/legal
  boundary canon is revised citing it. (SB-31-01)
- [ ] The conversion pipeline produces a deterministic, checksummed,
  inspectable package from original archives, reproducibly. (SB-31-02)
- [ ] The hosted package downloads once, caches locally, survives
  offline restarts, and the import path still works. (SB-31-03)
- [ ] A first-time visitor on `serfbound.com` reaches active play with
  zero import steps — e2e, with the legal posture re-audited.
  (SB-31-04)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-31-01 | Permission record and boundary revision | backlog | story-01-permission-record.md | — |
| SB-31-02 | Deterministic asset conversion pipeline | backlog | story-02-conversion-pipeline.md | — |
| SB-31-03 | Hosted delivery and local caching | backlog | story-03-hosted-delivery-caching.md | — |
| SB-31-04 | Zero-import play gate | backlog | story-04-zero-import-play-gate.md | — |

## Where we are

Scaffolded 2026-06-11, the day of the reported Blue Byte call. The
phase is intentionally blocked at its first story: SB-31-01 turns the
verbal confirmation into the written record everything else cites.
SB-31-02 may be prototyped locally meanwhile (conversion of one's own
data is what the project has always done) but nothing is hosted or
shipped player-facing until SB-31-01 closes.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| The verbal permission never materializes in writing | medium | SB-31-01 is the hard gate; the phase dies cleanly if unmet | No written record obtainable → phase closed unshipped, boundary unchanged |
| The written grant is narrower than the call suggested | medium | Boundary revision follows the document, not the conversation | Any shipped behavior exceeding the documented scope |
| Hosted assets blur the "your data never leaves your machine" promise | medium | Separate, loud messaging: hosted package is Serfbound-distributed under license; imported data still never uploads | Player-facing copy conflating the two paths |
| Provenance/scope drift in the artifact | low | Version, checksums, permission reference baked into the package; release-gate check | A published package missing its provenance block |

## Decisions made (this phase)

- 2026-06-11 — Phase scaffolded blocked-first: documentation before
  implementation — maintainer report + PMO "evidence, not vibes" rule —
  PMO.

## Decisions deferred

- Delivery host (`assets.serfbound.com` on the LKE ingress vs Pages/CDN
  static) — decided in SB-31-03 against the Phase 29 decision record.
- Which language/version corpora the grant covers (DOS EN first;
  Amiga reopening condition from Phase 26 unaffected) — follows the
  written record.
- Whether the demo-version corpus is hosted alongside the full data —
  follows the written record.
