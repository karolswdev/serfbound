import assert from "node:assert/strict";
import { test } from "node:test";

import {
  LockstepSession,
  MapEditor,
  SessionProtocolError,
  bundleFromTurnMessage,
  computeGameChecksum,
  decodeSessionMessage,
  encodeSessionMessage,
  encodeCustomMap,
  firstChecksumDivergence,
  generateClassicMap,
  sessionProtocolVersion,
  startSerfboundLocalGame,
  turnMessageFromBundle,
  verifySessionHandshake,
} from "@serfbound/engine";

// SB-22-03: the session wire protocol — round-trip exactness, mismatch
// rejection, malformed-input safety, and the SB-22-02 peers re-driven
// over encoded strings.

const dataSource = {
  kind: "imported-dos-pa-catalog",
  archiveName: "SPAU.PA",
  byteLength: 1_282_805,
  entryCount: 4000,
  definedArchiveEntries: 3805,
  fixupCount: 252,
};

const settings = {
  data: dataSource,
  seedString: "1234567812345678",
  mapSize: 3,
  playerCount: 2,
  playerSupplies: [20, 20],
};

function helloFor(player) {
  return {
    type: "hello",
    protocolVersion: sessionProtocolVersion,
    appVersion: "0.1.0",
    player,
    settings: {
      seedString: settings.seedString,
      mapSize: settings.mapSize,
      playerCount: settings.playerCount,
      initialSupplies: 20,
      playerSupplies: settings.playerSupplies,
    },
    turnTicks: 64,
    inputDelayTurns: 2,
  };
}

test("every session message kind round-trips byte-exactly", () => {
  const messages = [
    helloFor(0),
    {
      type: "turn",
      player: 1,
      turn: 7,
      actions: [
        { kind: "build-castle", position: 1234, player: 1 },
        { kind: "build-road", start: 10, directions: ["Right", "DownRight"], player: 1 },
      ],
    },
    { type: "checksum", player: 0, tick: 4096, checksum: 0xdeadbeef },
    { type: "leave", player: 1, reason: "player-quit" },
  ];

  for (const message of messages) {
    const encoded = encodeSessionMessage(message);
    const decoded = decodeSessionMessage(encoded);
    assert.deepEqual(decoded, message);
    assert.equal(encodeSessionMessage(decoded), encoded, "re-encode is byte-identical");
  }
});

test("handshake rejects version, config, and settings mismatches", () => {
  const local = helloFor(0);
  assert.deepEqual(verifySessionHandshake(local, helloFor(1)), { ok: true });

  const cases = [
    [{ ...helloFor(1), protocolVersion: sessionProtocolVersion + 1 }, "protocol-version-mismatch"],
    [{ ...helloFor(1), appVersion: "0.2.0" }, "app-version-mismatch"],
    [helloFor(0), "player-collision"],
    [{ ...helloFor(1), inputDelayTurns: 3 }, "lockstep-config-mismatch"],
    [
      { ...helloFor(1), settings: { ...helloFor(1).settings, seedString: "8888888888888888" } },
      "settings-mismatch",
    ],
    [
      { ...helloFor(1), settings: { ...helloFor(1).settings, playerSupplies: [20, 35] } },
      "settings-mismatch",
    ],
  ];
  for (const [remote, reason] of cases) {
    const verdict = verifySessionHandshake(local, remote);
    assert.equal(verdict.ok, false);
    assert.equal(verdict.reason, reason);
    assert.equal(typeof verdict.message, "string");
  }
});

test("malformed messages throw recoverable protocol errors", () => {
  const malformed = [
    "not json at all",
    "42",
    '{"type":"warp-drive"}',
    '{"type":"checksum","player":0,"tick":"soon","checksum":1}',
    '{"type":"turn","player":0,"turn":1,"actions":[{"kind":"summon-dragon"}]}',
    '{"type":"hello","protocolVersion":1,"appVersion":"0.1.0","player":0,"turnTicks":64,"inputDelayTurns":2,"settings":{"seedString":"9999","mapSize":3,"playerCount":2,"initialSupplies":20,"playerSupplies":null}}',
    '{"type":"leave","player":0,"reason":7}',
  ];
  for (const text of malformed) {
    assert.throws(
      () => decodeSessionMessage(text),
      (error) => error instanceof SessionProtocolError && typeof error.reason === "string",
      `rejects: ${text.slice(0, 40)}`,
    );
  }
});

