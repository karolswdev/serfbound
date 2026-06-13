# SB-43-03 — The Gallery and Library Shell

- **Project:** serfbound
- **Phase:** 43
- **Status:** done
- **Depends on:** SB-43-01, SB-42-01
- **Unblocks:** SB-43-05
- **Owner:** unassigned

## Problem

Sharing needs a client and the sprite-free thumbnail the gallery shows.
The maps service exists (SB-43-01); the app needs typed functions to
publish/browse/fetch/rate/report/play/delete against it, and a way to
render a map preview that needs no imported data — so the gallery is
browsable on a fresh browser and the service never touches original
art.

## What ships

- `packages/app/src/maps-client.ts`: `publishMap`, `listMaps`
  (size/players filter), `fetchMap`, `rateMap`, `reportMap`,
  `reportMapPlayed`, `deleteMap` — each signing with the device key,
  mirroring the mailbox client. `MapGalleryEntry` is the card shape
  (title, author, thumbnail, rating + count, downloads, times played,
  size, players, date).
- `packages/app/src/map-thumbnail.ts`: `renderMapThumbnail(landscape)`
  — a pure RGBA grid of false-color terrain (`minimapTerrainColors`),
  no decoded sprites; `markThumbnailStarts` overlays the castle starts.

## Acceptance criteria

- [x] The client drives the real (in-process) maps service end to end:
  publish → browse (filtered) → fetch → rate → report-a-play → delete
  (CI-gated, stash-verified).
- [x] The thumbnail is sprite-free false-color: a water bay renders
  blue, grass renders green, every pixel opaque terrain color, and
  start markers overlay (CI-gated).
- [x] Full unit sweep + release gates green.

## Honest limits

- The gallery shell UI (the cards rendered on screen, the browse/
  download/play flow in the shell), the custom-maps IndexedDB library
  store, and the canvas wrapper that turns the thumbnail RGBA into a
  PNG data-URL are the browser surface proven at the device gate
  (SB-43-05); this story is the CI-held client + the pure thumbnail.
- The thumbnail is import-data-free by design; the authentic editor
  render stays import-gated (Phase 42).
