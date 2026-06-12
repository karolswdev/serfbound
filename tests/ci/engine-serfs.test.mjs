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

test("free walking rides the reference counter tables - no second movement system (SB-35-01)", async () => {
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

  // Watch the worker's outdoor walk: every tile must cost at least the
  // flat reference walking counter (255 ticks). The deleted fixed-tick
  // stepper moved a tile every 8 ticks - a 30x teleport.
  let tick = started.game.state.tick;
  let worker = null;
  let lastPosition = -1;
  let lastMoveTick = -1;
  const stepCosts = [];
  for (let step = 0; step < 30000 && stepCosts.length < 4; step += 1) {
    tick += 8;
    engine.update(tick);
    if (worker === null) {
      for (const serf of engine.serfs.values()) {
        if (serf.workBuildingIndex === building.index && serf.state === 11) {
          worker = serf;
        }
      }

      continue;
    }

    if (worker.workPhase === 1) {
      if (lastPosition === -1) {
        lastPosition = worker.position;
        lastMoveTick = tick;
      } else if (worker.position !== lastPosition) {
        stepCosts.push(tick - lastMoveTick);
        lastPosition = worker.position;
        lastMoveTick = tick;
      }

      // The walk wears a walking-row animation, not a synthetic pose.
      assert.equal(worker.animation < 81, true, `walking animation (${worker.animation})`);
    }
  }

  assert.equal(stepCosts.length >= 2, true, `observed outdoor steps (${stepCosts.length})`);
  // Crossing swaps with oncoming serfs are instant (reference
  // SwitchWaiting), so individual cheap steps can occur — but the
  // walk's typical tile must cost the reference counter (flat 255).
  // The deleted stepper moved EVERY tile in 8 ticks.
  const sorted = [...stepCosts].sort((a, b) => a - b);
  const median = sorted[Math.trunc(sorted.length / 2)];
  assert.equal(
    median >= 255 - 8,
    true,
    `the typical free-walk tile costs reference ticks (median ${median}, steps ${stepCosts})`,
  );
});

