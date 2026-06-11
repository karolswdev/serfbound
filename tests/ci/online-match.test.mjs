import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  SerfboundOnlineMatch,
  acceptChallenge,
  createChallenge,
  fetchLadder,
  generateIdentityKeys,
} from "@serfbound/app";
import { startSerfboundLocalGame } from "@serfbound/engine";

// SB-29-04: a full online correspondence match through the real
// mailbox — windows posted as signed moves, every received move
// re-verified through the recap path, and the dual-attestation finish
// that ends and rates the match.

const dataSource = {
  kind: "imported-dos-pa-catalog",
  archiveName: "SPAU.PA",
  byteLength: 1_282_805,
  entryCount: 4000,
  definedArchiveEntries: 3805,
  fixupCount: 252,
};

const terms = {
  seedString: "1234567812345678",
  mapSize: 3,
  playerCount: 2,
  initialSupplies: 20,
  windowTicks: 512,
  pickupSeconds: 3600,
};

let server;
let serviceUrl;
let storeDir;

before(async () => {
  storeDir = mkdtempSync(join(tmpdir(), "serfbound-online-match-"));
  process.env.SERFBOUND_MAILBOX_AUTOSTART = "0";
  process.env.SERFBOUND_MAILBOX_STORE = join(storeDir, "matches.json");
  ({ server } = await import("../../services/mailbox/server.mjs"));
  await new Promise((resolve) => server.listen(0, resolve));
  serviceUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server?.close();
  rmSync(storeDir, { recursive: true, force: true });
});

function discoverCastleSites() {
  const probe = startSerfboundLocalGame({ data: dataSource, ...terms }).game.world();
  let first = null;
  let second = null;
  for (let position = 0; position < probe.tileCount; position += 1) {
    if (first === null) {
      if (probe.buildCastle(position, 0) !== null) {
        first = position;
      }
    } else if (probe.buildCastle(position, 1) !== null) {
      second = position;
      break;
    }
  }

  return { first, second };
}

function playWindowOut(side) {
  for (let step = 0; step < terms.windowTicks / 16 + 2; step += 1) {
    side.tick(16);
  }
}

async function settle(side) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    await side.poll();
    if (side.status.mode !== "posting") {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  throw new Error("the posted move never settled");
}

function recapThrough(side) {
  let frames = 0;
  while (side.status.mode === "recap") {
    side.tick(16);
    frames += 1;
    assert.equal(frames < 200, true, "the recap terminates");
  }
}

test("two sides play through the mailbox and end by dual attestation", async () => {
  const sites = discoverCastleSites();
  const keysA = await generateIdentityKeys();
  const keysB = await generateIdentityKeys();
  // The shell's surface always posts service-sanitized names; this
  // controller-level test passes them pre-sanitized.
  const challengeId = await createChallenge(serviceUrl, keysA, "ALICE", terms);
  const view = await acceptChallenge(serviceUrl, keysB, "BOB", challengeId);

  const endedViews = [];
  const host = new SerfboundOnlineMatch({
    view,
    seat: 0,
    keys: keysA,
    mailboxUrl: serviceUrl,
    data: dataSource,
    onEnded: (ended) => endedViews.push(ended),
  });
  const guest = new SerfboundOnlineMatch({
    view,
    seat: 1,
    keys: keysB,
    mailboxUrl: serviceUrl,
    data: dataSource,
    onEnded: (ended) => endedViews.push(ended),
  });
  assert.equal(host.status.mode, "your-window", "window 0 belongs to the challenger");
  assert.equal(guest.status.mode, "awaiting-move");
  assert.equal(host.status.opponentName, "BOB");
  assert.equal(guest.status.opponentName, "ALICE");

  // Window 0: the host founds a castle; the signed move reaches the
  // mailbox; the guest polls it down and verifies through the recap.
  host.queue({ kind: "build-castle", position: sites.first, player: 0 });
  playWindowOut(host);
  await settle(host);
  assert.equal(host.status.mode, "awaiting-move");
  await guest.poll();
  assert.equal(guest.status.mode, "move-arrived");
  guest.pickup();
  recapThrough(guest);
  assert.equal(guest.status.mode, "your-window");
  assert.equal(guest.status.failureReason, null);
  assert.equal(guest.status.checksum, host.status.checksum, "verified to the same state");

  // Window 1 back the other way.
  guest.queue({ kind: "build-castle", position: sites.second, player: 1 });
  playWindowOut(guest);
  await settle(guest);
  await host.poll();
  assert.equal(host.status.mode, "move-arrived");
  host.pickup();
  recapThrough(host);
  assert.equal(host.status.mode, "your-window");
  assert.equal(host.status.boundaryChecksum, guest.status.boundaryChecksum);

  // Dual attestation: both declare the same winner over the same
  // verified boundary checksum — the match ends and rates.
  assert.equal(await guest.attest(0), true);
  assert.equal(guest.status.serviceState, "active", "one attestation is not a result");
  assert.equal(await host.attest(0), true);
  assert.equal(host.status.mode, "ended");
  assert.equal(host.status.winnerSeat, 0);
  await guest.poll();
  assert.equal(guest.status.mode, "ended");
  assert.equal(endedViews.length, 2, "both sides observed the end");

  const ladder = await fetchLadder(serviceUrl);
  assert.equal(ladder[0].name, "ALICE", "the winner rates first");
  assert.equal(ladder[0].rating, 1516);
});

test("an unreachable mailbox never throws from poll or tick", async () => {
  const keys = await generateIdentityKeys();
  const match = new SerfboundOnlineMatch({
    view: {
      matchId: "00000000-0000-4000-8000-000000000000",
      terms,
      players: [
        { name: "ALICE", keyId: "a".repeat(64) },
        { name: "BOB", keyId: "b".repeat(64) },
      ],
      moves: [],
      nextPlayer: 0,
      nextDeadlineIso: new Date().toISOString(),
      state: "active",
    },
    seat: 0,
    keys,
    mailboxUrl: "http://127.0.0.1:9",
    data: dataSource,
  });
  playWindowOut(match);
  await match.poll();
  assert.equal(match.status.mode, "posting", "the move waits for the mailbox to come back");
  assert.equal(match.status.failureReason, null, "network trouble is not a match failure");
});
