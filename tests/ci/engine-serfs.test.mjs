import assert from "node:assert/strict";
import { test } from "node:test";

import {
  SerfboundGameWorld,
  SerfboundSerfEngine,
  counterFromAnimation,
  generateClassicMap,
  mapTerrain,
  serfState,
  walkingAnimation,
} from "@serfbound/engine";

function flatWorldWithCastle() {
  const landscape = generateClassicMap(3, [1, 2, 3]);
  const world = new SerfboundGameWorld({
    ...landscape,
    heights: new Uint8Array(landscape.tileCount).fill(4),
    typesUp: new Uint8Array(landscape.tileCount).fill(mapTerrain.grass1),
    typesDown: new Uint8Array(landscape.tileCount).fill(mapTerrain.grass1),
    objects: new Uint8Array(landscape.tileCount),
    minerals: new Uint8Array(landscape.tileCount),
    resourceAmounts: new Uint8Array(landscape.tileCount),
  });
  const castlePosition = world.geometry.position(20, 20);
  assert.equal(world.canBuildCastle(castlePosition, 0), true);
  world.buildCastle(castlePosition, 0);
  return { world, castlePosition };
}

test("walking animations and counters follow the reference formulas", () => {
  assert.equal(walkingAnimation(0, "Right", false), 4);
  assert.equal(walkingAnimation(-4, "Right", false), 0);
  assert.equal(walkingAnimation(2, "Up", false), 4 + 2 + 9 * 5);
  assert.equal(walkingAnimation(0, "Right", true), 4 + 9 * 6, "switch adds 6 directions");
  assert.equal(counterFromAnimation(4), 255, "flat walking is fastest");
  assert.equal(counterFromAnimation(0), 511);
  assert.equal(counterFromAnimation(8), 1023, "steep uphill is slowest");
  assert.equal(counterFromAnimation(81), 127, "waiting animation");
});

test("a serf leaves the castle, walks the road, and enters the destination building", () => {
  const { world, castlePosition } = flatWorldWithCastle();
  const castleFlag = world.flagAt(world.move(castlePosition, "DownRight"));

  // Build a flag 5 tiles right of the castle flag, connect by road, and put
  // a building on it so the serf has somewhere to go.
  const targetFlagPosition = world.geometry.positionAdd(castleFlag.position, 5, 0);
  const targetFlag = world.buildFlag(targetFlagPosition, 0);
  assert.notEqual(targetFlag, null);
  assert.equal(
    world.buildRoad(
      { start: castleFlag.position, directions: Array(5).fill("Right") },
      0,
    ),
    true,
  );

  const engine = new SerfboundSerfEngine(world);
  const serf = engine.spawnGenericSerf(0, 0);
  assert.notEqual(serf, null);
  assert.equal(serf.state, serfState.idleInStock);

  assert.equal(engine.callOutSerf(serf, targetFlag.index, 0), true);
  assert.equal(serf.state, serfState.leavingBuilding);
  assert.equal(serf.position, castleFlag.position, "the serf slides to the castle flag");

  // Drive the engine forward; the serf must traverse all five road tiles.
  const visited = new Set();
  let arrived = false;
  for (let tick = 0; tick < 20000 && !arrived; tick += 16) {
    engine.update(tick);
    visited.add(serf.position);
    if (serf.state === serfState.null && serf.position === targetFlagPosition) {
      arrived = true;
    }
  }

  assert.equal(arrived, true, "the serf finished its journey");
  for (let step = 1; step <= 4; step += 1) {
    assert.equal(
      visited.has(world.geometry.positionAdd(castleFlag.position, step, 0)),
      true,
      `the serf walked road tile ${step}`,
    );
  }
});

