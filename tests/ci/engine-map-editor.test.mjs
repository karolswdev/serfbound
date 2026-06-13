import assert from "node:assert/strict";
import { test } from "node:test";

import {
  MapEditor,
  decodeCustomMapLandscape,
  encodeCustomMap,
  generateClassicMap,
} from "@serfbound/engine";

const meta = {
  title: "EDIT TEST",
  authorKeyId: "k",
  authorName: "T",
  createdAtIso: "2026-06-13T00:00:00.000Z",
};

function flatEditor(size = 3, height = 4) {
  const base = generateClassicMap(size, [1, 2, 3]);
  const editor = new MapEditor(base);
  // A blank canvas: flat grass plateau, no objects — what "new map"
  // gives the author.
  editor.heights.fill(height);
  editor.typesUp.fill(5); // grass1
  editor.typesDown.fill(5);
  editor.objects.fill(0);
  return editor;
}

test("a terrain stroke writes the expected bytes, across its radius (SB-42-02)", () => {
  const editor = flatEditor();
  const center = editor.geometry.position(10, 10);

  // Radius 0: just the tile.
  editor.beginStroke();
  editor.paintTerrain(center, 6, 0); // grass2
  editor.endStroke();
  assert.equal(editor.typesUp[center], 6, "up triangle painted");
  assert.equal(editor.typesDown[center], 6, "down triangle painted");

  // Radius 1: the tile plus its six neighbors.
  editor.beginStroke();
  editor.paintTerrain(center, 11, 1); // tundra0
  editor.endStroke();
  assert.equal(editor.typesUp[center], 11, "center repainted");
  for (const dir of ["Right", "DownRight", "Down", "Left", "UpLeft", "Up"]) {
    const n = editor.geometry.move(center, dir);
    assert.equal(editor.typesUp[n], 11, `neighbor ${dir} painted`);
    assert.equal(editor.typesDown[n], 11, `neighbor ${dir} down painted`);
  }

  // Out-of-range terrain is refused.
  editor.beginStroke();
  editor.paintTerrain(center, 99, 0);
  editor.endStroke();
  assert.equal(editor.typesUp[center], 11, "illegal terrain ignored");
});

test("the height brush keeps the <=32 slope invariant; a big delta cascades (SB-42-02)", () => {
  const editor = flatEditor(3, 100);
  const center = editor.geometry.position(10, 10);

  // Raise the center by a cliff-sized 90; the clamp must smooth it.
  editor.beginStroke();
  editor.raiseHeight(center, 90, 0);
  editor.endStroke();
  assert.equal(editor.heights[center], 190, "center rose");

  // Every adjacency on the map is within 32 — no cliff survives.
  for (let pos = 0; pos < editor.tileCount; pos += 1) {
    const h = editor.heights[pos];
    for (const dir of ["Right", "DownRight", "Down"]) {
      const n = editor.geometry.move(pos, dir);
      assert.equal(
        Math.abs(h - editor.heights[n]) <= 32,
        true,
        `slope ${pos}->${dir} within 32`,
      );
    }
  }

  // The immediate neighbor sits exactly 32 below the 190 peak.
  const neighbor = editor.geometry.move(center, "Right");
  assert.equal(editor.heights[neighbor], 158, "the first ring is pulled to 32 below the peak");
});

test("undo reverses a stroke completely, including the slope cascade; redo re-applies (SB-42-02)", () => {
  const editor = flatEditor(3, 100);
  const center = editor.geometry.position(10, 10);
  const before = Array.from(editor.heights);

  editor.beginStroke();
  editor.raiseHeight(center, 90, 1); // a radius-1 cliff: lots of cascade
  editor.endStroke();
  assert.notDeepEqual(Array.from(editor.heights), before, "the stroke changed heights");

  assert.equal(editor.canUndo(), true);
  editor.undo();
  assert.deepEqual(
    Array.from(editor.heights),
    before,
    "undo restored every byte the stroke (and its cascade) touched",
  );

  assert.equal(editor.canRedo(), true);
  editor.redo();
  assert.equal(editor.heights[center], 190, "redo re-applied the stroke");
});

