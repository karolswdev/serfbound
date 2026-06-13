// The Serfbound maps service (SB-43-01): publish, browse, rate, report,
// and download community-authored custom maps. The third member of the
// zero-dependency service family (identity, mailbox) — it verifies the
// author's device-key signature, structurally validates and size-caps
// the record, stores it, and forwards it; it never referees and never
// touches original game data. A custom map is enum bytes + text
// metadata; the wire format has no field for sprite data. JSON-file
// storage, self-hostable anywhere.

import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomUUID, webcrypto } from "node:crypto";

const port = Number(process.env.SERFBOUND_MAPS_PORT ?? "4330");
const storePath = process.env.SERFBOUND_MAPS_STORE ?? ".tmp/maps.json";
// A map payload caps at 512 KB encoded (covers up to ~size 10); larger
// is a recorded later decision. The body cap leaves slack for metadata.
const bodyByteCap = 768 * 1024;
const landscapeByteCap = 512 * 1024;
const mapsPerKey = 50;
const reportQuarantineThreshold = 3;

function loadStore() {
  const empty = { maps: {} };
  if (!existsSync(storePath)) {
    return empty;
  }

  try {
    const store = JSON.parse(readFileSync(storePath, "utf8"));
    store.maps ??= {};
    return store;
  } catch {
    return empty;
  }
}

function saveStore(store) {
  writeFileSync(storePath, JSON.stringify(store, null, 2));
}

async function verifySignature(publicKeyJwk, payloadText, signatureBase64) {
  try {
    const key = await webcrypto.subtle.importKey(
      "jwk",
      publicKeyJwk,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    return await webcrypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      Buffer.from(signatureBase64, "base64"),
      new TextEncoder().encode(payloadText),
    );
  } catch {
    return false;
  }
}

async function keyFingerprint(publicKeyJwk) {
  const canonical = JSON.stringify({
    crv: publicKeyJwk.crv,
    kty: publicKeyJwk.kty,
    x: publicKeyJwk.x,
    y: publicKeyJwk.y,
  });
  const digest = await webcrypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return Buffer.from(digest).toString("hex");
}

// The wire carries a custom map: enum bytes (as base64) + text metadata
// + the player starts. Structurally pinned here — there is no field for
// sprite/audio/original data, and a record with the wrong shape or an
// out-of-cap landscape is refused.
function validMapRecord(map) {
  if (typeof map !== "object" || map === null) {
    return false;
  }

  if (map.schemaVersion !== 1 || map.kind !== "serfbound.custom-map") {
    return false;
  }

  if (!Number.isInteger(map.size) || map.size < 1 || map.size > 23) {
    return false;
  }

  if (typeof map.landscape !== "string" || map.landscape.length > landscapeByteCap) {
    return false;
  }

  if (!Number.isInteger(map.contentHash)) {
    return false;
  }

  if (!Number.isInteger(map.playerCount) || map.playerCount < 1 || map.playerCount > 4) {
    return false;
  }

  if (
    !Array.isArray(map.starts) ||
    !map.starts.every(
      (start) =>
        typeof start === "object" &&
        start !== null &&
        Number.isInteger(start.player) &&
        Number.isInteger(start.position) &&
        Number.isInteger(start.supplies),
    )
  ) {
    return false;
  }

  const meta = map.meta;
  if (typeof meta !== "object" || meta === null) {
    return false;
  }

  if (
    typeof meta.title !== "string" ||
    typeof meta.authorKeyId !== "string" ||
    typeof meta.authorName !== "string" ||
    typeof meta.createdAtIso !== "string"
  ) {
    return false;
  }

  if (meta.thumbnail !== undefined && typeof meta.thumbnail !== "string") {
    return false;
  }

  return true;
}

