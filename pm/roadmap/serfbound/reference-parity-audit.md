# Reference Parity Audit — What Serfbound Skipped

**Date:** 2026-06-11. **Trigger:** the maintainer's sixth device pass:
"the lumberjack is teleporting… nobody brings out the raw materials,
they literally just appear at the castle door… when I created a flag
in the middle of the road no new worker came up… we SKIPPED SO MUCH
this isn't even an alpha yet."

**Verdict: the maintainer is right.** Phase 34's whack-a-mole rounds
(2–7) each fixed a symptom and exposed three more because the engine
condensed or deferred entire reference systems. This audit is the
honest, system-by-system accounting against Freeserf.net
(Freeserf.Core), with the reference's concrete mechanics as ground
truth, and it is phased out into Phases 35–38.

The reference's serf state machine has **78 states**. Serfbound's has
**17**. That single number is the audit in miniature.

---

## How to read the table

- **Faithful** — ported with reference constants; parity-tested.
- **Condensed** — works, but a simplified model replaces the
  reference mechanism (recorded in code comments).
- **Missing** — not implemented at all.

| # | System | Reference (ground truth) | Serfbound today | Status | Phase |
|---|---|---|---|---|---|
| 1 | Serf walking pace | Per-frame counters (walking rows 255…1023 ticks), slope-modified `(slope*counter)>>5`, turn animations 110–115 | Road walking uses the reference counter table; **the harvest walk ignores it** (fixed 8 ticks/tile ≈ 5–10× road speed — the "teleporting lumberjack") | Condensed | 35 |
| 2 | Leaving/entering buildings | LeavingBuilding/EnteringBuilding states: the door at DownRight, slide offsets, RoadBuildingSlope per type (5–22), slope-scaled counters | Serfs blink in/out of buildings; no door, no slide, no slope | Missing | 35 |
| 3 | Work animations | Logging = 5-stage tree fall (frames 116–120, felled-tree objects on the map), StoneCutting = anim 123 over 1535 ticks, Sawing 124, Planting, Fishing rod… | Worker stands in his walking pose for a flat 60-tick dwell; the object flips in one step | Missing | 35 |
| 4 | Resources leaving the castle | MoveResourceOut → WaitForResourceOut → DropResourceOut: a serf **walks out the door carrying the resource** and drops it at the flag; 2-slot OutQueue | `pendingOut` drops resources directly onto the castle flag — "they literally just appear at the castle door" | Condensed | 36 |
| 5 | Flag scheduling | 8 slots with per-slot direction + destination, ScheduleSlotToKnownDest (BFS over the flag network) vs UnknownDest, pickup scheduling flags per direction | Greedy `#directionToward` BFS; no priorities, no per-direction scheduling, no multi-serf coordination at congested flags | Condensed | 36 |
| 6 | Road split by a new flag | Game.BuildFlagSplitPath: FillPathSerfInfo on both halves, the existing transporter is **reassigned to one half** via PathSplited(), a new transporter is requested for the other | Structural split only — "serf reassignment deferred"; the old transporter sits on the new flag, the second half is unstaffed (the maintainer's exact bug) | Missing | 36 |
| 7 | Transporter pool per road | MaxTransporters by length category {1,2,3,4,6,8,11,15}; idle park/wake (IdleOnPath, WakeAtFlag, WakeOnPath); WaitCounter>3 → TransporterToServe | One transporter per road, ever; no park/wake, no multi-transporter staffing | Condensed | 36 |
| 8 | Tree growth & map ambience | Map.Update every tick: NewTree/NewPine mature on `(rand & 0x300)==0`, felled→stub→none decay, Seeds0–5→Field0–5→expired on the map clock, fish spawn AND migrate between water tiles, signs decay | **The map is static.** Forester saplings mature instantly; fields advance inside the farmer's state machine; fish only deplete; nothing decays | Missing | 37 |
| 9 | Outdoor professions | Planning states (PlanningLogging/StoneCutting/Fishing/Farming…), FreeWalking with distance bookkeeping, every gatherer visibly out: fisher at the shore, farmer sowing/harvesting, geologist sampling | Lumberjack + stonecutter walk out (round 7, but at the wrong pace and with no work poses); fisher/farmer/forester act at a distance; **no geologist at all** | Condensed | 38 |
| 10 | Building request loop | Building.Update: Stock[n] {available, requested, maximum, priority}, dynamic priority `policy >> (8+total)`, worker + materials requested per building through inventory dispatch | Stock condensed (delivered+requested merged); workers auto-spawn per building; no priorities | Condensed | 36 |
| 11 | Inventory serf types | Per-profession serf counts, tools gate professions (an axe makes a lumberjack), CallOutSerf by type | A generic pool; tools are produced but **gate nothing** | Condensed | 38 |
| 12 | Demolition & burning | Burning state with countdown, escape serfs (EscapeBuilding, Scatter), rubble | Structural removal only | Missing | 38 |
| 13 | Knights & combat | 30+ knight states, ranks with appearance, morale, occupation/training loop, menu-driven attack selection | Condensed combat (dispatch from castle, greedy march, outcome tables); ranks exist but no training | Condensed | 39 |
| 14 | Sound on actions | Per-action sfx (rowing, digging, fights) keyed to animation frames | Click/accept/production hooks only | Condensed | 38 |
| 15 | Core determinism | Random, map geometry, checksums | Parity-tested in CI against fixtures | Faithful | — |
| 16 | Terrain/objects/roads render | RenderMap triangle composition, masks, path segments | Faithful (decoded art, masks, road masks audited) | Faithful | — |

## Why the symptoms looked random but weren't

Every round-2..8 device complaint traces to rows above: the cropped
build menu and frozen flags were renderer gaps (fixed in 34); the
teleporting lumberjack is row 1+3; the materializing materials are
row 4; the unstaffed split road is row 6; the identical serfs were
the appearance system (fixed in 34 round 7). The phase-34 pattern —
fix one, expose three — is what shipping against a condensed
simulation looks like. The fix is not more rounds; it is porting the
systems.

## The alpha bar

Serfbound calls itself an alpha when a player on a phone can, without
reading anything: found a castle, lay roads that staff themselves
correctly (including splits), watch serfs walk at the original's
pace through doors that exist, see every gathered resource carried
by hand from castle door to construction site, watch trees fall in
five stages and saplings grow back, and burn a building down. Rows
1–10 green, on-device sign-off. That is the exit gate of Phase 38.

## The phases

- **Phase 35 — Locomotion and the working pose.** One movement
  system: every walk (roads, free-walking, harvest) paced by the
  reference counter tables with slope; building doors with
  leave/enter slides; driven work animations (logging's five-stage
  fall with felled-tree map objects, stonecutting, planting); turn
  and waiting animations. Kills "teleporting serfs" at the root.
- **Phase 36 — The transport economy in full.** The reference flag
  scheduling (slots scheduled per direction, known/unknown dest
  searches), resources walked out of inventories by serfs
  (MoveResourceOut chain), transporter reassignment + second-half
  request on road split, idle park/wake, MaxTransporters per length
  category. Kills "materials appear at the castle door" and the
  split-road bug at the root.
- **Phase 37 — The living map.** Map.Update ambience: tree/pine
  growth, felled decay, field stages on the map clock, fish spawn
  and migration, sign decay. The forester plants something that
  grows.
- **Phase 38 — Professions, tools, and fire.** Every outdoor
  profession on the reference planning/free-walking cycle (fisher at
  the shore, farmer in the field, geologist), tools gating
  professions from the inventory's typed serf counts, demolition and
  burning with escaping serfs, action sound hooks.
- **Phase 39 — Knight fidelity.** Row 13 comes off the "later" pile:
  the full knight state machine, the garrison disciplines (castle
  knights wanted, serf-to-knight rate, cycling, send
  strongest/weakest), the player-commanded attack flow, and the gold
  morale loop in full. (Addendum rows 13 and 17 detail.)
- **Phase 40 — Boats and waterways.** Addendum row 17: the
  boatbuilder builds boats, sailors carry cargo over water roads.
- **Phase 41 — Levers and ledgers.** Addendum rows 18–22, the
  player-facing halves: the settings sliders, the 20-message
  notification system, the history/score stat windows, minimap
  modes. (The engine-side settings data and the emergency program
  land in Phase 36, where the scheduler and stock priorities consume
  them — SB-36-07/08.)

Phase 34 (touch playability) stays open for its device gate but
takes **no new simulation stories**; simulation complaints route to
35–38.

---

## Addendum — 2026-06-11, second pass: what the audit itself skipped

**Trigger:** the maintainer, reading phases 35–36 in flight: "I
still think we are missing the mark on many of these… I am nearly
certain that not all [is covered]." A full sweep of Freeserf.Core
against the engine — this time inventorying everything, not just
the systems behind the device complaints — confirms it. The
original sixteen rows were the audit of *the simulation the player
watches*; these six are the audit of *the game the player runs*:
whole subsystems with no row, no phase, and (for most) no code.

| # | System | Reference (ground truth) | Serfbound today | Status | Phase |
|---|---|---|---|---|---|
| 17 | Water transport | Sailor serf type with FreeSailing/LostSailor states, BoatBuilder building boats from planks (BuildingBoat, 9-step cycle), flags track water vs land per direction, water roads carry cargo by boat (Serf.cs, Flag.cs, Building.cs) | The boatbuilder is a buildable building with a sprite offset and **no work cycle** — no case in the profession switch; the boat resource exists and nothing produces or consumes it; no sailor, no water carriage. A player can build a useless building today | Missing | 40 |
| 18 | Player economy settings | PlayerSettings.cs: food distribution to the 4 mine types, plank split (construction/boatbuilder/toolmaker), steel split, coal 3-way, wheat split, 9 tool-making priorities, the 26-entry **flag and inventory transport priority lists**, inventory in/stop/out modes per stock (resources AND serfs), SerfToKnightRate, CastleKnightsWanted | **None of it exists as engine data** — the only settings a player can touch are knight occupation rows and audio volume. Verified: the sole grep hit for the whole settings surface is the knight-promotion function | Missing | 36 + 41 |
| 19 | Notifications | 20 typed messages with map positions (Notification.cs): UnderAttack, LoseFight, WinFight, MineEmpty, LostLand, FoundGold/Iron/Coal/Stone, EmergencyActive/Neutral, CallToLocation, save-age nudges… | Building-complete, game-over, achievement, and multiplayer toasts. A player whose hut is attacked off-screen learns nothing | Missing | 41 |
| 20 | Statistics, history, score | 4-timescale circular history buffers (112 slots each: land, buildings, military, total), 120-slot resource history, player score calculation, the original stat chart windows (Game.cs 2608–2768, Player.cs) | The stats popup is a flat resource-count grid; profile win/loss is the only history | Missing | 41 |
| 21 | Emergency program | Player.cs: a castle short of planks/stones flips into the emergency program — construction priorities collapse to lumberjack/sawmill/stonecutter until supply recovers; EmergencyActive/Neutral notifications | Nothing — a starved settlement just stalls | Missing | 36 |
| 22 | Minimap modes | Ownership modes (None/Solid/Mixed), scale, building/road overlays (Minimap.cs) | One fixed terrain+owner rendering; height shading already recorded as deferred | Condensed | 41 |

Row 13 (knights) was the only original row parked as "later" with
no phase; this pass also surfaced how deep it runs — no training
loop, no knight cycling, no castle-knights-wanted, no
send-strongest/weakest, no attack UI flow (pick target, choose
knight count), 5 knight states against the reference's 30+. It is
now Phase 39.

Also recorded in this pass, noted but not rowed:

- **In-flight serf state is not serialized** (local-game.ts:128,
  recorded since Phase 13): restored games re-dispatch logistics.
  Original saves capture serfs mid-stride. Rides Phase 41 with the
  ledger work or earlier if a save bug forces it.
- **AI depth**: the reference AI's AdjustSettings, CraftTool,
  FindMinerals, AvoidCongestion, DestroyUselessBuildings states are
  condensed (recorded in ai.ts). AdjustSettings only becomes
  meaningful once row 18 exists; re-audit after Phase 41.
- **Mission reproduction parameter** (serf spawn rate per character
  preset) appears unimplemented; verify against Mission.cs when the
  campaign is next touched.
- **Music is oscillator synthesis**, not soundfonts — a recorded
  SB-17-02 decision, restated here so the fidelity gap has one home.

**The alpha bar is unchanged** (rows 1–10 green, Phase 38 exit).
Rows 17–22 define the bar *behind* it: parity with freeserf.net as
played, not just as watched. Phases 39–41 are that bar's phases.

## Sources

- Reference: Freeserf.Core — Serf.cs (78-state enum, counter tables,
  free-walking/logging/stonecutting sequences, building entry/exit),
  Flag.cs (slots, scheduling, FillPathSerfInfo/PathSplited),
  Inventory.cs (OutQueue, modes), Building.cs (Stock, priorities),
  Game.cs + Map.cs (update cadence, ambient growth/fish/signs).
- Serfbound: every recorded condensation in
  packages/engine/src/{serfs,game-world,inventory,ai,pathfinder}.ts
  (grep "condensed|deferred|interim|recorded"), surveyed 2026-06-11.
- Addendum second pass: Freeserf.Core — PlayerSettings.cs +
  Player.cs (the full settings surface, emergency program, score,
  morale), Notification.cs (the 20 message types), Game.cs
  (history buffers), Mission.cs (character presets), AI.cs (state
  list), UI/Minimap.cs; Serfbound — full engine/app sweep
  2026-06-11 late, including the negative greps recorded in the
  addendum rows.
