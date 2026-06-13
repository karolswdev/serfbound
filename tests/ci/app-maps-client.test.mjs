import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  deleteMap,
  fetchMap,
  generateIdentityKeys,
  listMaps,
  markThumbnailStarts,
  publishMap,
  rateMap,
  renderMapThumbnail,
  reportMapPlayed,
} from "@serfbound/app";
import { MapEditor, encodeCustomMap, generateClassicMap, mapTerrain } from "@serfbound/engine";

let server;
let serviceUrl;
let storeDir;

before(async () => {
  storeDir = mkdtempSync(join(tmpdir(), "serfbound-maps-client-"));
  process.env.SERFBOUND_MAPS_AUTOSTART = "0";
  process.env.SERFBOUND_MAPS_STORE = join(storeDir, "maps.json");
  ({ server } = await import("../../services/maps/server.mjs"));
  await new Promise((resolve) => server.listen(0, resolve));
  serviceUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server?.close();
  if (storeDir) {
    rmSync(storeDir, { recursive: true, force: true });
  }
});

async function fingerprint(keys) {
  const canonical = JSON.stringify({
    crv: keys.publicKeyJwk.crv,
    kty: keys.publicKeyJwk.kty,
    x: keys.publicKeyJwk.x,
    y: keys.publicKeyJwk.y,
  });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return Buffer.from(digest).toString("hex");
}

function blankEditor() {
  const editor = new MapEditor(generateClassicMap(3, [1, 2, 3]));
  editor.heights.fill(4);
  editor.typesUp.fill(5);
  editor.typesDown.fill(5);
  editor.objects.fill(0);
  return editor;
}

async function authoredMap(keys, title) {
  const editor = blankEditor();
  return encodeCustomMap(
    editor.toLandscape(),
    { title, authorKeyId: await fingerprint(keys), authorName: "MAKER", createdAtIso: "2026-06-13T00:00:00.000Z" },
    { playerCount: 1, starts: [] },
  );
}

test("the maps client publishes, browses, fetches, rates, and counts a play (SB-43-03)", async () => {
  const author = await generateIdentityKeys();
  const map = await authoredMap(author, "BROVVER BAY");
  const mapId = await publishMap(serviceUrl, author, map);
  assert.match(mapId, /^[0-9a-f-]{36}$/);

  const gallery = await listMaps(serviceUrl);
  const card = gallery.find((m) => m.mapId === mapId);
  assert.notEqual(card, undefined, "the map shows in the gallery");
  assert.equal(card.title, "BROVVER BAY");
  assert.equal(card.size, 3);
  assert.equal(card.downloads, 0);
  assert.equal(card.timesPlayed, 0);

  const fetched = await fetchMap(serviceUrl, mapId);
  assert.equal(fetched.map.contentHash, map.contentHash, "the fetched map is whole");

  const player = await generateIdentityKeys();
  const rated = await rateMap(serviceUrl, player, mapId, 5);
  assert.equal(rated.rating, 5);
  const played = await reportMapPlayed(serviceUrl, player, mapId);
  assert.equal(played.timesPlayed, 1, "the play counted");

  // Filter by player count.
  const onePlayer = await listMaps(serviceUrl, { players: 1 });
  assert.equal(onePlayer.some((m) => m.mapId === mapId), true);
  const fourPlayer = await listMaps(serviceUrl, { players: 4 });
  assert.equal(fourPlayer.some((m) => m.mapId === mapId), false, "the filter excludes it");

  await deleteMap(serviceUrl, author, mapId);
  assert.equal((await listMaps(serviceUrl)).some((m) => m.mapId === mapId), false, "deleted");
});

test("the thumbnail is sprite-free false-color terrain (SB-43-03)", () => {
  const editor = blankEditor();
  // A water bay in the corner, the rest grass.
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      const pos = editor.geometry.position(c, r);
      editor.typesUp[pos] = mapTerrain.water0;
      editor.typesDown[pos] = mapTerrain.water0;
    }
  }

  const thumb = renderMapThumbnail(editor.toLandscape(), 64);
  assert.equal(thumb.width > 0 && thumb.height > 0, true);
  assert.equal(thumb.rgba.length, thumb.width * thumb.height * 4);

  // The top-left pixel samples the water bay → the water color (00 00 af).
  assert.deepEqual(
    [thumb.rgba[0], thumb.rgba[1], thumb.rgba[2], thumb.rgba[3]],
    [0x00, 0x00, 0xaf, 0xff],
    "the water corner renders blue",
  );

  // A grass tile far from the bay → a green-dominant color, not blue.
  const grassOx = thumb.width - 1;
  const grassIndex = grassOx * 4;
  assert.equal(thumb.rgba[grassIndex + 1] > thumb.rgba[grassIndex + 2], true, "grass is greener than blue");

  // No sprite bytes anywhere — every pixel is a terrain color (opaque).
  for (let i = 3; i < thumb.rgba.length; i += 4) {
    assert.equal(thumb.rgba[i], 0xff, "every pixel is opaque false-color");
  }

  // The start marker overlays magenta at the start tile.
  const start = editor.geometry.position(20, 20);
  const marked = markThumbnailStarts(thumb, editor.toLandscape(), [{ position: start }]);
  const magenta = [];
  for (let i = 0; i < marked.rgba.length; i += 4) {
    if (marked.rgba[i] === 0xff && marked.rgba[i + 1] === 0x00 && marked.rgba[i + 2] === 0xff) {
      magenta.push(i);
    }
  }
  assert.equal(magenta.length >= 1, true, "the start is marked");
});
