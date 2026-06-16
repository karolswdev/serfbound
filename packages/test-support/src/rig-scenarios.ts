// The rig catalog (SB-44-03): one entry per gate check (or group of checks)
// that can be put into a known state. Each local-game scenario's build() runs
// against a live world at bake time, so positions are resolved by the engine's
// own canBuild* scans rather than hand-picked tile indices. A few checks are
// inherently observational (touch feel, an unbuilt moderation UI) and are
// deliberately absent — honestly un-rigged, not faked.

import { buildingType } from "@serfbound/engine";
import type { RigScenario } from "./scenario-rig.js";
import {
  borderMap,
  flatPlainsMap,
  flatTreesMap,
  mountainsMap,
  shorelineMap,
} from "./rig-maps.js";

export function rigScenarios(): readonly RigScenario[] {
  return [
    // ── Gate 35 — Locomotion fidelity ────────────────────────────────────
    {
      id: "phase-35-lumberjack",
      gate: "SB-35-04",
      check: "35.1",
      covers: ["35.1", "35.2", "35.3", "35.4"],
      kind: "local-game",
      title: "Lumberjack on a road",
      instruction:
        "A lumberjack's hut stands roaded to your castle beside a wood. Watch one full cycle: the serf leaving, his pace tile-to-tile, the door transition, and a tree felled.",
      result:
        "He WALKS (no teleport), at a deliberate ~247 ticks/tile, slides through the door, and fells a tree in five visible stages leaving a stump.",
      map: flatTreesMap(),
      initialSupplies: 30,
      expected: [
        { kind: "castle-built", player: 0 },
        { kind: "building-of-type", building: buildingType.lumberjack },
        { kind: "tree-near-building", building: buildingType.lumberjack },
      ],
      build: (rig) => {
        const { flag } = rig.foundCastle(0);
        const hut = rig.buildingNear(flag, buildingType.lumberjack, 2);
        rig.road(flag, rig.step(hut, "DownRight"));
      },
    },

    // ── Gate 36 — Transport economy ──────────────────────────────────────
    {
      id: "phase-36-road-split",
      gate: "SB-36-06",
      check: "36.1",
      kind: "local-game",
      title: "Split a live road",
      instruction:
        "A road runs from your castle flag to a lone flag. Plant a new flag on a tile in the MIDDLE of that road to split it in two.",
      result:
        "BOTH halves staff themselves — a distinct carrier appears on each half (the round-8 bug left the new half unstaffed).",
      map: flatPlainsMap(),
      initialSupplies: 30,
      expected: [
        { kind: "castle-built", player: 0 },
        { kind: "flag-count", atLeast: 2 },
      ],
      build: (rig) => {
        const { flag } = rig.foundCastle(0);
        const far = rig.flagNear(flag, 9);
        rig.road(flag, far);
      },
    },
    {
      id: "phase-36-haul-chain",
      gate: "SB-36-06",
      check: "36.2",
      covers: ["36.2", "36.3"],
      kind: "local-game",
      title: "Resources leave the castle by hand",
      instruction:
        "A lumberjack's hut sits at the end of a two-flag road from your castle. Watch a resource leave the castle and travel to the hut.",
      result:
        "A serf carries it OUT THE CASTLE DOOR and it is handed flag-to-flag along the road — never materializing on a flag, never teleporting.",
      map: flatPlainsMap(),
      initialSupplies: 30,
      expected: [
        { kind: "castle-built", player: 0 },
        { kind: "flag-count", atLeast: 2 },
        { kind: "building-of-type", building: buildingType.lumberjack },
      ],
      build: (rig) => {
        const { flag } = rig.foundCastle(0);
        const mid = rig.flagNear(flag, 7);
        const hut = rig.buildingNear(mid, buildingType.lumberjack, 3);
        rig.road(flag, mid);
        rig.road(mid, rig.step(hut, "DownRight"));
      },
    },

    // ── Gate 37 — Living map ─────────────────────────────────────────────
    {
      id: "phase-37-living-map",
      gate: "SB-37",
      check: "37.1",
      covers: ["37.1", "37.2", "37.3", "37.4"],
      kind: "local-game",
      title: "Leave the map running",
      instruction:
        "A forester works a wood beside open water. Leave the settlement running and watch the map itself: saplings, a felled trunk, planting, and the water.",
      result:
        "Saplings grow into trees on the map clock, trunks rot to stumps and vanish, the forester's plantings mature over map-time, and fish are present in the water.",
      map: shorelineMap(),
      initialSupplies: 30,
      expected: [
        { kind: "castle-built", player: 0 },
        { kind: "building-of-type", building: buildingType.forester },
      ],
      build: (rig) => {
        const { flag } = rig.foundCastle(0);
        const hut = rig.buildingNear(flag, buildingType.forester, 2);
        rig.road(flag, rig.step(hut, "DownRight"));
      },
    },

    // ── Gate 38 — Professions, tools, fire (ALPHA GATE) ──────────────────
    {
      id: "phase-38-full-loop",
      gate: "SB-38-06",
      check: "38.1",
      covers: ["38.1", "38.2", "38.3"],
      kind: "local-game",
      title: "The whole loop, pre-founded",
      instruction:
        "A castle, a self-staffing road, and a lumberjack by a wood are already standing. Watch the loop: serfs moving, a resource delivered, trees worked.",
      result:
        "Serfs walk at pace through real doors on self-staffing roads; every gathered resource is hand-carried castle-to-site; trees fall in stages and regrow.",
      map: flatTreesMap(),
      initialSupplies: 35,
      expected: [
        { kind: "castle-built", player: 0 },
        { kind: "building-of-type", building: buildingType.lumberjack },
        { kind: "tree-near-building", building: buildingType.lumberjack },
      ],
      build: (rig) => {
        const { flag } = rig.foundCastle(0);
        const hut = rig.buildingNear(flag, buildingType.lumberjack, 2);
        rig.road(flag, rig.step(hut, "DownRight"));
      },
    },
    {
      id: "phase-38-fisher",
      gate: "SB-38-06",
      check: "38.4",
      kind: "local-game",
      title: "Fisher at the shore",
      instruction:
        "A fisher's hut stands by stocked water, roaded to your castle. Watch where the fisher works.",
      result: "He works at the shore in the open, in a visible standing pose.",
      map: shorelineMap(),
      initialSupplies: 30,
      expected: [
        { kind: "castle-built", player: 0 },
        { kind: "building-of-type", building: buildingType.fisher },
      ],
      build: (rig) => {
        const { flag } = rig.foundCastle(0);
        const hut = rig.buildingNear(flag, buildingType.fisher, 2);
        rig.road(flag, rig.step(hut, "DownRight"));
      },
    },
    {
      id: "phase-38-farm",
      gate: "SB-38-06",
      check: "38.5",
      kind: "local-game",
      title: "Farm on open ground",
      instruction: "A farm stands roaded to your castle on open ground. Watch the farmer.",
      result: "He sows and harvests at visible field positions around the farm.",
      map: flatPlainsMap(6),
      initialSupplies: 30,
      expected: [
        { kind: "castle-built", player: 0 },
        { kind: "building-of-type", building: buildingType.farm },
      ],
      build: (rig) => {
        const { flag } = rig.foundCastle(0);
        const farm = rig.buildingNear(flag, buildingType.farm, 2);
        rig.road(flag, rig.step(farm, "DownRight"));
      },
    },
    {
      id: "phase-38-forester",
      gate: "SB-38-06",
      check: "38.6",
      kind: "local-game",
      title: "Forester planting",
      instruction: "A forester's hut stands roaded to your castle by a wood. Watch him plant.",
      result: "He plants saplings outdoors, away from the hut.",
      map: flatTreesMap(),
      initialSupplies: 30,
      expected: [
        { kind: "castle-built", player: 0 },
        { kind: "building-of-type", building: buildingType.forester },
      ],
      build: (rig) => {
        const { flag } = rig.foundCastle(0);
        const hut = rig.buildingNear(flag, buildingType.forester, 2);
        rig.road(flag, rig.step(hut, "DownRight"));
      },
    },
    {
      id: "phase-38-geologist",
      gate: "SB-38-06",
      check: "38.7",
      kind: "local-game",
      title: "Geologist on the hills",
      instruction:
        "Ore-bearing hills sit beside your castle. Send a geologist up (flag near the hills) and watch.",
      result: "A geologist prospects on the hills and plants prospecting signs.",
      map: mountainsMap(6),
      initialSupplies: 30,
      expected: [{ kind: "castle-built", player: 0 }, { kind: "flag-count", atLeast: 2 }],
      build: (rig) => {
        const { flag } = rig.foundCastle(0);
        rig.flagNear(flag, 8);
      },
    },
    {
      id: "phase-38-fire",
      gate: "SB-38-06",
      check: "38.9",
      kind: "local-game",
      title: "Burn a building down",
      instruction: "A lumberjack's hut stands roaded to your castle. Demolish it and watch.",
      result: "A fire countdown plays and the serfs inside escape.",
      map: flatPlainsMap(),
      initialSupplies: 30,
      expected: [
        { kind: "castle-built", player: 0 },
        { kind: "building-of-type", building: buildingType.lumberjack },
      ],
      build: (rig) => {
        const { flag } = rig.foundCastle(0);
        const hut = rig.buildingNear(flag, buildingType.lumberjack, 2);
        rig.road(flag, rig.step(hut, "DownRight"));
      },
    },

    // ── Gate 39 — Knight fidelity ────────────────────────────────────────
    {
      id: "phase-39-border",
      gate: "SB-39-05",
      check: "39.1",
      covers: ["39.1", "39.2", "39.3", "39.4", "39.5"],
      kind: "local-game",
      title: "A contested border",
      instruction:
        "You and an enemy hold neighbouring ground, each with a border military post. Order an attack on an enemy building and read the outcome; order more; toggle garrison settings.",
      result:
        "You pick an enemy building + knight count; knights march from border posts keeping each garrison's minimum; they clash decisively on open ground; you can win AND lose; send-strongest/weakest and cycling respond.",
      map: borderMap(),
      initialSupplies: 40,
      playerCount: 2,
      playerSupplies: [40, 40],
      expected: [
        { kind: "castle-built", player: 0 },
        { kind: "building-count", atLeast: 3 },
      ],
      build: (rig) => {
        const home = rig.foundCastle(0);
        const enemy = rig.foundCastle(1);
        const homePost = rig.buildingNear(home.flag, buildingType.hut, 3, 0);
        rig.road(home.flag, rig.step(homePost, "DownRight"), 0);
        const enemyPost = rig.buildingNear(enemy.flag, buildingType.hut, 3, 1);
        rig.road(enemy.flag, rig.step(enemyPost, "DownRight"), 1);
      },
    },

    // ── Gate 42 — Map builder (editor-draft) ─────────────────────────────
    {
      id: "phase-42-editor",
      gate: "SB-42",
      check: "42.1",
      covers: ["42.1", "42.2", "42.3", "42.5", "42.6"],
      kind: "editor-draft",
      title: "Editor, half-authored",
      instruction:
        "The map editor opens on a half-built draft. Look at the canvas, paint terrain/heights, place objects/minerals/starts, run validate, then play it.",
      result:
        "Authentic tiles (not placeholders); brushes write; validate gives a real verdict; a local game launches on your map with no network.",
      map: flatPlainsMap(5),
    },

    // ── Gate 43 — Community maps (gallery) ───────────────────────────────
    {
      id: "phase-43-gallery",
      gate: "SB-43-05",
      check: "43.1",
      covers: ["43.1", "43.2", "43.3", "43.5"],
      kind: "gallery",
      title: "A map staged to publish",
      instruction:
        "A finished map is staged for the community gallery. Publish it, browse the gallery, rate it, then download and play it.",
      result:
        "It publishes within the size/quota limits; the gallery shows sprite-free thumbnails; you rate once per device key; it plays locally and in multiplayer.",
      map: flatPlainsMap(),
    },
  ];
}
