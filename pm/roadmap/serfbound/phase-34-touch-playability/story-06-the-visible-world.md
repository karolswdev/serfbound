# SB-34-06 — The Visible World: Cursor, Construction, Waving Flags

- **Project:** serfbound
- **Phase:** 34
- **Status:** done
- **Depends on:** SB-34-01
- **Unblocks:** SB-34-05
- **Owner:** unassigned

## Problem

Round 3 of the device gate (maintainer, verbatim in spirit,
2026-06-11): "when I somehow manage to place a building on the map
(mind you, still no indication where I'm 'clicking') the building
literally doesn't render. Like…, at all. Just a flag. And still —
zero animations — flags aren't waving at all still."

Three render truths the world was not showing:

1. **The cursor never followed the tap** — the 5-point cursor sprite
   was drawn as HUD decoration pinned to the top-right corner. The
   maintainer's round-1 "ALWAYS stuck in a corner" was literal: it
   was designed into the corner. Selection state existed in the DOM;
   the player could not see it on the map.
2. **A placed building rendered nothing** — sites at progress 0
   (leveling, which lasts until a builder arrives — forever, if no
   road reaches the site) drew no sprite at all. The reference shows
   CrossSprite 0x90 the instant a site is placed.
3. **Flags never waved anywhere** — the renderer used the single
   static map-object 128; the reference cycles frames 128..131 by
   `(tick >> 3) & 3`. Not a device problem: no platform ever waved.

## Acceptance criteria

- [x] The cursor draws at the selected tile as a map marker, never
  as corner chrome (unit-gated; corner cursor asserted absent).
- [x] A building site at progress 0 renders the construction cross
  (unit-gated through a real placed building).
- [x] Flags cycle the four reference wave frames with the tick
  (unit-gated frame-by-frame; real-data pixels verified to change).
- [x] The fixture archive carries the cross and all four flag
  frames so CI can see what the phone sees.
