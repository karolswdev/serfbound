# Amiga Data Support — evaluation and decision (SB-26-01)

**Recorded:** 2026-06-10. **Decision: NO-GO (for now)** — re-openable
the day a lawful corpus exists.

## Corpus availability — the gating fact

The local data inventory (`serfbound-local-data/sources/`) holds
exactly one corpus: the English DOS demo
(`Serf-City-Life-is-Feudal_DOS_EN`, including the `SPAU.PA` the whole
DOS pipeline is proven against). **No Amiga files exist locally**, and
acquiring copyrighted game data is not something this project does on
a player's behalf — the same boundary that governs DOS data. Without a
lawfully-owned corpus there is nothing to run parity against, and the
DOS-grade standard (real-data decode parity, opt-in local tests,
visual-gate captures) is the recorded bar Amiga support must meet. A
port without that corpus would be untested code wearing a feature's
name.

## What GO would require (from the reference loader inventory)

`Freeserf.Core/Data/DataSourceAmiga.cs` (archive repository, ~2,000
lines, read-only inventory):

- **Six data files** replace the single `SPAU.PA`: `gfxheader`,
  `gfxfast`, `gfxchip`, `gfxpics`, `sounds`, `music`.
- **Different compression**: an LZ-style `Decode`/`Unpack` pass over
  most files before any sprite parsing.
- **Different sprite encodings**: planar/interlaced bitmaps
  (`DecodeInterlasedSprite`, plane counts per resource), masks, and
  ~six hardcoded palettes (main, intro, logo, symbols, two more) —
  versus the DOS palette-indexed run formats.
- **Different audio**: raw sample sounds and a tracker-style `music`
  file — versus DOS PCM clips and XMI.
- **Catalog shape**: data pointers into decoded buffers rather than the
  DOS 4,000-entry offset table.

The architecture is ready for this: decode lives behind
`@serfbound/assets`' typed catalog (the SB-25 era proved the engine and
renderer never see archive formats), so GO means parallel decoders plus
an import path that recognizes the six-file set — no engine changes.

## Re-opening condition

A player-owned Amiga corpus lands under `serfbound-local-data/sources/`
→ reopen SB-26-02 with the DOS-grade plan: metadata oracle capture,
opt-in parity tests, synthetic CI fixtures, visual-gate captures.

## Consequence for this phase

SB-26-02 (Amiga decoders) closes as **not applicable under the no-go**
— the exit criterion was explicitly conditional ("If go: …"). The
phase's delivered breadth is localization (SB-26-03/04).
