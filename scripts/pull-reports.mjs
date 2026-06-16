// Pull submitted gate-verification reports (SB-44-06) from the reports service
// into the repo, so a device playtest becomes a file the maintainer and the
// harness work on together. Each report lands as its own markdown file under
// the playtest reports/ folder, newest verdicts in hand.
//
//   SERFBOUND_REPORTS_TOKEN=<token> npm run pull:reports
//
// Token + base resolve from env:
//   SERFBOUND_REPORTS_TOKEN  the submit token (same one the deck uses)
//   SERFBOUND_REPORTS_URL    the route prefix (default https://api.serfbound.com/reports)

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(
  repoRoot,
  "pm/roadmap/serfbound/phase-44-gate-verification/playtest/reports",
);
const base = (process.env["SERFBOUND_REPORTS_URL"] ?? "https://api.serfbound.com/reports").replace(
  /\/+$/,
  "",
);
const token = process.env["SERFBOUND_REPORTS_TOKEN"] ?? "";

const headers = token === "" ? {} : { "x-serfbound-report-token": token };

function safeStamp(iso) {
  // 2026-06-16T12:34:56.789Z -> 2026-06-16T12-34-56
  return String(iso).replace(/\.\d+Z$/, "").replace(/:/g, "-");
}

const listResponse = await fetch(`${base}/reports`, { headers });
if (!listResponse.ok) {
  console.error(
    `Failed to list reports: ${listResponse.status} ${await listResponse.text().catch(() => "")}`,
  );
  console.error(
    listResponse.status === 401
      ? "Set SERFBOUND_REPORTS_TOKEN to the submit token (kubectl -n serfbound get secret reports-token ...)."
      : `Check SERFBOUND_REPORTS_URL (currently ${base}).`,
  );
  process.exit(1);
}

const { reports } = await listResponse.json();
if (!Array.isArray(reports) || reports.length === 0) {
  console.log("No reports submitted yet.");
  process.exit(0);
}

await mkdir(outDir, { recursive: true });
let written = 0;
for (const summary of reports) {
  const detail = await fetch(`${base}/reports/${summary.reportId}`, { headers });
  if (!detail.ok) {
    console.error(`! skip ${summary.reportId}: ${detail.status}`);
    continue;
  }
  const { report } = await detail.json();
  const fileName = `${safeStamp(report.receivedAtIso)}-${report.reportId.slice(0, 8)}.md`;
  const header = [
    "<!--",
    `report-id: ${report.reportId}`,
    `received: ${report.receivedAtIso}`,
    `meta: ${JSON.stringify(report.meta ?? {})}`,
    "-->",
    "",
  ].join("\n");
  await writeFile(resolve(outDir, fileName), `${header}${report.markdown}\n`);
  written += 1;
  console.log(`✓ ${fileName}  (${report.summary})`);
}

console.log(
  `\nPulled ${written} report(s) → pm/roadmap/serfbound/phase-44-gate-verification/playtest/reports/`,
);
