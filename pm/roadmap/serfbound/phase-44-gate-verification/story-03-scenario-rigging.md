# SB-44-03 — Scenario Rigging and the In-Game Verification HUD

- **Project:** serfbound
- **Phase:** 44
- **Status:** done
- **Depends on:** SB-44-01 (the protocol deck), SB-44-02 (the shared verdict store)
- **Unblocks:** the Bucket-A gate closures (35–39, 42, 43) — the maintainer now reaches each check's state in one tap and records the verdict in-game
- **Owner:** unassigned

## Problem

The deck (SB-44-01/02) sequenced the checks and captured verdicts, but it
was still only a checklist: before every check the maintainer had to
hand-build the game state on a phone — found a castle, lay a road, wait
for serfs, hunt for trees to fell. Slow, error-prone, and
non-deterministic. The round-8 road-split bug (check 36.1) is exactly the
state that's painful to reproduce by hand. The maintainer asked for two
things: (1) "rigging" that boots the game into the exact state a check
needs, on a test map that guarantees placement; and (2) the game itself
able to report back — pass/fail by clicking inside the running game, with
the verdict feeding the same results.

## What ships

A **scenario rigging harness** built on the engine's own determinism.
`restoreSerfboundLocalGame(snapshot)` rebuilds an exact game from
`settings` (incl. an optional custom map) plus a replayed `worldActions`
log — so a rig is a first-class snapshot, not a hack.

- **Authoring API** (`packages/test-support/src/scenario-rig.ts`). A
  declarative `RigScenario` whose `build()` runs imperatively against a
  live world — `RigBuilder.foundCastle/flagNear/road/buildingNear` resolve
  real positions via the engine's own `canBuild*` scans, so scenarios
  never hand-pick tile indices. `buildLocalGameRig` drives the real start +
  `applyWorldAction` + `recordWorldAction` path and snapshots.
- **Purpose-built test maps** (`rig-maps.ts`). Flat plains, woodland,
  shoreline (stocked with fish), ore hills, and a two-player border —
  authored through `MapEditor` / `encodeCustomMap`, validated with
  `evaluateMapPlayability` at bake time so an unplayable map fails
  generation, not the device.
- **The rig catalog** (`rig-scenarios.ts`): 13 rigs covering 33 of the 36
  checks across all 7 gates. The three gaps (38.8 tool-gating, 42.4 touch
  feel, 43.4 the un-built moderation UI) are inherently observational and
  honestly left un-rigged, not faked.
- **The generator** (`scripts/build-rigs.mjs`, `npm run build:rigs`) bakes
  each scenario to `public/rigs/<id>.json` and a `manifest.json`, round-
  tripping every local-game rig through restore and checking its
  expectations — a rig that no longer reaches its state fails the build.
- **The `?rig=<id>` loader** (`packages/app/src/main.ts`). A dev-only seam
  like `?dev=1`: inert without the param, silent fallback on any failure.
  It runs after the persisted-archive restore (so a rig renders against
  the device's imported SPAU.PA), shares one extracted
  `applyRestoredLocalGame` with the Load button, and routes local-game /
  editor-draft / gallery rigs to their surface.
- **The in-game verification HUD** (`packages/app/src/rig-hud.ts`). A DOM
  overlay over the three.js canvas carrying the check's instruction, the
  pass condition, Pass/Fail/Skip + notes per covered check, and prev/next
  to walk the rig sequence. Verdicts write to the **same** localStorage key
  the deck reads (`serfbound-gate-playtest-v1`), so the deck/report reflect
  in-game captures when served from the game's origin.
- **The deck, recast** (`playtest/index.html`) as a launcher + dashboard:
  it fetches the manifest, injects an "▶ Open rig" deep-link + instruction
  on each check (configurable base URL, default `serfbound.com`), and
  re-reads the shared store on focus. Unchanged when no manifest is
  reachable — it degrades to the SB-44-01 checklist.

## freeserf.net boundary

Held. The engine is untouched; the authoring API lives in test-support and
only drives existing engine entry points. The app change is a refactor-
extract plus one `?rig=`-gated branch and an overlay that never mounts in
normal play. Test maps carry only integer terrain/object/mineral bytes
(the custom-map format physically cannot carry sprite data), so the asset
boundary holds — `check:boundaries` and `check:independence` stay green.

## Acceptance criteria

- [x] All 13 rigs bake; every local-game rig restores `started` and meets
  its expectations (`build:rigs` self-check + `verify:rigs` node pass).
- [x] `?rig=<id>` boots the game into the rigged state and mounts the HUD;
  all 11 local-game rigs reach "Running" — verified in real Chromium with
  real SPAU.PA (`verify-rigs.mjs` browser pass, 13/13 boot + HUD).
- [x] The HUD records Pass/Fail/Skip + notes to the shared store; the deck
  reflects an in-game verdict on focus and it flows into the hand-back
  report (`verify-deck.mjs` Pass 4).
- [x] Inert and safe without `?rig=`; 323 unit tests, boundaries,
  independence, design, and docs checks all green.
- [x] Visual evidence: the road-split rig opens with castle + splittable
  road + HUD (`artifacts/rig-road-split.png`).