test("workers pass through the door: enter to settle, leave to harvest (SB-35-02)", async () => {
  const engineModule = await import("@serfbound/engine");
  const {
    SerfboundCommandRouter,
    SerfboundSerfEngine,
    serfState,
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
  let worker = null;
  const doorStates = new Set();
  let enteredBeforeWorking = false;
  let leftThroughDoor = false;
  let sawWorking = false;
  for (let step = 0; step < 60000; step += 1) {
    tick += 8;
    engine.update(tick);
    if (worker === null) {
      for (const serf of engine.serfs.values()) {
        if (serf.workBuildingIndex === building.index) {
          worker = serf;
        }
      }
    }

    if (worker !== null) {
      doorStates.add(worker.state);
      if (worker.state === serfState.enteringBuilding && !sawWorking) {
        enteredBeforeWorking = true;
      }

      if (worker.state === serfState.working) {
        sawWorking = true;
      }

      if (worker.state === serfState.leavingBuilding && sawWorking) {
        // The walk-out slide stands on the building's flag tile.
        assert.equal(
          worker.position,
          world.move(building.position, "DownRight"),
          "the leaving slide crosses the door onto the flag",
        );
        leftThroughDoor = true;
        break;
      }
    }
  }

  assert.equal(enteredBeforeWorking, true, "the worker settled in THROUGH the door");
  assert.equal(leftThroughDoor, true, "the worker walked OUT through the door to harvest");
});

test("the tree falls in visible stages under the axe (SB-35-03)", async () => {
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
  let worker = null;
  const observedObjects = new Set();
  let target = -1;
  for (let step = 0; step < 60000; step += 1) {
    tick += 8;
    engine.update(tick);
    if (worker === null) {
      for (const serf of engine.serfs.values()) {
        if (serf.workBuildingIndex === building.index) {
          worker = serf;
        }
      }

      continue;
    }

    if (worker.state === 11 && worker.workPhase === 2) {
      target = worker.workTargetPosition;
      observedObjects.add(world.objectAt(target));
    }

    if (target !== -1 && worker.workPhase === 3) {
      break;
    }
  }

  assert.notEqual(target, -1, "the worker chopped at a tree");
  // Felled stages: pine 93..97, tree 98..102. The fall must pass
  // through at least two visible stages — never tree -> gone in one
  // step — and end lying as the final felled trunk.
  const felledStages = [...observedObjects].filter((value) => value >= 93 && value <= 102);
  assert.equal(
    felledStages.length >= 2,
    true,
    `the tree fell in visible stages (saw ${[...observedObjects].join(",")})`,
  );
  const finalObject = world.objectAt(target);
  assert.equal(
    finalObject === 97 || finalObject === 102,
    true,
    `the trunk lies felled (${finalObject})`,
  );
});

test("resources leave the castle in a serf's arms - nothing materializes on the flag (SB-36-01)", async () => {
  const engineModule = await import("@serfbound/engine");
  const {
    SerfboundCommandRouter,
    SerfboundSerfEngine,
    serfState,
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
  const castleFlagPosition = world.move(castlePosition, "DownRight");
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
      tile: tileFor(castleFlagPosition),
      toTile: tileFor(world.flags.get(building.flagIndex).position),
    });
    if (road.status !== "accepted") {
      building = null;
    }
  }
  assert.notEqual(building, null);

  const engine = new SerfboundSerfEngine(world);
  const castleFlag = world.flagAt(castleFlagPosition);
  engine.dispatchConstructionLogistics(building, started.game.state.tick);

  let tick = started.game.state.tick;
  let sawCarrier = false;
  let firstSlotFillHadCarrier = null;
  for (let step = 0; step < 4000; step += 1) {
    tick += 8;
    engine.update(tick);
    for (const serf of engine.serfs.values()) {
      if (
        serf.state === serfState.dropResourceOut &&
        serf.carriedResource >= 0 &&
        serf.position === castleFlagPosition
      ) {
        sawCarrier = true;
      }
    }

    if (
      firstSlotFillHadCarrier === null &&
      castleFlag.slots.some((slot) => slot.resource >= 0)
    ) {
      firstSlotFillHadCarrier = sawCarrier;
    }

    if (firstSlotFillHadCarrier !== null && sawCarrier) {
      break;
    }
  }

  assert.equal(sawCarrier, true, "a serf stood at the flag with the resource in his arms");
  assert.equal(
    firstSlotFillHadCarrier,
    true,
    "the first resource on the flag was CARRIED there - it did not materialize",
  );
});

test("a flag splitting a road keeps one half staffed and staffs the other (SB-36-03)", async () => {
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
  const castleFlagPosition = world.move(castlePosition, "DownRight");

  // A straight four-segment road castleFlag -> B, then a flag at the
  // midpoint splits it (the maintainer's exact scenario).
  let cursor = castleFlagPosition;
  const steps = [];
  for (let step = 0; step < 4; step += 1) {
    cursor = world.move(cursor, "Right");
    steps.push(cursor);
  }
  const endPosition = cursor;
  const midPosition = steps[1];
  assert.equal(
    router.dispatch({ type: "game.build-flag", source: "pointer", tile: tileFor(endPosition) })
      .status,
    "accepted",
  );
  assert.equal(
    router.dispatch({
      type: "game.build-road",
      source: "pointer",
      tile: tileFor(castleFlagPosition),
      toTile: tileFor(endPosition),
      directions: ["Right", "Right", "Right", "Right"],
    }).status,
    "accepted",
  );

  const engine = new SerfboundSerfEngine(world);
  // Staff the original road (the construction-logistics path normally
  // does this): one transporter for castleFlag -> B.
  const original = engine.spawnGenericSerf(0, 0);
  assert.notEqual(original, null);
  const castleFlag = world.flagAt(castleFlagPosition);
  assert.equal(engine.assignTransporter(original, castleFlag.index, "Right", 0), true);

  let tick = 0;
  for (let step = 0; step < 800; step += 1) {
    tick += 8;
    engine.update(tick);
  }

  // The split: a new flag mid-road.
  assert.equal(
    router.dispatch({ type: "game.build-flag", source: "pointer", tile: tileFor(midPosition) })
      .status,
    "accepted",
  );
  for (let step = 0; step < 3000; step += 1) {
    tick += 8;
    engine.update(tick);
  }

  const midFlag = world.flagAt(midPosition);
  const endFlag = world.flagAt(endPosition);
  assert.notEqual(midFlag, null);

  // Every half reports a transporter on BOTH of its ends, and the
  // serfs actually serving each half exist.
  const halfStaffing = [];
  for (const direction of ["Right", "Left"]) {
    const path = midFlag.paths[direction];
    assert.equal(path.hasPath, true, `the ${direction} half exists`);
    halfStaffing.push(path.freeTransporters);
  }
  assert.equal(
    halfStaffing.every((count) => count >= 1),
    true,
    `both halves staffed from the split flag's view (${halfStaffing})`,
  );
  assert.equal(
    castleFlag.paths.Right.freeTransporters >= 1,
    true,
    "the castle half counts its transporter",
  );
  assert.equal(
    endFlag.paths.Left.freeTransporters >= 1,
    true,
    "the far half counts its transporter",
  );

  // Two distinct road serfs serve the two halves.
  const servers = new Set();
  for (const serf of engine.serfs.values()) {
    if (serf.roadDirection !== null) {
      servers.add(serf.index);
    }
  }
  assert.equal(servers.size >= 2, true, `two transporters serve the split road (${servers.size})`);
});

