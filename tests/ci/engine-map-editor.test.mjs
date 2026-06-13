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
