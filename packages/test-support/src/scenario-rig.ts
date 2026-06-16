// Scenario rigging (SB-44-03): author a deterministic game state once, in
// code, and bake it to a SerfboundLocalGameSnapshot the app boots into via
// `?rig=`. A rig is NOT a new engine pathway — it drives the exact production
// start + world-action machinery a real game uses (startSerfboundLocalGame,
// applyWorldAction, recordWorldAction), then snapshots. Restoring the baked
// snapshot replays the same action log and reconstructs the identical world,
// so the maintainer's device always opens on the precise state a gate check
// needs to verify.

import {
  type BuildingTypeValue,
  type ClassicMapLandscape,
  type Direction,
  type RoadPlan,
  type SerfboundCustomMap,
  type SerfboundLocalGame,
  type SerfboundLocalGameSnapshot,
  type SerfboundWorldAction,
  SerfboundGameWorld,
  applyWorldAction,
  findShortestRoad,
  startSerfboundLocalGame,
} from "@serfbound/engine";

// Trees, pines, palms — the lumberjack's cuttable objects (mirrors the
// engine's isTreeObject, which is not re-exported from the package root).
const isTreeObject = (objectValue: number): boolean => objectValue >= 8 && objectValue <= 27;

// A synthetic catalog descriptor. restoreSerfboundLocalGame only checks the
// shape (non-negative integers), not that it matches the device's imported
// SPAU.PA — so a rig renders against whatever catalog the maintainer imported.
// These figures mirror a real SPAU.PA import for plausibility.
export function rigDataSource() {
  return {
    kind: "imported-dos-pa-catalog",
    archiveName: "SPAU.PA",
    byteLength: 1_282_805,
    entryCount: 4000,
    definedArchiveEntries: 3805,
    fixupCount: 252,
  } as const;
}

// The deterministic anchor lattice the AI founds on (ai.ts #foundCastle):
// players spread by index so a multi-player rig separates them the same way a
// real game does. Returns the first founding-valid spot near the anchor.
export function scanCastleSpot(world: SerfboundGameWorld, player: number): number | null {
  const columns = world.geometry.columns;
  const rows = world.geometry.rows;
  const anchorColumn = (8 + player * 24) % columns;
  const anchorRow = (12 + player * 20) % rows;
  const anchor = world.geometry.position(anchorColumn, anchorRow);
  for (let offset = 0; offset < 295; offset += 1) {
    const candidate = world.positionAddSpirally(anchor, offset);
    if (world.canBuildCastle(candidate, player)) {
      return candidate;
    }
  }
  return null;
}

// Castle start positions for every player, derived from a fresh world over the
// landscape — used to seed a custom map's `starts` so it matches where rig
// scenarios actually found their castles.
export function castleSpotsFor(landscape: ClassicMapLandscape, playerCount: number): number[] {
  const world = new SerfboundGameWorld(landscape, Math.max(1, playerCount));
  const spots: number[] = [];
  for (let player = 0; player < playerCount; player += 1) {
    const spot = scanCastleSpot(world, player);
    if (spot === null) {
      throw new Error(`castleSpotsFor: no castle spot for player ${player}`);
    }
    // Found it on the scratch world so later players spread off real ownership.
    world.buildCastle(spot, player);
    spots.push(spot);
  }
  return spots;
}

// The imperative authoring surface handed to a scenario's build() function.
// Every helper applies a real world action AND records it on the game state,
// exactly as SerfboundCommandRouter does, so game.snapshot() captures a replay
// log that restores to the identical world.
export class RigBuilder {
  readonly game: SerfboundLocalGame;
  readonly world: SerfboundGameWorld;
  player = 0;

  constructor(game: SerfboundLocalGame) {
    this.game = game;
    this.world = game.world();
  }

