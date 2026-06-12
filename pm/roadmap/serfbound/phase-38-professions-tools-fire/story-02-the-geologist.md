# SB-38-02 — The Geologist

- **Project:** serfbound
- **Phase:** 38
- **Status:** done
- **Depends on:** SB-38-01
- **Unblocks:** SB-38-03
- **Owner:** unassigned

## Problem

The audit's row 9, last clause: "no geologist at all." Serfbound's
mineral deposits are invisible until a mine happens to stand on
them — the player builds blind. The reference sends a geologist to
a flag in the mountains; he wanders the slopes spot by spot,
hammers a sample at each, and plants the signs the player reads:
large or small gold/iron/coal/stone where minerals lie, the empty
sign where nothing does. The signs fade on the map clock (already
ported, inert until now).

## Reference ground truth (Serf.cs)

- LookingForGeoSpot: eight tries at a random spiral distance
  (`((rand >> 2) & 0x3f) + 1`); the spot must be object-free and
  touch mountain terrain (Tundra0..Snow0 in any of the four
  triangles); two strikes on existing signs end the outing; no spot
  found walks him home.
- SamplingGeoSpot: no mineral or no amount → SignEmpty; else
  `SignLargeGold + 2 * (mineral - 1) + (amount < 12 ? 1 : 0)` —
  the hammering pose (142), then back to looking from where he
  stands.

## What ships

- A `prospecting` serf state and `sendGeologist(flagIndex)` on the
  engine: a castle serf walks the roads to the flag, then runs the
  reference looking/sampling loop on the shared RNG — signs planted
  at his own feet — and walks home to the castle when the mountains
  are sampled out.

## Acceptance criteria

- [x] A geologist sent to a mountain flag plants the correct large
  coal sign on the deposit and empty signs on barren slopes, each
  landing at his feet, and returns to the castle (engine-gated,
  stash-verified).
- [x] Full unit sweep + release gates green.

## Honest limits

- The flag-popup "send geologist" button is app surface — it rides
  the alpha-gate device work; the engine API is the story.
- FoundGold/Iron/Coal/Stone notifications ride Phase 41's messenger
  (the reference's same-sign-nearby suppression goes with them).
- Tools do not gate him yet (no hammer required) — SB-38-03.
- He free-walks on the shared greedy walker like every outdoor
  profession (recorded with SB-38-01).
