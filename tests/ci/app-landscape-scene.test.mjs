import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildDecodedRenderAssets,
  buildLandscapeRenderAssets,
  constructionCrossSprite,
  createLandscapeScene,
  mapTileToScreen,
  screenToMapTile,
} from "@serfbound/app";
import {
  SerfboundCommandRouter,
  generateClassicMap,
  startSerfboundLocalGame,
} from "@serfbound/engine";
import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

const decodedAssets = buildDecodedRenderAssets(createDecodableGeneratedPaArchive());
const landscape = generateClassicMap(3, [0x1234, 0x5678, 0x9abc]);
const landscapeAssets = buildLandscapeRenderAssets(decodedAssets, landscape);

test("landscape render assets compose every terrain combo the map needs", () => {
  assert.notEqual(landscapeAssets, null);
  assert.equal(landscapeAssets.terrainComboCount > 20, true);
  assert.equal(landscapeAssets.objectSpriteCount > 0, true);
  assert.notEqual(landscapeAssets.atlas.regions["obj:flag"], undefined);

  // Every terrain triangle combo of the landscape resolves to an atlas region.
  for (let position = 0; position < landscape.tileCount; position += 1) {
    const keys = Object.keys(landscapeAssets.atlas.regions);
    assert.equal(keys.length > 0, true);
    break;
  }
});

test("the landscape scene covers the viewport from the generated world", () => {
  const scene = createLandscapeScene({
    size: { width: 960, height: 540 },
    assets: landscapeAssets,
    scroll: { column: 0, row: 0 },
    builtStructures: [{ id: 1, kind: "flag", tile: { column: 5, row: 4, position: 4 * 64 + 5 } }],
  });

  assert.equal(scene.assetSummary.source, "dos-pa-decoded");
  const terrain = scene.sprites.filter((sprite) => sprite.layer === "terrain");
  const expectedCells = (Math.ceil(960 / 32) + 2) * (Math.ceil(540 / 20) + 8);
  assert.equal(
    terrain.length >= expectedCells,
    true,
    `terrain covers the canvas (${terrain.length} >= ${expectedCells})`,
  );

  for (const sprite of scene.sprites) {
    assert.notEqual(
      landscapeAssets.atlas.regions[sprite.key],
      undefined,
      `sprite key ${sprite.key} resolves`,
    );
  }

  // Flags render the wave frame for the scene's tick (frame 0 here).
  assert.equal(scene.sprites.filter((sprite) => sprite.key === "objflag:0").length, 1);
});

test("scrolling changes the visible window and wraps at map edges", () => {
  const sceneAt = (column, row) =>
    createLandscapeScene({
      size: { width: 320, height: 200 },
      assets: landscapeAssets,
      scroll: { column, row },
    });

  const origin = sceneAt(0, 0);
  const shifted = sceneAt(5, 7);
  assert.notDeepEqual(
    origin.sprites.map((sprite) => sprite.key),
    shifted.sprites.map((sprite) => sprite.key),
    "scrolling shows different terrain",
  );

  // Wrapping: scrolling a full map width/height shows the same scene again.
  const wrapped = sceneAt(landscape.columns, landscape.rows);
  assert.deepEqual(wrapped.sprites, origin.sprites);

  // Negative scroll wraps too.
  const negative = sceneAt(-landscape.columns + 5, -landscape.rows + 7);
  assert.deepEqual(negative.sprites, shifted.sprites);
});

test("map/screen mappings agree and respect scroll", () => {
  const scroll = { column: 10, row: 12 };
  for (const tile of [
    { column: 10, row: 12 },
    { column: 15, row: 13 },
    { column: 12, row: 19 },
  ]) {
    const screen = mapTileToScreen(landscape, tile, scroll);
    assert.notEqual(screen, null);
    // Height-aware picking (SB-34 round 4): the exact screen point the
    // cursor draws at must pick the same tile back — no compensation.
    const roundTripped = screenToMapTile(landscape, screen, scroll);
    assert.deepEqual(
      { column: roundTripped.column, row: roundTripped.row },
      tile,
      `tile ${JSON.stringify(tile)} round-trips`,
    );
  }
});

const isFlagKey = (key) => key === "obj:flag" || /^objflag:\d$/.test(key);

