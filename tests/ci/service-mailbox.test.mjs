import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  acceptChallenge,
  createChallenge,
  fetchMatch,
  generateIdentityKeys,
  identityAccountId,
  listChallenges,
  listMatchesForKey,
  postMove,
} from "@serfbound/app";
import { CorrespondenceMatch } from "@serfbound/engine";

// SB-25-03: the turn mailbox — a real correspondence match played
// through the real service: challenge, accept, signed moves, trustless
// re-verification on receipt, whose-turn listings, and deadline
// forfeits.

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

  storeDir = mkdtempSync(join(tmpdir(), "serfbound-mailbox-"));
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

function playWindow(match, action) {
  if (action !== undefined) {
    match.queue(action);
  }

  match.advance(terms.windowTicks);
  return match.takeMove();
}

test("a real correspondence match plays through the mailbox", async () => {
  const alice = await generateIdentityKeys();
  const bob = await generateIdentityKeys();

  // Challenge and accept: the lobby lists it, the acceptance creates
  // the match with the agreed terms.
  const challengeId = await createChallenge(serviceUrl, alice, "ALICE", terms);
  const lobby = await listChallenges(serviceUrl);
  assert.equal(lobby.some((entry) => entry.challengeId === challengeId), true);
  const match = await acceptChallenge(serviceUrl, bob, "BOB", challengeId);
  assert.deepEqual(match.terms, terms);
  assert.deepEqual(
    match.players.map((player) => player.name),
    ["ALICE", "BOB"],
  );

  // Both sides build the same deterministic game from the terms.
  const aliceGame = gameFromTerms();
  const bobGame = gameFromTerms();

  // Discover a castle site for player 0 on a probe instance.
  const probe = gameFromTerms();
  let site = null;
  for (let position = 0; position < probe.world.tileCount && site === null; position += 1) {
    if (probe.world.buildCastle(position, 0) !== null) {
      site = position;
    }
  }

  // Window 0: Alice plays, posts; Bob fetches and re-verifies.
  const move0 = playWindow(aliceGame, { kind: "build-castle", position: site, player: 0 });
  const afterMove0 = await postMove(serviceUrl, alice, match.matchId, move0);
  assert.equal(afterMove0.nextPlayer, 1, "the seat passes to Bob");

  const bobView = await fetchMatch(serviceUrl, match.matchId);
  const received0 = bobView.moves[0];
  const verdict0 = bobGame.applyMove(received0);
  assert.deepEqual(verdict0, { ok: true }, "Bob's client re-verifies the fetched move");

  // Window 1: Bob plays back; Alice fetches and re-verifies.
  const move1 = playWindow(bobGame);
  await postMove(serviceUrl, bob, match.matchId, move1);
  const aliceView = await fetchMatch(serviceUrl, match.matchId);
  const verdict1 = aliceGame.applyMove(aliceView.moves[1]);
  assert.deepEqual(verdict1, { ok: true });
  assert.equal(aliceGame.checksum(), bobGame.checksum(), "both sides agree exactly");

  // "Your turn" listings address each player by key fingerprint.
  const aliceMatches = await listMatchesForKey(serviceUrl, await identityAccountId(alice));
  assert.equal(aliceMatches.length, 1);
  assert.equal(aliceMatches[0].yourSeat, 0);
  assert.equal(aliceMatches[0].nextPlayer, 0, "it is Alice's turn again");
});

test("out-of-turn and wrongly-signed moves reject", async () => {
  const alice = await generateIdentityKeys();
  const bob = await generateIdentityKeys();
  const challengeId = await createChallenge(serviceUrl, alice, "ALICE", terms);
  const match = await acceptChallenge(serviceUrl, bob, "BOB", challengeId);

  const aliceGame = gameFromTerms();
  const move0 = playWindow(aliceGame);

  // Bob cannot post Alice's window — the mailbox knows whose turn it is
  // and whose signature it expects.
  await assert.rejects(
    () => postMove(serviceUrl, bob, match.matchId, move0),
    (error) => error.reason === "bad-signature",
  );

  // A fabricated out-of-sequence window rejects.
  await assert.rejects(
    () => postMove(serviceUrl, alice, match.matchId, { ...move0, window: 5 }),
    (error) => error.reason === "out-of-turn",
  );

  // The honest move posts.
  const view = await postMove(serviceUrl, alice, match.matchId, move0);
  assert.equal(view.moves.length, 1);
});

test("a missed pickup deadline forfeits the match", async () => {
  const alice = await generateIdentityKeys();
  const bob = await generateIdentityKeys();
  // pickupSeconds 0 means "no clock" (casual matches); 1 second is the
  // shortest enforced deadline.
  const instantTerms = { ...terms, pickupSeconds: 1 };
  const challengeId = await createChallenge(serviceUrl, alice, "ALICE", instantTerms);
  const match = await acceptChallenge(serviceUrl, bob, "BOB", challengeId);
  await new Promise((resolve) => setTimeout(resolve, 1100));

  const view = await fetchMatch(serviceUrl, match.matchId);
  assert.equal(view.state, "forfeited");
  assert.equal(view.forfeitedPlayer, 0, "the player who missed the pickup forfeits");

  // Posting into a forfeited match rejects.
  const aliceGame = gameFromTerms();
  const move0 = playWindow(aliceGame);
  await assert.rejects(
    () => postMove(serviceUrl, alice, match.matchId, move0),
    (error) => error.reason === "match-not-active",
  );
});
