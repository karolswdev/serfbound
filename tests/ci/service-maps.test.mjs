import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createPasswordIdentityV2Account,
  deleteMapWithIdentityV2,
  generateIdentityKeys,
  publishMapWithIdentityV2,
  rateMapWithIdentityV2,
  reportMapPlayedWithIdentityV2,
  reportMapWithIdentityV2,
  signIdentityPayload,
} from "@serfbound/app";
import { MapEditor, encodeCustomMap, generateClassicMap } from "@serfbound/engine";

// SB-43-01: the maps service contract — publish/list/fetch/rate/report/
// delete against the real zero-dep server, signature-verified, and the
// "no original-data field" guarantee.

let identityServer;
let server;
let identityUrl;
let serviceUrl;
let storeDir;
const v2SessionSecret = "service-maps-test-v2-session";

before(async () => {
  if (process.env.SERFBOUND_MAPS_URL) {
    serviceUrl = process.env.SERFBOUND_MAPS_URL;
    return;
  }

  storeDir = mkdtempSync(join(tmpdir(), "serfbound-maps-"));
  process.env.SERFBOUND_IDENTITY_AUTOSTART = "0";
  process.env.SERFBOUND_IDENTITY_STORE = join(storeDir, "identity.json");
  process.env.SERFBOUND_IDENTITY_V2_SESSION_SECRET = v2SessionSecret;
  process.env.SERFBOUND_MAPS_AUTOSTART = "0";
  process.env.SERFBOUND_MAPS_STORE = join(storeDir, "maps.json");
  ({ server: identityServer } = await import("../../services/identity/server.mjs"));
  ({ server } = await import("../../services/maps/server.mjs"));
  await new Promise((resolve) => identityServer.listen(0, resolve));
  await new Promise((resolve) => server.listen(0, resolve));
  identityUrl = `http://127.0.0.1:${identityServer.address().port}`;
  serviceUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  identityServer?.close();
  server?.close();
  if (storeDir) {
    rmSync(storeDir, { recursive: true, force: true });
  }
});

async function createV2Session(email, displayName) {
  const account = await createPasswordIdentityV2Account(identityUrl, {
    email,
    password: "long-enough-password",
    displayName,
  });
  assert.equal(account.session?.kind, "identity-v2-session");
  return account.session;
}

async function fingerprint(keys) {
  // Mirror the service's keyFingerprint over the public JWK.
  const canonical = JSON.stringify({
    crv: keys.publicKeyJwk.crv,
    kty: keys.publicKeyJwk.kty,
    x: keys.publicKeyJwk.x,
    y: keys.publicKeyJwk.y,
  });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return Buffer.from(digest).toString("hex");
}

async function authoredMap(keys, title = "TEST MAP", authorName = "TESTER") {
  const base = generateClassicMap(3, [1, 2, 3]);
  const editor = new MapEditor(base);
  editor.heights.fill(4);
  editor.typesUp.fill(5);
  editor.typesDown.fill(5);
  editor.objects.fill(0);
  const authorKeyId = await fingerprint(keys);
  return encodeCustomMap(
    editor.toLandscape(),
    {
      title,
      authorKeyId,
      authorName,
      createdAtIso: "2026-06-13T00:00:00.000Z",
    },
    { playerCount: 1, starts: [] },
  );
}

function authoredV2Map(accountId, title = "V2 MAP", authorName = "V2MAKER") {
  const base = generateClassicMap(3, [1, 2, 3]);
  const editor = new MapEditor(base);
  editor.heights.fill(4);
  editor.typesUp.fill(5);
  editor.typesDown.fill(5);
  editor.objects.fill(0);
  return encodeCustomMap(
    editor.toLandscape(),
    {
      title,
      authorKeyId: accountId,
      authorName,
      createdAtIso: "2026-06-23T00:00:00.000Z",
    },
    { playerCount: 1, starts: [] },
  );
}

async function publish(keys, map) {
  const signedAtIso = "2026-06-13T00:00:00.000Z";
  const signature = await signIdentityPayload(keys, `publish|${map.contentHash}|${signedAtIso}`);
  const response = await fetch(`${serviceUrl}/maps`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ map, publicKeyJwk: keys.publicKeyJwk, signedAtIso, signature }),
  });
  return { status: response.status, body: await response.json() };
}

