# Evidence — SB-44-03 Scenario Rigging and the In-Game Verification HUD

## What was verified

The rig harness bakes deterministically, every rig boots the game into its
intended state with the in-game HUD, verdicts captured in-game flow to the
deck's hand-back report, and nothing in normal play changed.

## Bake + self-check (`npm run build:rigs`)

```
✓ phase-35-lumberjack  (local-game, covers 35.1, 35.2, 35.3, 35.4)
✓ phase-36-road-split  (local-game, covers 36.1)
✓ phase-36-haul-chain  (local-game, covers 36.2, 36.3)
✓ phase-37-living-map  (local-game, covers 37.1, 37.2, 37.3, 37.4)
✓ phase-38-full-loop   (local-game, covers 38.1, 38.2, 38.3)
✓ phase-38-fisher / -farm / -forester / -geologist / -fire   (38.4–38.9)
✓ phase-39-border      (local-game, covers 39.1–39.5)
✓ phase-42-editor      (editor-draft, covers 42.1, 42.2, 42.3, 42.5, 42.6)
✓ phase-43-gallery     (gallery, covers 43.1, 43.2, 43.3, 43.5)

Baked 13 rigs → public/rigs/ (manifest covers 33 checks).
```

The 3 uncovered checks (38.8 tool-gating, 42.4 touch feel, 43.4 the
un-built moderation UI) are inherently observational and left un-rigged.

## Self-verifier (`npm run verify:rigs`)

- **Node pass (CI-safe, no data):** 11 local-game rigs each restore to
  `started` and meet their recorded expectations — 0 failures. This gates
  the gate tool against snapshot schema drift.
- **Browser pass (real Chromium + real SPAU.PA):** SPAU.PA imported once,
  then each `?rig=` booted. **13/13 boot and mount the HUD; all 11
  local-game rigs reach "Running."**

```
✓ browser: phase-36-road-split boots + HUD
… (13/13)
```

## Deck integration (`verify-deck.mjs`)

All deck assertions pass (36 checks intact, persistence, report, offline
fallback) plus the new Pass 4:

```
ok - rig deep-link injected: https://serfbound.com/?rig=phase-36-road-split
ok - rig instruction shown on the slide
ok - a check with no rig stays a plain checklist item
ok - a verdict in the shared store reflects in the deck on focus
ok - in-game verdict flows into the hand-back report
ALL DECK ASSERTIONS PASS
```

## No regressions

```
test:unit            → # pass 323  # fail 0
check:boundaries     → serfbound-boundaries-ok
check:independence   → serfbound-independence-ok: zero .NET artifacts
check:design         → serfbound-design-tokens-ok (raw-color ratchet 0/0)
test:docs            → serfbound-docs-ok
```

## Visual proof

`artifacts/rig-road-split.png` — `?rig=phase-36-road-split` on a phone
viewport: the castle and a multi-tile road running to a lone flag (the
road the maintainer splits), with the in-game HUD showing the instruction,
the pass condition, Check 36.1's Pass/Fail/Skip + notes, and Prev/Next.
