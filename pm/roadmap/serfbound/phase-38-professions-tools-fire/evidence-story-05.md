# Evidence — SB-38-05 — The Sound of Work

- **Shipped:** 2026-06-12
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/app/src/work-sounds.ts` — the RenderSerf frame rules as
  a pure module: lumberjack 0x85/0x86 → axe blow (the tree-fall
  crash on the last chop's stage), stonecutter 0x85/0x86 → pick,
  forester 0x86/0x87 → planting, sawmiller's four frame windows →
  sawing, butcher → backsword, farmer → mowing, fisher's rod frames
  (idle holds excluded) → reel, builder (frame & 7) == 4/5 →
  hammer, digger 0x83/0x84 → digging, geologist → sample tap,
  fights → Fight01..04. The reference's IsPlayingSfx latch is
  condensed to frame-edge triggering (recorded).
- `packages/app/src/main.ts` — the render loop evaluates every
  working serf's frame transition (the same animation-table read
  the scene uses), gates off-screen work like the reference's
  viewport-scoped render serfs, and plays through the existing
  audio service.

## Verification artifacts

```
gate (new), stash-verified failing pre-fix (the module does not
exist; the suite cannot even import):
  app-work-sounds: # pass 0 / fail 1 (stashed with -u)
post-fix:
  ok - the axe lands on entry to the swing frames and holds stay
       silent; the last chop crashes; pick, planting, sawing
       windows, backsword, mowing, reel (idle holds silent),
       hammer, digging, sampling, and a fight clip all name
       correctly; an unruled profession stays silent.

npm test -> exit=0 (unit + build + 32 browser specs)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> exit=0 (captured directly)
```

## Acceptance criteria — re-checked

- [x] The rules module names the right clip on frame entry, silence
  on holds, per profession (CI-gated, stash-verified).
- [x] Full unit sweep + release gates green.
