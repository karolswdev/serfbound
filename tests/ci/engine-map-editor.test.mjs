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

function flatEditor(size = 3, height = 100) {
  const base = generateClassicMap(size, [1, 2, 3]);
  const editor = new MapEditor(base);
  // Flatten so the slope-clamp test starts from a clean plateau.
  editor.heights.fill(height);
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
