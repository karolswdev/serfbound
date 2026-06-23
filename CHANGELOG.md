# Serfbound Changelog

## Unreleased — after v0.2.0

- **Licensed asset delivery (Phase 31)**: written permission is recorded in
  `LICENSE-CONSENT.md`; the deterministic `sb31-runtime-v1` converter,
  hosted manifest/package delivery, checksum/provenance verification,
  separate IndexedDB cache, public-origin audit, and zero-import
  `serfbound.com` first run are shipped. The import-your-own-data path remains
  first-class, and the licensed-package font-shadow contrast fix is in place.
- **Gate verification (Phase 44)**: the hosted playtest protocol deck, durable
  verdict export, in-game rig HUD, report server, phone-targeted deck fixes,
  asset library, and camera-centering rig fixes are shipped so Bucket-A
  device gates can close on maintainer evidence.
- **Community maps (Phase 43)**: the maps service, signed client, sprite-free
  thumbnails, moderation/quota/reporting, play counts, gallery/library shell,
  local downloaded-map storage, and deterministic custom-map multiplayer
  handshake are shipped.
- **Open-source readiness (Phase 28)**: README media, feature claims,
  contributor guide, GitHub issue/PR templates, repository topics, five seeded
  `good first issue` items, and the public-doc link/media CI guard are
  shipped.
- **Social realm (Phase 33)**: the identity v2 schema/privacy posture contract
  is accepted; README/player-guide/shell copy now state the optional online
  identity data honestly; device keys are legacy standing migration only, not
  v2 credentials; nameless mailbox challenges reject; and lobby entries carry
  challenger key ids for unambiguous challenge/rating joins.

## v0.2.0 — 2026-06-13

The simulation-fidelity release: the reference parity audit, system by
system, closed — plus the in-browser map builder.

- **Locomotion (Phase 35)**: one movement system on the reference
  counter tables with slope; building doors with leave/enter slides;
  driven work poses (the five-stage tree fall with felled-tree map
  objects, sliced stonecutting). The "teleporting lumberjack" is dead.
- **The transport economy in full (Phase 36)**: resources carried out
  the castle door by hand; flag slots scheduled per direction over the
  real network search with priority pickup; split roads that staff
  themselves; roads that reinforce under load; the stock priorities,
  the player's priority book, and the emergency program. "Materials
  appearing at the castle door" is dead.
- **The living map (Phase 37)**: the reference map clock — trees grow
  from saplings, felled trunks rot to stubs, fields ripen and expire on
  the clock, fish spawn and migrate. The map changes without you.
- **Professions, tools, fire (Phase 38)**: the fisher, farmer, and
  forester work in the open; the geologist prospects and plants signs;
  tools gate professions (no axe, no lumberjack); a demolished building
  burns down with escaping serfs; action sounds ride the animation
  frames.
- **Knight fidelity (Phase 39)**: the garrison disciplines
  (reproduction clock, serf-to-knight rate, the two-phase cycling
  swap); the commanded attack from the border garrisons; gold-and-
  castle-score morale on the reference cadence; the free fight on open
  ground.
- **Boats (Phase 40)**: the boatbuilder builds boats — the last
  buildable no-op retired.
- **The map builder (Phase 42)**: an in-browser map editor that looks
  exactly like the game (the real tiles, import-gated) — paint terrain
  and heights with the slope clamp, place objects/minerals/starts by
  the engine's own rules, validate playability, and play your map
  locally. A self-verifying custom-map format that plays clean.
- **Render fixes**: runtime-laid map objects (felled trunks, saplings,
  signs) now render; serfs on inclines no longer sink into the terrain.

## serfbound-v0.1.0 — 2026-06-10

The first public release: the complete classic game, browser-native,
playing from the user's own original data.

- **World**: the classic map generator with tile-for-tile fixture parity;
  authentic decoded terrain, objects, borders, and waves.
- **Settlements**: castle founding, flags, pathfinder roads, serf-driven
  construction at reference material costs.
- **Serfs**: the reference state machine (tick/counter, walking
  animations, collision waiting, waiting-swap), transporters, builders,
  and the profession workers.
- **Economy**: every classic chain (wood, stone, food, meat, mining,
  metallurgy, tools, weapons) with demand-driven dispatch and lossless
  transport over the road network.
- **Conquest**: knight recruitment on gold morale, garrisons growing
  borders through the reference influence tables, exact SetFightOutcome
  combat parity, capture, defeat, and game over.
- **Interface**: the original UI rebuilt from decoded art — game font,
  icons, panel bar, build/stats/sett popups, minimap, notifications, and
  the start screen with the decoded logo.
- **Sound**: all 39 DOS clips with exact ConvertToWav parity and XMI
  music through a WebAudio synth, gesture-gated, with persistent mutes.
- **The complete game**: the 31-mission campaign, classic AI opponents
  (replayable world actions), original DOS savegame parsing, game
  speeds, and autosave.
- **Browser experience**: measured scale headroom, touch play, an
  installable offline-capable PWA, onboarding, and accessibility.

No original game data is bundled, hosted, or cached — players import
their own `SPAU.PA`, which never leaves their device.
