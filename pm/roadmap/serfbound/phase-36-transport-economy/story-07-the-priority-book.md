# SB-36-07 — The Priority Book

- **Project:** serfbound
- **Phase:** 36
- **Status:** done
- **Depends on:** SB-36-02, SB-36-05
- **Unblocks:** SB-36-06, SB-41-01
- **Owner:** unassigned

## Problem

The audit addendum's row 18, engine half. SB-36-02 and SB-36-05
hardcoded the reference's priority tables as module constants: the
26-entry flag pecking order, the distribution splits inside the
stock book, the toolmaker's round-robin standing in for the
weighted tool draw. The reference keeps all of it in PlayerSettings
— per player, mutable, the data Phase 41's sliders will drive — and
adds two tables serfbound lacks entirely: the inventory priority
list (what an OUT-mode inventory expels first) and the inventory
in/stop/out resource modes themselves.

## Reference ground truth

- PlayerSettings.cs + Player.cs Reset*Priority: FlagPriorities,
  InventoryPriorities, ToolPriorities, the distribution fields —
  per-player state with known defaults.
- Serf.cs 8493–8552: the toolmaker's weighted draw —
  `priorityOffset = (totalToolPriority * RandomInt()) >> 16`, walk
  the nine tools subtracting `priority >> 4` until negative.
- Game.cs UpdateInventories 2295–2339: In/Stop inventories serve
  demand; an OUT-mode inventory queues its highest
  inventory-priority resource with destination 0 and lets the flag
  network re-home it.
- Inventory.cs modes: an inventory accepts only in In mode.

## What ships

- `PlayerEconomySettings` on every WorldPlayer — flag priorities,
  inventory priorities, tool priorities, distribution splits — with
  the reference defaults; the constants in serfs.ts die.
- Every consumer reads the book: transporter pickup and the cargo
  swap (flag priorities), the stock book (distribution splits by
  key), the toolmaker (the reference weighted draw on the shared
  RNG), the export sweep and re-homing (modes, inventory
  priorities).
- Inventory resource modes: In serves demand and accepts; Stop
  serves demand and accepts nothing; Out expels by inventory
  priority through the unknown-destination machinery.

## Acceptance criteria

- [x] Inverting a player's flag priorities inverts pickup order in
  the SB-36-02 scenario (engine-gated).
- [x] Zeroing coalGoldsmelter sends every coal to the steel smelter
  in the SB-36-05 scenario (engine-gated).
- [x] Inventory modes honored: Stop serves demand (the reference's
  In || Stop sourcing) but accepts nothing; In accepts; Out expels
  the highest inventory-priority resource first (engine-gated; the
  first test draft assumed Stop stopped serving too — Game.cs says
  otherwise, and the test now records the reference truth).
- [x] A toolmaker with only the hammer prioritized makes hammers
  (engine-gated).
- [x] Full unit sweep + release gates green.

## Honest limits

- Serf modes (in/stop/out for serfs) ride Phase 38 with typed-serf
  dispatch — only resource modes ship here.
- PlanksConstruction sits in the book unconsumed until SB-36-08's
  emergency program reads it (construction logistics are untouched).
- The sliders that mutate the book are Phase 41 (SB-41-01).
