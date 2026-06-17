# Evidence — SB-44-19 Verdict Taps That Actually Land

## Root cause

`data-prevent-swipe` (SB-44-16) is reveal.js's cooperative opt-out, but on the
maintainer's real device reveal's touch handler still swallows the tap. The
emulated-touch test passed regardless — which is exactly why the regression hid.
Fix removes reveal's touch handler entirely (`touch:false`) and adds our own
swipe handler that ignores interactive targets.

## Real touch-context test (Playwright, hasTouch + isMobile)

```
TAP records verdict: true
SWIPE nav: 35.1 -> 35.3 (changed: true)
```

- `page.tap()` on the Fail button → the button gets `is-active` (the verdict
  records) with reveal's touch handler disabled.
- A synthesized horizontal swipe over empty slide area advances the protocol;
  a swipe starting on a control is ignored, so taps are never hijacked.

## No regressions

```
$ node pm/roadmap/serfbound/phase-44-gate-verification/playtest/verify-deck.mjs
ALL DECK ASSERTIONS PASS
```