// SB-43-04: the handshake carries the community map's content hash so
// peers verify they hold the same map — the map equivalent of the seed
// check. The protocol moved to v2 to add it.

test("the session protocol is at v2 — the community-map handshake", () => {
  assert.equal(sessionProtocolVersion, 2);
});

test("handshake matches equal map hashes and rejects different ones (v2)", () => {
  const withHash = (player, hash) => ({
    ...helloFor(player),
    settings: { ...helloFor(player).settings, mapContentHash: hash },
  });

  // Two peers on the same community map (same hash): ok.
  assert.deepEqual(verifySessionHandshake(withHash(0, 0x1234abcd), withHash(1, 0x1234abcd)), {
    ok: true,
  });

  // Different maps under the same seed/size: rejected, named.
  const verdict = verifySessionHandshake(withHash(0, 0x1234abcd), withHash(1, 0x0000ffff));
  assert.equal(verdict.ok, false);
  assert.equal(verdict.reason, "map-mismatch");

  // One peer on a community map, the other on the generated map: rejected.
  const mixed = verifySessionHandshake(withHash(0, 0x1234abcd), helloFor(1));
  assert.equal(mixed.ok, false);
  assert.equal(mixed.reason, "map-mismatch");

  // Absent and explicit null both mean "generated map": still a match.
  const nulled = {
    ...helloFor(1),
    settings: { ...helloFor(1).settings, mapContentHash: null },
  };
  assert.deepEqual(verifySessionHandshake(helloFor(0), nulled), { ok: true });
});

test("a hello round-trips the mapContentHash, and a bad one is rejected", () => {
  const hello = {
    ...helloFor(0),
    settings: { ...helloFor(0).settings, mapContentHash: 0x1234abcd },
  };
  const decoded = decodeSessionMessage(encodeSessionMessage(hello));
  assert.equal(decoded.settings.mapContentHash, 0x1234abcd);

  // Absent stays absent so a v1-shaped hello round-trips byte-exactly;
  // the handshake treats absent and null alike (a generated map).
  const generated = decodeSessionMessage(encodeSessionMessage(helloFor(0)));
  assert.equal(generated.settings.mapContentHash ?? null, null);

  // An explicit null round-trips as null (a v2 generated-map hello).
  const explicitNull = decodeSessionMessage(
    encodeSessionMessage({
      ...helloFor(0),
      settings: { ...helloFor(0).settings, mapContentHash: null },
    }),
  );
  assert.equal(explicitNull.settings.mapContentHash, null);

  // A non-integer hash is refused.
  assert.throws(
    () =>
      decodeSessionMessage(
        '{"type":"hello","protocolVersion":2,"appVersion":"0.1.0","player":0,"turnTicks":64,"inputDelayTurns":2,"settings":{"seedString":"1234567812345678","mapSize":3,"playerCount":2,"initialSupplies":20,"playerSupplies":null,"mapContentHash":"oops"}}',
      ),
    (error) => error instanceof SessionProtocolError && error.reason === "malformed-field",
  );
});

