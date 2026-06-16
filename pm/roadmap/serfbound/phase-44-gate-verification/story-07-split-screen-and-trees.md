# SB-44-07 — Split-Screen Protocol, and a Lumberjack with Trees

- **Project:** serfbound
- **Phase:** 44
- **Status:** done
- **Depends on:** SB-44-03 (rigs + deck deep-links), SB-44-05 (hosted same-origin deck)
- **Unblocks:** a protocol that actually feels like a tool — read the check and play the rig in one window
- **Owner:** unassigned

## Problem

Two things surfaced the moment the maintainer ran the protocol on a device:

1. **The lumberjack rig had no tree to cut.** `flatTreesMap` placed its
   woods in a far quadrant (~68 tiles from the start), but the engine's
   lumberjack only searches spiral offset 1..150 from its hut (~7 tiles).
   So the hut stood by the castle with nothing in reach — the felling
   check (35.4) could never happen.
2. **The protocol made you tab-hop.** "Open rig" launched the game in a
   new tab, so reading a check and assessing it meant switching windows —
   exactly the friction that makes a tool feel like a checklist.

## What ships

- **Woods within reach.** `flatTreesMap` now rings the settlement at the
  castle's spiral rings 3..5 (offsets 19..60) — inside the lumberjack's
  150-offset search, while the inner rings stay clear for the castle, hut,
  and road. A new `tree-near-building` rig expectation mirrors the engine's
  exact search bound, so the bake fails if a felling rig ever lacks a
  cuttable tree again.
- **Split-screen.** The deck cuts the window horizontally: the check rides
  the top, and **▶ Open rig here** loads the rig into a game panel docked
  to the bottom half — same-origin, so the iframe shares the imported
  SPAU.PA and the verdict store. Read the check up top, play below, mark
  Pass/Fail/note on the check — no second tab. The panel bar carries reload
  (↻), pop-out-to-tab (↗), and close (✕).

## freeserf.net boundary

Held. The tree fix is test-support map authoring (integer object bytes,
no original data); the split-screen is deck tooling. No engine, asset, or
player-runtime code changes.

## Acceptance criteria

- [x] Every felling rig has a cuttable tree within the lumberjack's reach
  (`tree-near-building` expectation; `verify-rigs` node pass meets it for
  `phase-35-lumberjack` and `phase-38-full-loop`).
- [x] The lumberjack rig renders woods ringing the settlement
  (`artifacts/rig-lumberjack-trees.png`).
- [x] "Open rig here" splits the window and loads the rig into the game
  panel; close un-splits; the pop-out points at the rig (`verify-deck.mjs`,
  ALL DECK ASSERTIONS PASS).
- [x] The split-screen renders deck-over-game (`artifacts/deck-split-lumberjack.png`).