test("colliding serfs wait with the reference waiting animation", () => {
  const { world, castlePosition } = flatWorldWithCastle();
  const castleFlag = world.flagAt(world.move(castlePosition, "DownRight"));
  const targetFlagPosition = world.geometry.positionAdd(castleFlag.position, 4, 0);
  const targetFlag = world.buildFlag(targetFlagPosition, 0);
  world.buildRoad({ start: castleFlag.position, directions: Array(4).fill("Right") }, 0);

  const engine = new SerfboundSerfEngine(world);
  const walker = engine.spawnGenericSerf(0, 0);
  engine.callOutSerf(walker, targetFlag.index, 0);
  engine.update(2000); // put the walker onto the road

  // Park a blocker directly ahead of the walker.
  const ahead = world.move(walker.position, "Right");
  const blocker = engine.spawnGenericSerf(0, 0);
  blocker.position = ahead;
  blocker.state = serfState.null;
  engine.serfIndexes[ahead] = blocker.index;

  engine.update(4000);
  assert.equal(walker.walkingDirection < 0, true, "the walker waits");
  assert.equal(walker.animation >= 81 && walker.animation <= 86, true, "waiting animation");

  // Unblock; the walker resumes and arrives.
  engine.serfIndexes[ahead] = 0;
  blocker.position = 0;
  let arrived = false;
  for (let tick = 4000; tick < 30000 && !arrived; tick += 16) {
    engine.update(tick);
    arrived = walker.state === serfState.null && walker.position === targetFlagPosition;
  }
  assert.equal(arrived, true, "the walker resumes after the block clears");
});

test("a transporter hauls a resource across its road into the destination building", () => {
  const { world, castlePosition } = flatWorldWithCastle();
  const castleFlag = world.flagAt(world.move(castlePosition, "DownRight"));
  world.players[0].hasCastle = true;

  // Build a lumberjack four tiles right of the castle flag and connect it.
  const sitePosition = world.geometry.positionAdd(castleFlag.position, 3, -1);
  const building = world.buildBuilding(sitePosition, 2, 0);
  assert.notEqual(building, null, "lumberjack builds");
  const buildingFlag = world.flags.get(building.flagIndex);
  const road = {
    start: castleFlag.position,
    directions: ["Right", "Right", "Right", "Right"],
  };
  // Route the road to the building flag (4 right lands on its flag tile when
  // the site is one row up: building flag = site downright).
  const expectedFlagPosition = world.move(sitePosition, "DownRight");
  assert.equal(buildingFlag.position, expectedFlagPosition);
  assert.equal(
    world.buildRoad(road, 0),
    true,
    "road connects the castle flag to the building flag",
  );

  // Seed a plank (resource 7) at the castle flag, destined for the building
  // flag.
  assert.equal(world.dropResource(castleFlag.index, 7, buildingFlag.index), true);
  assert.equal(castleFlag.slots.filter((slot) => slot.resource >= 0).length, 1);

  const engine = new SerfboundSerfEngine(world);
  const transporter = engine.spawnGenericSerf(0, 0);
  assert.equal(engine.assignTransporter(transporter, castleFlag.index, "Right", 0), true);
  assert.equal(castleFlag.paths.Right.freeTransporters, 1);

  let delivered = false;
  for (let tick = 0; tick < 40000 && !delivered; tick += 16) {
    engine.update(tick);
    delivered = (building.deliveredResources[7] ?? 0) === 1;
  }

  assert.equal(delivered, true, "the plank reaches the building");
  assert.equal(
    castleFlag.slots.every((slot) => slot.resource < 0),
    true,
    "the source slot empties",
  );
  assert.equal(transporter.carriedResource, -1, "the transporter dropped its load");
  assert.equal(transporter.state, serfState.idleOnPath, "the transporter returns to duty");
});

