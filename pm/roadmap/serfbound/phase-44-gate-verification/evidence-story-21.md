# Evidence — SB-44-21 The Rig-Open Input Block

## Reproduced on the live site

Desktop Chromium against https://serfbound.com/playtest/ — open check 35.1,
click "▶ Open rig here", then hit-test the Pass button's own center:

```
has Open-rig button: true
split active: true
PROBE topEl: "div.slide-background-content"   (chain: .slide-background.present > .backgrounds)
topIsButtonOrChild: false
click threw: TimeoutError (the button is not the receiver)
verdict active after click: false
```

reveal's `.backgrounds` layer is painted on top of the flattened split-mode
deck and intercepts every click — the actual cause of the dead verdict taps in
the rig-open flow (not touch, not cache; it reproduced in fresh Firefox too).

## Fix verified locally

After adding `pointer-events: none` to reveal's background layers, same flow
(stubbed rig, split opened):

```
split: true | top is the button: true (button.) | verdict active after click: true
```

The verdict button is now the top element at its own center, and the click
records the verdict.

## No regressions

```
$ node pm/roadmap/serfbound/phase-44-gate-verification/playtest/verify-deck.mjs
ALL DECK ASSERTIONS PASS
```