test("a signed map publishes, lists, and fetches back whole (SB-43-01)", async () => {
  const keys = await generateIdentityKeys();
  const map = await authoredMap(keys, "GREEN VALLEY");
  const { status, body } = await publish(keys, map);
  assert.equal(status, 200, "publish accepted");
  assert.match(body.mapId, /^[0-9a-f-]{36}$/);

  const gallery = await (await fetch(`${serviceUrl}/maps`)).json();
  const listed = gallery.maps.find((m) => m.mapId === body.mapId);
  assert.notEqual(listed, undefined, "the map is in the gallery");
  assert.equal(listed.title, "GREEN VALLEY");
  assert.equal(listed.size, 3);
  assert.equal(listed.playerCount, 1);

  const fetched = await (await fetch(`${serviceUrl}/maps/${body.mapId}`)).json();
  assert.equal(fetched.map.contentHash, map.contentHash, "the fetched map is whole");
  assert.equal(fetched.view.downloads, 1, "the download counter bumped");
});

test(
  "v2 identity sessions publish, rate, report, count plays, and delete maps",
  { skip: process.env.SERFBOUND_MAPS_URL ? "URL-override mode does not start identity v2." : false },
  async () => {
    const author = await createV2Session("map-author-v2@example.com", "mapmaker");
    const map = authoredV2Map(author.accountId, "V2 HARBOR", "ignored");
    const mapId = await publishMapWithIdentityV2(serviceUrl, author, map);
    assert.match(mapId, /^[0-9a-f-]{36}$/);

    const gallery = await (await fetch(`${serviceUrl}/maps`)).json();
    const listed = gallery.maps.find((m) => m.mapId === mapId);
    assert.equal(listed.authorKeyId, author.accountId);
    assert.equal(listed.authorName, "MAPMAKER", "the service uses the v2 display name");

    const rater = await createV2Session("map-rater-v2@example.com", "rater");
    const rated = await rateMapWithIdentityV2(serviceUrl, rater, mapId, 4);
    assert.equal(rated.rating, 4);
    assert.equal(rated.ratingCount, 1);

    const played = await reportMapPlayedWithIdentityV2(serviceUrl, rater, mapId);
    assert.equal(played.timesPlayed, 1);

    const reported = await reportMapWithIdentityV2(serviceUrl, rater, mapId);
    assert.equal(reported.reports, 1);
    assert.equal(reported.quarantined, false);

    const bad = await fetch(`${serviceUrl}/maps/${mapId}/rate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer sbv2.bad.bad",
      },
      body: JSON.stringify({ stars: 5 }),
    });
    assert.equal(bad.status, 401);
    assert.equal((await bad.json()).error, "bad-v2-session");

    await deleteMapWithIdentityV2(serviceUrl, author, mapId);
    const afterDelete = await (await fetch(`${serviceUrl}/maps`)).json();
    assert.equal(afterDelete.maps.some((entry) => entry.mapId === mapId), false);
  },
);

test("a bad signature and an over-cap payload are refused (SB-43-01)", async () => {
  const keys = await generateIdentityKeys();
  const map = await authoredMap(keys);

  // Bad signature.
  const bad = await fetch(`${serviceUrl}/maps`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      map,
      publicKeyJwk: keys.publicKeyJwk,
      signedAtIso: "2026-06-13T00:00:00.000Z",
      signature: "AAAA",
    }),
  });
  assert.equal(bad.status, 401, "bad signature rejected");

  // Over-cap landscape (a giant string) fails structural validation.
  const huge = { ...map, landscape: "A".repeat(600 * 1024) };
  const hugeRes = await publish(keys, huge);
  assert.equal(hugeRes.status, 400, "an over-cap landscape is refused");
});

test("the wire has no field for original data (SB-43-01)", async () => {
  const keys = await generateIdentityKeys();
  const map = await authoredMap(keys);

  // A non-string landscape (where sprite bytes might be smuggled) is
  // rejected — the format carries only the base64 enum string.
  const blob = { ...map, landscape: { sprites: [1, 2, 3] } };
  assert.equal((await publish(keys, blob)).status, 400, "a non-string landscape is refused");

  // A wrong kind / schema is refused outright.
  const wrong = { ...map, kind: "serfbound.sprite-pack" };
  assert.equal((await publish(keys, wrong)).status, 400, "a foreign kind is refused");
});

test("metadata moderation filters title/author and per-key quota stops spam (SB-43-05)", async () => {
  const keys = await generateIdentityKeys();
  const messy = await authoredMap(keys, "  grüß__ bad title !!!  ", "  maker_?! ");
  const first = await publish(keys, messy);
  assert.equal(first.status, 200, "messy metadata publishes after filtering");

  const gallery = await (await fetch(`${serviceUrl}/maps`)).json();
  const listed = gallery.maps.find((m) => m.mapId === first.body.mapId);
  assert.notEqual(listed, undefined, "the filtered map lists");
  assert.equal(listed.title, "GRÜSS BAD TITLE");
  assert.equal(listed.authorName, "MAKER?");

  const fetched = await (await fetch(`${serviceUrl}/maps/${first.body.mapId}`)).json();
  assert.equal(fetched.map.meta.title, "GRÜSS BAD TITLE", "stored title is filtered");
  assert.equal(fetched.map.meta.authorName, "MAKER?", "stored author is filtered");

  for (let count = 1; count < 50; count += 1) {
    const accepted = await publish(keys, await authoredMap(keys, `SPAM ${count}`));
    assert.equal(accepted.status, 200, `publish ${count + 1}/50 accepted`);
  }

  const overQuota = await publish(keys, await authoredMap(keys, "TOO MANY"));
  assert.equal(overQuota.status, 429, "the 51st map for one key is refused");
  assert.equal(overQuota.body.error, "quota-exceeded");
});

test("rate once per key, report quarantines, author deletes (SB-43-01)", async () => {
  const author = await generateIdentityKeys();
  const map = await authoredMap(author, "DOOMED");
  const { body } = await publish(author, map);
  const mapId = body.mapId;

  const sign = async (keys, payload) => signIdentityPayload(keys, payload);
  const rater = await generateIdentityKeys();
  const rate = async (stars) => {
    const signedAtIso = "2026-06-13T00:00:00.000Z";
    const signature = await sign(rater, `rate|${mapId}|${stars}|${signedAtIso}`);
    return fetch(`${serviceUrl}/maps/${mapId}/rate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ publicKeyJwk: rater.publicKeyJwk, stars, signedAtIso, signature }),
    });
  };
  await rate(5);
  const second = await (await rate(1)).json();
  assert.equal(second.ratingCount, 1, "one rating per key (the second replaced the first)");
  assert.equal(second.rating, 1, "the rating updated");

  // Three reports from three keys quarantine the map.
  for (let i = 0; i < 3; i += 1) {
    const reporter = await generateIdentityKeys();
    const signedAtIso = "2026-06-13T00:00:00.000Z";
    const signature = await sign(reporter, `report|${mapId}|${signedAtIso}`);
    await fetch(`${serviceUrl}/maps/${mapId}/report`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ publicKeyJwk: reporter.publicKeyJwk, signedAtIso, signature }),
    });
  }
  const gallery = await (await fetch(`${serviceUrl}/maps`)).json();
  assert.equal(gallery.maps.some((m) => m.mapId === mapId), false, "a quarantined map is hidden");

  // A non-author cannot delete; the author can.
  const stranger = await generateIdentityKeys();
  const strangerDel = await fetch(`${serviceUrl}/maps/${mapId}`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      publicKeyJwk: stranger.publicKeyJwk,
      signedAtIso: "2026-06-13T00:00:00.000Z",
      signature: await sign(stranger, `delete|${mapId}|2026-06-13T00:00:00.000Z`),
    }),
  });
  assert.equal(strangerDel.status, 403, "a stranger cannot delete");

  const authorDel = await fetch(`${serviceUrl}/maps/${mapId}`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      publicKeyJwk: author.publicKeyJwk,
      signedAtIso: "2026-06-13T00:00:00.000Z",
      signature: await sign(author, `delete|${mapId}|2026-06-13T00:00:00.000Z`),
    }),
  });
  assert.equal(authorDel.status, 200, "the author deletes their map");
});