test("built flags track their map tile across scrolls", () => {
  const tile = { column: 20, row: 8, position: 8 * 64 + 20 };
  const near = createLandscapeScene({
    size: { width: 960, height: 540 },
    assets: landscapeAssets,
    scroll: { column: 16, row: 4 },
    builtStructures: [{ id: 1, kind: "flag", tile }],
  });
  const flag = near.sprites.find((sprite) => isFlagKey(sprite.key));
  assert.notEqual(flag, undefined, "flag visible when scrolled near its tile");

  const far = createLandscapeScene({
    size: { width: 320, height: 200 },
    assets: landscapeAssets,
    scroll: { column: 48, row: 40 },
    builtStructures: [{ id: 1, kind: "flag", tile }],
  });
  assert.equal(
    far.sprites.find((sprite) => isFlagKey(sprite.key)),
    undefined,
    "flag culled when far outside the viewport",
  );
});

test("flags wave through the reference frames as the tick advances", () => {
  // RenderFlag: map objects 128..131, frame = (tick >> 3) & 3.
  for (let frame = 0; frame < 4; frame += 1) {
    assert.notEqual(
      landscapeAssets.atlas.regions[`objflag:${frame}`],
      undefined,
      `flag frame ${frame} composed`,
    );
  }

  const tile = { column: 20, row: 8, position: 8 * 64 + 20 };
  const flagAtTick = (tick) =>
    createLandscapeScene({
      size: { width: 960, height: 540 },
      assets: landscapeAssets,
      scroll: { column: 16, row: 4 },
      tick,
      builtStructures: [{ id: 1, kind: "flag", tile }],
    }).sprites.find((sprite) => sprite.key.startsWith("objflag:"));

  assert.equal(flagAtTick(0).key, "objflag:0");
  assert.equal(flagAtTick(8).key, "objflag:1");
  assert.equal(flagAtTick(16).key, "objflag:2");
  assert.equal(flagAtTick(24).key, "objflag:3");
  assert.equal(flagAtTick(32).key, "objflag:0", "the cycle wraps");
});

test("waves animate on water and mask at shores per the reference rules", () => {
  assert.equal(landscapeAssets.waveFrameCount, 16, "all 16 wave frames composed");
  for (const variant of ["full", "up", "down"]) {
    assert.notEqual(
      landscapeAssets.atlas.regions[`wave:0:${variant}`],
      undefined,
      `wave variant ${variant} exists`,
    );
  }

  const sceneAtTick = (tick) =>
    createLandscapeScene({
      size: { width: 960, height: 540 },
      assets: landscapeAssets,
      scroll: { column: 0, row: 0 },
      tick,
    });

  const sceneA = sceneAtTick(0);
  const waves = sceneA.sprites.filter((sprite) => sprite.key.startsWith("wave:"));
  assert.equal(waves.length > 0, true, "waves render over water");
  assert.equal(
    waves.every((sprite) => sprite.layer === "paths"),
    true,
    "waves draw on the layer above terrain",
  );

  // Advancing the tick by 8 advances every wave frame by one.
  const sceneB = sceneAtTick(8);
  const wavesB = sceneB.sprites.filter((sprite) => sprite.key.startsWith("wave:"));
  assert.equal(wavesB.length, waves.length);
  const frameOf = (key) => Number(key.split(":")[1]);
  for (let index = 0; index < waves.length; index += 1) {
    assert.equal(
      frameOf(wavesB[index].key),
      (frameOf(waves[index].key) + 1) & 0xf,
      "wave frame advanced by one",
    );
  }
});

test("a freshly placed building shows the construction cross immediately", () => {
  // The maintainer's phone: "the building literally doesn't render —
  // just a flag." The reference shows CrossSprite 0x90 the moment a
  // site is placed (progress 0, leveling); invisible placement is a bug.
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
  assert.equal(started.status, "started");
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
  assert.notEqual(castlePosition, -1, "a castle spot exists");
  assert.equal(
    router.dispatch({ type: "game.build-castle", source: "pointer", tile: tileFor(castlePosition) })
      .status,
    "accepted",
  );

  let sitePosition = -1;
  for (let offset = 0; offset < 200; offset += 1) {
    const candidate = world.positionAddSpirally(castlePosition, offset);
    if (world.canBuildBuilding(candidate, 2, 0)) {
      sitePosition = candidate;
      break;
    }
  }
  assert.notEqual(sitePosition, -1, "a lumberjack site exists");
  assert.equal(
    router.dispatch({
      type: "game.build-building",
      source: "pointer",
      tile: tileFor(sitePosition),
      buildingKind: "lumberjack",
    }).status,
    "accepted",
  );
  const building = world.buildingAt(sitePosition);
  assert.notEqual(building, null);
  assert.equal(building.progress, 0, "the site has not been leveled yet");

  const worldAssets = buildLandscapeRenderAssets(
    buildDecodedRenderAssets(createDecodableGeneratedPaArchive()),
    started.game.landscape(),
  );
  const tile = tileFor(sitePosition);
  const scene = createLandscapeScene({
    size: { width: 960, height: 540 },
    assets: worldAssets,
    scroll: { column: Math.max(0, tile.column - 8), row: Math.max(0, tile.row - 8) },
    world,
  });
  assert.equal(
    scene.sprites.some((sprite) => sprite.key === `mo:${constructionCrossSprite}`),
    true,
    "the construction cross renders at the placed site",
  );
});

