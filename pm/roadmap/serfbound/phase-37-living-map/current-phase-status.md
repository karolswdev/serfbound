# Phase 37 — The Living Map

**Last updated:** 2026-06-11 (scaffolded from the reference parity
audit; see pm/roadmap/serfbound/reference-parity-audit.md).
**Status:** scaffolded.

## Goal

The map changes without the player: trees and pines grow from
saplings, felled trunks decay to stubs and vanish, sown fields
advance through their stages on the map clock and expire, fish
spawn and migrate between water tiles, prospecting signs fade. The
forester plants something that takes time to become a tree.

## Reference ground truth (Map.cs Update/UpdatePublic/UpdateHidden)

- NewTree/NewPine mature on `(rand & 0x300) == 0` to a random
  Tree0..7/Pine0..7; FelledTree0..4/FelledPine0..4 → Stub; Stub →
  None at 25%.
- Seeds0..5 → Field0..5 → FieldExpired → None, on the map clock,
  not inside the farmer.
- Fish: water tiles with stock spawn on 15/16 odds under 10, and
  migrate to adjacent water (4 directions).
- Signs decay on the RemoveSignsCounter cadence (reset 16).
- Cadence: regions × (counter/20) tiles per game update.

## Exit criteria (evidence required)

- [ ] The map update loop runs the reference cadence and the
  tree/felled/stub lifecycle; the forester plants NewTree, and the
  instant-maturity shortcut is deleted. (SB-37-01)
- [ ] Fields advance and expire on the map clock; the farmer sows
  and harvests what the MAP grew. (SB-37-02)
- [ ] Fish spawn and migrate; a fished-out bay recovers. (SB-37-03)
- [ ] Determinism holds: ambience rides the shared RNG and the
  lockstep checksum gates stay green. (every story)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-37-01 | Trees grow and stumps rot | backlog | — | — |
| SB-37-02 | Fields on the map clock | backlog | — | — |
| SB-37-03 | Fish | backlog | — | — |
