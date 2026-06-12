# Phase 38 — Professions, Tools, and Fire

**Last updated:** 2026-06-12 (SB-38-04 done: demolition burns — the
fire stands on the reference counter while everyone bound to the
building escapes home, and the ruin falls when it expires; the
game.demolish-building command carries it through saves and
lockstep. Earlier today: SB-38-01 outdoor trips, SB-38-02 the
geologist).
**Status:** in progress.

## Goal

Every profession behaves like the original: outdoor workers run the
reference planning/free-walking cycles (the fisher sits at the
shore, the farmer works his fields, the geologist prospects and
plants signs), tools gate professions through typed inventory serfs
(no axe, no lumberjack), buildings burn down with escaping serfs,
and actions sound like themselves.

## Reference ground truth

- Planning states per profession (PlanningLogging/StoneCutting/
  Fishing/Farming, LookingForGeoSpot/SamplingGeoSpot) with
  FreeWalking distance bookkeeping (Serf.cs).
- Inventory per-profession serf counts; CallOutSerf by type; tools
  convert generic serfs to professionals (Inventory.cs).
- Burning: the Burning counter, EscapeBuilding/Scatter serfs
  (Building.cs, Serf.cs).
- Per-action sfx keyed to animation frames (rowing, digging,
  fights — RenderSerf.cs).

## Exit criteria (evidence required)

- [x] Fisher, farmer, and forester work outdoors on the reference
  cycles (SB-38-01); the geologist exists and plants the signs the
  player reads (SB-38-02 — the flag-popup button rides the alpha
  gate's app work).
- [ ] Tools gate professions: the inventory tracks typed serfs and
  converts them with tools; the toolmaker matters. (SB-38-03)
- [x] Demolition burns: fire, countdown, escaping serfs. (SB-38-04 — conquest demolitions stay instant, recorded for Phase 39.)
- [ ] Action sounds ride the animation frames. (SB-38-05)
- [ ] **The alpha gate:** the maintainer plays the full loop on
  device and Serfbound calls itself an alpha — the bar defined in
  the parity audit. (SB-38-06)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-38-01 | Fisher, farmer, forester in the open | done | story-01-fisher-farmer-forester-in-the-open.md | evidence-story-01.md |
| SB-38-02 | The geologist | done | story-02-the-geologist.md | evidence-story-02.md |
| SB-38-03 | Tools make professionals | backlog | — | — |
| SB-38-04 | Fire | done | story-04-fire.md | evidence-story-04.md |
| SB-38-05 | The sound of work | backlog | — | — |
| SB-38-06 | The alpha gate | backlog | — | — |
