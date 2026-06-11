# Evidence — SB-26-03 — String Extraction and Language Tables

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `packages/app/src/strings.ts` — every in-game string in one keyed
  table per language (`uiText` with `{param}` templates), English as
  the reference, a complete German table (umlauts ride the original
  glyphs: GEBÄUDE, DRÜCKEN, RÜCKBLICK), and
  `uiTableGlyphOffenders` making glyph coverage a test failure rather
  than a runtime blank.
- `packages/app/src/landscape-scene.ts` / `render-layer-scene.ts` /
  `recap.ts` / `main.ts` — all 24 inline game-font strings replaced by
  table lookups (HUD stock, the sett popup rows, the init screen, every
  notice, the digest vocabulary); the two notice-prefix string
  comparisons replaced by honest mode tracking (string sniffing breaks
  the moment text localizes).
- Tests: `tests/ci/app-strings.test.mjs`.

## Verification artifacts

```text
npm run test:unit -> # tests 225 / pass 225 / fail 0 (222 + 3)
npm run test:browser -> 13 passed (1.2m) — the e2e suite is the
  "English renders identically" proof: it still asserts the literal
  texts ("BUILDING COMPLETE" via the live region, init rows, notices)
  and passes unchanged
node --test tests/ci/app-strings.test.mjs ->
  ok 1 - english renders identically to the previous inline strings
  ok 2 - the german table is complete and translates the whole surface
  ok 3 - every table entry renders inside the original glyph set
```

## Deviations from plan

- DOM shell texts (the status panel, buttons) stay English: the story
  scoped "shell texts that render in-game" — the game-font surface.
  DOM localization is a recorded follow-up if wanted; it has no glyph
  constraint.
- Mission names (START, ROLOND…) are campaign data, not UI strings —
  not localized, matching the original.

## Follow-ups

- SB-26-04: the language switch, the German sweep, and the phase
  close.