test("a congested road reinforces up to its length cap, and requests are serviced (SB-36-04)", async () => {
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
  const castleFlagPosition = world.move(castlePosition, "DownRight");

  // A 5-segment road (length category > 0 -> cap >= 2).
  let cursor = castleFlagPosition;
  for (let step = 0; step < 5; step += 1) {
    cursor = world.move(cursor, "Right");
  }
  const endPosition = cursor;
  assert.equal(
    router.dispatch({ type: "game.build-flag", source: "pointer", tile: tileFor(endPosition) })
      .status,
    "accepted",
  );
  assert.equal(
    router.dispatch({
      type: "game.build-road",
      source: "pointer",
      tile: tileFor(castleFlagPosition),
      toTile: tileFor(endPosition),
      directions: ["Right", "Right", "Right", "Right", "Right"],
    }).status,
    "accepted",
  );

  const engine = new SerfboundSerfEngine(world);
  const castleFlag = world.flagAt(castleFlagPosition);
  const endFlag = world.flagAt(endPosition);
  const first = engine.spawnGenericSerf(0, 0);
  assert.equal(engine.assignTransporter(first, castleFlag.index, "Right", 0), true);

  // Flood the castle flag with work destined across the road.
  for (let load = 0; load < 4; load += 1) {
    assert.equal(world.dropResource(castleFlag.index, 7, endFlag.index), true);
  }

  const countServers = () => {
    let servers = 0;
    for (const serf of engine.serfs.values()) {
      if (serf.roadDirection !== null) {
        servers += 1;
      }
    }

    return servers;
  };

  let tick = 0;
  let reinforced = false;
  for (let step = 0; step < 4000 && !reinforced; step += 1) {
    tick += 8;
    engine.update(tick);
    reinforced = countServers() >= 2;
  }

  assert.equal(reinforced, true, "the backlog pulled a second transporter onto the road");

  // A recorded serfRequested bit on an unstaffed road is serviced
  // and cleared (at-cap roads drop stale requests instead).
  let secondDirection = null;
  for (const direction of ["Down", "DownRight", "Up", "UpLeft", "Left"]) {
    if (castleFlag.paths[direction].hasPath) {
      continue;
    }

    let probe = castleFlagPosition;
    for (let step = 0; step < 4; step += 1) {
      probe = world.move(probe, direction);
    }

    if (
      router.dispatch({ type: "game.build-flag", source: "pointer", tile: tileFor(probe) })
        .status !== "accepted"
    ) {
      continue;
    }

    if (
      router.dispatch({
        type: "game.build-road",
        source: "pointer",
        tile: tileFor(castleFlagPosition),
        toTile: tileFor(probe),
        directions: [direction, direction, direction, direction],
      }).status === "accepted"
    ) {
      secondDirection = direction;
      break;
    }
  }
  assert.notEqual(secondDirection, null, "a second road exists for the request leg");
  castleFlag.paths[secondDirection].serfRequested = true;
  const before = countServers();
  let serviced = false;
  for (let step = 0; step < 2000 && !serviced; step += 1) {
    tick += 8;
    engine.update(tick);
    serviced = countServers() > before && castleFlag.paths[secondDirection].serfRequested === false;
  }

  assert.equal(serviced, true, "the recorded request was serviced and cleared");
});

