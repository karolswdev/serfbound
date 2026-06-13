# Evidence — SB-43-03 — The Gallery and Library Shell

- **Shipped:** 2026-06-13
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/app/src/maps-client.ts` (new) — the signed client:
  `publishMap`, `listMaps` (size/players filter), `fetchMap`,
  `rateMap`, `reportMap`, `reportMapPlayed`, `deleteMap`, and the
  `MapGalleryEntry` card shape. Mirrors the mailbox client's
  sign-and-request pattern.
- `packages/app/src/map-thumbnail.ts` (new) — `renderMapThumbnail`
  (pure RGBA false-color terrain via `minimapTerrainColors`, the drier
  triangle reads the tile, objects shade darker) and
  `markThumbnailStarts` (castle-start overlay).
- `packages/app/src/main.ts` — re-exports both.

## Verification artifacts

```
gates (new), stash-verified failing pre-fix (the modules do not exist;
the suite cannot import):
  app-maps-client: # pass 0 / fail 1 (stashed -u)
post-fix (in-process maps service, no SPAU.PA):
  ok 1 - the client publishes a map, lists it in the gallery, fetches
         it whole, rates it 5, counts a play, filters by player count
         (in/out), and deletes it.
  ok 2 - the thumbnail is sprite-free false-color: a water bay renders
         blue (00 00 af ff), grass renders greener-than-blue, every
         pixel is opaque terrain color, and a start marker overlays.
  app-maps-client: # tests 2 / pass 2

npm test -> exit=0 (unit + build + 32 browser specs)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] The client drives the real service end to end (CI-gated,
  stash-verified).
- [x] The thumbnail is sprite-free false-color with start markers
  (CI-gated).
- [x] Full unit sweep + release gates green.

## Note

The on-screen gallery shell, the custom-maps IndexedDB library store,
and the RGBA→PNG-data-URL canvas wrapper are the browser surface for
the device gate (SB-43-05). This story is the CI-held client + the
pure thumbnail the gallery renders.