function sanitizeTitle(title) {
  return String(title ?? "UNTITLED")
    .replace(/[^\w !?'.\-]/g, "")
    .slice(0, 40)
    .toUpperCase();
}

function averageRating(entry) {
  const stars = Object.values(entry.ratings ?? {});
  if (stars.length === 0) {
    return 0;
  }

  return stars.reduce((sum, value) => sum + value, 0) / stars.length;
}

function galleryView(entry) {
  return {
    mapId: entry.mapId,
    title: entry.map.meta.title,
    authorName: entry.map.meta.authorName,
    authorKeyId: entry.map.meta.authorKeyId,
    size: entry.map.size,
    playerCount: entry.map.playerCount,
    contentHash: entry.map.contentHash,
    thumbnail: entry.map.meta.thumbnail ?? null,
    rating: averageRating(entry),
    ratingCount: Object.keys(entry.ratings ?? {}).length,
    downloads: entry.downloads ?? 0,
    timesPlayed: entry.timesPlayed ?? 0,
    publishedAtIso: entry.publishedAtIso,
  };
}

function send(response, status, body) {
  response.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let data = "";
    request.on("data", (chunk) => {
      data += chunk;
      if (data.length > bodyByteCap) {
        reject(new Error("payload too large"));
        request.destroy();
      }
    });
    request.on("end", () => resolve(data));
    request.on("error", reject);
  });
}