test("toLandscape round-trips through the custom-map format (SB-42-02)", () => {
  const editor = flatEditor();
  const center = editor.geometry.position(12, 12);
  editor.beginStroke();
  editor.paintTerrain(center, 3, 2);
  editor.raiseHeight(center, 40, 1);
  editor.endStroke();

  const landscape = editor.toLandscape();
  const record = encodeCustomMap(landscape, meta, { playerCount: 1, starts: [] });
  const decoded = decodeCustomMapLandscape(record);
  for (const name of ["heights", "typesUp", "typesDown", "objects", "minerals", "resourceAmounts"]) {
    assert.deepEqual(
      Array.from(decoded[name]),
      Array.from(landscape[name]),
      `${name} survives the editor → encode → decode trip`,
    );
  }
});

test("objects respect the engine's space rule: land on land, water in water (SB-42-03)", () => {
  const editor = flatEditor();
  // A land tile (the flat map is grass1 = 5) and a hand-made water tile.
  const land = editor.geometry.position(10, 10);
  const water = editor.geometry.position(20, 20);
  editor.typesUp[water] = 0;
  editor.typesDown[water] = 0;

  // A land tree (tree0 = 8) places on land, refuses on water.
  assert.equal(editor.placeObject(land, 8), true, "tree on land");
  assert.equal(editor.objects[land], 8);
  assert.equal(editor.placeObject(water, 8), false, "tree refused on water");

  // A water tree (28) the reverse.
  assert.equal(editor.placeObject(water, 28), true, "water tree in water");
  assert.equal(editor.objects[water], 28);
  assert.equal(editor.placeObject(land, 28), false, "water tree refused on land");

  // A non-authorable object (a castle, 4) is refused outright.
  assert.equal(editor.placeObject(land, 4), false, "castle is not an authorable object");

  // Erase always works.
  editor.eraseObject(land);
  assert.equal(editor.objects[land], 0);
});

test("minerals and fish write the right bytes; fish need water (SB-42-03)", () => {
  const editor = flatEditor();
  const mountain = editor.geometry.position(10, 10);
  const water = editor.geometry.position(20, 20);
  editor.typesUp[water] = 0;
  editor.typesDown[water] = 0;

  // A coal seam (mineral 3) of 12.
  assert.equal(editor.seedMineral(mountain, 3, 12), true);
  assert.equal(editor.minerals[mountain], 3);
  assert.equal(editor.resourceAmounts[mountain], 12);

  // An out-of-range mineral is refused.
  assert.equal(editor.seedMineral(mountain, 9, 5), false);

  // Fish (mineral none + amount) in water, refused on land.
  assert.equal(editor.seedFish(water, 8), true);
  assert.equal(editor.minerals[water], 0);
  assert.equal(editor.resourceAmounts[water], 8);
  assert.equal(editor.seedFish(mountain, 8), false, "no fish on dry land");
});

test("castle starts validate live and round-trip through the format (SB-42-03)", async () => {
  const { decodeCustomMapLandscape, encodeCustomMap } = await import("@serfbound/engine");
  const editor = flatEditor();
  // Find a castle-placeable tile on the flat grass plateau.
  let legal = -1;
  for (let pos = 0; pos < editor.tileCount && legal < 0; pos += 1) {
    if (editor.isCastlePlaceable(pos)) {
      legal = pos;
    }
  }
  assert.notEqual(legal, -1, "the flat map has a legal castle site");

  assert.equal(editor.setStart(0, legal, 30), true, "a legal start is accepted");
  assert.equal(editor.starts.length, 1);
  assert.equal(editor.starts[0].player, 0);
  assert.equal(editor.starts[0].position, legal);
  assert.equal(editor.starts[0].supplies, 30);

  // Block a tile with a stone and prove the start there is refused.
  const blocked = editor.geometry.position(12, 12);
  editor.placeObject(blocked, 72); // stone0 (impassable)
  assert.equal(editor.setStart(1, blocked, 20), false, "a blocked site is refused");

  // The accepted start rides into the custom-map format.
  const record = encodeCustomMap(editor.toLandscape(), {
    title: "STARTS",
    authorKeyId: "k",
    authorName: "T",
    createdAtIso: "2026-06-13T00:00:00.000Z",
  }, { playerCount: 1, starts: editor.starts });
  assert.equal(record.starts.length, 1);
  assert.equal(record.starts[0].position, legal);
  // And the landscape still decodes clean.
  decodeCustomMapLandscape(record);
});

const catalogData = {
  kind: "imported-dos-pa-catalog",
  archiveName: "SPAU.PA",
  byteLength: 1_282_805,
  entryCount: 4000,
  definedArchiveEntries: 3805,
  fixupCount: 252,
};

