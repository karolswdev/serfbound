# Evidence — SB-30-03 — Achievements in Original Art

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/app/src/achievements.ts` — the curated set: 12 deeds,
  every trigger a pure predicate over facts the app already tracks
  (data imported, castle standing, buildings done, saved once, the
  chronicle's derived statistics, online history, the campaign
  ledger); badge icons are DOS icon-sheet indices the original
  popups already draw (0x28-0x37 range).
- `packages/app/src/profile-store.ts` — additive `achievements`
  (id + unlock moment) with once-only recording.
- `packages/app/src/main.ts` — the deeds evaluator (a 4-second pure
  check; unlocks write the profile and speak once through the
  original notice path), the Deeds section in the chronicle: badges
  drawn from the player's own decoded icon sheet
  (`rawIcons` → pixelated canvas), a gold medallion initial standing
  in until data decodes.
- `packages/app/src/strings.ts` — `notice.achievement` in both
  languages ("DEED DONE - {name}" / "TAT VOLLBRACHT - {name}");
  deed names constrained to the game font's alphabet.
- `docs/design/design-standard.md` — the Deed badge entered §3.
- `tests/ci/achievements.test.mjs` (3 tests: set integrity +
  font-safe names, the full trigger matrix with threshold gating,
  once-only recording) + `tests/browser/achievements.spec.ts`.

## Verification artifacts

```
achievements unit: # tests 3 / # pass 3 / # fail 0
achievements.spec + profile-chronicle.spec: 2 passed
  (import -> "DEED DONE - THE REALM AWAKENS" through the original
   notice; save -> KEEPER; chronicle renders the badges; reload ->
   deeds persist; play never blocked)
npm run ci:release -> exit=0 (captured directly; includes the
  glyph-coverage strings check over the new notice keys)
```

A strict ImageData overload (Uint8ClampedArray<ArrayBufferLike>)
briefly broke the build — caught before the stale bundle could lie
this time (the SB-30-01 lesson applied), fixed with a fresh copy.

Real-data capture (local `SPAU.PA` — the badges show genuinely
decoded DOS icons): `artifacts/story-03-deeds.png`.

## Acceptance criteria — re-checked

- [x] The curated set is recorded with trigger conditions, each
  mapped to an engine-proven fact — achievements.ts + the unit
  matrix.
- [x] Unlocks fire from real play, render with decoded original art,
  persist across reloads, never block or alter gameplay — the
  browser spec walks import → notice → play → save → reload.
- [x] Accountless offline players get the identical experience — the
  spec runs accountless; the evaluator reads only local state.

## Deviations from plan

- Badge icon assignments are aesthetic (proven decodable indices
  from the popup tables); refining icon-to-deed pairings is a
  capture-review follow-up, not a contract.
- The unlock toast uses the in-game notice (original font path)
  rather than a new original-art popup — within the story's open
  question, resolved toward the existing Phase 16 idiom.

## Follow-ups

- SB-30-04 (the gamification gate) is the last story standing in
  this phase: the full loop e2e + the privacy regression sweep.
- A conquest-victory e2e (campaigner unlock from a real mission win)
  rides SB-30-04's loop if cheap, else stays manual.
