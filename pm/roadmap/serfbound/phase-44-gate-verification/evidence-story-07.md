# Evidence — SB-44-07 Split-Screen Protocol, and a Lumberjack with Trees

## Trees within the lumberjack's reach

`flatTreesMap` rings the settlement at the castle's spiral offsets 19..60,
inside the engine's lumberjack search (offset 1..150, `serfs.ts`
`#workHarvest`). A `tree-near-building` expectation mirrors that exact
bound. The bake + node verify confirm it:

```
node scripts/build-rigs.mjs            → Baked 13 rigs
verify-rigs (node pass):
  ✓ phase-35-lumberjack restores + meets 3 expectation(s)   (incl. tree-near)
  ✓ phase-38-full-loop  restores + meets 3 expectation(s)
  Node pass: 11 local-game rig(s), 0 failure(s)
```

`artifacts/rig-lumberjack-trees.png` — the rig booted in real Chromium with
real SPAU.PA: castle, road, and woods ringing the settlement (the trees the
lumberjack now cuts).

## Split-screen (`verify-deck.mjs`)

```
ok - rig 'Open rig here' button injected on the check
ok - clicking a rig splits the window (game panel shown)
ok - game iframe loads the rig: https://serfbound.com/?rig=phase-36-road-split
ok - pop-out link points at the rig
ok - closing the panel un-splits the window
ALL DECK ASSERTIONS PASS
```

`artifacts/deck-split-lumberjack.png` — the deck on a phone viewport: the
check up top, the game panel (titled "Lumberjack on a road", with ↗/↻/✕)
docked to the bottom half, the rig running inside.

## No regressions

```
npm run test:unit    → # pass 329  # fail 0
check:boundaries / check:design / check:independence / test:docs → all ok
```
