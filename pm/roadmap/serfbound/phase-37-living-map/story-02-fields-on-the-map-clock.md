# SB-37-02 — Fields on the Map Clock

- **Project:** serfbound
- **Phase:** 37
- **Status:** done
- **Depends on:** SB-37-01
- **Unblocks:** SB-37-03
- **Owner:** unassigned

## Problem

The farmer grows his own wheat by bookkeeping: he sows a tile,
privately remembers it, and harvests it on his next work cycle at
whatever stage it shows — the audit's row 8 ("fields advance inside
the farmer's state machine"). In the reference the MAP grows the
field: Seeds0..5 age into Field0..5 on the map clock and expire to
nothing, and the farmer is just a man with a scythe who sows open
ground and harvests whatever fields stand ready — each harvest
visit advancing the field one stage (Field5 becomes FieldExpired),
so one sowing feeds several cuts.

## Reference ground truth

- Map.cs UpdatePublic (2835–2869): Seeds0..4 and Field0..4 advance
  one stage per visit, Seeds5 → Field0, Field5 → FieldExpired,
  FieldExpired → None.
- Serf.cs HandleSerfFarmingState (8138–8165): sowing puts Seeds0 on
  open, path-free ground; harvesting advances the stage (Field5 →
  FieldExpired) and the farmer carries wheat home.

## What ships

- The field cases join `#updateMapTile` — the map ages every sown
  tile through the full Seeds → Field → FieldExpired → None life.
- The farmer's private growth is deleted: each work cycle he
  harvests the nearest standing Field0..5 (advancing its stage, one
  wheat per cut) or, if none is ready, sows Seeds0. No tracked
  tile, no instant stages.

## Acceptance criteria

- [x] No wheat before the map has had time to grow a field — the
  condensed farmer's instant harvest fails this clock (engine-gated,
  stash-verified) — and wheat flows once fields stand.
- [x] A sown tile left alone walks the whole reference life:
  seeds, field, expired, gone (engine-gated).
- [x] Full unit sweep + release gates green.

## Honest limits

- The farmer still works at a distance from his building (the
  outdoor sow/harvest FreeWalking trips are Phase 38's profession
  cycles); what changed is that the MAP owns growth.
- The reference's Seeds5-harvest special case (turning ripe seeds
  into Field0 by hand, no wheat) is not ported — the farmer waits
  for Field0; recorded.
