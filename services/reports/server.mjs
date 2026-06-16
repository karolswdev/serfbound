// The Serfbound reports service (SB-44-06): the gate-verification deck
// submits a playtest report here and it is stored as its own record, so a
// device run becomes a file the maintainer and the harness work on later
// (npm run pull:reports writes them into the repo). The fourth member of the
// zero-dependency service family (identity, mailbox, maps) — Node plus one
// file, JSON-file storage, self-hostable anywhere.
//
// A report is markdown the maintainer typed (verdicts + notes) plus small
// metadata. There is no field for original game data; this service never sees
// sprites, audio, or save state — only the human-authored hand-back text.
//
// Write and read are gated by a shared submit token (SERFBOUND_REPORTS_TOKEN):
// the maintainer holds it, pastes it into the deck once, and the pull script
// uses it. When the env var is unset the service runs open (local dev/tests).

import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";

const port = Number(process.env.SERFBOUND_REPORTS_PORT ?? "4340");
const storePath = process.env.SERFBOUND_REPORTS_STORE ?? ".tmp/reports.json";
const submitToken = process.env.SERFBOUND_REPORTS_TOKEN ?? "";
// A report is hand-typed markdown; 256 KB is generous (the full 36-check
// protocol with notes is a few KB). The body cap leaves slack for metadata.
const markdownByteCap = 256 * 1024;
const bodyByteCap = 512 * 1024;
const reportsCap = 2000; // a safety backstop against unbounded growth

function loadStore() {
  const empty = { reports: {} };
  if (!existsSync(storePath)) {
    return empty;
  }
  try {
    const store = JSON.parse(readFileSync(storePath, "utf8"));
    store.reports ??= {};
    return store;
  } catch {
    return empty;
  }
}

function saveStore(store) {
  writeFileSync(storePath, JSON.stringify(store, null, 2));
}

function send(response, status, body) {
  response.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,x-serfbound-report-token",
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

// The submit token gates every endpoint when configured. Unset = open (local).
function authorized(request) {
  if (submitToken === "") {
    return true;
  }
  return request.headers["x-serfbound-report-token"] === submitToken;
}

// A short, human-meaningful summary line for listings — the first heading or
// the leading non-empty line of the report.
function summarize(markdown) {
  for (const raw of markdown.split("\n")) {
    const line = raw.replace(/^#+\s*/, "").trim();
    if (line.length > 0) {
      return line.slice(0, 120);
    }
  }
  return "(empty report)";
}

function reportView(entry) {
  return {
    reportId: entry.reportId,
    receivedAtIso: entry.receivedAtIso,
    summary: entry.summary,
    byteLength: entry.markdown.length,
    meta: entry.meta ?? {},
  };
}

export const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://localhost:${port}`);
    if (request.method === "OPTIONS") {
      send(response, 204, {});
      return;
    }

    // Health probe — unauthenticated, no store access.
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      send(response, 200, { service: "serfbound-reports", ok: true });
      return;
    }

    if (!authorized(request)) {
      send(response, 401, { error: "unauthorized", message: "A valid submit token is required." });
      return;
    }

    const store = loadStore();

    // POST /reports — submit a playtest report.
    if (request.method === "POST" && url.pathname === "/reports") {
      const body = JSON.parse((await readBody(request)) || "{}");
      const markdown = typeof body.markdown === "string" ? body.markdown : "";
      if (markdown.trim().length === 0) {
        send(response, 400, { error: "empty-report", message: "A report needs markdown content." });
        return;
      }
      if (markdown.length > markdownByteCap) {
        send(response, 413, { error: "too-large", message: "The report exceeds the size cap." });
        return;
      }
      if (Object.keys(store.reports).length >= reportsCap) {
        send(response, 429, { error: "store-full", message: "The report store is at capacity." });
        return;
      }

      const reportId = randomUUID();
      store.reports[reportId] = {
        reportId,
        receivedAtIso: new Date().toISOString(),
        summary: summarize(markdown),
        markdown,
        meta: body.meta && typeof body.meta === "object" ? body.meta : {},
      };
      saveStore(store);
      send(response, 200, { reportId, receivedAtIso: store.reports[reportId].receivedAtIso });
      return;
    }

    // GET /reports — list submitted reports, newest first.
    if (request.method === "GET" && url.pathname === "/reports") {
      const reports = Object.values(store.reports)
        .map(reportView)
        .sort((a, b) => (a.receivedAtIso < b.receivedAtIso ? 1 : -1));
      send(response, 200, { reports });
      return;
    }

    // GET /reports/:id — the full markdown of one report.
    const fetchMatch = url.pathname.match(/^\/reports\/([0-9a-f-]{36})$/);
    if (request.method === "GET" && fetchMatch !== null) {
      const entry = store.reports[fetchMatch[1]];
      if (entry === undefined) {
        send(response, 404, { error: "not-found" });
        return;
      }
      send(response, 200, {
        report: {
          ...reportView(entry),
          markdown: entry.markdown,
        },
      });
      return;
    }

    send(response, 404, { error: "unknown-route" });
  } catch (error) {
    send(response, 400, { error: "bad-request", message: String(error?.message ?? error) });
  }
});

if (process.env.SERFBOUND_REPORTS_AUTOSTART !== "0") {
  server.listen(port, () => {
    console.log(`serfbound-reports listening on :${port} (store: ${storePath})`);
  });
}