test("flag slots schedule per direction and the higher priority rides first (SB-36-02)", () => {
  const { world, castlePosition } = flatWorldWithCastle();
  const castleFlag = world.flagAt(world.move(castlePosition, "DownRight"));
  world.players[0].hasCastle = true;

  // The test-123 geometry: a lumberjack three right / one up, its flag
  // four tiles right of the castle flag, one road between them.
  const sitePosition = world.geometry.positionAdd(castleFlag.position, 3, -1);
  const building = world.buildBuilding(sitePosition, 2, 0);
  assert.notEqual(building, null);
  const buildingFlag = world.flags.get(building.flagIndex);
  assert.equal(
    world.buildRoad(
      { start: castleFlag.position, directions: ["Right", "Right", "Right", "Right"] },
      0,
    ),
    true,
  );

  // Gold ore (priority 1) lands in the earlier slot, plank (priority 26)
  // behind it — slot order must NOT decide who rides first.
  assert.equal(world.dropResource(castleFlag.index, 13, buildingFlag.index), true);
  assert.equal(world.dropResource(castleFlag.index, 7, buildingFlag.index), true);

  const engine = new SerfboundSerfEngine(world);
  const transporter = engine.spawnGenericSerf(0, 0);
  assert.equal(engine.assignTransporter(transporter, castleFlag.index, "Right", 0), true);

  // The first sweep schedules both slots out the road by the network
  // search — observable while the transporter is still walking out.
  engine.update(16);
  const goldSlot = castleFlag.slots.find((slot) => slot.resource === 13);
  const plankSlot = castleFlag.slots.find((slot) => slot.resource === 7);
  assert.notEqual(goldSlot, undefined, "the gold ore is still waiting");
  assert.equal(goldSlot.scheduledDirection, "Right", "gold ore scheduled per direction");
  assert.equal(plankSlot.scheduledDirection, "Right", "plank scheduled per direction");

  // The plank is picked up first despite sitting in the later slot.
  let firstCarried = -1;
  let delivered = false;
  for (let tick = 16; tick < 60000 && !delivered; tick += 16) {
    engine.update(tick);
    if (firstCarried < 0 && transporter.carriedResource >= 0) {
      firstCarried = transporter.carriedResource;
    }

    delivered =
      (building.deliveredResources[7] ?? 0) >= 1 && (building.deliveredResources[13] ?? 0) >= 1;
  }

  assert.equal(firstCarried, 7, "the plank outranks the gold ore at pickup");
  assert.equal(delivered, true, "both resources still arrive");
});

test("a destination off the staffed network is cancelled and the resource carried home (SB-36-02)", () => {
  const { world, castlePosition } = flatWorldWithCastle();
  const castleFlag = world.flagAt(world.move(castlePosition, "DownRight"));
  world.players[0].hasCastle = true;

  // A staffed road castle flag -> far flag, and a sawmill far away with
  // NO road to anything: its flag is not on the staffed network.
  const farPosition = world.geometry.positionAdd(castleFlag.position, 4, 0);
  const farFlag = world.buildFlag(farPosition, 0);
  assert.notEqual(farFlag, null);
  assert.equal(
    world.buildRoad(
      { start: castleFlag.position, directions: ["Right", "Right", "Right", "Right"] },
      0,
    ),
    true,
  );

  const sawmillPosition = world.geometry.positionAdd(castleFlag.position, 0, 6);
  const sawmill = world.buildBuilding(sawmillPosition, 17, 0);
  assert.notEqual(sawmill, null, "the disconnected sawmill builds");

  // Lumber waiting at the far flag, destined for the unreachable
  // sawmill, with the dispatch bookkeeping that sent it.
  sawmill.requestedResources[6] = 1;
  assert.equal(world.dropResource(farFlag.index, 6, sawmill.flagIndex), true);

  const engine = new SerfboundSerfEngine(world);
  const transporter = engine.spawnGenericSerf(0, 0);
  assert.equal(engine.assignTransporter(transporter, castleFlag.index, "Right", 0), true);

  const inventory = world.inventoryForPlayer(0);
  const lumberBefore = inventory.resources[6] ?? 0;

  // The sweep searches the staffed network, fails to reach the sawmill,
  // releases the in-flight request, and re-homes the lumber to the
  // castle inventory.
  let cancelled = false;
  let rehomed = false;
  let stored = false;
  for (let tick = 0; tick < 60000 && !stored; tick += 16) {
    engine.update(tick);
    const slot = farFlag.slots.find((entry) => entry.resource === 6);
    if (!cancelled && (sawmill.requestedResources[6] ?? 0) === 0) {
      cancelled = true;
    }

    if (slot !== undefined && slot.destinationFlagIndex === castleFlag.index) {
      rehomed = true;
    }

    stored = (inventory.resources[6] ?? 0) > lumberBefore;
  }

  assert.equal(cancelled, true, "the sawmill's in-flight request was released");
  assert.equal(rehomed, true, "the lumber was re-homed to the inventory flag");
  assert.equal(stored, true, "the lumber was carried home into the castle stock");
});

