# SB-34-10 — A Settlement of Individuals

- **Project:** serfbound
- **Phase:** 34
- **Status:** done
- **Depends on:** SB-34-09
- **Unblocks:** SB-34-05
- **Owner:** unassigned

## Problem

Round 7 of the device gate (maintainer, 2026-06-11): "all serfs
literally look the same. WTF? Also: literally no materials visible.
Serfs bring invisible objects. Rock miners don't even come out.
Rocks just disappear around them."

## What it turned out to be

1. **Everyone was a generic walker** because the renderer fed raw
   animation frames into the appearance tables. The reference adds a
   profession sprite-bank offset first (RenderSerf.GetActiveSerfBody:
   builder +0x500, lumberjack +0xb00, stonecutter +0xd00, knights
   +0x7800+rank…) — and the torso decode stopped at body 48 of ~600,
   so even with offsets the dressed bodies had no sprites. Both
   fixed: `serfBodyOffset` (engine) derives the profession from the
   serf's assignment and applies the reference offsets; the full
   torso/head ranges decode.
2. **Carried materials were invisible** twice over: transporters
   never switched to the carrying torsos (the reference indexes the
   carry table by Resource.Type + 1 — the plank in a transporter's
   arms is sprite-bank +0x700), and resources waiting at flags never
   rendered at all. Both shipped: loaded transporters dress for
   their cargo, and flags stack their slot resources at the
   reference ResPos offsets (game_object 135+type).
3. **Harvesters worked by remote control** — `#workHarvest` mutated
   the tree/stone from inside the hut. Now the worker physically
   walks OUT (greedy free-walk, ghosting off the collision map so a
   dwelling stonecutter never walls off transporters), stands AT the
   target through a visible dwell, the object changes under him, and
   he walks the product home. Rest is half the old cycle so the
   economy pace holds.

## Found by the gates en route

- The walk-home wedged one tile from the hut — the step function
  refused tiles with buildings, including the worker's own
  destination. The economy-chain gate caught it (lumber flow zero,
  sawmill idle at a 3.9M tick counter).
- Dwelling workers on road tiles would have deadlocked transporters
  behind them — hence the ghost-walk off the collision map.

## Acceptance criteria

- [x] Profession offsets match the reference (unit-gated: builder,
  lumberjack, stonecutter, ranked knight, plank/stone carriers).
- [x] A harvester physically leaves the hut and stands AT the target
  while working it (engine-gated through a real lumberjack).
- [x] Flags render their stacked slot resources (fixture carries the
  resource sprites; real data decodes game_object 135+).
- [x] The economy still flows: full chain/AI suites green at the new
  pacing.