test("a community map plays deterministically in lockstep — no divergence", () => {
  // Author a small playable map and export it as a community map record.
  const editor = new MapEditor(generateClassicMap(3, [1, 2, 3]));
  editor.heights.fill(4);
  editor.typesUp.fill(5);
  editor.typesDown.fill(5);
  editor.objects.fill(0);
  let start = -1;
  for (let pos = 0; pos < editor.tileCount && start < 0; pos += 1) {
    if (editor.isCastlePlaceable(pos)) start = pos;
  }
  assert.notEqual(start, -1, "a castle site exists on the plateau");
  editor.setStart(0, start, 20);
  const record = encodeCustomMap(
    editor.toLandscape(),
    { title: "LOCKSTEP", authorKeyId: "k", authorName: "T", createdAtIso: "2026-06-13T00:00:00.000Z" },
    { playerCount: 1, starts: editor.starts },
  );

  // Two peers start from the same downloaded record (its hash would ride
  // the handshake) and run the identical schedule.
  const runCustom = () => {
    const started = startSerfboundLocalGame({ data: dataSource, customMap: record });
    assert.equal(started.status, "started");
    const world = started.game.world();
    const engine = started.game.serfEngine();
    const state = started.game.state;
    state.recordWorldAction({ kind: "build-castle", position: start, player: 0 });
    world.buildCastle(start, 0);
    const records = [];
    for (let tick = 16; tick <= 8192; tick += 16) {
      engine.update(tick);
      if (tick % 1024 === 0) {
        records.push({ tick, checksum: computeGameChecksum({ world, serfEngine: engine, state }) });
      }
    }
    return records;
  };

  const first = runCustom();
  const second = runCustom();
  assert.deepEqual(second, first);
  assert.equal(firstChecksumDivergence(first, second), null, "the custom map is divergence-free");
  // The map's content hash is what the handshake compares; it is stable.
  assert.equal(record.contentHash, encodeCustomMap(
    editor.toLandscape(),
    { title: "LOCKSTEP", authorKeyId: "k", authorName: "T", createdAtIso: "2026-06-13T00:00:00.000Z" },
    { playerCount: 1, starts: editor.starts },
  ).contentHash, "the content hash is deterministic over the same bytes");
});

test("the lockstep peers agree when every bundle crosses the wire encoded", () => {
  // Discover a valid castle site for player 0.
  const probe = startSerfboundLocalGame(settings).game.world();
  let site = null;
  for (let position = 0; position < probe.tileCount && site === null; position += 1) {
    if (probe.buildCastle(position, 0) !== null) {
      site = position;
    }
  }

  const peers = [0, 1].map((player) => {
    const started = startSerfboundLocalGame(settings);
    return {
      world: started.game.world(),
      engine: started.game.serfEngine(),
      session: new LockstepSession({
        localPlayer: player,
        players: [0, 1],
        turnTicks: 64,
        inputDelayTurns: 2,
      }),
    };
  });

  const totalTurns = 64;
  for (let step = 0; step < totalTurns; step += 1) {
    for (const peer of peers) {
      if (peer.session.localPlayer === 0 && peer.session.localTurn === 1) {
        peer.session.submit({ kind: "build-castle", position: site, player: 0 });
      }

      const bundle = peer.session.completeTurn();
      // The wire: encode -> string -> decode -> receive on the other peer.
      const wireText = encodeSessionMessage(turnMessageFromBundle(bundle));
      const received = decodeSessionMessage(wireText);
      assert.equal(received.type, "turn");
      for (const other of peers) {
        if (other !== peer) {
          other.session.receive(bundleFromTurnMessage(received));
        }
      }
    }

    for (const peer of peers) {
      while (
        peer.session.executedTurn < Math.min(step, totalTurns - 1) &&
        peer.session.readyThroughTurn() > peer.session.executedTurn
      ) {
        peer.session.executeNextTurn(peer.world);
        const startTick = peer.session.turnStartTick(peer.session.executedTurn);
        for (let tick = startTick + 16; tick <= startTick + 64; tick += 16) {
          peer.engine.update(tick);
        }
      }
    }
  }

  const fingerprints = peers.map((peer) =>
    computeGameChecksum({ world: peer.world, serfEngine: peer.engine }),
  );
  assert.equal(fingerprints[0], fingerprints[1]);
  assert.equal(peers[0].world.players[0].hasCastle, true);
  assert.equal(peers[1].world.players[0].hasCastle, true);
});
