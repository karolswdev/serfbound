# Phase 34 — Touch Playability

**Last updated:** 2026-06-11 (after SB-34-07: the round-4 punch
list — tap/cursor divergence on hills, the phantom road button, the
missing flag→road act, silent rejections — fixed and gated; the
fourth device pass is the open gate).
**Status:** in progress — opened by the maintainer's real-device
play test, which the previous touch gates failed to predict.

## The punch list (maintainer, verbatim in spirit, 2026-06-11)

Real phone, real fingers: "LITERALLY unplayable."

1. Placed a castle by accident — zero confirmation.
2. The 5-point cursor is ALWAYS stuck in a corner.
3. Constantly "selecting" the surrounding div instead of playing.
4. Zero animations — flags don't wave.
5. Could not build a road — "could not even click into it."
6. The build-building menu shows buildings cropped after ~5 pixels.

## Round 4 (third device pass, 2026-06-11)

"Definitely some improvements" — the cursor is visible — but:

10. The cursor sometimes does not match the tapped spot.
    (Root: height-blind tile picking vs the height-lifted apex the
    cursor draws at — diverged on hills. Height-aware picking,
    SB-34-07.)
11. No way to build a road from a flag or construction site.
    (Root: the reference's flag→road build-slot affordance was never
    ported, and road rejections spoke only into the hidden dev
    ledger. Both fixed, SB-34-07.)
12. The road panel button becomes a transparent rectangle when
    tapped. (Root: buildRoadStarred pointed at sprite 25 — the
    reference enum ends at 24 and the DOS data carries 0..24; the
    armed state drew a sprite that exists nowhere. SB-34-07.)

## Round 3 (second device pass, 2026-06-11)

"Some improvements" — the build menu renders — but:

7. A placed building does not render at all; just its flag.
   (Root: progress-0 sites drew no sprite; the reference shows the
   construction cross 0x90 instantly. Fixed + gated, SB-34-06.)
8. Still no visible indication where the tap landed.
   (Root: the 5-point cursor was HUD decoration pinned top-right by
   design — punch 2's literal cause. It now draws at the selected
   tile. Fixed + gated, SB-34-06.)
9. Flags still don't wave.
   (Root: flags rendered the single static frame 128 on every
   platform; the reference cycles 128..131. Fixed + gated,
   SB-34-06 — this was never device-specific.)

## Honest diagnosis of the gate failure

Phases 19/21 claimed touch proven — but the "mobile" specs drive
mouse clicks in phone-sized viewports, and no test has ever run at
device pixel ratio 3 (a real iPhone) or with genuine touchscreen
events end-to-end through play. Emulation flattered us; the
maintainer's hands did not. Leading technical hypothesis: the
`uiScaleFor` scale-3 path (DPR 3) breaks popup/panel/cursor
coordinate spaces (symptoms 2, 5, 6 in one stroke); symptoms 1 and 3
are unconditional design defects; 4 needs device diagnosis.

## Goal

Serfbound is genuinely playable with fingers on a real phone — and
the only gate that closes this phase is the maintainer playing on
their device and saying so.

## Exit criteria (evidence required)

- [x] A genuinely-touch spec harness exists: hasTouch contexts,
  touchscreen taps, DPR 3, WebKit and Chromium — reproducing the
  punch list before fixing it. (SB-34-01; CI runs Chromium-only —
  the WebKit half of the bar is the maintainer's iPhone itself,
  i.e. the SB-34-05 device gate.)
- [x] Founding acts confirm on touch: no irreversible build from a
  single tap. (SB-34-02)
- [x] The cursor follows taps; the panel bar, road mode, and popups
  are hit-true and fully visible at every DPR including 3.
  (SB-34-03 — the build-menu crop turned out to be a UI paint-order
  bug, broken at every scale; see evidence-story-03.md.)
- [x] The chrome never text-selects mid-play; the reduced-motion
  world-freeze is fixed and gated; the Pulse diagnostic ships for
  the device run. (SB-34-04 — "flags wave on the device" is owned
  by SB-34-05.)
- [ ] The maintainer plays on their phone and signs off — or the next
  punch list loops. (SB-34-05)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-34-01 | The real-touch repro harness | done | story-01-real-touch-harness.md | evidence-story-01.md |
| SB-34-02 | Founding confirmation on touch | done | story-02-founding-confirmation.md | evidence-story-02.md |
| SB-34-03 | DPR-3 coordinate spaces: cursor, panel, popups | done | story-03-dpr3-coordinate-truth.md | evidence-story-03.md |
| SB-34-04 | Selection bleed + on-device animation | done | story-04-selection-bleed-and-motion.md | evidence-story-04.md |
| SB-34-05 | The device gate | looped — rounds 2 and 3 rejected; round 4 shipped, fourth pass pending | — | — |
| SB-34-06 | The visible world: cursor, construction, waving flags | done | story-06-the-visible-world.md | evidence-story-06.md |
| SB-34-07 | The road and the true tap | done | story-07-the-road-and-the-true-tap.md | evidence-story-07.md |

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Emulation flatters again | high | DPR-3 + hasTouch + touchscreen.tap as the spec floor; the device gate is the maintainer | Any "fixed" claim without a device pass |
| Symptom 4 not reproducible off-device | medium | Shipped: the dev-ledger Pulse row (`?dev=1`) splits sim tick / wave frame / motion preference on device; the reduced-motion world-freeze found en route is fixed and gated | — |

## Decisions made (this phase)

- 2026-06-11 — Touch gates are real-touch or they are nothing:
  hasTouch + touchscreen events + DPR 3 become the minimum bar for
  any claim containing the word "touch" — this phase.
- 2026-06-11 — The UI render layer paints in push order, never
  y-sorted (SB-34-03): y-sorting belongs to the map layers; chrome
  composes background → borders → content explicitly. Gated by the
  paint-order unit test in tests/ci/app-popup.test.mjs.
- 2026-06-11 — The chrome publishes its hit rectangles
  (`data-serfbound-panel-rect`, `data-serfbound-popup-rect`, canvas
  CSS space) so gates verify against the geometry the code uses,
  not a parallel re-derivation.
- 2026-06-11 — Reduced motion never pauses the world (SB-34-04):
  `prefers-reduced-motion` pins decorative frame cycling only; the
  simulation timer always runs while a game is live. An
  accessibility preference must never read as a frozen game.
- 2026-06-11 — Player feedback speaks in-canvas (SB-34-07): command
  verdicts and mode prompts surface as the game-font notice; the
  dev ledger is not a product surface and nothing player-critical
  may live only there.
- 2026-06-11 — Sprite ids answer to the data (SB-34-07): every
  sprite-id constant must exist in the DOS archives (the fixture
  mirrors the real entry counts), so a phantom id fails in CI the
  way it fails on a phone.
