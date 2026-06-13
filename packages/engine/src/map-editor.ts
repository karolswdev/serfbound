import { MapGeometry, type Direction } from "./index.js";
import { SerfboundGameWorld } from "./game-world.js";
import { mapMinerals, mapTerrain } from "./map-generator.js";
import type { ClassicMapLandscape } from "./map-generator.js";

// The map editor's brush model (SB-42-02): a mutable landscape that
// turns brush strokes into bytes, honoring the generator's own
// invariants (the ≤32 slope clamp), with grouped undo/redo. The render
// is the production sprite scene over toLandscape(); this module is the
// CI-gateable heart — strokes write exact bytes, the height brush keeps
// the slope invariant, and undo reverses a stroke completely.

const maxSlope = 32;
const terrainMax = 15;

// The authorable object palette (SB-42-03): the natural decorations a
// map author places. Runtime objects (flags, buildings, stubs, felled
// wood, seeds, signs) are excluded — the game places those.
const waterObjectValues = new Set<number>([28, 29, 30, 31, 88, 89]);
const authorableObjectValues = (() => {
  const set = new Set<number>();
  for (let v = 8; v <= 31; v += 1) set.add(v); // trees, pines, palms, water trees
  for (let v = 72; v <= 82; v += 1) set.add(v); // stones, sandstone, cross
  set.add(88);
  set.add(89); // water stones
  for (let v = 90; v <= 92; v += 1) set.add(v); // cactus, dead tree
  return set;
})();
const neighborDirections: readonly Direction[] = [
  "Right",
  "DownRight",
  "Down",
  "Left",
  "UpLeft",
  "Up",
];

// The six landscape arrays, addressed by a stable id so undo can record
// which one a byte change touched.
const arrayIds = {
  heights: 0,
  typesUp: 1,
  typesDown: 2,
  objects: 3,
  minerals: 4,
  resourceAmounts: 5,
} as const;
type ArrayId = (typeof arrayIds)[keyof typeof arrayIds];

type ByteChange = {
  readonly array: ArrayId;
  readonly position: number;
  readonly oldValue: number;
  readonly newValue: number;
};

export class MapEditor {
  readonly geometry: MapGeometry;
  readonly size: number;
  readonly tileCount: number;
  readonly heights: Uint8Array;
  readonly typesUp: Uint8Array;
  readonly typesDown: Uint8Array;
  readonly objects: Uint8Array;
  readonly minerals: Uint8Array;
  readonly resourceAmounts: Uint8Array;

  #stroke: ByteChange[] | null = null;
  readonly #undo: ByteChange[][] = [];
  readonly #redo: ByteChange[][] = [];

  constructor(landscape: ClassicMapLandscape) {
    this.geometry = new MapGeometry(landscape.size);
    this.size = landscape.size;
    this.tileCount = landscape.tileCount;
    this.heights = Uint8Array.from(landscape.heights);
    this.typesUp = Uint8Array.from(landscape.typesUp);
    this.typesDown = Uint8Array.from(landscape.typesDown);
    this.objects = Uint8Array.from(landscape.objects);
    this.minerals = Uint8Array.from(landscape.minerals);
    this.resourceAmounts = Uint8Array.from(landscape.resourceAmounts);
  }

