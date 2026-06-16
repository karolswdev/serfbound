// Purpose-built test maps for rigging (SB-44-03). Random terrain fights the
// thing under test — a fisher needs a shore, a geologist needs hills, a road
// needs flat ground that accepts flags anywhere. These maps guarantee that:
// flat, deterministic, asset placement assured. Authored through the real
// editor + custom-map pipeline (MapEditor / encodeCustomMap), validated the
// engine's own way (evaluateMapPlayability) at bake time, so a map that can't
// host its scenario fails generation, not the maintainer's device.

import {
  type ClassicMapLandscape,
  type CustomMapMeta,
  type SerfboundCustomMap,
  MapEditor,
  MapGeometry,
  encodeCustomMap,
  evaluateMapPlayability,
  mapMinerals,
  mapObject,
  mapTerrain,
} from "@serfbound/engine";
import { castleSpotsFor } from "./scenario-rig.js";

// A fixed authoring stamp keeps baked rigs byte-stable across rebuilds (no
// Date.now() churn). Rigs are tooling, not player content.
const RIG_META_BASE = {
  authorKeyId: "rig-harness",
  authorName: "Gate Rig Harness",
  createdAtIso: "2026-06-15T00:00:00.000Z",
} as const;

// A dead-flat landscape: every tile the same land terrain and height, no
// objects, no minerals. The blank canvas every flat-ground scenario starts on.
export function flatLandscape(
  size: number,
  options: { readonly terrain?: number; readonly height?: number } = {},
): ClassicMapLandscape {
  const terrain = options.terrain ?? mapTerrain.grass1;
  // Heights are small (~0..31); the engine's levelingHeight rejects a spread
  // of 9+ around a build site, so a flat map must sit at a single low value.
  const height = options.height ?? 16;
  const geometry = new MapGeometry(size);
  const tileCount = geometry.tileCount;
  return {
    size,
    columns: geometry.columns,
    rows: geometry.rows,
    tileCount,
    heights: new Uint8Array(tileCount).fill(height),
    typesUp: new Uint8Array(tileCount).fill(terrain),
    typesDown: new Uint8Array(tileCount).fill(terrain),
    objects: new Uint8Array(tileCount),
    minerals: new Uint8Array(tileCount),
    resourceAmounts: new Uint8Array(tileCount),
  };
}

// Finish a landscape into a verified custom map: derive valid starts, encode,
// and prove playability the engine's way. Throws on an unplayable map so a
// broken test map never reaches a device.
export function finishMap(
  landscape: ClassicMapLandscape,
  title: string,
  playerCount: number,
): SerfboundCustomMap {
  const spots = castleSpotsFor(landscape, playerCount);
  const starts = spots.map((position, player) => ({ player, position, supplies: 30 }));
  const verdict = evaluateMapPlayability(landscape, starts, playerCount);
  if (!verdict.playable) {
    throw new Error(`finishMap "${title}" unplayable: ${JSON.stringify(verdict.errors)}`);
  }
  const meta: CustomMapMeta = { ...RIG_META_BASE, title };
  return encodeCustomMap(landscape, meta, { playerCount, starts });
}

// Flat grass, single player. Roads, transport, professions, farms — anything
// that just needs open buildable ground.
export function flatPlainsMap(size = 5): SerfboundCustomMap {
  return finishMap(flatLandscape(size), "Rig — flat plains", 1);
}

// Flat grass with a stand of trees away from the start, so a lumberjack /
// forester has wood to work and the felling animation has something to fell.
export function flatTreesMap(size = 5): SerfboundCustomMap {
  const landscape = flatLandscape(size);
  const editor = new MapEditor(landscape);
  // A cluster of trees in the lower-right quadrant, clear of the start anchor.
  const geometry = editor.geometry;
  const baseColumn = Math.floor(geometry.columns * 0.6);
  const baseRow = Math.floor(geometry.rows * 0.6);
  for (let dr = 0; dr < 6; dr += 1) {
    for (let dc = 0; dc < 6; dc += 1) {
      const position = geometry.position(baseColumn + dc, baseRow + dr);
      editor.placeObject(position, mapObject.tree0 + ((dc + dr) % 8));
    }
  }
  return finishMap(editor.toLandscape(), "Rig — woodland", 1);
}

// A grass map with a water band down one side and fish stocked in it: fisher
// huts work the shore, and the living-map check sees fish in water.
export function shorelineMap(size = 5): SerfboundCustomMap {
  const landscape = flatLandscape(size);
  const editor = new MapEditor(landscape);
  const geometry = editor.geometry;
  const waterColumns = Math.max(2, Math.floor(geometry.columns * 0.25));
  for (let row = 0; row < geometry.rows; row += 1) {
    for (let column = 0; column < waterColumns; column += 1) {
      const position = geometry.position(column, row);
      editor.paintTerrain(position, mapTerrain.water1);
    }
  }
  // Stock fish in the shallows (one column in from the deep edge).
  for (let row = 0; row < geometry.rows; row += 2) {
    editor.seedFish(geometry.position(waterColumns - 1, row), 8);
  }
  return finishMap(editor.toLandscape(), "Rig — shoreline", 1);
}

// Flat grass with a hilly region (tundra) seeded with ore, for geologists and
// miners.
export function mountainsMap(size = 5): SerfboundCustomMap {
  const landscape = flatLandscape(size);
  const editor = new MapEditor(landscape);
  const geometry = editor.geometry;
  const baseColumn = Math.floor(geometry.columns * 0.55);
  const minerals = [mapMinerals.coal, mapMinerals.iron, mapMinerals.gold];
  for (let row = 0; row < geometry.rows; row += 1) {
    for (let column = baseColumn; column < geometry.columns; column += 1) {
      const position = geometry.position(column, row);
      editor.paintTerrain(position, mapTerrain.tundra1);
      editor.seedMineral(position, minerals[(column + row) % minerals.length]!, 16);
    }
  }
  return finishMap(editor.toLandscape(), "Rig — ore hills", 1);
}

// Flat grass for two players whose anchor-lattice starts share a frontier:
// knight combat needs a border with an enemy.
export function borderMap(size = 6): SerfboundCustomMap {
  return finishMap(flatLandscape(size), "Rig — contested border", 2);
}
