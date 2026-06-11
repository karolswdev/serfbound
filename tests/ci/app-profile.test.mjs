import assert from "node:assert/strict";
import { test } from "node:test";

import {
  MemoryProfileStore,
  SerfboundAsyncLoopbackMatch,
  SerfboundLoopbackMultiplayer,
  createProfile,
  matchHistoryCap,
  sanitizeProfileName,
  withMatchHistoryEntry,
  withProfileName,
} from "@serfbound/app";

// SB-25-01: local-first profiles — sanitized names in the game font,
// a capped local match history, and the name traveling through both
// session handshakes.

const settings = {
  seedString: "1234567812345678",
  mapSize: 3,
  playerCount: 2,
  initialSupplies: 20,
  playerSupplies: null,
};

function channelPair() {
  const a = { onmessage: null, postMessage: (text) => b.onmessage?.({ data: text }), close() {} };
  const b = { onmessage: null, postMessage: (text) => a.onmessage?.({ data: text }), close() {} };
  return [a, b];
}

test("profile names sanitize to the game font and fall back to PLAYER", () => {
  assert.equal(sanitizeProfileName("karol"), "KAROL");
  assert.equal(sanitizeProfileName("  küh ne?! "), "KÜHNE?");
  assert.equal(sanitizeProfileName("=== ~~~ ___"), "PLAYER");
  assert.equal(sanitizeProfileName("ABCDEFGHIJKLMNOP"), "ABCDEFGHIJKL", "capped at 12");
  assert.equal(sanitizeProfileName(""), "PLAYER");
});

test("the profile stores, renames, and caps its match history", async () => {
  const store = new MemoryProfileStore();
  let profile = createProfile("karol");
  await store.save(profile);
  assert.deepEqual(await store.load(), profile);

  profile = withProfileName(profile, "serf lord");
  assert.equal(profile.name, "SERFLORD");

  for (let index = 0; index < matchHistoryCap + 10; index += 1) {
    profile = withMatchHistoryEntry(profile, {
      mode: "async-loopback",
      opponentName: `OPP${index}`,
      localPlayer: 0,
      result: "completed",
      endedAtIso: "2026-06-10T00:00:00.000Z",
    });
  }

  assert.equal(profile.history.length, matchHistoryCap, "history caps");
  assert.equal(profile.history[0].opponentName, `OPP${matchHistoryCap + 9}`, "newest first");

  await store.save(profile);
  await store.clear();
  assert.equal(await store.load(), null);
});

test("both peers see each other's profile name in a realtime session", () => {
  const [hostChannel, joinChannel] = channelPair();
  const host = new SerfboundLoopbackMultiplayer({
    role: "host",
    appVersion: "0.1.0",
    settings,
    channel: hostChannel,
    profileName: "KAROL",
  });
  const join = new SerfboundLoopbackMultiplayer({
    role: "join",
    appVersion: "0.1.0",
    settings,
    channel: joinChannel,
    profileName: "GUEST",
  });

  assert.equal(host.status.phase, "running");
  assert.equal(host.status.opponentName, "GUEST");
  assert.equal(join.status.opponentName, "KAROL");
});

test("an ended async match surfaces for the local history record", () => {
  const dataSource = {
    kind: "imported-dos-pa-catalog",
    archiveName: "SPAU.PA",
    byteLength: 1_282_805,
    entryCount: 4000,
    definedArchiveEntries: 3805,
    fixupCount: 252,
  };
  const [hostChannel, joinChannel] = channelPair();
  const endings = [];
  const host = new SerfboundAsyncLoopbackMatch({
    role: "host",
    appVersion: "0.1.0",
    data: dataSource,
    windowTicks: 512,
    settings,
    channel: hostChannel,
    profileName: "KAROL",
    onEnded: (reason) => endings.push({ side: "host", reason }),
  });
  const join = new SerfboundAsyncLoopbackMatch({
    role: "join",
    appVersion: "0.1.0",
    data: dataSource,
    windowTicks: 512,
    settings,
    channel: joinChannel,
    profileName: "GUEST",
    onEnded: (reason) => endings.push({ side: "join", reason }),
  });

  assert.equal(join.status.opponentName, "KAROL");
  assert.equal(host.status.opponentName, "GUEST");

  join.leave("player-quit");
  assert.deepEqual(endings, [{ side: "host", reason: "player-quit" }]);
  assert.equal(host.status.mode, "failed");
});
