import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  acceptChallenge,
  createChallenge,
  fetchLadder,
  fetchMatch,
  generateIdentityKeys,
  postMove,
  submitResult,
} from "@serfbound/app";
import { CorrespondenceMatch } from "@serfbound/engine";

// SB-25-04: the ladder — only dual-attested outcomes rate (the final
// checksum agreement is the receipt determinism already provides);
// disagreement quarantines; forfeits rate the player who showed up.

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
  // SB-29-02: with SERFBOUND_MAILBOX_URL set, the same contract suite
  // targets an externally running (e.g. containerized) instance.
  if (process.env.SERFBOUND_MAILBOX_URL) {
    serviceUrl = process.env.SERFBOUND_MAILBOX_URL;
    return;
  }

  storeDir = mkdtempSync(join(tmpdir(), "serfbound-ladder-"));
  process.env.SERFBOUND_MAILBOX_AUTOSTART = "0";
  process.env.SERFBOUND_MAILBOX_STORE = join(storeDir, "matches.json");
  ({ server } = await import("../../services/mailbox/server.mjs"));
  await new Promise((resolve) => server.listen(0, resolve));
  serviceUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server?.close();
  if (storeDir) {
    rmSync(storeDir, { recursive: true, force: true });
  }
});

function gameFromTerms() {
  return new CorrespondenceMatch({
    game: {
      data: dataSource,
      seedString: terms.seedString,
      mapSize: terms.mapSize,
      initialSupplies: terms.initialSupplies,
    },
    windowTicks: terms.windowTicks,
    playerCount: terms.playerCount,
  });
}

async function playRatedMatchSetup(aliceName, bobName) {
  const alice = await generateIdentityKeys();
  const bob = await generateIdentityKeys();
  const challengeId = await createChallenge(serviceUrl, alice, aliceName, terms);
  const match = await acceptChallenge(serviceUrl, bob, bobName, challengeId);

  const aliceGame = gameFromTerms();
  const bobGame = gameFromTerms();
  aliceGame.advance(terms.windowTicks);
  const move0 = aliceGame.takeMove();
  await postMove(serviceUrl, alice, match.matchId, move0);
  bobGame.applyMove(move0);
  bobGame.advance(terms.windowTicks);
  const move1 = bobGame.takeMove();
  await postMove(serviceUrl, bob, match.matchId, move1);
  aliceGame.applyMove(move1);
  return { alice, bob, match, finalChecksum: aliceGame.checksum() };
}

test("a dual-attested result ends and rates the match", async () => {
  const { alice, bob, match, finalChecksum } = await playRatedMatchSetup("ALICE", "BOB");

  // Alice attests first: nothing rates on one voice.
  const afterFirst = await submitResult(serviceUrl, alice, match.matchId, 0, 0, finalChecksum);
  assert.equal(afterFirst.state, "active");
  assert.equal(afterFirst.attestations, 1);

  // Bob agrees: the match ends and rates.
  const afterSecond = await submitResult(serviceUrl, bob, match.matchId, 1, 0, finalChecksum);
  assert.equal(afterSecond.state, "ended");
  assert.equal(afterSecond.winnerSeat, 0);

  const ladder = await fetchLadder(serviceUrl);
  const aliceEntry = ladder.find((entry) => entry.name === "ALICE");
  const bobEntry = ladder.find((entry) => entry.name === "BOB");
  assert.equal(aliceEntry.rating, 1516, "Elo K=32, even expectation: +16");
  assert.equal(bobEntry.rating, 1484);
  assert.equal(ladder[0].name, "ALICE", "best first");

  // Rating twice is impossible.
  await assert.rejects(
    () => submitResult(serviceUrl, alice, match.matchId, 0, 0, finalChecksum),
    (error) => error.reason === "already-rated",
  );
});

test("disagreeing attestations quarantine the match unrated", async () => {
  const { alice, bob, match, finalChecksum } = await playRatedMatchSetup("CLARA", "DENIS");

  await submitResult(serviceUrl, alice, match.matchId, 0, 0, finalChecksum);
  // Bob claims HE won — the attestations disagree.
  const after = await submitResult(serviceUrl, bob, match.matchId, 1, 1, finalChecksum);
  assert.equal(after.state, "disputed");

  const ladder = await fetchLadder(serviceUrl);
  assert.equal(ladder.some((entry) => entry.name === "CLARA"), false, "nobody rated");
  assert.equal(ladder.some((entry) => entry.name === "DENIS"), false);
});

test("a forfeit rates the player who showed up", async () => {
  const alice = await generateIdentityKeys();
  const bob = await generateIdentityKeys();
  const fastTerms = { ...terms, pickupSeconds: 1 };
  const challengeId = await createChallenge(serviceUrl, alice, "ERWIN", fastTerms);
  const match = await acceptChallenge(serviceUrl, bob, "FRIDA", challengeId);
  await new Promise((resolve) => setTimeout(resolve, 1100));

  const view = await fetchMatch(serviceUrl, match.matchId);
  assert.equal(view.state, "forfeited");
  assert.equal(view.forfeitedPlayer, 0, "Erwin never picked up");
  assert.equal(view.winnerSeat, 1);

  const ladder = await fetchLadder(serviceUrl);
  const frida = ladder.find((entry) => entry.name === "FRIDA");
  const erwin = ladder.find((entry) => entry.name === "ERWIN");
  assert.equal(frida.rating, 1516);
  assert.equal(erwin.rating, 1484);
});
