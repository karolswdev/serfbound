import assert from "node:assert/strict";
import { test } from "node:test";

import * as engineModule from "@serfbound/engine";
import {
  SerfboundCommandRouter,
  restoreSerfboundLocalGame,
  startSerfboundLocalGame,
} from "@serfbound/engine";

const dataSource = {
  kind: "imported-dos-pa-catalog",
  archiveName: "SPAU.PA",
  byteLength: 1_282_805,
  entryCount: 4000,
  definedArchiveEntries: 3805,
  fixupCount: 252,
};

function tileFor(world, position) {
  return {
    column: position & world.geometry.columnMask,
    row: (position >>> world.geometry.rowShift) & world.geometry.rowMask,
    position,
  };
}

function findCastleSpot(world) {
  for (let position = 0; position < world.tileCount; position += 1) {
    if (world.canBuildCastle(position, 0)) {
      return position;
    }
  }

  throw new Error("no castle spot on this map");
}

function startedGameWithCastle() {
  const started = startSerfboundLocalGame({ data: dataSource });
  assert.equal(started.status, "started");
  const world = started.game.world();
  const router = new SerfboundCommandRouter(started.game.state, world);
  const castlePosition = findCastleSpot(world);
  const result = router.dispatch({
    type: "game.build-castle",
    source: "pointer",
    tile: tileFor(world, castlePosition),
  });
  assert.equal(result.status, "accepted");
  assert.equal(result.effect, "castle-built");
  return { started, world, router, castlePosition };
}

test("the castle command claims territory and unlocks building", () => {
  const { world, router, castlePosition } = startedGameWithCastle();

  assert.equal(world.players[0].hasCastle, true);
  assert.equal(world.players[0].castlePosition, castlePosition);
  assert.equal(world.owner(castlePosition), 0, "castle tile is owned");
  assert.equal(world.players[0].landArea > 100, true, "territory claimed around the castle");

  // A second castle is rejected.
  const again = router.dispatch({
    type: "game.build-castle",
    source: "pointer",
    tile: tileFor(world, world.geometry.positionAdd(castlePosition, 10, 10)),
  });
  assert.equal(again.status, "rejected");
  assert.equal(again.reason, "invalid-build-position");

  // Snapshot carries world facts.
  assert.equal(again.snapshot.world.hasCastle, true);
  assert.equal(again.snapshot.world.flagCount, 1, "the castle flag exists");
});

test("flags, roads, and buildings build inside territory via commands", () => {
  const { world, router, castlePosition } = startedGameWithCastle();
  const castleFlagPosition = world.move(castlePosition, "DownRight");

  // Find a flag spot inside territory.
  let flagPosition = -1;
  for (let radius = 2; radius < 8 && flagPosition < 0; radius += 1) {
    for (let offset = 0; offset < 100; offset += 1) {
      const candidate = world.positionAddSpirally(castleFlagPosition, offset);
      if (candidate !== castleFlagPosition && world.canBuildFlag(candidate, 0)) {
        flagPosition = candidate;
        break;
      }
    }
  }
  assert.notEqual(flagPosition, -1, "a flag spot exists in territory");

  const flagResult = router.dispatch({
    type: "game.build-flag",
    source: "pointer",
    tile: tileFor(world, flagPosition),
  });
  assert.equal(flagResult.status, "accepted");
  assert.equal(flagResult.effect, "world-flag-built");

  const roadResult = router.dispatch({
    type: "game.build-road",
    source: "pointer",
    tile: tileFor(world, castleFlagPosition),
    toTile: tileFor(world, flagPosition),
  });
  assert.equal(roadResult.status, "accepted", roadResult.message ?? "");
  assert.equal(roadResult.effect, "road-built");
  assert.equal(world.flagAt(castleFlagPosition).paths !== undefined, true);

  // Find a lumberjack site.
  let sitePosition = -1;
  for (let offset = 0; offset < 200; offset += 1) {
    const candidate = world.positionAddSpirally(castlePosition, offset);
    if (world.canBuildBuilding(candidate, 2, 0)) {
      sitePosition = candidate;
      break;
    }
  }

  if (sitePosition >= 0) {
    const buildResult = router.dispatch({
      type: "game.build-building",
      source: "pointer",
      tile: tileFor(world, sitePosition),
      buildingKind: "lumberjack",
    });
    assert.equal(buildResult.status, "accepted");
    assert.equal(buildResult.effect, "building-built");
    assert.equal(buildResult.snapshot.world.buildingCount, 2, "castle + lumberjack");
  }

  // Commands outside territory are rejected.
  const outside = router.dispatch({
    type: "game.build-flag",
    source: "pointer",
    tile: tileFor(world, world.geometry.positionAdd(castlePosition, 30, 30)),
  });
  assert.equal(outside.status, "rejected");
});