test("serfs dress for their profession and carry visibly (SB-34 round 7)", async () => {
  const { serfBodyOffset, serfState, buildingType } = await import("@serfbound/engine");
  const baseSerf = {
    state: serfState.walking,
    carriedResource: -1,
    buildTargetIndex: 0,
    workBuildingIndex: 0,
    isKnight: false,
    knightRank: 0,
    garrisonTargetIndex: 0,
  };
  const world = {
    buildings: new Map([
      [5, { type: buildingType.lumberjack }],
      [6, { type: buildingType.stonecutter }],
    ]),
  };

  // Generic walkers stay undressed; builders, professions, knights and
  // loaded transporters take the reference sprite-bank offsets.
  assert.equal(serfBodyOffset({ ...baseSerf }, world), 0);
  assert.equal(serfBodyOffset({ ...baseSerf, buildTargetIndex: 9 }, world), 0x500);
  assert.equal(serfBodyOffset({ ...baseSerf, workBuildingIndex: 5 }, world), 0xb00);
  assert.equal(serfBodyOffset({ ...baseSerf, workBuildingIndex: 6 }, world), 0xd00);
  assert.equal(
    serfBodyOffset({ ...baseSerf, isKnight: true, knightRank: 2 }, world),
    0x7800 + 0x200,
  );
  // A transporter carrying a plank shows it (Resource.Type + 1 indexes
  // the reference carry table; plank = 7 -> 0x700).
  assert.equal(
    serfBodyOffset(
      { ...baseSerf, state: serfState.transporting, carriedResource: 7 },
      world,
    ),
    0x700,
  );
  // Stone in hand (9 -> 0x800... the reference table: stone is 0x800).
  assert.equal(
    serfBodyOffset(
      { ...baseSerf, state: serfState.transporting, carriedResource: 9 },
      world,
    ),
    0x800,
  );
});

test("harvesters walk out, work the target in the open, and walk the product home (SB-34 round 7)", async () => {
  const engineModule = await import("@serfbound/engine");
  const {
    SerfboundCommandRouter,
    SerfboundSerfEngine,
    startSerfboundLocalGame,
  } = engineModule;
  const started = startSerfboundLocalGame({
    data: {
      kind: "imported-dos-pa-catalog",
      archiveName: "SPAU.PA",
      byteLength: 1_282_805,
      entryCount: 4000,
      definedArchiveEntries: 3805,
      fixupCount: 252,
    },
  });
  const world = started.game.world();
  const router = new SerfboundCommandRouter(started.game.state, world);
  const tileFor = (position) => ({
    column: position & world.geometry.columnMask,
    row: (position >>> world.geometry.rowShift) & world.geometry.rowMask,
    position,
  });
  let castlePosition = -1;
  for (let position = 0; position < world.tileCount; position += 1) {
    if (world.canBuildCastle(position, 0)) {
      castlePosition = position;
      break;
    }
  }
  router.dispatch({ type: "game.build-castle", source: "pointer", tile: tileFor(castlePosition) });
  const castleFlag = world.move(castlePosition, "DownRight");
  let building = null;
  for (let offset = 0; offset < 250 && building === null; offset += 1) {
    const candidate = world.positionAddSpirally(castlePosition, offset);
    if (!world.canBuildBuilding(candidate, 2, 0)) {
      continue;
    }

    const result = router.dispatch({
      type: "game.build-building",
      source: "pointer",
      tile: tileFor(candidate),
      buildingKind: "lumberjack",
    });
    if (result.status !== "accepted") {
      continue;
    }

    building = [...world.buildings.values()].reduce((a, b) => (a.index > b.index ? a : b));
    const road = router.dispatch({
      type: "game.build-road",
      source: "pointer",
      tile: tileFor(castleFlag),
      toTile: tileFor(world.flags.get(building.flagIndex).position),
    });
    if (road.status !== "accepted") {
      building = null;
    }
  }
  assert.notEqual(building, null);

  const engine = new SerfboundSerfEngine(world);
  engine.dispatchConstructionLogistics(building, started.game.state.tick);
  let tick = started.game.state.tick;
  let leftHome = false;
  let workedOutside = false;
  for (let step = 0; step < 6000; step += 1) {
    tick += 8;
    engine.update(tick);
    for (const serf of engine.serfs.values()) {
      if (serf.workBuildingIndex === building.index && serf.state === 11) {
        if (serf.position !== building.position) {
          leftHome = true;
        }

        if (serf.workPhase === 2 && serf.position === serf.workTargetPosition) {
          workedOutside = true;
        }
      }
    }

    if (workedOutside) {
      break;
    }
  }

  assert.equal(leftHome, true, "the worker physically left the building");
  assert.equal(workedOutside, true, "the worker stood AT the tree while working it");
});
