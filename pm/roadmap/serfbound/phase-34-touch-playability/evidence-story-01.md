# Evidence — SB-34-01 — The Real-Touch Repro Harness

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `tests/browser/touch-playability.spec.ts` — the new spec floor for
  touch claims: iPhone 13 device profile, `hasTouch: true`,
  `isMobile: true`, `deviceScaleFactor: 3`, and genuine
  `page.touchscreen.tap()` — no mouse clicks wearing a phone-sized
  viewport. Punch 1 (no unconfirmed founding) and punch 2 (the
  cursor follows the tap, never the corner) are live; punch 6 (the
  DPR-3 build-popup crop) is `test.fixme` until SB-34-03 publishes
  the popup/panel rects it needs to verify.
- `packages/app/src/main.ts` — the three root-cause fixes the harness
  proved (the confirm flow itself is SB-34-02's evidence):
  - auto-scroll the game into view when chrome flips to `running`
    (`scrollIntoView` on the terrain preview) — on a phone the canvas
    sat below the fold and probes showed its bounding box at
    y=-533 with the page scrolled to 640: **zero pointer events ever
    reached the canvas**, which is the single root of "the cursor is
    always stuck in a corner" and "I couldn't even click into road
    building";
  - the touch `pointerleave` guard — lifting a finger fires a
    synthetic pointerleave that wiped the just-made selection back to
    idle, so no tap could ever leave a selected tile behind;
- `packages/app/src/styles.css` — `user-select: none` +
  `-webkit-touch-callout: none` across the chrome (text inputs
  re-enabled), so play-taps stop selecting the surrounding divs.
- `tests/browser/mobile-play.spec.ts` — the SB-19 probe loop updated
  to the SB-34-02 contract: founding by touch is now two taps.

## Diagnosis trail (why the old gates lied)

The phase-19/21 "mobile" specs drive `mouse.click()` in a phone-sized
viewport at DPR 1. Under a genuine touch context at DPR 3 the punch
list reproduced immediately: the first harness run had the canvas
off-screen and every tap landing on chrome. The harness reproduced
the failure before any fix went in — then went green only with the
fixes applied.

## Verification artifacts

```
npx playwright test tests/browser/mobile-play.spec.ts tests/browser/touch-playability.spec.ts
  ✓  punch 1: a single tap must not found a castle without confirmation (1.4s)
  ✓  punch 2: the cursor follows the tap, never the corner (904ms)
  ✓  a phone founds a settlement through the authentic UI by touch (2.8s)
  1 skipped (punch 6 — fixme until SB-34-03)
  3 passed (3.7s)
exit=0 (captured directly)

npm run ci:release -> exit=0 (captured directly; first run caught
  mobile-play still founding with a single tap — the spec was
  updated to the two-tap contract and the full gate re-run green)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] Encoded and green in tests/browser/touch-playability.spec.ts
  under genuine touch at DPR 3.
