# SB-34-01 — The Real-Touch Repro Harness

- **Project:** serfbound
- **Phase:** 34
- **Status:** done
- **Depends on:** none
- **Unblocks:** SB-34-05
- **Owner:** unassigned

## Problem

Genuine touchscreen taps, hasTouch contexts, DPR 3 — the spec floor for any touch claim. tests/browser/touch-playability.spec.ts encodes the punch list; punch 6 stays fixme until SB-34-03.

## Acceptance criteria

- [x] Encoded and green in tests/browser/touch-playability.spec.ts under genuine touch at DPR 3.

## Notes

- Shipped in the round-1 bundle with the punch-list scaffold (the harness, the fixes it proved, and the phase docs are one change); BUNDLE-OK recorded.
- Round-1 fixes alongside: the auto-scroll to the game on start (the root of "taps do nothing" on mobile), the touch pointerleave wipe, and the selection-bleed CSS.
