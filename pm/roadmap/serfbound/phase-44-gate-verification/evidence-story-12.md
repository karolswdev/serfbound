# Evidence — SB-44-12 Playtest Fixes

## 1. Verdict capture (the `.controls` hijack)

Root cause, from the vendored reveal.css:
```
.reveal .controls { display:none; position:absolute; ... }
.reveal .controls button { position:absolute; visibility:hidden; opacity:0; }
```
The deck's verdict box was `class="controls"` → hijacked → buttons 0×0.

After renaming to `.verdict-set` + the split-mode flatten, in real Chromium:
```
VERDICT BTN: {"w":120,"h":55,"vis":"visible","pos":"static"}
ok - verdict button visible + sized + not hijacked
ok - a real click on Pass records the verdict
```
`artifacts/deck-split-usable.png` — the split: the 36.1 check with usable
Pass/Fail/Skip on the left, the game on the right. `verify-deck.mjs` adds a
guard ("verdict buttons aren't hijacked by reveal's .controls rule") — 31 ok.

## 2. The road that staffs

The rig now lays a long straight road to a demand building; headless sim:
```
road len: 7 (Right,Right,Right,Right,Right,Right,Right)
1500 ticks: serfs=5
(road-split previously: 2-tile road, 0 serfs after 8000 ticks)
```
`verify-rigs` node pass: `phase-36-road-split restores + meets 3 expectation(s)`.

## 3. The debug rig view

An embedded rig (in real Chromium, real SPAU.PA):
```
EMBEDDED GAME: {"rigFlag":"1","devFlag":"1","gameState":"Running",
                "dataPanelHidden":true,"devLedgerOpen":true}
ok - embedded game is in rig/dev chrome
ok - the data-import panel is decluttered
ok - the dev ledger (debug tools) is open
```
`artifacts/rig-debug-view.png` — the embedded pane: the rigged map (a long
road with a carrier walking it) over the under-the-hood ledger, import panel
gone.

## No regressions

```
test:unit → # pass 329 ; verify-deck → 31 ok ; verify-rigs → 11/11 node pass
check:boundaries / check:design / check:independence / test:docs → all ok
```
