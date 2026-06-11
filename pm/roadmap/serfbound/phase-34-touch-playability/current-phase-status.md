# Phase 34 — Touch Playability

**Last updated:** 2026-06-11 (after the round-1 bundle:
SB-34-01/02 done; punches 1–3 fixed under genuine touch).
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
- [ ] The cursor follows taps; the panel bar, road mode, and popups
  are hit-true and fully visible at every DPR including 3.
  (SB-34-03)
- [ ] The chrome never text-selects mid-play; animations verified on
  device (flags wave). (SB-34-04)
- [ ] The maintainer plays on their phone and signs off — or the next
  punch list loops. (SB-34-05)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-34-01 | The real-touch repro harness | done | story-01-real-touch-harness.md | evidence-story-01.md |
| SB-34-02 | Founding confirmation on touch | done | story-02-founding-confirmation.md | evidence-story-02.md |
| SB-34-03 | DPR-3 coordinate spaces: cursor, panel, popups | backlog | — | — |
| SB-34-04 | Selection bleed + on-device animation | backlog | — | — |
| SB-34-05 | The device gate | backlog | — | — |

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Emulation flatters again | high | DPR-3 + hasTouch + touchscreen.tap as the spec floor; the device gate is the maintainer | Any "fixed" claim without a device pass |
| Symptom 4 not reproducible off-device | medium | Diagnostic overlay (?dev=1 frame counter) for the maintainer's run | — |

## Decisions made (this phase)

- 2026-06-11 — Touch gates are real-touch or they are nothing:
  hasTouch + touchscreen events + DPR 3 become the minimum bar for
  any claim containing the word "touch" — this phase.
