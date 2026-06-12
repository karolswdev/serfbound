# SB-38-05 — The Sound of Work

- **Project:** serfbound
- **Phase:** 38
- **Status:** done
- **Depends on:** SB-38-01, SB-38-04
- **Unblocks:** SB-38-06
- **Owner:** unassigned

## Problem

The audit's row 14: the 39 reference clips decode and play — on
clicks, popups, production events — but the WORK is silent. In the
reference every action sounds like itself, keyed to the animation
frame the player is watching: the axe blow lands on the swing
frames, the tree-fall crash on the final chop, the pick on the
stone, the saw in the sawmill window, the rod reel at the shore,
the scythe in the field, the planting dig, the builder's hammer,
the geologist's sample tap, the swords in a fight.

## Reference ground truth (Render/RenderSerf.cs 852–1430)

- Per-profession frame rules on the body-sprite byte: lumberjack
  0x85 always / 0x86 latched → AxeBlow (TreeFall layered when the
  last chop's counter runs out); stonecutter 0x85/0x86 → PickBlow;
  forester 0x86/0x87 → Planting; sawmiller 0xb3/0xbb/0xc3/0xcb +
  latched 0xb7/0xbf/0xc7/0xcf → Sawing; butcher 0xb2/0xba/0xc2/0xca
  → BackswordBlow; fisher rod frames → FishingRodReel; builder
  (frame & 7) == 4/5 → HammerBlow; digger 0x83/0x84 → Digging;
  geologist → GeologistSampling; fights → Fight01..04.
- IsPlayingSfx: a per-serf latch so a held frame does not retrigger.

## What ships

- `work-sounds.ts`: the frame-rule table as a pure module — given a
  serf's profession context and the frame transition, it names the
  clip — with the reference rules ported per profession and the
  latch condensed to frame-edge detection.
- The shell's render loop evaluates it for every visible working
  serf and plays through the existing audio service (clips decoded
  since SB-17): chopping, sawing, mowing, planting, reeling,
  hammering, sampling, and the clash of a fight, all in sync with
  the pose on screen.

## Acceptance criteria

- [x] The rules module names the right clip on frame entry and
  stays silent on held frames, for every ported profession
  (CI-gated, stash-verified).
- [x] Full unit sweep + release gates green.

## Honest limits

- The reference's IsPlayingSfx start/stop latch is condensed to
  frame-edge triggering (play on entering a trigger frame) —
  equivalent cadence for the reference's frame tables, recorded.
- Miner sounds stay silent (serfbound miners work invisible inside
  the mine); the sailor's rowing rides Phase 40 with the sailor.
- The farmer's mowing and the fight clips follow the reference's
  intent on serfbound's frame set rather than byte-exact rules
  (recorded; the reference's farmer/fight sections key on state
  variables serfbound condenses).