test("stocks request by the reference priorities, not first-found (SB-36-05)", () => {
  const { world, castlePosition } = flatWorldWithCastle();
  const castleFlag = world.flagAt(world.move(castlePosition, "DownRight"));
  world.players[0].hasCastle = true;

  // The steel smelter is built FIRST (lower index — first-found's
  // favorite); the gold smelter sits further down the same road line.
  const steelPosition = world.geometry.positionAdd(castleFlag.position, 3, -1);
  const steel = world.buildBuilding(steelPosition, 18, 0);
  assert.notEqual(steel, null, "steel smelter builds");
  const goldPosition = world.geometry.positionAdd(castleFlag.position, 6, -1);
  const gold = world.buildBuilding(goldPosition, 23, 0);
  assert.notEqual(gold, null, "gold smelter builds");
  steel.isDone = true;
  gold.isDone = true;

  const steelFlag = world.flags.get(steel.flagIndex);
  const goldFlag = world.flags.get(gold.flagIndex);
  assert.equal(
    world.buildRoad(
      { start: castleFlag.position, directions: ["Right", "Right", "Right", "Right"] },
      0,
    ),
    true,
  );
  assert.equal(
    world.buildRoad(
      { start: steelFlag.position, directions: ["Right", "Right", "Right"] },
      0,
    ),
    true,
  );
  assert.equal(goldFlag.position, world.geometry.positionAdd(castleFlag.position, 7, 0));

  // Exactly four coal in the castle and nothing else to export.
  const inventory = world.inventoryForPlayer(0);
  inventory.resources.fill(0);
  inventory.resources[12] = 4;

  const engine = new SerfboundSerfEngine(world);
  const first = engine.spawnGenericSerf(0, 0);
  assert.equal(engine.assignTransporter(first, castleFlag.index, "Right", 0), true);
  const second = engine.spawnGenericSerf(0, 0);
  assert.equal(engine.assignTransporter(second, steelFlag.index, "Right", 0), true);

  // The first allocation must go to the gold smelter: coal policy
  // 65500 (gold) over 32750 (steel), both stocks empty.
  let firstRequestSeen = null;
  let settled = false;
  for (let tick = 0; tick < 200000 && !settled; tick += 16) {
    engine.update(tick);
    if (firstRequestSeen === null) {
      if ((gold.requestedResources[12] ?? 0) > 0) {
        firstRequestSeen = "gold";
      } else if ((steel.requestedResources[12] ?? 0) > 0) {
        firstRequestSeen = "steel";
      }
    }

    settled =
      (gold.deliveredResources[12] ?? 0) + (steel.deliveredResources[12] ?? 0) === 4 &&
      (inventory.resources[12] ?? 0) === 0;
  }

  assert.equal(firstRequestSeen, "gold", "the higher coal policy is served first");
  assert.equal(settled, true, "all four coal left the castle and arrived");
  assert.equal(
    gold.deliveredResources[12] ?? 0,
    2,
    "the priority decay shares coal with the gold smelter at 2",
  );
  assert.equal(
    steel.deliveredResources[12] ?? 0,
    2,
    "the priority decay shares coal with the steel smelter at 2",
  );
});

