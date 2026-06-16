# Evidence — SB-44-13 Tappable Verdicts

## Finger-sized buttons (real Chromium, 390px phone, touch)

Before: reveal scaled the 1100px slide to ~0.35× → button 18px tall.
After (`width:480`):

```
BTN at phone width (non-split): {"w":117,"h":43,"scale":0.78}
TAP: WORKS
```

The verdict button is now ~43px tall (the ~44px tap-target floor).
`artifacts/deck-phone-check.png` — CHECK 35.1 at phone width with big
brass Pass/Fail/Skip plates (Pass active in green).

## No stale deck

`public/sw.js`: cache name `serfbound-shell-v2` → `serfbound-shell-v3`
(the activate handler deletes non-current caches, so old caches clear on
the next visit). `/playtest/` and `/rigs/` are fetched network-only:

```
if (url.pathname.includes("/playtest") || url.pathname.includes("/rigs/")) {
  event.respondWith(fetch(request).catch(() => caches.match(request) ?? Response.error()));
  return;
}
```

So the deck and the baked rigs are always the freshest deploy; a browser
that cached the pre-fix deck gets the new one.

## No regressions

```
verify-deck.mjs → ALL DECK ASSERTIONS PASS (31 ok)
```

## Honest note

The maintainer's exact failure was not reproducible in fresh Chromium or
WebKit (mouse or touch, local or live) — the live deck already taps fine in
test. These two fixes address the most likely real causes (sub-target
buttons + a stale cached deck); if it still fails, the device/browser and
the exact behaviour are the next signal.
