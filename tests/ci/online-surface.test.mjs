import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { SerfboundOnlineSurface } from "@serfbound/app";

// SB-29-04: the shell online surface against real in-process services —
// sign-in links an account, the lobby lists challenges, the your-turn
// badge counts active matches awaiting this player, and a dead service
// degrades recoverably without throwing.

const terms = {
  seedString: "1234567812345678",
  mapSize: 3,
  playerCount: 2,
  initialSupplies: 20,
  windowTicks: 512,
  pickupSeconds: 3600,
};

let identityServer;
let mailboxServer;
let identityUrl;
let mailboxUrl;
let storeDir;

before(async () => {
  storeDir = mkdtempSync(join(tmpdir(), "serfbound-online-surface-"));
  process.env.SERFBOUND_IDENTITY_AUTOSTART = "0";
  process.env.SERFBOUND_IDENTITY_STORE = join(storeDir, "accounts.json");
  process.env.SERFBOUND_MAILBOX_AUTOSTART = "0";
  process.env.SERFBOUND_MAILBOX_STORE = join(storeDir, "matches.json");
  ({ server: identityServer } = await import("../../services/identity/server.mjs"));
  ({ server: mailboxServer } = await import("../../services/mailbox/server.mjs"));
  await new Promise((resolve) => identityServer.listen(0, resolve));
  await new Promise((resolve) => mailboxServer.listen(0, resolve));
  identityUrl = `http://127.0.0.1:${identityServer.address().port}`;
  mailboxUrl = `http://127.0.0.1:${mailboxServer.address().port}`;
});

after(() => {
  identityServer?.close();
  mailboxServer?.close();
  rmSync(storeDir, { recursive: true, force: true });
});

test("sign-in, lobby, accept, and the your-turn badge", async () => {
  let linked = null;
  const alice = new SerfboundOnlineSurface({
    identityUrl,
    mailboxUrl,
    onAccountLinked: (account) => {
      linked = account;
    },
  });
  assert.equal(alice.status, "signed-out");
  assert.equal(alice.yourTurnCount, 0, "signed-out players have no turns");

  assert.equal(await alice.signIn("alice"), true);
  assert.equal(alice.status, "signed-in");
  assert.equal(alice.accountName, "ALICE", "the service-sanitized name is adopted");
  assert.notEqual(linked, null, "the linked account reaches the profile hook");
  assert.equal(linked.accountId, alice.accountId);
  assert.equal(typeof linked.privateKeyJwk.d, "string", "the keypair stays with the player");

  const challengeId = await alice.postChallenge(terms);
  assert.notEqual(challengeId, null);
  assert.equal(alice.lobby.length, 1, "the posted challenge shows in the lobby");
  assert.equal(alice.lobby[0].challengerName, "ALICE");

  const bob = new SerfboundOnlineSurface({ identityUrl, mailboxUrl });
  assert.equal(await bob.signIn("bob"), true);
  await bob.refresh();
  assert.equal(bob.lobby.length, 1);

  const match = await bob.accept(challengeId);
  assert.notEqual(match, null);
  assert.equal(match.players[0].name, "ALICE", "seat 0 is the challenger");
  assert.equal(match.players[1].name, "BOB");

  // Window 0 belongs to seat 0: it is Alice's turn, not Bob's.
  await alice.refresh();
  assert.equal(alice.yourTurnCount, 1);
  assert.equal(bob.yourTurnCount, 0);
  assert.equal(alice.lobby.length, 0, "an accepted challenge leaves the lobby");
});

test("an unreachable service degrades recoverably and never throws", async () => {
  const dead = new SerfboundOnlineSurface({
    identityUrl: "http://127.0.0.1:9",
    mailboxUrl: "http://127.0.0.1:9",
  });
  assert.equal(await dead.signIn("ghost"), false);
  assert.equal(dead.status, "unavailable", "a failed online action is visibly unavailable");
  assert.notEqual(dead.lastError, null);

  dead.restore(
    {
      accountId: "0".repeat(64),
      serviceUrl: "http://127.0.0.1:9",
      publicKeyJwk: {},
      privateKeyJwk: {},
    },
    "ghost",
  );
  assert.equal(await dead.refresh(), false);
  assert.equal(dead.status, "unavailable", "a linked account degrades to unavailable, not signed-out");
  assert.equal(dead.yourTurnCount, 0);
});