test("the priority book is player data: inverted flag priorities invert pickup (SB-36-07)", () => {
  const { world, castlePosition } = flatWorldWithCastle();
  const castleFlag = world.flagAt(world.move(castlePosition, "DownRight"));
  world.players[0].hasCastle = true;

  // The SB-36-02 scenario, with this player's book inverted: gold ore
  // now outranks plank.
  world.players[0].economy.flagPriorities[13] = 26;
  world.players[0].economy.flagPriorities[7] = 1;

  const sitePosition = world.geometry.positionAdd(castleFlag.position, 3, -1);
  const building = world.buildBuilding(sitePosition, 2, 0);
  const buildingFlag = world.flags.get(building.flagIndex);
  assert.equal(
    world.buildRoad(
      { start: castleFlag.position, directions: ["Right", "Right", "Right", "Right"] },
      0,
    ),
    true,
  );
  assert.equal(world.dropResource(castleFlag.index, 13, buildingFlag.index), true);
  assert.equal(world.dropResource(castleFlag.index, 7, buildingFlag.index), true);

  const engine = new SerfboundSerfEngine(world);
  const transporter = engine.spawnGenericSerf(0, 0);
  assert.equal(engine.assignTransporter(transporter, castleFlag.index, "Right", 0), true);

  let firstCarried = -1;
  for (let tick = 0; tick < 60000 && firstCarried < 0; tick += 16) {
    engine.update(tick);
    if (transporter.carriedResource >= 0) {
      firstCarried = transporter.carriedResource;
    }
  }

  assert.equal(firstCarried, 13, "the player's inverted book sends gold ore first");
});

test("the distribution splits are player data: a zeroed policy starves its smelter (SB-36-07)", () => {
  const { world, castlePosition } = flatWorldWithCastle();
  const castleFlag = world.flagAt(world.move(castlePosition, "DownRight"));
  world.players[0].hasCastle = true;

  // The SB-36-05 scenario with coalGoldsmelter zeroed: every coal
  // must go to the steel smelter now.
  world.players[0].economy.distributions.coalGoldsmelter = 0;

  const steel = world.buildBuilding(world.geometry.positionAdd(castleFlag.position, 3, -1), 18, 0);
  const gold = world.buildBuilding(world.geometry.positionAdd(castleFlag.position, 6, -1), 23, 0);
  steel.isDone = true;
  gold.isDone = true;
  const steelFlag = world.flags.get(steel.flagIndex);
  assert.equal(
    world.buildRoad(
      { start: castleFlag.position, directions: ["Right", "Right", "Right", "Right"] },
      0,
    ),
    true,
  );
  assert.equal(
    world.buildRoad({ start: steelFlag.position, directions: ["Right", "Right", "Right"] }, 0),
    true,
  );

  // Three coal: the steel smelter's decay (127, 63, 31) stays above
  // the reference export minimum of 16 for all three.
  const inventory = world.inventoryForPlayer(0);
  inventory.resources.fill(0);
  inventory.resources[12] = 3;

  const engine = new SerfboundSerfEngine(world);
  const first = engine.spawnGenericSerf(0, 0);
  engine.assignTransporter(first, castleFlag.index, "Right", 0);
  const second = engine.spawnGenericSerf(0, 0);
  engine.assignTransporter(second, steelFlag.index, "Right", 0);

  let settled = false;
  for (let tick = 0; tick < 200000 && !settled; tick += 16) {
    engine.update(tick);
    settled = (steel.deliveredResources[12] ?? 0) === 3;
  }

  assert.equal(settled, true, "all three coal reached the steel smelter");
  assert.equal(gold.deliveredResources[12] ?? 0, 0, "the zeroed policy starves the gold smelter");
});

