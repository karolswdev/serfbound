// The Serfbound turn mailbox (SB-25-03): challenges with match terms,
// store-and-forward of window moves, and pickup deadlines with forfeit
// — the correspondence post office. The service stores moves and
// checksums ONLY (structurally validated, size-capped) and never
// referees: clients re-simulate and verify every move themselves.
// Zero dependencies, JSON-file storage, self-hostable anywhere.

import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHmac, randomUUID, timingSafeEqual, webcrypto } from "node:crypto";

const port = Number(process.env.SERFBOUND_MAILBOX_PORT ?? "4320");
const storePath = process.env.SERFBOUND_MAILBOX_STORE ?? ".tmp/mailbox-matches.json";
const v2SessionSecret = process.env.SERFBOUND_IDENTITY_V2_SESSION_SECRET ?? "";
const moveByteCap = 256 * 1024;
const playerNameMaxLength = 12;

function loadStore() {
  const empty = { challenges: {}, matches: {}, ratings: {} };
  if (!existsSync(storePath)) {
    return empty;
  }

  try {
    const store = JSON.parse(readFileSync(storePath, "utf8"));
    store.ratings ??= {};
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

function validTerms(terms) {
  return (
    typeof terms === "object" &&
    terms !== null &&
    typeof terms.seedString === "string" &&
    /^[1-8]{16}$/.test(terms.seedString) &&
    Number.isInteger(terms.mapSize) &&
    Number.isInteger(terms.playerCount) &&
    Number.isInteger(terms.initialSupplies) &&
    Number.isInteger(terms.windowTicks) &&
    terms.windowTicks >= 64 &&
    Number.isInteger(terms.pickupSeconds) &&
    terms.pickupSeconds >= 0
  );
}

function normalizePlayerName(input) {
  if (typeof input !== "string") {
    return null;
  }

  const upper = input.toUpperCase();
  let name = "";
  for (const character of upper) {
    if (name.length >= playerNameMaxLength) {
      break;
    }

    if (/[A-Z0-9ÄÖÜ.\-:?%]/.test(character)) {
      name += character;
    }
  }

  return name.length > 0 ? name : null;
}

function sanitizeV2DisplayName(input) {
  return normalizePlayerName(input) ?? "PLAYER";
}

function signV2SessionPayload(encodedPayload) {
  return createHmac("sha256", v2SessionSecret).update(encodedPayload).digest("base64url");
}

function timingSafeTextEqual(left, right) {
  const leftBytes = Buffer.from(String(left));
  const rightBytes = Buffer.from(String(right));
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function verifyV2SessionToken(token) {
  if (v2SessionSecret === "" || typeof token !== "string" || !token.startsWith("sbv2.")) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [, encodedPayload, signature] = parts;
  if (!timingSafeTextEqual(signature, signV2SessionPayload(encodedPayload))) {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (
    payload?.schemaVersion !== 1 ||
    payload.audience !== "serfbound-social" ||
    typeof payload.accountId !== "string" ||
    !/^acct_[0-9a-f]{32}$/.test(payload.accountId) ||
    typeof payload.displayName !== "string" ||
    typeof payload.expiresAtIso !== "string" ||
    Date.parse(payload.expiresAtIso) <= Date.now()
  ) {
    return null;
  }

  return {
    accountId: payload.accountId,
    displayName: sanitizeV2DisplayName(payload.displayName),
  };
}

function v2SessionFromRequest(request) {
  const authorization = request.headers.authorization;
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    return null;
  }

  return verifyV2SessionToken(authorization.slice("Bearer ".length).trim());
}

function sendBadV2Session(response) {
  send(response, 401, {
    error: "bad-v2-session",
    message: "The identity v2 session did not verify.",
  });
}

// The wire carries world actions and checksums only — structurally
// pinned here, trustlessly re-verified by the receiving client.
function validMove(move) {
  return (
    typeof move === "object" &&
    move !== null &&
    Number.isInteger(move.window) &&
    Number.isInteger(move.player) &&
    Number.isInteger(move.endTick) &&
    Number.isInteger(move.endChecksum) &&
    Array.isArray(move.actions) &&
    move.actions.every(
      (stamped) =>
        typeof stamped === "object" &&
        stamped !== null &&
        Number.isInteger(stamped.tick) &&
        typeof stamped.action === "object" &&
        stamped.action !== null &&
        typeof stamped.action.kind === "string",
    )
  );
}

// Whose turn a match is on, and whether the pickup deadline forfeited
// it (evaluated lazily — no clocks run server-side). pickupSeconds 0
// means no clock (casual matches).
function evaluateMatch(match, nowMs) {
  if (match.state !== "active") {
    return match;
  }

  if (match.terms.pickupSeconds > 0 && nowMs > Date.parse(match.nextDeadlineIso)) {
    match.state = "forfeited";
    match.forfeitedPlayer = match.moves.length % 2;
    match.pendingForfeitRating = true;
  }

  return match;
}

// The ladder (SB-25-04): Elo, K=32, rated only on dual-attested or
// forfeited outcomes. Modest stakes by design — no rewards, no decay.
const eloK = 32;
const eloBase = 1500;

function rateOutcome(store, match, winnerSeat) {
  if (match.rated === true) {
    return;
  }

  const ids = match.players.map((player) => player.keyId);
  const ratings = ids.map((id) => store.ratings[id]?.rating ?? eloBase);
  const expectedWinner = 1 / (1 + 10 ** ((ratings[1 - winnerSeat] - ratings[winnerSeat]) / 400));
  const delta = Math.round(eloK * (1 - expectedWinner));
  for (const seat of [0, 1]) {
    const id = ids[seat];
    store.ratings[id] = {
      keyId: id,
      name: match.players[seat].name,
      rating: ratings[seat] + (seat === winnerSeat ? delta : -delta),
      matches: (store.ratings[id]?.matches ?? 0) + 1,
    };
  }

  match.rated = true;
  match.winnerSeat = winnerSeat;
}

function matchView(match) {
  return {
    matchId: match.matchId,
    terms: match.terms,
    players: match.players.map((player) => ({ name: player.name, keyId: player.keyId })),
    moves: match.moves,
    nextPlayer: match.moves.length % 2,
    nextDeadlineIso: match.nextDeadlineIso,
    state: match.state,
    ...(match.forfeitedPlayer === undefined ? {} : { forfeitedPlayer: match.forfeitedPlayer }),
    ...(match.winnerSeat === undefined ? {} : { winnerSeat: match.winnerSeat }),
    ...(match.attestations === undefined
      ? {}
      : { attestations: Object.keys(match.attestations).length }),
  };
}

function send(response, status, body) {
  response.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
  });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let data = "";
    request.on("data", (chunk) => {
      data += chunk;
      if (data.length > moveByteCap) {
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

    // POST /challenges — open a challenge with match terms.
    if (request.method === "POST" && url.pathname === "/challenges") {
      const body = JSON.parse((await readBody(request)) || "{}");
      const v2Session = v2SessionFromRequest(request);
      if (request.headers.authorization !== undefined && v2Session === null) {
        sendBadV2Session(response);
        return;
      }

      const { publicKeyJwk, name, terms, signedAtIso, signature } = body;
      if (!validTerms(terms)) {
        send(response, 400, { error: "invalid-terms", message: "Challenge terms are malformed." });
        return;
      }

      const challengerName =
        v2Session === null ? normalizePlayerName(name) : sanitizeV2DisplayName(v2Session.displayName);
      if (challengerName === null) {
        send(response, 400, {
          error: "missing-name",
          message: "Challenges require a player-visible challenger name.",
        });
        return;
      }

      let challenger;
      if (v2Session === null) {
        const payload = `challenge|${JSON.stringify(terms)}|${signedAtIso}`;
        if (!(await verifySignature(publicKeyJwk, payload, signature))) {
          send(response, 401, { error: "bad-signature", message: "The signature does not verify." });
          return;
        }

        challenger = { publicKeyJwk, name: challengerName, keyId: await keyFingerprint(publicKeyJwk) };
      } else {
        challenger = { name: challengerName, keyId: v2Session.accountId, identityVersion: 2 };
      }

      const challengeId = randomUUID();
      store.challenges[challengeId] = {
        challengeId,
        terms,
        challenger,
        openedAtIso: new Date().toISOString(),
      };
      saveStore(store);
      send(response, 200, { challengeId });
      return;
    }

    // GET /challenges — the open lobby.
    if (request.method === "GET" && url.pathname === "/challenges") {
      send(response, 200, {
        challenges: Object.values(store.challenges).map((challenge) => ({
          challengeId: challenge.challengeId,
          terms: challenge.terms,
          challengerName: challenge.challenger.name,
          challengerKeyId: challenge.challenger.keyId,
          openedAtIso: challenge.openedAtIso,
        })),
      });
      return;
    }

    // POST /challenges/:id/accept — the match begins; the pickup clock
    // starts for the challenger's first window.
    const acceptMatch = url.pathname.match(/^\/challenges\/([0-9a-f-]{36})\/accept$/);
    if (request.method === "POST" && acceptMatch !== null) {
      const challenge = store.challenges[acceptMatch[1]];
      if (challenge === undefined) {
        send(response, 404, { error: "not-found" });
        return;
      }

      const body = JSON.parse((await readBody(request)) || "{}");
      const v2Session = v2SessionFromRequest(request);
      if (request.headers.authorization !== undefined && v2Session === null) {
        sendBadV2Session(response);
        return;
      }

      const { publicKeyJwk, name, signedAtIso, signature } = body;
      const accepterName =
        v2Session === null ? normalizePlayerName(name) : sanitizeV2DisplayName(v2Session.displayName);
      if (accepterName === null) {
        send(response, 400, {
          error: "missing-name",
          message: "Challenge acceptance requires a player-visible name.",
        });
        return;
      }

      let accepter;
      if (v2Session === null) {
        const payload = `accept|${challenge.challengeId}|${signedAtIso}`;
        if (!(await verifySignature(publicKeyJwk, payload, signature))) {
          send(response, 401, { error: "bad-signature", message: "The signature does not verify." });
          return;
        }

        accepter = { publicKeyJwk, name: accepterName, keyId: await keyFingerprint(publicKeyJwk) };
      } else {
        accepter = { name: accepterName, keyId: v2Session.accountId, identityVersion: 2 };
      }

      const matchId = randomUUID();
      const match = {
        matchId,
        terms: challenge.terms,
        players: [challenge.challenger, accepter],
        moves: [],
        state: "active",
        nextDeadlineIso: new Date(
          Date.now() + challenge.terms.pickupSeconds * 1000,
        ).toISOString(),
      };
      store.matches[matchId] = match;
      delete store.challenges[challenge.challengeId];
      saveStore(store);
      send(response, 200, { matchId, match: matchView(match) });
      return;
    }

    // GET /matches/:id — the match record (deadline evaluated lazily).
    const matchRoute = url.pathname.match(/^\/matches\/([0-9a-f-]{36})(\/moves)?$/);
    if (matchRoute !== null) {
      const match = store.matches[matchRoute[1]];
      if (match === undefined) {
        send(response, 404, { error: "not-found" });
        return;
      }

      evaluateMatch(match, Date.now());
      if (match.pendingForfeitRating === true) {
        rateOutcome(store, match, 1 - match.forfeitedPlayer);
        delete match.pendingForfeitRating;
      }

      if (request.method === "GET" && matchRoute[2] === undefined) {
        saveStore(store);
        send(response, 200, { match: matchView(match) });
        return;
      }

      // POST /matches/:id/moves — the active player's window move.
      if (request.method === "POST" && matchRoute[2] === "/moves") {
        if (match.state !== "active") {
          saveStore(store);
          send(response, 409, {
            error: "match-not-active",
            message: `The match is ${match.state}.`,
            match: matchView(match),
          });
          return;
        }

        const body = JSON.parse((await readBody(request)) || "{}");
        const v2Session = v2SessionFromRequest(request);
        if (request.headers.authorization !== undefined && v2Session === null) {
          sendBadV2Session(response);
          return;
        }

        const { move, signedAtIso, signature } = body;
        if (!validMove(move)) {
          send(response, 400, { error: "invalid-move", message: "The move payload is malformed." });
          return;
        }

        const expectedPlayer = match.moves.length % 2;
        if (move.window !== match.moves.length || move.player !== expectedPlayer) {
          send(response, 409, {
            error: "out-of-turn",
            message: `Expected window ${match.moves.length} from player ${expectedPlayer}.`,
          });
          return;
        }

        const signer = match.players[expectedPlayer];
        if (signer.identityVersion === 2) {
          if (v2Session === null || v2Session.accountId !== signer.keyId) {
            sendBadV2Session(response);
            return;
          }
        } else {
          const payload = `move|${match.matchId}|${move.window}|${move.endChecksum}|${signedAtIso}`;
          if (!(await verifySignature(signer.publicKeyJwk, payload, signature))) {
            send(response, 401, { error: "bad-signature", message: "The signature does not verify." });
            return;
          }
        }

        match.moves.push(move);
        match.nextDeadlineIso = new Date(
          Date.now() + match.terms.pickupSeconds * 1000,
        ).toISOString();
        saveStore(store);
        send(response, 200, { match: matchView(match) });
        return;
      }
    }

    // POST /matches/:id/results — dual attestation: both players sign
    // the outcome (winner seat + final checksum). Agreement rates the
    // match; disagreement quarantines it as disputed.
    const resultRoute = url.pathname.match(/^\/matches\/([0-9a-f-]{36})\/results$/);
    if (request.method === "POST" && resultRoute !== null) {
      const match = store.matches[resultRoute[1]];
      if (match === undefined) {
        send(response, 404, { error: "not-found" });
        return;
      }

      evaluateMatch(match, Date.now());
      if (match.state === "forfeited") {
        send(response, 409, { error: "match-not-active", message: "The match is forfeited." });
        return;
      }

      if (match.state === "ended" && match.rated === true) {
        send(response, 409, { error: "already-rated", message: "The match already rated." });
        return;
      }

      const body = JSON.parse((await readBody(request)) || "{}");
      const v2Session = v2SessionFromRequest(request);
      if (request.headers.authorization !== undefined && v2Session === null) {
        sendBadV2Session(response);
        return;
      }

      const { seat, winnerSeat, finalChecksum, signedAtIso, signature } = body;
      if (![0, 1].includes(seat) || ![0, 1].includes(winnerSeat) || !Number.isInteger(finalChecksum)) {
        send(response, 400, { error: "malformed", message: "Missing result fields." });
        return;
      }

      const signer = match.players[seat];
      if (signer.identityVersion === 2) {
        if (v2Session === null || v2Session.accountId !== signer.keyId) {
          sendBadV2Session(response);
          return;
        }
      } else {
        const payload = `result|${match.matchId}|${winnerSeat}|${finalChecksum}|${signedAtIso}`;
        if (!(await verifySignature(signer.publicKeyJwk, payload, signature))) {
          send(response, 401, { error: "bad-signature", message: "The signature does not verify." });
          return;
        }
      }

      match.attestations ??= {};
      match.attestations[seat] = { winnerSeat, finalChecksum };
      const seats = Object.keys(match.attestations);
      if (seats.length === 2) {
        const [a, b] = [match.attestations[0], match.attestations[1]];
        if (a.winnerSeat === b.winnerSeat && a.finalChecksum === b.finalChecksum) {
          match.state = "ended";
          rateOutcome(store, match, a.winnerSeat);
        } else {
          // Quarantine: someone is lying; nobody rates.
          match.state = "disputed";
        }
      }

      saveStore(store);
      send(response, 200, { match: matchView(match) });
      return;
    }

    // GET /ladder — ratings, best first.
    if (request.method === "GET" && url.pathname === "/ladder") {
      const entries = Object.values(store.ratings).sort((left, right) => right.rating - left.rating);
      send(response, 200, { ladder: entries });
      return;
    }

    // GET /players/:keyId/matches — a player's open matches ("your turn"
    // surfacing).
    const playerRoute = url.pathname.match(/^\/players\/([A-Za-z0-9_:-]+)\/matches$/);
    if (request.method === "GET" && playerRoute !== null) {
      const keyId = playerRoute[1];
      const matches = Object.values(store.matches)
        .filter((match) => match.players.some((player) => player.keyId === keyId))
        .map((match) => {
          evaluateMatch(match, Date.now());
          if (match.pendingForfeitRating === true) {
            rateOutcome(store, match, 1 - match.forfeitedPlayer);
            delete match.pendingForfeitRating;
          }

          return match;
        })
        .map((match) => ({
          ...matchView(match),
          yourSeat: match.players.findIndex((player) => player.keyId === keyId),
        }));
      saveStore(store);
      send(response, 200, { matches });
      return;
    }

    send(response, 404, { error: "unknown-route" });
  } catch (error) {
    send(response, 400, { error: "bad-request", message: String(error?.message ?? error) });
  }
});

if (process.env.SERFBOUND_MAILBOX_AUTOSTART !== "0") {
  server.listen(port, () => {
    console.log(`serfbound-mailbox listening on :${port} (store: ${storePath})`);
  });
}