test("validation gives a playable verdict, and names what's wrong (SB-42-04)", () => {
  const editor = flatEditor();
  // Find two legal sites on the plateau.
  const legal = [];
  for (let pos = 0; pos < editor.tileCount && legal.length < 2; pos += 1) {
    if (editor.isCastlePlaceable(pos) && !legal.some((p) => editor.geometry.move(p, "DownRight") === pos)) {
      legal.push(pos);
    }
  }
  assert.equal(legal.length, 2, "two legal sites found");

  editor.setStart(0, legal[0], 20);
  editor.setStart(1, legal[1], 20);
  const verdict = editor.validate(2);
  assert.equal(verdict.playable, true, "two good starts on a grass plateau is playable");
  assert.equal(verdict.errors.length, 0);
  assert.equal(verdict.buildableRatio > 0.5, true, "the grass plateau is mostly buildable");
  assert.equal(verdict.perPlayer.every((p) => p.placeable && p.buildableNearby > 0), true);

  // A missing start for player 2 is named.
  const short = editor.validate(3);
  assert.equal(short.playable, false);
  assert.equal(short.errors.some((e) => e.kind === "missing-start" && e.player === 2), true);

  // An all-water map has no buildable land.
  const ocean = flatEditor();
  ocean.typesUp.fill(0);
  ocean.typesDown.fill(0);
  const drowned = ocean.validate(1);
  assert.equal(drowned.playable, false);
  assert.equal(drowned.errors.some((e) => e.kind === "insufficient-buildable"), true);
});

test("play this map: an authored custom map runs in a local game (SB-42-04)", async () => {
  const { startSerfboundLocalGame, encodeCustomMap, serfState } = await import("@serfbound/engine");

  // Author a small playable map, set a start, export it.
  const editor = flatEditor();
  let start = -1;
  for (let pos = 0; pos < editor.tileCount && start < 0; pos += 1) {
    if (editor.isCastlePlaceable(pos)) start = pos;
  }
  editor.setStart(0, start, 20);
  assert.equal(editor.validate(1).playable, true, "the authored map is playable");

  const record = encodeCustomMap(editor.toLandscape(), {
    title: "PLAYTEST",
    authorKeyId: "k",
    authorName: "T",
    createdAtIso: "2026-06-13T00:00:00.000Z",
  }, { playerCount: 1, starts: editor.starts });

  // Play it through the customMap seam (catalog metadata only, no real
  // SPAU.PA — CI-safe).
  const started = startSerfboundLocalGame({ data: catalogData, customMap: record });
  assert.equal(started.status, "started", "the custom map starts a local game");
  const world = started.game.world();
  assert.equal(world.size, editor.size, "the world is the authored map's size");

  // The authored landscape reached the world: found a castle at the
  // authored start and prove it stands.
  assert.equal(world.canBuildCastle(start, 0), true, "the authored start is castle-placeable in-game");
  const castle = world.buildCastle(start, 0);
  assert.notEqual(castle, null, "a castle founds on the authored map");
  assert.equal(world.players[0].hasCastle, true, "the player holds a castle on their custom map");
});

test("copyRegion lifts a rectangle and pasteRegion reproduces it (SB-42-07)", () => {
  const editor = flatEditor(4);
  // Stamp a distinctive source tile (raised land + a tree) inside a 2x2
  // block, leaving the other three at the flat grass base.
  const mark = editor.geometry.position(10, 10);
  editor.setHeight(mark, 20, 0);
  assert.equal(editor.placeObject(mark, 8), true, "a tree sits on the raised land"); // tree0

  const clip = editor.copyRegion(mark, editor.geometry.position(11, 11));
  assert.equal(clip.columns, 2);
  assert.equal(clip.rows, 2);
  assert.equal(clip.heights[0], 20, "clip carries the source height");
  assert.equal(clip.objects[0], 8, "clip carries the source object");

  // Paste the block at a fresh corner; the destination reproduces the clip.
  const target = editor.geometry.position(15, 15);
  editor.pasteRegion(clip, target);
  assert.equal(editor.heights[target], 20, "pasted height matches");
  assert.equal(editor.objects[target], 8, "pasted object matches");
  assert.equal(
    editor.objects[editor.geometry.position(16, 16)],
    0,
    "the rest of the 2x2 block transferred as the open base",
  );

  // Paste is one undoable stroke.
  assert.equal(editor.canUndo(), true);
  editor.undo();
  assert.notEqual(editor.heights[target], 20, "undo reverted the paste in one step");
});