  #arrayOf(id: ArrayId): Uint8Array {
    switch (id) {
      case arrayIds.heights:
        return this.heights;
      case arrayIds.typesUp:
        return this.typesUp;
      case arrayIds.typesDown:
        return this.typesDown;
      case arrayIds.objects:
        return this.objects;
      case arrayIds.minerals:
        return this.minerals;
      default:
        return this.resourceAmounts;
    }
  }

  // Write one byte, recording the change in the open stroke (or as its
  // own stroke when called outside begin/end). A no-op write records
  // nothing, so undo never replays untouched bytes.
  #write(id: ArrayId, position: number, value: number): void {
    const array = this.#arrayOf(id);
    const clamped = value < 0 ? 0 : value > 255 ? 255 : value;
    const oldValue = array[position]!;
    if (oldValue === clamped) {
      return;
    }

    array[position] = clamped;
    const change: ByteChange = { array: id, position, oldValue, newValue: clamped };
    if (this.#stroke !== null) {
      this.#stroke.push(change);
    } else {
      this.#undo.push([change]);
      this.#redo.length = 0;
    }
  }

  // Group edits into one undoable stroke. A brush gesture is one
  // beginStroke … endStroke.
  beginStroke(): void {
    this.#stroke = [];
  }

  endStroke(): void {
    if (this.#stroke !== null && this.#stroke.length > 0) {
      this.#undo.push(this.#stroke);
      this.#redo.length = 0;
    }

    this.#stroke = null;
  }

  // The tiles a radius-r brush touches: the position plus its spiral
  // neighborhood out to radius.
  #brushTiles(position: number, radius: number): number[] {
    const tiles = [position];
    if (radius <= 0) {
      return tiles;
    }

    const seen = new Set<number>([position]);
    let frontier = [position];
    for (let ring = 0; ring < radius; ring += 1) {
      const next: number[] = [];
      for (const tile of frontier) {
        for (const direction of neighborDirections) {
          const neighbor = this.geometry.move(tile, direction);
          if (!seen.has(neighbor)) {
            seen.add(neighbor);
            next.push(neighbor);
            tiles.push(neighbor);
          }
        }
      }

      frontier = next;
    }

    return tiles;
  }

  // Paint terrain: set both triangles' type under the brush. Terrain is
  // 0..15 (mapTerrain); out-of-range is ignored (the editor never
  // writes an illegal enum).
  paintTerrain(position: number, terrain: number, radius = 0): void {
    if (terrain < 0 || terrain > terrainMax) {
      return;
    }

    for (const tile of this.#brushTiles(position, radius)) {
      this.#write(arrayIds.typesUp, tile, terrain);
      this.#write(arrayIds.typesDown, tile, terrain);
    }
  }

  // Raise/lower the height under the brush by delta, then re-clamp the
  // ≤32 slope invariant locally (adjustMapHeight, to a fixpoint).
  raiseHeight(position: number, delta: number, radius = 0): void {
    const seeds = this.#brushTiles(position, radius);
    for (const tile of seeds) {
      this.#write(arrayIds.heights, tile, this.heights[tile]! + delta);
    }

    this.#clampSlope(seeds);
  }

  setHeight(position: number, value: number, radius = 0): void {
    const seeds = this.#brushTiles(position, radius);
    for (const tile of seeds) {
      this.#write(arrayIds.heights, tile, value);
    }

    this.#clampSlope(seeds);
  }

  // adjustMapHeight as a local worklist: any neighbor more than 32 from
  // an edited tile is pulled to exactly 32 away; a pulled neighbor
  // re-enters the worklist until the ≤32 invariant holds everywhere it
  // could have been disturbed. Equivalent to the generator's global
  // fixpoint, seeded at the stroke.
  #clampSlope(seeds: readonly number[]): void {
    const worklist = [...seeds];
    while (worklist.length > 0) {
      const tile = worklist.pop()!;
      const height = this.heights[tile]!;
      for (const direction of neighborDirections) {
        const neighbor = this.geometry.move(tile, direction);
        const neighborHeight = this.heights[neighbor]!;
        if (Math.abs(height - neighborHeight) > maxSlope) {
          const pulled = height < neighborHeight ? height + maxSlope : height - maxSlope;
          this.#write(arrayIds.heights, neighbor, pulled);
          worklist.push(neighbor);
        }
      }
    }
  }

  canUndo(): boolean {
    return this.#undo.length > 0;
  }

  canRedo(): boolean {
    return this.#redo.length > 0;
  }

  undo(): boolean {
    const stroke = this.#undo.pop();
    if (stroke === undefined) {
      return false;
    }

    for (let i = stroke.length - 1; i >= 0; i -= 1) {
      const change = stroke[i]!;
      this.#arrayOf(change.array)[change.position] = change.oldValue;
    }

    this.#redo.push(stroke);
    return true;
  }

  redo(): boolean {
    const stroke = this.#redo.pop();
    if (stroke === undefined) {
      return false;
    }

    for (const change of stroke) {
      this.#arrayOf(change.array)[change.position] = change.newValue;
    }

    this.#undo.push(stroke);
    return true;
  }

  // Whether both triangles of a tile are water (terrain 0..3) / land.
  #isWaterTile(position: number): boolean {
    return (
      this.typesUp[position]! <= mapTerrain.water3 &&
      this.typesDown[position]! <= mapTerrain.water3
    );
  }

  #isLandTile(position: number): boolean {
    return (
      this.typesUp[position]! >= mapTerrain.grass0 &&
      this.typesDown[position]! >= mapTerrain.grass0
    );
  }

  // Whether an object value may be placed on a tile: only the
  // authorable palette, water objects in water, land objects on land.
  canPlaceObject(position: number, object: number): boolean {
    if (object === 0) {
      return true; // erase is always legal
    }

    if (!authorableObjectValues.has(object)) {
      return false;
    }

    return waterObjectValues.has(object)
      ? this.#isWaterTile(position)
      : this.#isLandTile(position);
  }

  // Place an object (or erase with 0); refuses an illegal placement.
  placeObject(position: number, object: number): boolean {
    if (!this.canPlaceObject(position, object)) {
      return false;
    }

    this.#write(arrayIds.objects, position, object);
    return true;
  }

  eraseObject(position: number): void {
    this.#write(arrayIds.objects, position, 0);
  }

  // Seed a hidden mineral deposit (gold/iron/coal/stone) of an amount.
  // Minerals are hidden until a geologist samples them, so the editor
  // allows them on any tile (authoring freedom).
  seedMineral(position: number, mineral: number, amount: number): boolean {
    if (mineral < mapMinerals.gold || mineral > mapMinerals.stone) {
      return false;
    }

    this.#write(arrayIds.minerals, position, mineral);
    this.#write(arrayIds.resourceAmounts, position, amount);
    return true;
  }

  // Seed fish stock in shallow water (mineral none + a resource amount).
  seedFish(position: number, amount: number): boolean {
    if (!this.#isWaterTile(position)) {
      return false;
    }

    this.#write(arrayIds.minerals, position, mapMinerals.none);
    this.#write(arrayIds.resourceAmounts, position, amount);
    return true;
  }

  // --- player starts (authoring metadata, not landscape bytes) ----------------

  readonly #starts = new Map<number, { position: number; supplies: number }>();

  // Whether a castle could be founded at a position, asked of a fresh
  // world built from the current landscape (no owners, so any legal
  // open buildable site passes) — the game's own canBuildCastle.
  isCastlePlaceable(position: number): boolean {
    const world = new SerfboundGameWorld(this.toLandscape(), 1);
    return world.canBuildCastle(position, 0);
  }

  // Set a player's castle start; refuses an unbuildable site.
  setStart(player: number, position: number, supplies = 20): boolean {
    if (!this.isCastlePlaceable(position)) {
      return false;
    }

    this.#starts.set(player, { position, supplies });
    return true;
  }

  clearStart(player: number): void {
    this.#starts.delete(player);
  }

  // The authored starts, sorted by player, ready for encodeCustomMap.
  get starts(): { player: number; position: number; supplies: number }[] {
    return [...this.#starts.entries()]
      .map(([player, start]) => ({ player, ...start }))
      .sort((a, b) => a.player - b.player);
  }

  // The current authored landscape — handed to encodeCustomMap (SB-42-01)
  // and the play pipeline.
  toLandscape(): ClassicMapLandscape {
    return {
      size: this.size,
      columns: this.geometry.columns,
      rows: this.geometry.rows,
      tileCount: this.tileCount,
      heights: Uint8Array.from(this.heights),
      typesUp: Uint8Array.from(this.typesUp),
      typesDown: Uint8Array.from(this.typesDown),
      objects: Uint8Array.from(this.objects),
      minerals: Uint8Array.from(this.minerals),
      resourceAmounts: Uint8Array.from(this.resourceAmounts),
    };
  }
}