export const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://localhost:${port}`);
    if (request.method === "OPTIONS") {
      send(response, 204, {});
      return;
    }

    const store = loadStore();

    // POST /maps — publish a signed map.
    if (request.method === "POST" && url.pathname === "/maps") {
      const body = JSON.parse((await readBody(request)) || "{}");
      const { map, publicKeyJwk, signedAtIso, signature } = body;
      if (!validMapRecord(map)) {
        send(response, 400, { error: "invalid-map", message: "The map record is malformed." });
        return;
      }

      const payload = `publish|${map.contentHash}|${signedAtIso}`;
      if (!(await verifySignature(publicKeyJwk, payload, signature))) {
        send(response, 401, { error: "bad-signature", message: "The signature does not verify." });
        return;
      }

      const keyId = await keyFingerprint(publicKeyJwk);
      if (map.meta.authorKeyId !== keyId) {
        send(response, 401, {
          error: "author-mismatch",
          message: "The map's author key does not match the signer.",
        });
        return;
      }

      const ownedCount = Object.values(store.maps).filter(
        (entry) => entry.map.meta.authorKeyId === keyId,
      ).length;
      if (ownedCount >= mapsPerKey) {
        send(response, 429, {
          error: "quota-exceeded",
          message: `A key may publish at most ${mapsPerKey} maps.`,
        });
        return;
      }

      const mapId = randomUUID();
      const stored = {
        ...map,
        meta: { ...map.meta, title: sanitizeTitle(map.meta.title) },
      };
      store.maps[mapId] = {
        mapId,
        map: stored,
        publishedAtIso: new Date().toISOString(),
        downloads: 0,
        timesPlayed: 0,
        ratings: {},
        reports: {},
        quarantined: false,
      };
      saveStore(store);
      send(response, 200, { mapId });
      return;
    }

    // GET /maps — the gallery (quarantined hidden), filterable.
    if (request.method === "GET" && url.pathname === "/maps") {
      const sizeFilter = url.searchParams.get("size");
      const playersFilter = url.searchParams.get("players");
      const maps = Object.values(store.maps)
        .filter((entry) => !entry.quarantined)
        .filter((entry) => sizeFilter === null || entry.map.size === Number(sizeFilter))
        .filter(
          (entry) => playersFilter === null || entry.map.playerCount === Number(playersFilter),
        )
        .map(galleryView)
        .sort((a, b) => b.rating - a.rating || b.downloads - a.downloads);
      send(response, 200, { maps });
      return;
    }

    // GET /maps/:id — the full payload, bumping the download counter.
    const fetchMatch = url.pathname.match(/^\/maps\/([0-9a-f-]{36})$/);
    if (request.method === "GET" && fetchMatch !== null) {
      const entry = store.maps[fetchMatch[1]];
      if (entry === undefined) {
        send(response, 404, { error: "not-found" });
        return;
      }

      entry.downloads = (entry.downloads ?? 0) + 1;
      saveStore(store);
      send(response, 200, { map: entry.map, view: galleryView(entry) });
      return;
    }

    // POST /maps/:id/rate — signed 1..5 stars, one per key.
    const rateMatch = url.pathname.match(/^\/maps\/([0-9a-f-]{36})\/rate$/);
    if (request.method === "POST" && rateMatch !== null) {
      const entry = store.maps[rateMatch[1]];
      if (entry === undefined) {
        send(response, 404, { error: "not-found" });
        return;
      }

      const body = JSON.parse((await readBody(request)) || "{}");
      const { publicKeyJwk, stars, signedAtIso, signature } = body;
      if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
        send(response, 400, { error: "invalid-rating", message: "Stars must be 1..5." });
        return;
      }

      const payload = `rate|${entry.mapId}|${stars}|${signedAtIso}`;
      if (!(await verifySignature(publicKeyJwk, payload, signature))) {
        send(response, 401, { error: "bad-signature", message: "The signature does not verify." });
        return;
      }

      const keyId = await keyFingerprint(publicKeyJwk);
      entry.ratings[keyId] = stars;
      saveStore(store);
      send(response, 200, { rating: averageRating(entry), ratingCount: Object.keys(entry.ratings).length });
      return;
    }

    // POST /maps/:id/played — a signed-in player opting to report a
    // match they played on this map. Signed (so accountless play stays
    // invisible — the unbreakable); a popularity signal, not a log.
    const playedMatch = url.pathname.match(/^\/maps\/([0-9a-f-]{36})\/played$/);
    if (request.method === "POST" && playedMatch !== null) {
      const entry = store.maps[playedMatch[1]];
      if (entry === undefined) {
        send(response, 404, { error: "not-found" });
        return;
      }

      const body = JSON.parse((await readBody(request)) || "{}");
      const { publicKeyJwk, signedAtIso, signature } = body;
      const payload = `played|${entry.mapId}|${signedAtIso}`;
      if (!(await verifySignature(publicKeyJwk, payload, signature))) {
        send(response, 401, { error: "bad-signature", message: "The signature does not verify." });
        return;
      }

      entry.timesPlayed = (entry.timesPlayed ?? 0) + 1;
      saveStore(store);
      send(response, 200, { timesPlayed: entry.timesPlayed });
      return;
    }

    // POST /maps/:id/report — signed; a threshold quarantines the map.
    const reportMatch = url.pathname.match(/^\/maps\/([0-9a-f-]{36})\/report$/);
    if (request.method === "POST" && reportMatch !== null) {
      const entry = store.maps[reportMatch[1]];
      if (entry === undefined) {
        send(response, 404, { error: "not-found" });
        return;
      }

      const body = JSON.parse((await readBody(request)) || "{}");
      const { publicKeyJwk, signedAtIso, signature } = body;
      const payload = `report|${entry.mapId}|${signedAtIso}`;
      if (!(await verifySignature(publicKeyJwk, payload, signature))) {
        send(response, 401, { error: "bad-signature", message: "The signature does not verify." });
        return;
      }

      const keyId = await keyFingerprint(publicKeyJwk);
      entry.reports[keyId] = new Date().toISOString();
      if (Object.keys(entry.reports).length >= reportQuarantineThreshold) {
        entry.quarantined = true;
      }

      saveStore(store);
      send(response, 200, { quarantined: entry.quarantined, reports: Object.keys(entry.reports).length });
      return;
    }

    // DELETE /maps/:id — author-key-signed takedown.
    const deleteMatch = url.pathname.match(/^\/maps\/([0-9a-f-]{36})$/);
    if (request.method === "DELETE" && deleteMatch !== null) {
      const entry = store.maps[deleteMatch[1]];
      if (entry === undefined) {
        send(response, 404, { error: "not-found" });
        return;
      }

      const body = JSON.parse((await readBody(request)) || "{}");
      const { publicKeyJwk, signedAtIso, signature } = body;
      const payload = `delete|${entry.mapId}|${signedAtIso}`;
      if (!(await verifySignature(publicKeyJwk, payload, signature))) {
        send(response, 401, { error: "bad-signature", message: "The signature does not verify." });
        return;
      }

      const keyId = await keyFingerprint(publicKeyJwk);
      if (entry.map.meta.authorKeyId !== keyId) {
        send(response, 403, { error: "not-author", message: "Only the author may delete a map." });
        return;
      }

      delete store.maps[entry.mapId];
      saveStore(store);
      send(response, 200, { deleted: true });
      return;
    }

    send(response, 404, { error: "unknown-route" });
  } catch (error) {
    send(response, 400, { error: "bad-request", message: String(error?.message ?? error) });
  }
});

if (process.env.SERFBOUND_MAPS_AUTOSTART !== "0") {
  server.listen(port, () => {
    console.log(`serfbound-maps listening on :${port} (store: ${storePath})`);
  });
}
