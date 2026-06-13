import type { ClassicMapLandscape } from "@serfbound/engine";
import { minimapTerrainColors } from "./popup.js";

// The sprite-free map thumbnail (SB-43-03): a false-color preview of a
// landscape, one solid color per terrain type (`minimapTerrainColors`)
// — no decoded sprites, so the gallery is browsable with no imported
// data and the maps service never touches original art. Pure: returns
// an RGBA pixel grid the gallery (or a canvas) turns into an image.

export type MapThumbnail = {
  readonly width: number;
  readonly height: number;
  // RGBA, width*height*4 bytes, row-major top-left origin.
  readonly rgba: Uint8Array;
};

// Object tiles (trees/stones) darken their pixel a touch so a forested
// map reads differently from bare grass at a glance.
const objectShade = 0.78;

export function renderMapThumbnail(
  landscape: ClassicMapLandscape,
  maxDim = 96,
): MapThumbnail {
  const { columns, rows } = landscape;
  const scale = Math.max(1, Math.ceil(Math.max(columns, rows) / maxDim));
  const width = Math.max(1, Math.ceil(columns / scale));
  const height = Math.max(1, Math.ceil(rows / scale));
  const rgba = new Uint8Array(width * height * 4);

  for (let oy = 0; oy < height; oy += 1) {
    for (let ox = 0; ox < width; ox += 1) {
      const column = Math.min(columns - 1, ox * scale);
      const row = Math.min(rows - 1, oy * scale);
      const position = row * columns + column;

      // The drier of the two triangle types reads as the tile's color
      // (water shows through any shore; mountains read as mountain).
      const terrain = Math.min(
        15,
        Math.max(landscape.typesUp[position]!, landscape.typesDown[position]!),
      );
      const [r, g, b] = minimapTerrainColors[terrain]!;
      const shade = landscape.objects[position]! >= 8 ? objectShade : 1;

      const index = (oy * width + ox) * 4;
      rgba[index] = Math.round(r * shade);
      rgba[index + 1] = Math.round(g * shade);
      rgba[index + 2] = Math.round(b * shade);
      rgba[index + 3] = 0xff;
    }
  }

  return { width, height, rgba };
}

// Paint player castle starts as bright markers over the thumbnail, so a
// gallery card hints at the layout (optional overlay; pure).
export function markThumbnailStarts(
  thumbnail: MapThumbnail,
  landscape: ClassicMapLandscape,
  starts: readonly { readonly position: number }[],
): MapThumbnail {
  const { columns, rows } = landscape;
  const scale = Math.max(1, Math.ceil(Math.max(columns, rows) / Math.max(thumbnail.width, thumbnail.height)));
  const rgba = Uint8Array.from(thumbnail.rgba);
  for (const start of starts) {
    const column = start.position % columns;
    const row = Math.floor(start.position / columns);
    if (row >= rows) {
      continue;
    }

    const ox = Math.min(thumbnail.width - 1, Math.floor(column / scale));
    const oy = Math.min(thumbnail.height - 1, Math.floor(row / scale));
    const index = (oy * thumbnail.width + ox) * 4;
    rgba[index] = 0xff;
    rgba[index + 1] = 0x00;
    rgba[index + 2] = 0xff;
    rgba[index + 3] = 0xff;
  }

  return { width: thumbnail.width, height: thumbnail.height, rgba };
}
