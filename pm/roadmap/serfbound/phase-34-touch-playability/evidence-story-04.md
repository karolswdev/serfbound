# Evidence — SB-34-04 — Selection Bleed + Motion

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/app/src/main.ts` —
  - the wave/simulation timer no longer dies under
    `prefers-reduced-motion: reduce`: the timer always runs while a
    game world is live (hidden-tab pause and the lockstep exception
    unchanged); reduced motion only stops the decorative wave-frame
    advance. The old behavior froze simulation, serfs, AI, autosave
    and notifications on any phone with Reduce Motion enabled —
    the most likely root of "zero animations, flags don't wave";
  - `data-serfbound-motion="reduced|full"` published, updated live
    via the matchMedia change listener;
  - the dev ledger's Pulse row: `tick N · wave N · motion full`,
    refreshed by the timer — the `?dev=1` device diagnostic.

- `tests/browser/touch-playability.spec.ts` —
  - punch 3: the running game's body and status panel compute
    `user-select: none` (the round-1 CSS, now gated);
  - punch 4: with `emulateMedia({ reducedMotion: "reduce" })` at
    DPR 3 under genuine touch, the game tick must advance across a
    1.2s window.

## Verification artifacts

```
Old main.ts (stashed), punch 4:
  Error: expect(locator).toHaveAttribute(expected) failed
  1 failed        <- the world genuinely froze under Reduce Motion

Fixed:
  ✓ punch 1: a single tap must not found a castle without confirmation
  ✓ punch 2: the cursor follows the tap, never the corner
  ✓ punch 3: play taps never text-select the chrome
  ✓ punch 4: Reduce Motion must never freeze the world
  ✓ punch 5: road mode engages from a panel-bar tap at DPR 3
  ✓ punch 6: the build popup fits and its content is hit-true at DPR 3
  6 passed (plus chrome-states: 7 passed in the combined run)

npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Honest limits

Whether flags wave on the maintainer's actual iPhone remains a
device question (Low Power Mode throttling, WebKit timer clamping).
What this story guarantees: the world never freezes for a motion
preference, and the Pulse row makes the device answer readable in
seconds. The device verdict belongs to SB-34-05.

## Acceptance criteria — re-checked

- [x] Reduced motion never freezes the simulation (gated, fails pre-fix).
- [x] Chrome text-selection during play is impossible (gated).
- [x] Visible device diagnostic shipped (Pulse row, `?dev=1`).