test("a signed play-ping increments times-played; an unsigned one is refused (SB-43-06)", async () => {
  const author = await generateIdentityKeys();
  const map = await authoredMap(author, "POPULAR");
  const { body } = await publish(author, map);
  const mapId = body.mapId;

  const player = await generateIdentityKeys();
  const ping = async (keys, sig) => {
    const signedAtIso = "2026-06-13T00:00:00.000Z";
    const signature = sig ?? (await signIdentityPayload(keys, `played|${mapId}|${signedAtIso}`));
    return fetch(`${serviceUrl}/maps/${mapId}/played`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ publicKeyJwk: keys.publicKeyJwk, signedAtIso, signature }),
    });
  };

  const first = await (await ping(player)).json();
  assert.equal(first.timesPlayed, 1, "the play-ping counted");
  const second = await (await ping(player)).json();
  assert.equal(second.timesPlayed, 2, "a second play counts (raw count)");

  // The gallery and fetch views carry it.
  const gallery = await (await fetch(`${serviceUrl}/maps`)).json();
  const listed = gallery.maps.find((m) => m.mapId === mapId);
  assert.equal(listed.timesPlayed, 2, "the gallery shows times played");
  const fetched = await (await fetch(`${serviceUrl}/maps/${mapId}`)).json();
  assert.equal(fetched.view.timesPlayed, 2, "the fetch view shows times played");

  // An unsigned ping is refused (accountless play can't be counted).
  const bad = await ping(player, "AAAA");
  assert.equal(bad.status, 401, "a bad-signed play-ping is refused");
});
