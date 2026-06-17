# Evidence — SB-44-18 God-Mode Building Editor

## Build + unit suite green

```
$ npm run build
> tsc -b packages/engine packages/assets packages/test-support packages/app
$ npm run test:unit
# tests 329
# pass 329
# fail 0
```

## Architecture gates green

```
$ npm run check:boundaries
serfbound-boundaries-ok
$ npm run check:design
serfbound-design-tokens-ok: 44 tokens defined, 44 consumed, 0 reserved, raw-color ratchet 0/0.
```

(The editor is a `.ts` module with inline styles; it touches no shell CSS /
root index.html / public, so the design structural gate doesn't fire.)

## Placement works end-to-end (real SPAU data)

Driven in a real Chromium against `?rig=phase-35-lumberjack` on the built site
(vite preview), with the user's local SPAU.PA imported:

```
canvas box { x: 16, y: 66.875, width: 1132, height: 867.125 }
buildings before 2 after 3 placed 1
```

Arm a type from the palette → tap a valid tile → `buildBuilding` runs → the
world re-renders → a new marker appears. `artifacts/editor-placed.png`.

## Select / move / replace / delete

`artifacts/editor-select.png` — a selected building with the popover
("Castle · P1", ⤳ Move / ⟳ Replace / 🗑 Delete) and the PLACE palette down the
left. `editor-highlights.png` — every building marked. `hero-split.png` shows
the deck+game split (the rig surface the editor rides on). Move/replace/delete
use the same `demolishBuildingAt` + `buildBuilding` primitives the placement
path exercises above.
