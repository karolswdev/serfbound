# SB-42-01 — The Format and the Boundary

- **Project:** serfbound
- **Phase:** 42
- **Status:** done
- **Depends on:** nothing (the safe foundation, deliberately first)
- **Unblocks:** SB-42-02, SB-42-03, SB-42-04, SB-43-*
- **Owner:** unassigned

## Problem

A custom map needs a serializable, self-verifying format before any
editor can save one or any service can share one. The engine already
plays an arbitrary landscape — `SerfboundGameWorld`'s constructor takes
a `ClassicMapLandscape` value, not a seed (`continueFromDosSavegame`
proves it) — so the only missing piece to *play* an authored map is a
format that round-trips the six landscape arrays losslessly and a seam
that feeds it into the local game. This story builds that foundation
and records the asset-boundary decision it rests on.

## Codebase ground truth

- `ClassicMapLandscape` (map-generator.ts) — six `Uint8Array`s
  (heights, typesUp, typesDown, objects, minerals, resourceAmounts),
  each `tileCount` bytes, plus size/columns/rows/tileCount derived from
  `MapGeometry`.
- `MapGeometry` rejects size outside 1..23 (index.ts).
- `StateHasher` (checksum.ts) is the FNV-1a primitive — `.bytes()` over
  the arrays gives the canonical content hash, the same family
  `computeGameChecksum` uses.
- `landscapeForLocalGameSettings` (local-game.ts) is the seam: it
  returns a generated landscape today; with a custom map present it
  returns the decoded one.

## What ships

- `packages/engine/src/custom-map.ts`: the `serfbound.custom-map` v1
  type, `encodeCustomMap(landscape, meta)`, `decodeCustomMap(record)`,
  and `customMapContentHash(landscape)`. The landscape payload is a
  self-contained base64 of the six arrays concatenated in fixed order
  (`6 × tileCount` bytes); decode structurally validates (size 1..23,
  exact byte length, terrain 0..15, object 0..127, mineral 0..4) and
  verifies the declared FNV-1a content hash — **reject, never clamp**.
- The `customMap` seam: `SerfboundLocalGameSettings.customMap?` and
  `landscapeForLocalGameSettings` returning the decoded landscape when
  present.
- An addendum to `asset-and-legal-boundary.md`: custom maps are
  user-authored data (integer terrain/object indices, no sprite bytes);
  the editor renders the real tiles import-gated like playing; "baking
  the tiles in" is Phase 31.

## Acceptance criteria

- [x] Round-trip parity (CI-safe, no SPAU.PA): generate a map → encode
  → decode → the six arrays are byte-identical and `computeGameChecksum`
  of the decoded world equals the original (engine-gated,
  stash-verified).
- [x] Malformed payloads reject, not clamp: wrong byte length, an
  out-of-range terrain/object/mineral byte, a tampered content hash,
  and a bad size each throw a typed rejection.
- [x] A custom map fed through the `customMap` seam plays — the world
  builds from the decoded landscape (engine-gated).
- [x] The boundary addendum lands; full unit sweep + release gates
  green.

## Honest limits

- The authoring metadata (title, author key, thumbnail) is carried in
  the format but the gallery/service that consume it are Phase 43.
- The `starts` (per-player castle positions) are stored but the editor
  that authors them is SB-42-03; SB-42-01 round-trips them verbatim.