test("inventory modes: stop serves but rejects, in accepts, out expels by priority (SB-36-07)", () => {
  const { world, castlePosition } = flatWorldWithCastle();
  const castleFlag = world.flagAt(world.move(castlePosition, "DownRight"));
  world.players[0].hasCastle = true;

  const sawmill = world.buildBuilding(world.geometry.positionAdd(castleFlag.position, 3, -1), 17, 0);
  sawmill.isDone = true;
  const sawmillFlag = world.flags.get(sawmill.flagIndex);
  assert.equal(
    world.buildRoad(
      { start: castleFlag.position, directions: ["Right", "Right", "Right", "Right"] },
      0,
    ),
    true,
  );

  const inventory = world.inventoryForPlayer(0);
  inventory.resources.fill(0);
  inventory.resources[6] = 2; // lumber, which the sawmill always wants
  inventory.resourceMode = "stop";

  // An orphan wheat (no destination) at the sawmill flag: nothing
  // consumes wheat here, so only an ACCEPTING inventory can home it.
  assert.equal(world.dropResource(sawmillFlag.index, 3, 0), true);

  const engine = new SerfboundSerfEngine(world);
  // Arrived lumber is sawed the moment it lands, so count the planks
  // it becomes rather than sampling the stock.
  let planksMade = 0;
  engine.onProduct = (_type, product) => {
    if (product === 7) {
      planksMade += 1;
    }
  };
  const transporter = engine.spawnGenericSerf(0, 0);
  engine.assignTransporter(transporter, castleFlag.index, "Right", 0);

  let tick = 0;
  let lumberServed = false;
  for (; tick < 200000 && !lumberServed; tick += 16) {
    engine.update(tick);
    lumberServed = planksMade === 2;
  }

  assert.equal(lumberServed, true, "a stopped inventory still serves demand (In || Stop)");
  assert.equal(inventory.resources[3], 0, "the stopped inventory accepted nothing");
  assert.equal(
    sawmillFlag.slots.some((slot) => slot.resource === 3),
    true,
    "the orphan wheat waits at the flag while the castle is stopped",
  );

  // Flip to IN: the orphan re-homes into the castle stock.
  inventory.resourceMode = "in";
  let wheatHome = false;
  for (; tick < 500000 && !wheatHome; tick += 16) {
    engine.update(tick);
    wheatHome = (inventory.resources[3] ?? 0) === 1;
  }

  assert.equal(wheatHome, true, "an accepting inventory homes the orphan");

  // OUT mode: the higher inventory priority leaves first — lumber (7)
  // over wheat (1) — and the network re-homes it to the sawmill.
  inventory.resources[6] = 1;
  inventory.resourceMode = "out";
  let lumberExpelled = false;
  for (; tick < 900000 && !lumberExpelled; tick += 16) {
    engine.update(tick);
    lumberExpelled = planksMade === 3;
  }

  assert.equal(lumberExpelled, true, "expelled lumber re-homed to the sawmill");
  assert.equal(inventory.resources[3], 0, "the wheat was expelled after it");
  assert.equal(
    castleFlag.slots.some((slot) => slot.resource === 3),
    true,
    "homeless wheat waits at the flag, not in a building",
  );
});

test("the toolmaker draws from the player's tool priorities (SB-36-07)", () => {
  const { world, castlePosition } = flatWorldWithCastle();
  const castleFlag = world.flagAt(world.move(castlePosition, "DownRight"));
  world.players[0].hasCastle = true;

  // Only the hammer is prioritized: every draw must be a hammer.
  world.players[0].economy.toolPriorities = [0, 65500, 0, 0, 0, 0, 0, 0, 0];

  const toolmaker = world.buildBuilding(world.geometry.positionAdd(castleFlag.position, 3, -1), 19, 0);
  toolmaker.isDone = true;
  assert.equal(
    world.buildRoad(
      { start: castleFlag.position, directions: ["Right", "Right", "Right", "Right"] },
      0,
    ),
    true,
  );

  const inventory = world.inventoryForPlayer(0);
  inventory.resources.fill(0);
  toolmaker.deliveredResources[7] = 3; // planks
  toolmaker.deliveredResources[11] = 3; // steel

  const engine = new SerfboundSerfEngine(world);
  const transporter = engine.spawnGenericSerf(0, 0);
  engine.assignTransporter(transporter, castleFlag.index, "Right", 0);

  let hammers = 0;
  for (let tick = 0; tick < 400000 && hammers < 3; tick += 16) {
    engine.update(tick);
    hammers = inventory.resources[16] ?? 0;
  }

  assert.equal(hammers, 3, "three tools made, all hammers");
  for (const tool of [15, 17, 18, 19, 20, 21, 22, 23]) {
    assert.equal(inventory.resources[tool] ?? 0, 0, `no ${tool} was drawn`);
  }
});

