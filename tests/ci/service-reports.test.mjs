import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// SB-44-06: the reports service contract — token-gated submit/list/fetch
// against the real zero-dep server, with the "no original-data field"
// guarantee (a report is hand-typed markdown the maintainer hands back).

const TOKEN = "test-submit-token";
let server;
let serviceUrl;
let storeDir;

before(async () => {
  storeDir = mkdtempSync(join(tmpdir(), "serfbound-reports-"));
  process.env.SERFBOUND_REPORTS_AUTOSTART = "0";
  process.env.SERFBOUND_REPORTS_STORE = join(storeDir, "reports.json");
  process.env.SERFBOUND_REPORTS_TOKEN = TOKEN;
  ({ server } = await import("../../services/reports/server.mjs"));
  await new Promise((resolve) => server.listen(0, resolve));
  serviceUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server?.close();
  if (storeDir) {
    rmSync(storeDir, { recursive: true, force: true });
  }
});

const auth = { "content-type": "application/json", "x-serfbound-report-token": TOKEN };

test("health is open and needs no token", async () => {
  const response = await fetch(`${serviceUrl}/health`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
});

test("submit without the token is rejected", async () => {
  const response = await fetch(`${serviceUrl}/reports`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ markdown: "# nope" }),
  });
  assert.equal(response.status, 401);
});

test("an empty report is rejected", async () => {
  const response = await fetch(`${serviceUrl}/reports`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ markdown: "   " }),
  });
  assert.equal(response.status, 400);
});

test("a report submits, lists, and fetches round-trip", async () => {
  const markdown = "# Gate playtest\n\n## SB-36-06\n- [36.1] ✗ FAIL — new half unstaffed";
  const submit = await fetch(`${serviceUrl}/reports`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ markdown, meta: { gate: "SB-36-06" } }),
  });
  assert.equal(submit.status, 200);
  const { reportId, receivedAtIso } = await submit.json();
  assert.match(reportId, /^[0-9a-f-]{36}$/);
  assert.ok(typeof receivedAtIso === "string");

  const list = await (await fetch(`${serviceUrl}/reports`, { headers: auth })).json();
  assert.equal(list.reports.length, 1);
  assert.equal(list.reports[0].reportId, reportId);
  assert.equal(list.reports[0].summary, "Gate playtest");
  assert.equal(list.reports[0].meta.gate, "SB-36-06");

  const fetched = await (
    await fetch(`${serviceUrl}/reports/${reportId}`, { headers: auth })
  ).json();
  assert.equal(fetched.report.markdown, markdown);
});

test("listing is token-gated too", async () => {
  const response = await fetch(`${serviceUrl}/reports`);
  assert.equal(response.status, 401);
});

test("an oversized report is rejected", async () => {
  const huge = "#".repeat(256 * 1024 + 1);
  const response = await fetch(`${serviceUrl}/reports`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ markdown: huge }),
  });
  assert.equal(response.status, 413);
});