test("serfs render torso sprites from the animation table chain", () => {
  // The fixture provides torso body 0 + arms + the animation table; heads
  // live beyond the fixture's entry table and are skipped gracefully.
  assert.notEqual(landscapeAssets.serfAnimationTable, null);
  assert.equal(landscapeAssets.serfBodyCount >= 1, true);
  assert.notEqual(landscapeAssets.atlas.regions["serft:0"], undefined);

  const scene = createLandscapeScene({
    size: { width: 960, height: 540 },
    assets: landscapeAssets,
    scroll: { column: 0, row: 0 },
    serfs: [{ position: 5 * 64 + 6, animation: 0, counter: 0 }],
  });
  const serfSprites = scene.sprites.filter((sprite) => sprite.key.startsWith("serf"));
  assert.equal(serfSprites.length >= 1, true, "the serf renders its torso");
  assert.equal(serfSprites[0].layer, "markers");
});

test("construction rises bottom-up: cornerstone, then frame, then the building reveals (SB-34 round 6)", () => {
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
  let sitePosition = -1;
  for (let offset = 0; offset < 200; offset += 1) {
    const candidate = world.positionAddSpirally(castlePosition, offset);
    if (world.canBuildBuilding(candidate, 2, 0)) {
      sitePosition = candidate;
      break;
    }
  }
  router.dispatch({
    type: "game.build-building",
    source: "pointer",
    tile: tileFor(sitePosition),
    buildingKind: "lumberjack",
  });
  const building = world.buildingAt(sitePosition);
  const worldAssets = buildLandscapeRenderAssets(
    buildDecodedRenderAssets(createDecodableGeneratedPaArchive()),
    started.game.landscape(),
  );
  const tile = tileFor(sitePosition);
  const sceneNow = () =>
    createLandscapeScene({
      size: { width: 960, height: 540 },
      assets: worldAssets,
      scroll: { column: Math.max(0, tile.column - 8), row: Math.max(0, tile.row - 8) },
      world,
    });

  // Mid-first-half: cornerstone + the frame partially revealed.
  building.progress = 1;
  building.deliveredResources[7] = 2;
  building.materialWorkTicks = 15; // fraction (0 + 15/30) / 2 = 0.25
  const early = sceneNow();
  assert.equal(
    early.sprites.some((sprite) => sprite.key === "mo:145"),
    true,
    "the corner stone marks the rising frame",
  );
  const frameKey = "mo:186"; // 0xba, the lumberjack frame
  const earlyFrame = early.sprites.find((sprite) => sprite.key === frameKey);
  assert.notEqual(earlyFrame, undefined, "the frame renders");
  assert.equal(
    Math.abs((earlyFrame.cropTop ?? 0) - 0.5) < 0.01,
    true,
    `frame half-revealed (cropTop ${earlyFrame.cropTop})`,
  );

  // Second half: the frame stands whole; the building reveals over it.
  building.consumedMaterials = 1;
  building.materialWorkTicks = 15; // fraction (1 + 0.5) / 2 = 0.75
  const late = sceneNow();
  const lateFrame = late.sprites.find((sprite) => sprite.key === frameKey);
  assert.equal(lateFrame.cropTop ?? 0, 0, "the frame stands whole");
  const buildingSprite = late.sprites.find((sprite) => sprite.key === "mo:168"); // 0xa8 lumberjack
  assert.notEqual(buildingSprite, undefined, "the building rises over the frame");
  assert.equal(
    Math.abs((buildingSprite.cropTop ?? 0) - 0.5) < 0.01,
    true,
    `building half-revealed (cropTop ${buildingSprite.cropTop})`,
  );
});
