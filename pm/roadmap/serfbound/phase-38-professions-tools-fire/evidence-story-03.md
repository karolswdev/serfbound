# Evidence — SB-38-03 — Tools Make Professionals

- **Shipped:** 2026-06-12
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/engine/src/serfs.ts` —
  - `professionTools`: the Building.Requests table — fisher/rod,
    lumberjack/axe, boatbuilder/hammer, stonecutter and the four
    mines/pick, farmer/scythe, butcher/cleaver, sawmiller/saw,
    toolmaker/hammer+saw, weaponsmith/hammer+pincer; forester, pig
    farmer, miller, baker, and the smelters convert free;
  - `#takeProfessionTools`: the all-or-nothing tool charge
    (Inventory.SpecializeSerf);
  - the worker sweep refuses a toolless conversion and retries when
    the toolmaker delivers; the construction builder charges a
    hammer before any side effects (so emergency recovery can retry
    a refused dispatch); the geologist charges his hammer.
- `tests/ci/engine-serfs.test.mjs` — three zeroed-inventory tests
  now stock the tools their staffed professions consume (a saw for
  the sawmiller, hammer+saw for the toolmaker, hammers for the
  emergency test's builders) — the gating working as designed.

## Verification artifacts

```
engine gate (new), stash-verified failing pre-fix (the toolless
lumberjack staffs immediately):
  not ok 1 - tools make professionals: no axe, no lumberjack
             (SB-38-03)
post-fix:
  ok - an empty toolshed leaves the lumberjack unstaffed through
       50k ticks; one axe staffs him and leaves stock with him; a
       hammerless construction dispatch is refused (after the
       emergency program, correctly tripped by the zeroed stocks,
       was lifted by standing the trio) and a hammer sends the
       builder and is consumed.
  engine-serfs: # tests 28 / pass 28
  engine-economy-chains: # tests 6 / pass 6 — the twelve-building
    settlement staffs itself entirely through consumed tools from
    the default supplies; the toolmaker is load-bearing now.

npm test -> exit=0 (unit + build + 32 browser specs)
npm run ci:release -> exit=0 (captured directly)
npm run test:compatibility -> first run exit=1 (environment flake),
  two consecutive reruns exit=0 with 5/5 browser positions
  (captured directly)
```

## Acceptance criteria — re-checked

- [x] No axe, no lumberjack; one axe staffs and is consumed
  (engine-gated, stash-verified).
- [x] Hammerless construction refused and retryable; hammered
  construction proceeds and consumes (engine-gated).
- [x] Full unit sweep + release gates green.