  #act(action: SerfboundWorldAction): void {
    const outcome = applyWorldAction(this.world, action);
    if (!outcome.ok) {
      throw new Error(`rig action "${action.kind}" rejected: ${outcome.message}`);
    }
    this.game.state.recordWorldAction(action);
  }

  // Found the player's castle at its anchor-lattice spot. Returns the castle
  // position and its auto-built flag (DownRight of the castle).
  foundCastle(player = this.player): { readonly castle: number; readonly flag: number } {
    const spot = scanCastleSpot(this.world, player);
    if (spot === null) {
      throw new Error(`foundCastle: no valid castle spot for player ${player}`);
    }
    this.#act({ kind: "build-castle", position: spot, player });
    return { castle: spot, flag: this.world.move(spot, "DownRight") };
  }

  // Plant a standalone flag at an exact position (must be inside the player's
  // territory). Use flagNear() when you want "a flag roughly here".
  flag(position: number, player = this.player): number {
    this.#act({ kind: "build-flag", position, player });
    return position;
  }

  // The first flag-buildable spot at spiral offset >= minOffset from an anchor
  // (typically the castle flag), so roads come out long enough to be useful.
  flagNear(anchor: number, minOffset = 6, player = this.player): number {
    for (let offset = minOffset; offset < 200; offset += 1) {
      const candidate = this.world.positionAddSpirally(anchor, offset);
      if (this.world.canBuildFlag(candidate, player)) {
        return this.flag(candidate, player);
      }
    }
    throw new Error(`flagNear: no flag spot within territory near ${anchor}`);
  }

  // Connect two existing flags with the shortest valid road; returns the plan
  // (start + directions) so callers can locate the road's midpoint.
  road(fromFlag: number, toFlag: number, player = this.player): RoadPlan {
    const plan = findShortestRoad(this.world, fromFlag, toFlag);
    if (plan === null) {
      throw new Error(`road: no valid road from ${fromFlag} to ${toFlag}`);
    }
    this.#act({ kind: "build-road", start: plan.start, directions: plan.directions, player });
    return plan;
  }

  // Place a building at an exact position.
  building(position: number, building: BuildingTypeValue, player = this.player): number {
    this.#act({
      kind: "build-building",
      position,
      building,
      player,
      atTick: this.game.state.tick,
    });
    return position;
  }

  // The first site near an anchor where `building` can stand and its flag can
  // attach — scans the spiral so authors don't hand-pick tile indices.
  buildingNear(
    anchor: number,
    building: BuildingTypeValue,
    minOffset = 2,
    player = this.player,
  ): number {
    for (let offset = minOffset; offset < 200; offset += 1) {
      const candidate = this.world.positionAddSpirally(anchor, offset);
      if (this.world.canBuildBuilding(candidate, building, player)) {
        return this.building(candidate, building, player);
      }
    }
    throw new Error(`buildingNear: no site near ${anchor} for building ${building}`);
  }

  // Walk a chain of directions from a position (geometry only — no mutation).
  step(position: number, ...path: readonly Direction[]): number {
    let here = position;
    for (const direction of path) {
      here = this.world.move(here, direction);
    }
    return here;
  }
}

// What a rig is expected to have set up, checked headlessly so a rig can't
// silently bit-rot. Evaluated against the RESTORED world (a fresh replay), not
// the authoring world, so it proves the round-trip.
export type RigExpectation =
  | { readonly kind: "castle-built"; readonly player: number }
  | { readonly kind: "flag-count"; readonly atLeast: number }
  | { readonly kind: "building-count"; readonly atLeast: number }
  | { readonly kind: "building-of-type"; readonly building: BuildingTypeValue }
  | { readonly kind: "road-at"; readonly position: number }
  // A cuttable tree must stand within the lumberjack's reach (spiral offset
  // 1..150) of a building of this type — so a felling rig actually has wood.
  | { readonly kind: "tree-near-building"; readonly building: BuildingTypeValue };

export type RigKind = "local-game" | "editor-draft" | "gallery";

