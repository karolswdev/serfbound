# Evidence — SB-26-01 — Amiga Corpus Evaluation

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## What shipped

`amiga-evaluation.md` — the decision record: **NO-GO**, with the
gating fact (the local inventory holds only the English DOS demo
corpus; no Amiga files exist, and the project does not acquire game
data on a player's behalf), the full reference-loader inventory of
what GO requires (six data files, LZ unpacking, planar/interlaced
sprite decoding against six hardcoded palettes, sampled sounds +
tracker music, a different catalog shape — ~2,000 lines of
`DataSourceAmiga.cs` read archive-side for inventory only), the
architectural readiness note (decoders land behind the typed catalog;
no engine changes), and the explicit re-opening condition.

## Verification artifacts

```text
find serfbound-local-data -type d ->
  sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN (only)
Freeserf.Core/Data/DataSourceAmiga.cs (archive) -> 2047 lines;
  files: gfxheader, gfxfast, gfxchip, gfxpics, sounds, music;
  DecodeInterlasedSprite + six palettes; Decode/Unpack compression
```

## Deviations from plan

- "If a corpus exists locally, metadata oracle outputs are captured" —
  no corpus exists; the oracle-capture step is part of the recorded
  re-opening plan instead.
- No-go was an anticipated valid outcome in the story's own design;
  this is it, named with its blocking fact.

## Follow-ups

- SB-26-02 closes as not-applicable under the no-go (its criterion was
  conditional); SB-26-03 begins localization.
