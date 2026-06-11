# Evidence — SB-34-02 — Founding Confirmation on Touch

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/app/src/main.ts` — the two-tap founding confirm, touch
  only:
  - the first touch-tap on a tile while the castle is pending records
    `pendingCastleTile`, publishes
    `data-serfbound-castle-confirm="col,row"`, and asks in the
    command state ("Found your castle here? Tap the same tile again
    to confirm.");
  - a second tap on the **same** tile dispatches
    `game.build-castle`; accepted → the attribute flips to
    `"confirmed"`; rejected (invalid site) → the pending state is
    released so a thumb is never stranded on an unbuildable tile;
  - a tap on a **different** tile re-arms the confirm there — moving
    the question, not founding;
  - mouse keeps the original click-to-found (the hover preview is the
    mouse's confirmation; phones have no hover).
- `tests/browser/touch-playability.spec.ts` — punch 1 asserts the
  contract under genuine touch at DPR 3: no castle may appear without
  `castle-confirm="confirmed"`, and the pending → second-tap path is
  walked explicitly.
- `tests/browser/mobile-play.spec.ts` — the SB-19 founding probe now
  taps twice per site, encoding the new contract in the older gate.

## Verification artifacts

```
npx playwright test tests/browser/mobile-play.spec.ts tests/browser/touch-playability.spec.ts
  ✓  punch 1: a single tap must not found a castle without confirmation (1.4s)
  ✓  punch 2: the cursor follows the tap, never the corner (904ms)
  ✓  a phone founds a settlement through the authentic UI by touch (2.8s)
  3 passed (3.7s)
exit=0 (captured directly)

npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

The maintainer's punch-list item 1 — "I placed a castle somehow by
fucking accident, zero confirmation" — is the founding act this
story guards. The harness probe proves a single tap can no longer
found: the first tap only ever asks.

## Acceptance criteria — re-checked

- [x] Encoded and green in tests/browser/touch-playability.spec.ts
  under genuine touch at DPR 3.
