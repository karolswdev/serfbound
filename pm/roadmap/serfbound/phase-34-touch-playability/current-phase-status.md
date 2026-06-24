# Phase 34 — Touch Playability

**Last updated:** 2026-06-24 (after the gameplay usability punch:
high-quality build sites open the advanced page, still cycle back to
basic, and terrain double-clicks invoke the same primary action as
the build slot). SB-34-05 status: looped — rounds 2–6 rejected; the
device sign-off gate remains open.
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

## Round 9 (gameplay usability punch, 2026-06-24)

The build slot and terrain double-click path were still violating
the reference-style primary action contract:

20. High-quality build plots advertised the large-site button, but
    the build slot always opened the basic building page.
21. Double-clicking terrain only selected/inspected it; it did not
    invoke the obvious action for buildable land, flag placement, or
    owned-flag road building.
22. The fix must not collapse high-quality plots into "advanced
    only"; a player still needs to flip back to the basic building
    page and place a basic service on the same good plot.

Shipped: selected terrain now has one primary build action across
the panel slot and double-click. Large sites open `buildAdv1`, small
sites open `buildBasic`, flag sites build a flag, and owned flags
enter road mode. The build popup flip remains the escape valve:
`buildAdv1` → `buildAdv2` → `buildBasic`, with a browser gate proving
a basic lumberjack can still be placed on a large/high-quality plot.

Evidence: `tests/browser/build-primary-actions.spec.ts` covers the
large-site advanced entry, the advanced-to-basic cycle, basic
placement on the large site, flag double-click, road-mode
double-click, and direct advanced double-click. The DPR-3 touch punch
and decoded-scene gates now select an actual small/large plot before
asserting which build page opens.

Regression follow-up: the reference has two basic building popups.
`BasicBld` is the plain small-site page and hides the building-page
flip; `BasicBldFlip` is the large-site page and may cycle through
advanced pages and back to basic. The browser gate now proves small
terrain stays on `buildBasic`, while large terrain keeps the
advanced-to-basic escape route. The flip uses the reference building
button icon (`61`) rather than the adjacent exit-looking icon.

## Round 8 (seventh device pass, 2026-06-11) — escalated to the audit

"The lumberjack is teleporting to the tree in a couple of
milliseconds… nobody brings out the raw materials, they literally
just appear at the castle door… when I created a flag in the middle
of the road no new worker came up, the old one decided to sit right
on the flag… do an ACTUAL audit against the reference project of
what is missing and phase it out. We SKIPPED SO MUCH this isn't even
an alpha yet."

The maintainer is right, and the response is structural, not another
round: the **reference parity audit**
(pm/roadmap/serfbound/reference-parity-audit.md) accounts for every
condensed or missing system against Freeserf.Core and phases the
work out into Phases 35–38 (locomotion fidelity, the full transport
economy, the living map, professions/tools/fire — ending at the
defined alpha bar). The three round-8 symptoms map directly:
teleporting lumberjack → Phase 35 (the harvest walk bypasses the
reference counter tables); materializing materials → Phase 36
(MoveResourceOut chain missing); the unstaffed split road → Phase 36
(BuildFlagSplitPath serf reassignment, deferred since Phase 13).

**Phase 34 takes no new simulation stories.** It remains open only
for its original scope — touch input/UI truth on device (SB-34-05).

## Round 7 (sixth device pass, 2026-06-11)

Construction rises — but:

17. "All serfs literally look the same." (Root: raw animation frames
    hit the appearance tables with no profession sprite-bank offset,
    and the torso decode stopped at body 48 of ~600. SB-34-10.)
18. "Literally no materials visible. Serfs bring invisible objects."
    (Root: transporters never switched to the carrying torsos, and
    flag slot resources never rendered at all. SB-34-10.)
19. "Rock miners don't even come out. Rocks just disappear around
    them." (Root: #workHarvest mutated the map from inside the hut.
    Harvesters now walk out, work the target in the open, and walk
    the product home. SB-34-10.)

## Round 6 (fifth device pass, 2026-06-11)

The road builder landed — but:

14. "Buildings just immediately transform to the other phase" — no
    construction animation. (Root: the renderer knew only three
    states AND the engine banked builder work against missing
    materials, snapping a phase per delivery. Shipped: material-gated
    work + the reference bottom-up reveal — cross, cornerstone with
    the frame creeping up, building over the frame. SB-34-09.)
15. "The architect finishing each phase coming back to the castle" —
    diagnosed: the builder never leaves; the walkers are transporters
    hauling planks, and the delivery-snap made them look causal. With
    gradual rise the illusion dissolves. (SB-34-09.)
16. The road builder lacked the original's stepwise control — an
    adjacent tap now extends exactly one segment (the reference
    click), distant taps keep the pathfind convenience. (SB-34-09.)

## Round 5 (fourth device pass, 2026-06-11)

The canvas prompts landed — but:

13. "We're missing one very crucial thing in the entire interface,
    which is the road builder interface, which allowed us to build
    roads, plant flags, and so on with a very simple and intuitive
    menu." (The reference IsBuildingRoad flow was never ported.
    Shipped: tap-to-extend with live path preview, undo by tapping
    back, plant-a-flag-at-the-end, the reference road-builder bar,
    explicit drawn paths honored by the engine. SB-34-08.)

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
| SB-34-05 | The device gate | looped — rounds 2–6 rejected; gameplay usability punch shipped, device sign-off still open | — | — |
| SB-34-06 | The visible world: cursor, construction, waving flags | done | story-06-the-visible-world.md | evidence-story-06.md |
| SB-34-07 | The road and the true tap | done | story-07-the-road-and-the-true-tap.md | evidence-story-07.md |
| SB-34-08 | The road builder | done | story-08-the-road-builder.md | evidence-story-08.md |
| SB-34-09 | Rising under the hammer | done | story-09-rising-under-the-hammer.md | evidence-story-09.md |
| SB-34-10 | A settlement of individuals | done | story-10-a-settlement-of-individuals.md | evidence-story-10.md |

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
- 2026-06-24 — The selected terrain primary action is one contract
  across the panel build slot and desktop double-click: large site →
  `buildAdv1`, small site → `buildBasic`, flag site → build flag,
  owned flag → road builder. The build popup flip must still let a
  large/high-quality plot cycle back to basic buildings.
- 2026-06-24 — Small-site `BasicBld` and large-site `BasicBldFlip`
  are distinct UI states: a basic plot cannot flip into advanced
  building pages, and the large-site cycle remains the only advanced
  page path.
