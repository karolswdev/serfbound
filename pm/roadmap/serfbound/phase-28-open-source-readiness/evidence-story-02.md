# Evidence — SB-28-02 — README Overhaul

- **Shipped:** 2026-06-11 (bundled with SB-28-01; the README and the
  media it references are inseparable for a green main)
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `README.md` — the overhaul: the hero (pitch + play-now at
  serfbound.com + the living-settlement screenshot), the privacy
  promise kept loud, the evidence-grounded feature showcase, the
  three-scene screenshot row, the updated Play path (serfbound.com
  first, drag-drop import), the regeneration note, and the lineage/
  license section preserved with one added sentence stating whose
  data produced the screenshots.

## The claims map (every feature claim → its shipped phase)

| Claim | Phase |
|---|---|
| Original world generator, fixture parity | 11 |
| Every production chain, no deadlock | 14 |
| Knights, territory, conquest math | 15 |
| Original interface decoded | 16 |
| Sound + XMI music from own files | 17 |
| 31 missions, classic AI, DOS saves | 18 |
| Offline PWA, touch, ~2M ticks/s | 19 |
| High-DPI view scales, gestures | 21 |
| Realtime lockstep | 22 |
| Hot-seat + async correspondence | 23 |
| English + German in original glyphs | 26 |
| serfbound.com live, online correspondence, device-key accounts | 29 |
| Lobby, ladder, deeds, avatars/guilds | 30 |

## Verification artifacts

```
npm run check:media -> ok (5 referenced, 5 committed, in budget)
npm run test:docs -> ok (the docs gate governs docs/*; the README
  keeps its required cross-links to the guides)
npm run ci:release -> exit recorded in this commit's gate run
```

## Acceptance criteria — re-checked

- [x] The README opens with the pitch and a real gameplay screenshot;
  features shown with media.
- [x] Every feature claim traceable — the map above.
- [x] Links resolve (check:media for media; the guides' links
  unchanged and gate-covered); play and development paths survive a
  cold read.

## Deviations from plan

- The CI badge: deferred to SB-28-03 with the rest of the repo
  metadata (one surface, one story).

## Follow-ups

- SB-28-03: contributor onramp + repo metadata (description, topics,
  social preview from `docs/media/social-preview.png`).
- SB-28-04: the fresh-clone gate.
