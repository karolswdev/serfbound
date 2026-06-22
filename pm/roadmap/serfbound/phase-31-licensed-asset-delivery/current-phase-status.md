# Phase 31 — Licensed Asset Delivery

**Last updated:** 2026-06-22 (Phase complete: `serfbound.com` serves
`/licensed-assets/manifest.json` and
`serfbound-demo-dos-en.sb31.json`; the live public audit passes with
package checksum `fnv1a32:3ddba0a7` and source checksum
`fnv1a32:08dbd8c7`; clean desktop and phone contexts reach active play
with zero import steps, then reload offline and start again from the
IndexedDB package cache.)
**Status:** complete — all Phase 31 exit criteria met.

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
This phase exists to act on that. SB-31-01 turned the phone-call report
into the written project record (`LICENSE-CONSENT.md`) and revised the
project's load-bearing asset boundary
(`adoption/asset-and-legal-boundary.md`). The remaining stories now
follow the written record, not the earlier verbal report.

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

- **The written record governs.** SB-31-01 is complete; any conversion,
  package shape, host, attribution, provenance, or player-facing copy
  must stay inside `LICENSE-CONSENT.md` and the amended
  `asset-and-legal-boundary.md`.
- The import-your-own-data path remains first-class forever — players
  who prefer their own files lose nothing.
- The converted package carries provenance: format version, source
  checksums, the permission reference, and a license note inside the
  artifact.
- Hosting scope follows the document exactly: if the grant names
  conditions (domains, formats, attribution), they become contract
  tests or release-gate checks, not good intentions.

## Exit criteria (evidence required)

- [x] The written permission record is committed, and the asset/legal
  boundary canon is revised citing it. (SB-31-01)
- [x] The conversion pipeline produces a deterministic, checksummed,
  inspectable package from original archives, reproducibly. (SB-31-02)
- [x] The hosted package downloads once, caches locally, survives
  offline restarts, and the import path still works. (SB-31-03)
- [x] A first-time visitor on `serfbound.com` reaches active play with
  zero import steps — e2e, with the legal posture re-audited.
  (SB-31-04)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-31-01 | Permission record and boundary revision | done | story-01-permission-record.md | evidence-story-01.md |
| SB-31-02 | Deterministic asset conversion pipeline | done | story-02-conversion-pipeline.md | evidence-story-02.md |
| SB-31-03 | Hosted delivery and local caching | done | story-03-hosted-delivery-caching.md | evidence-story-03.md |
| SB-31-04 | Zero-import play gate | done | story-04-zero-import-play-gate.md | evidence-story-04.md |

## Where we are

Scaffolded 2026-06-11, the day of the reported Blue Byte call. On
2026-06-22, SB-31-01 recorded the written consent and revised the
boundary canon; SB-31-02 shipped the deterministic conversion pipeline
and package inspector; SB-31-03 shipped the configured hosted package
download/verify/cache/activate path. SB-31-04 has now landed the CI
zero-import/offline fixture gate, the no-manifest storage privacy
regression guard, the repository-hosted converted package/manifest, and
the public-origin audit command. The package commit was pushed to
`main`, GitHub Pages deployed it, the live `serfbound.com` audit passed,
and clean desktop/phone contexts proved first-visit active play plus
offline package-cache restore. Phase 31 is complete.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| The written record lacks email timestamps | low | `LICENSE-CONSENT.md` records 2026-06-22 as the PMO record date and names the transcript limitation | A later dated source conflicts with this record |
| The written grant is narrower than implementation assumptions | medium | Boundary revision follows the document, not the conversation | Any shipped behavior exceeding the documented scope |
| Hosted assets blur the "your data never leaves your machine" promise | medium | Separate, loud messaging: hosted package is Serfbound-distributed under license; imported data still never uploads | Player-facing copy conflating the two paths |
| Provenance/scope drift in the artifact | low | Version, checksums, permission reference, and content checksum baked into the package; release-gate check | A published package missing its provenance block |
| Public package freshness after future deploys | medium | Keep `npm run audit:licensed-assets:public -- --base https://serfbound.com` in the release runbook | Audit fails or reports unexpected package/provenance |
| Broader corpus scope drift | medium | DOS EN demo package is the first hosted corpus; any additional corpus follows the written record and gets its own PMO evidence | A new package appears without provenance and legal re-audit |

## Decisions made (this phase)

- 2026-06-11 — Phase scaffolded blocked-first: documentation before
  implementation — maintainer report + PMO "evidence, not vibes" rule —
  PMO.
- 2026-06-22 — The written consent record exists and unblocks Phase 31
  engineering. Raw original archive redistribution remains forbidden;
  the authorized path is browser-native converted runtime packages with
  provenance and integrity checks.
- 2026-06-22 — The licensed package format is `sb31-runtime-v1`,
  canonical JSON with no generation timestamp, sorted resources, source
  checksum, content checksum, and inspectable decoded payloads. The
  CLI lives at `scripts/convert-licensed-assets.mjs`.
- 2026-06-22 — Hosted package delivery is configuration-driven:
  `licensedAssetPackage` supplies the package URL and
  `licensedAssetChecksum` supplies the release checksum. The browser
  activates only verified packages, stores them separately from imported
  archives, and lets imported `SPAU.PA` override the hosted source.
- 2026-06-22 — Zero-import delivery discovers the default
  `/licensed-assets/manifest.json` path when no query override is
  present. If no manifest is present and no package was previously
  cached, startup leaves `serfbound-licensed-assets` uncreated.
- 2026-06-22 — The final public run uses
  `npm run audit:licensed-assets:public -- --base https://serfbound.com`
  before desktop/phone capture. After the Pages deploy, the command
  passes against `https://serfbound.com/licensed-assets/manifest.json`.
- 2026-06-22 — The first repository-hosted converted package is
  `public/licensed-assets/serfbound-demo-dos-en.sb31.json`, referenced
  by `public/licensed-assets/manifest.json`; local release preview audit
  verifies package checksum `fnv1a32:3ddba0a7`, source checksum
  `fnv1a32:08dbd8c7`, 34 resources, 2,233 sprites, 39 SFX, and
  4 music tracks.

## Decisions deferred

- Which language/version corpora the grant covers (DOS EN first;
  Amiga reopening condition from Phase 26 unaffected) — follows the
  written record.
- Whether the demo-version corpus is hosted alongside the full data —
  follows the written record.