test("saved games replay world actions to identical world state", () => {
  const { started, world, router, castlePosition } = startedGameWithCastle();
  const castleFlagPosition = world.move(castlePosition, "DownRight");

  let flagPosition = -1;
  for (let offset = 0; offset < 100; offset += 1) {
    const candidate = world.positionAddSpirally(castleFlagPosition, offset);
    if (candidate !== castleFlagPosition && world.canBuildFlag(candidate, 0)) {
      flagPosition = candidate;
      break;
    }
  }
  router.dispatch({
    type: "game.build-flag",
    source: "pointer",
    tile: tileFor(world, flagPosition),
  });
  router.dispatch({
    type: "game.build-road",
    source: "pointer",
    tile: tileFor(world, castleFlagPosition),
    toTile: tileFor(world, flagPosition),
  });

  const saved = started.game.snapshot();
  assert.equal(saved.state.worldActions.length, 3, "castle + flag + road actions recorded");

  const restored = restoreSerfboundLocalGame(saved);
  assert.equal(restored.status, "started");
  const replayedWorld = restored.game.world();

  assert.deepEqual(Array.from(replayedWorld.paths), Array.from(world.paths), "paths identical");
  assert.deepEqual(Array.from(replayedWorld.owners), Array.from(world.owners), "owners identical");
  assert.deepEqual(Array.from(replayedWorld.objects), Array.from(world.objects), "objects identical");
  assert.equal(replayedWorld.flags.size, world.flags.size);
  assert.equal(replayedWorld.buildings.size, world.buildings.size);
  assert.equal(replayedWorld.players[0].hasCastle, true);
});

test("construction is serf-driven: builder + materials complete the building", () => {
  const { started, world, router, castlePosition } = startedGameWithCastle();
  const castleFlagPosition = world.move(castlePosition, "DownRight");

  // Find a lumberjack site whose flag can be road-connected to the castle.
  let building = null;
  for (let offset = 0; offset < 250 && building === null; offset += 1) {
    const candidate = world.positionAddSpirally(castlePosition, offset);
    if (!world.canBuildBuilding(candidate, 2, 0)) {
      continue;
    }

    const result = router.dispatch({
      type: "game.build-building",
      source: "pointer",
      tile: tileFor(world, candidate),
      buildingKind: "lumberjack",
    });
    if (result.status !== "accepted") {
      continue;
    }

    building = [...world.buildings.values()].reduce((a, b) => (a.index > b.index ? a : b));
    const roadResult = router.dispatch({
      type: "game.build-road",
      source: "pointer",
      tile: tileFor(world, castleFlagPosition),
      toTile: tileFor(world, world.flags.get(building.flagIndex).position),
    });
    if (roadResult.status !== "accepted") {
      building = null; // unroutable site; try another
    }
  }
  assert.notEqual(building, null, "a road-connected lumberjack site exists");

  const { SerfboundSerfEngine } = engineModule;
  const engine = new SerfboundSerfEngine(world);
  assert.equal(engine.dispatchConstructionLogistics(building, started.game.state.tick), true);

  let sawFrame = false;
  let done = false;
  for (let tick = 0; tick < 200000 && !done; tick += 16) {
    engine.update(tick);
    if (building.progress >= 1) {
      sawFrame = true;
    }

    done = building.isDone;
  }

  assert.equal(sawFrame, true, "the site passed through the frame stage");
  assert.equal(done, true, "the building completes through builder work + materials");
  assert.equal(building.consumedMaterials, 2, "the lumberjack consumed its two planks");
});

