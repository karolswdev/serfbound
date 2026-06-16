# Evidence — SB-44-04 The In-Game Results Report

## What was verified

A verdict recorded inside the game flows into a hand-back report exported
from the in-game HUD, and persists to the shared store — closing the gate
protocol loop without the deck.

## Real Chromium + real SPAU.PA

SPAU.PA imported once, then `?rig=phase-36-road-split` booted, a Pass
recorded on check 36.1 via the in-game panel, the **Report** control
opened:

```
ok  - report groups by gate (SB-36-06)
ok  - report records the in-game verdict     ([36.1] ✓ pass)
ok  - verdict written to the shared store

IN-GAME REPORT OK
```

## No regressions

```
tsc -b (engine, assets, test-support, app)  → exit 0
npm run test:unit                            → # pass 323  # fail 0
```

The change is confined to the `?rig=`-gated HUD overlay; the deck's own
report path (verify-deck Pass 4, SB-44-03) is unchanged.
