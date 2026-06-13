# Evidence — SB-42-01 — The Format and the Boundary

- **Shipped:** 2026-06-13
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/custom-map.ts` (new) — the
  `serfbound.custom-map` v1 format: `SerfboundCustomMap` type,
  `encodeCustomMap`, `decodeCustomMapLandscape`,
  `customMapContentHash`, a typed `CustomMapDecodeError`, and a
  self-contained isomorphic base64. The landscape is base64 of the six
  arrays concatenated in a pinned order (`6 × tileCount` bytes); decode
  structurally validates (size 1..23, exact length, terrain 0..15,
  object 0..127, mineral 0..4) and verifies the FNV-1a content hash —
  reject, never clamp.
- `packages/engine/src/local-game.ts` — `SerfboundLocalGameSettings.customMap?`
  and `landscapeForLocalGameSettings` returning the decoded landscape
  when a custom map is present.
- `packages/engine/src/index.ts` — re-exports the format.
- `pm/roadmap/serfbound/adoption/asset-and-legal-boundary.md` — the
  custom-map addendum: maps are user-authored enum data (no sprite
  bytes), the editor renders real tiles import-gated like playing, the
  service touches no original art, "baking tiles in" stays Phase 31.

## Verification artifacts

```
engine gate (new), stash-verified failing pre-fix (the module does not
exist; the suite cannot import):
  engine-custom-map: # pass 0 / fail 1 (stashed with -u)
post-fix:
  ok 1 - a generated map encodes → decodes byte-identically across all
         six arrays, and the decoded landscape builds a world whose
         computeGameChecksum equals the original's.
  ok 2 - malformed maps reject with typed reasons: invalid-schema
         (bad version / kind), invalid-size, invalid-payload-length
         (truncated), content-hash-mismatch (tampered hash).
  ok 3 - an out-of-range terrain byte (99 > 15) rejects
         out-of-range-terrain even when its hash matches the bad bytes.
  ok 4 - the customMap seam returns the authored landscape (its size
         wins over a deliberately-wrong mapSize), proving it plays
         through the local-game pipeline.
  engine-custom-map: # tests 4 / pass 4

npm test -> exit=0 (unit + build + 32 browser specs)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] Round-trip parity: byte-identical arrays + equal
  computeGameChecksum (engine-gated, stash-verified).
- [x] Malformed payloads reject (length, enum range, hash, size), not
  clamp.
- [x] The customMap seam plays the decoded landscape (engine-gated).
- [x] The boundary addendum landed; full unit sweep + release gates
  green.
