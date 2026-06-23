# Phase 43 Final Summary — Community Maps

**Closed:** 2026-06-22.
**Status:** complete.

Phase 43 shipped the full community-map sharing path without putting
original game data on the wire. The maps service verifies device-key
signatures, stores structurally validated custom-map records, hides
reported/quarantined entries from the gallery, enforces the payload cap
and per-key quota, and carries title/author moderation plus opt-in play
counts.

The browser shell now exposes that backbone to players. A signed-in
device key can publish the open editor map, browse/filter/sort the
gallery, rate/report entries, download a map into the local
`serfbound-custom-maps` IndexedDB library, and play the downloaded map
with the player's own data. Gallery thumbnails are generated from the
sprite-free false-color terrain renderer, not decoded original sprites.

The deterministic custom-map seam is also covered below the UI:
custom-map content hashes are part of session protocol v2, and CI proves
a community map can run through the multiplayer determinism path without
checksum divergence.

Evidence:

- `evidence-story-01.md` — maps service publish/list/fetch, validation,
  no-original-data contract, moderation primitives.
- `evidence-story-02.md` — backbone deployment record for
  `api.serfbound.com/maps`.
- `evidence-story-03.md` — signed maps client and sprite-free thumbnail
  renderer.
- `evidence-story-04.md` — custom-map multiplayer hash/protocol proof.
- `evidence-story-05.md` — title/author moderation and per-key quota.
- `evidence-story-06.md` — signed play-count endpoint.
- `evidence-story-07.md` — on-screen gallery/library/device gate.