// A declarative scenario. `build` is imperative against a live world (robust:
// it resolves real positions via canBuild* scans) for local-game rigs.
export type RigScenario = {
  readonly id: string; // url-safe: ^[a-z0-9-]+$
  readonly gate: string; // e.g. "SB-36-06"
  readonly check: string; // e.g. "36.1" — matches the deck PROTOCOL ids
  // Every deck check this one rig serves (defaults to [check]). One rigged
  // settlement often answers several checks of the same gate.
  readonly covers?: readonly string[];
  readonly kind: RigKind;
  readonly title: string;
  readonly instruction: string; // the single gesture the maintainer performs
  readonly result: string; // what "pass" looks like, shown in the HUD
  // World-state assertions for local-game rigs, checked headlessly after a
  // round-trip restore. Empty/omitted for editor-draft and gallery rigs, which
  // are validated structurally.
  readonly expected?: readonly RigExpectation[];
  // The custom map this rig carries. local-game: the map the game plays (and
  // build() rigs state on). editor-draft: the draft the editor opens on.
  // gallery: the map staged into the community-maps surface. Always a
  // base64-serializable SerfboundCustomMap so the baked fixture is plain JSON.
  readonly map?: SerfboundCustomMap;
  // local-game only:
  readonly initialSupplies?: number;
  readonly playerCount?: number;
  readonly playerSupplies?: readonly number[];
  readonly build?: (rig: RigBuilder) => void;
};

// Bake a local-game scenario into a restorable snapshot by driving the real
// start + action path, then snapshotting.
export function buildLocalGameRig(scenario: RigScenario): SerfboundLocalGameSnapshot {
  if (scenario.kind !== "local-game") {
    throw new Error(`buildLocalGameRig: scenario "${scenario.id}" is not a local-game rig`);
  }
  if (scenario.map === undefined) {
    throw new Error(`buildLocalGameRig: scenario "${scenario.id}" has no map`);
  }

  const started = startSerfboundLocalGame({
    data: rigDataSource(),
    customMap: scenario.map,
    ...(scenario.initialSupplies === undefined ? {} : { initialSupplies: scenario.initialSupplies }),
    ...(scenario.playerCount === undefined ? {} : { playerCount: scenario.playerCount }),
    ...(scenario.playerSupplies === undefined ? {} : { playerSupplies: scenario.playerSupplies }),
  });
  if (started.status !== "started") {
    throw new Error(`buildLocalGameRig: start rejected for "${scenario.id}": ${started.message}`);
  }

  if (scenario.build !== undefined) {
    scenario.build(new RigBuilder(started.game));
  }

  return started.game.snapshot();
}

// Evaluate one expectation against a restored world. Returns null on pass or a
// failure message — used by verify-rigs to gate the rigs themselves.
export function checkRigExpectation(
  world: SerfboundGameWorld,
  expectation: RigExpectation,
): string | null {
  switch (expectation.kind) {
    case "castle-built": {
      const player = world.players[expectation.player];
      return player !== undefined && player.hasCastle
        ? null
        : `player ${expectation.player} has no castle`;
    }
    case "flag-count": {
      const count = world.flags.size;
      return count >= expectation.atLeast
        ? null
        : `expected >= ${expectation.atLeast} flags, found ${count}`;
    }
    case "building-count": {
      const count = world.buildings.size;
      return count >= expectation.atLeast
        ? null
        : `expected >= ${expectation.atLeast} buildings, found ${count}`;
    }
    case "building-of-type": {
      for (const building of world.buildings.values()) {
        if (building.type === expectation.building) {
          return null;
        }
      }
      return `no building of type ${expectation.building}`;
    }
    case "road-at": {
      return world.pathsAt(expectation.position) !== 0
        ? null
        : `no road/path at ${expectation.position}`;
    }
    case "tree-near-building": {
      let target: { position: number } | undefined;
      for (const building of world.buildings.values()) {
        if (building.type === expectation.building) {
          target = building;
          break;
        }
      }
      if (target === undefined) {
        return `no building of type ${expectation.building} to check trees near`;
      }
      // Mirror the lumberjack's own search bound (serfs.ts #workHarvest).
      for (let offset = 1; offset < 151; offset += 1) {
        const candidate = world.positionAddSpirally(target.position, offset);
        const object = world.objects[candidate];
        if (object !== undefined && isTreeObject(object)) {
          return null;
        }
      }
      return `no cuttable tree within reach of the ${expectation.building}`;
    }
  }
}
