# SB-34-02 — Founding Confirmation on Touch

- **Project:** serfbound
- **Phase:** 34
- **Status:** done
- **Depends on:** none
- **Unblocks:** SB-34-05
- **Owner:** unassigned

## Problem

A thumb must never found a realm by accident: touch requires a confirming second tap on the same tile, with invalid sites releasing the pending state. Mouse keeps the original click-to-found (hover-previewed).

## Acceptance criteria

- [x] Encoded and green in tests/browser/touch-playability.spec.ts under genuine touch at DPR 3.

## Notes

- Shipped in the round-1 bundle with the punch-list scaffold (the harness, the fixes it proved, and the phase docs are one change); BUNDLE-OK recorded.
- Round-1 fixes alongside: the auto-scroll to the game on start (the root of "taps do nothing" on mobile), the touch pointerleave wipe, and the selection-bleed CSS.