test("the emergency program: short stocks funnel construction into the essential trio (SB-36-08)", () => {
  const { world, castlePosition } = flatWorldWithCastle();
  const castleFlag = world.flagAt(world.move(castlePosition, "DownRight"));
  world.players[0].hasCastle = true;
  const player = world.players[0];

  // Five planks against the seven the missing trio would cost:
  // the program must trip.
  const inventory = world.inventoryForPlayer(0);
  inventory.resources.fill(0);
  inventory.resources[7] = 5;
  inventory.resources[9] = 10;

  // A hut site queued BEFORE the program trips, with its materials
  // already staged behind the castle door.
  const hut = world.buildBuilding(world.geometry.positionAdd(castleFlag.position, 3, -1), 11, 0);
  const hutFlag = world.flags.get(hut.flagIndex);
  assert.equal(
    world.buildRoad(
      { start: castleFlag.position, directions: ["Right", "Right", "Right", "Right"] },
      0,
    ),
    true,
  );

  const engine = new SerfboundSerfEngine(world);
  assert.equal(engine.dispatchConstructionLogistics(hut, 0), true, "the hut dispatches pre-emergency");
  const stagedForHut = inventory.pendingOut.filter(
    (entry) => entry.destinationFlagIndex === hutFlag.index,
  ).length;
  assert.equal(stagedForHut, 2, "a plank and a stone wait behind the door");
  const planksAfterDispatch = inventory.resources[7];

  engine.update(16);
  assert.equal(player.emergencyProgramActive, true, "the program trips on short planks");
  assert.equal(
    inventory.pendingOut.some((entry) => entry.destinationFlagIndex === hutFlag.index),
    false,
    "the hut's staged materials were clawed back",
  );
  assert.equal(inventory.resources[7], planksAfterDispatch + 1, "the plank returned to stock");

  // New non-essential work is refused; the essential chain builds.
  // Both sites sit on real roads so the refusal is the emergency,
  // not unreachability.
  const hut2 = world.buildBuilding(world.geometry.positionAdd(castleFlag.position, -1, 3), 11, 0);
  assert.notEqual(hut2, null, "second hut site builds");
  assert.equal(
    world.buildRoad({ start: castleFlag.position, directions: ["Down", "Down", "Down", "Down"] }, 0),
    true,
    "the south road connects",
  );
  assert.equal(engine.dispatchConstructionLogistics(hut2, 32), false, "no huts in an emergency");

  const lumberjack = world.buildBuilding(world.geometry.positionAdd(castleFlag.position, 6, -1), 2, 0);
  assert.notEqual(lumberjack, null, "lumberjack site builds");
  assert.equal(
    world.buildRoad({ start: hutFlag.position, directions: ["Right", "Right", "Right"] }, 0),
    true,
    "the corridor extends to the lumberjack",
  );
  assert.equal(
    engine.dispatchConstructionLogistics(lumberjack, 32),
    true,
    "the lumberjack site goes through",
  );

  // Stand the trio; the program lifts and the held sites re-dispatch.
  lumberjack.isDone = true;
  const sawmill = world.buildBuilding(world.geometry.positionAdd(castleFlag.position, 3, 3), 17, 0);
  assert.notEqual(sawmill, null, "sawmill site builds");
  sawmill.isDone = true;
  const stonecutter = world.buildBuilding(world.geometry.positionAdd(castleFlag.position, -3, -1), 4, 0);
  assert.notEqual(stonecutter, null, "stonecutter site builds");
  stonecutter.isDone = true;

  engine.update(128);
  assert.equal(player.emergencyProgramActive, false, "the trio lifts the program");
  assert.equal(
    inventory.pendingOut.some((entry) => entry.destinationFlagIndex === hutFlag.index),
    true,
    "the hut's logistics re-dispatched on recovery",
  );
});