test("an explicit drawn road path builds exactly as drawn (SB-34-08)", () => {
  const { world, router, castlePosition } = startedGameWithCastle();
  const castleFlagPosition = world.move(castlePosition, "DownRight");

  // Walk a short valid path from the castle flag, then flag its end.
  const directions = [];
  let end = castleFlagPosition;
  for (const candidate of ["Right", "DownRight", "Down", "Left", "UpLeft", "Up"]) {
    const probe = [];
    let walker = castleFlagPosition;
    let valid = true;
    for (let step = 0; step < 2; step += 1) {
      walker = world.move(walker, candidate);
      if (!world.canBuildFlag(walker, 0) && step === 1) {
        valid = false;
      }

      probe.push(candidate);
    }

    if (valid && world.canBuildFlag(walker, 0)) {
      directions.push(...probe);
      end = walker;
      break;
    }
  }
  assert.equal(directions.length, 2, "a straight two-segment path exists");

  assert.equal(
    router.dispatch({ type: "game.build-flag", source: "pointer", tile: tileFor(world, end) })
      .status,
    "accepted",
  );

  const result = router.dispatch({
    type: "game.build-road",
    source: "pointer",
    tile: tileFor(world, castleFlagPosition),
    toTile: tileFor(world, end),
    directions,
  });
  assert.equal(result.status, "accepted", result.message ?? "");
  assert.equal(result.effect, "road-built");
  // The drawn segments exist on the map, direction for direction.
  let walker = castleFlagPosition;
  for (const direction of directions) {
    assert.equal(world.hasPath(walker, direction), true, `segment ${direction} laid`);
    walker = world.move(walker, direction);
  }

  // An invalid drawn path (not ending at a flag) is rejected wholesale.
  const bad = router.dispatch({
    type: "game.build-road",
    source: "pointer",
    tile: tileFor(world, castleFlagPosition),
    toTile: tileFor(world, world.move(end, "Right")),
    directions: [...directions, "Right", "Right"],
  });
  assert.equal(bad.status, "rejected");
});

test("builder work never banks: phases rise under the hammer, not on delivery (SB-34 round 6)", () => {
  const { world, router, castlePosition } = startedGameWithCastle();
  let sitePosition = -1;
  for (let offset = 0; offset < 200; offset += 1) {
    const candidate = world.positionAddSpirally(castlePosition, offset);
    if (world.canBuildBuilding(candidate, 2, 0)) {
      sitePosition = candidate;
      break;
    }
  }
  assert.equal(
    router.dispatch({
      type: "game.build-building",
      source: "pointer",
      tile: tileFor(world, sitePosition),
      buildingKind: "lumberjack",
    }).status,
    "accepted",
  );
  const building = world.buildingAt(sitePosition);

  // Leveling: fraction stays 0 until the ground is ready.
  assert.equal(world.constructionFraction(building), 0);
  world.applyBuilderWork(building, 40);
  assert.equal(building.progress, 1, "leveling done");

  // The builder hammers for ages with NO materials on site: nothing
  // banks — the fraction stays at 0 instead of storing phantom work.
  world.applyBuilderWork(building, 500);
  assert.equal(building.consumedMaterials, 0);
  assert.equal(world.constructionFraction(building), 0);

  // The first plank arrives: progress rises tick by tick, not in one
  // snap from the banked 500.
  building.deliveredResources[7] = 1;
  world.applyBuilderWork(building, 10);
  const early = world.constructionFraction(building);
  assert.equal(early > 0 && early < 0.5, true, `gradual (${early})`);
  world.applyBuilderWork(building, 10);
  const later = world.constructionFraction(building);
  assert.equal(later > early, true, "monotonic under the hammer");
  world.applyBuilderWork(building, 10);
  assert.equal(building.consumedMaterials, 1, "one material consumed after 30 ticks");
  assert.equal(building.isDone, false);

  // The second plank: the building tops out and completes.
  building.deliveredResources[7] = 2;
  world.applyBuilderWork(building, 30);
  assert.equal(building.isDone, true);
  assert.equal(world.constructionFraction(building), 1);
});
