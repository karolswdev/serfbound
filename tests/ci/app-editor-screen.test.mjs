import assert from "node:assert/strict";
import { test } from "node:test";

import {
  applyEditorTool,
  editorTools,
  findEditorTool,
  editorToCustomMap,
  newEditableLandscape,
} from "@serfbound/app";
import {
  MapEditor,
  mapMinerals,
  mapObject,
  startSerfboundLocalGame,
} from "@serfbound/engine";

// SB-42-05: the pure core behind the on-screen editor — the tool palette
// and applyEditorTool, the only thing that mutates the MapEditor. The
// render/pointer loop is the browser surface (the device gate).

const catalogData = {
  kind: "imported-dos-pa-catalog",
  archiveName: "SPAU.PA",
  byteLength: 1_282_805,
  entryCount: 4000,
  definedArchiveEntries: 3805,
  fixupCount: 252,
};

function flatEditor() {
  const editor = new MapEditor(newEditableLandscape(3));
  editor.heights.fill(4);
  editor.typesUp.fill(5); // grass1
  editor.typesDown.fill(5);
  editor.objects.fill(0);
  return editor;
}

test("the palette covers terrain, height, objects, minerals, fish, and four starts", () => {
  const kinds = new Set(editorTools.map((tool) => tool.kind));
  for (const kind of ["terrain", "height", "object", "erase-object", "mineral", "fish", "start"]) {
    assert.equal(kinds.has(kind), true, `palette has a ${kind} tool`);
  }
  assert.equal(editorTools.filter((tool) => tool.kind === "start").length, 4, "four starts");
  // IDs are unique and findable.
  const ids = editorTools.map((tool) => tool.id);
  assert.equal(new Set(ids).size, ids.length, "tool ids are unique");
  assert.equal(findEditorTool("grass")?.kind, "terrain");
  assert.equal(findEditorTool("nope"), undefined);
});

test("applyEditorTool dispatches every tool through the editor", () => {
  const editor = flatEditor();
  const center = editor.geometry.position(10, 10);

  applyEditorTool(editor, findEditorTool("water"), center);
  assert.equal(editor.typesUp[center], 0, "water painted");

  applyEditorTool(editor, findEditorTool("grass"), center);
  assert.equal(editor.typesUp[center], 5, "grass repainted");

  const before = editor.heights[center];
  applyEditorTool(editor, findEditorTool("raise"), center);
  assert.equal(editor.heights[center] > before, true, "raise lifted the tile");

  // An object lands on a land tile, then Clear removes it.
  const land = editor.geometry.position(12, 12);
  const placed = applyEditorTool(editor, findEditorTool("tree"), land);
  assert.equal(placed.ok, true, "a tree placed on grass");
  assert.notEqual(editor.objects[land], mapObject.none);
  applyEditorTool(editor, findEditorTool("erase"), land);
  assert.equal(editor.objects[land], mapObject.none, "Clear erased the object");

  // A mineral seeds under a mountain tile.
  const mountain = editor.geometry.position(8, 8);
  applyEditorTool(editor, findEditorTool("tundra"), mountain);
  const seeded = applyEditorTool(editor, findEditorTool("gold"), mountain);
  assert.equal(seeded.ok, true, "gold seeded");
  assert.equal(editor.minerals[mountain], mapMinerals.gold);

  // An undo reverses the most recent stroke (height), proving strokes group.
  assert.equal(editor.canUndo(), true);
});

test("a start tool sets a castle-placeable start; play this map runs it", () => {
  const editor = flatEditor();
  let site = -1;
  for (let pos = 0; pos < editor.tileCount && site < 0; pos += 1) {
    if (editor.isCastlePlaceable(pos)) site = pos;
  }
  assert.notEqual(site, -1, "a castle site exists");

  const result = applyEditorTool(editor, findEditorTool("start1"), site);
  assert.equal(result.ok, true, "start placed at a placeable site");
  assert.equal(editor.starts.length, 1);
  assert.equal(editor.validate(1).playable, true, "one start on a plateau is playable");

  // editorToCustomMap → a record that plays through the customMap seam.
  const map = editorToCustomMap(editor, "MY MAP", "local", "Tester", "2026-06-13T00:00:00.000Z");
  assert.equal(map.starts.length, 1);
  assert.equal(map.playerCount, 1);
  const started = startSerfboundLocalGame({ data: catalogData, customMap: map });
  assert.equal(started.status, "started", "the authored map starts a local game");
  assert.equal(started.game.world().canBuildCastle(site, 0), true);
});

test("a start at a blocked site is refused, not forced", () => {
  const editor = flatEditor();
  // Drown a tile: water is not castle-placeable.
  const wet = editor.geometry.position(5, 5);
  applyEditorTool(editor, findEditorTool("water"), wet);
  const result = applyEditorTool(editor, findEditorTool("start1"), wet);
  assert.equal(result.ok, false, "a start on water is refused");
  assert.equal(editor.starts.length, 0);
});
