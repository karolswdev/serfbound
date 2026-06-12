# SB-38-03 — Tools Make Professionals

- **Project:** serfbound
- **Phase:** 38
- **Status:** done
- **Depends on:** SB-38-02
- **Unblocks:** SB-38-06
- **Owner:** unassigned

## Problem

The audit's row 11: "tools are produced but gate nothing." Serfbound
staffs every completed building with a free generic serf — the
toolmaker's output piles up in the castle as dead stock, and the
player's tool-priority sliders steer a number nothing reads. In the
reference a building's worker is a REQUEST against the inventory:
an existing professional, or a generic serf converted by consuming
the profession's tools — no axe, no lumberjack; no hammer and saw,
no toolmaker. The toolmaker is the choke point of the whole
mid-game economy.

## Reference ground truth

- Building.cs Requests table (2168–2193): fisher/Rod,
  lumberjack/Axe, boatbuilder/Hammer, stonecutter/Pick, all four
  mines/Pick, farmer/Scythe, butcher/Cleaver, sawmiller/Saw,
  toolmaker/Hammer+Saw, weaponsmith/Hammer+Pincer; forester,
  pig farmer, miller, baker, and both smelters need no tool.
- Building.cs 1801: the construction Builder costs a Hammer.
- Game.SendGeologist: the geologist costs a Hammer.
- Inventory.cs SpecializeSerf: conversion consumes the tools from
  stock; a missing tool fails the request, and the building retries.
- Knights already gate the reference way: promotion consumes a
  sword and a shield (shipped with Phase 15's port).

## What ships

- The profession tool table as engine data and an all-or-nothing
  tool take: the worker sweep converts a generic serf only when the
  tools are in stock — a failed request leaves the building
  unstaffed and retried, so a missing axe is a visible, fixable
  economy problem instead of a free pass.
- The construction builder costs a hammer; the geologist costs a
  hammer.

## Acceptance criteria

- [x] A lumberjack with no axe in the castle stays unstaffed and
  produces nothing; stocking one axe staffs it and consumes the axe
  (engine-gated, stash-verified).
- [x] A construction dispatch without a hammer is refused and
  retried; with one it proceeds and consumes it (engine-gated).
- [x] Full unit sweep + release gates green.

## Honest limits

- The inventory keeps the pool condensation: conversion-only, no
  per-profession serf counts (professionals never return to stock
  in serfbound — they live and die with their building). Recorded.
- A professional fleeing a fire rejoins the pool as a generic; his
  tool burns with the building. The reference keeps the serf typed
  — recorded with the pool condensation.
- The reference's digger/shovel leveling phase stays condensed into
  the single builder (one hammer per site, no shovel charge).
