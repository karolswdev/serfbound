// verify-rigs (SB-44-03): the gate tool gates itself. Two passes:
//
//   1. Node pass (always, CI-safe, no browser, no game data): every baked
//      local-game rig in public/rigs/ must restore to status "started" and
//      satisfy its recorded expectations. This catches snapshot schema drift
//      and a rig that no longer reaches its state — before the maintainer ever
//      picks up a phone.
//
//   2. Browser pass (opt-in: set SERFBOUND_RIG_SPAU_PA to a local SPAU.PA):
//      boots each rig through `?rig=` in real Chromium after importing the
//      catalog and asserts the in-game HUD mounts. Needs original game data,
//      so it is local/manual, never CI.
//
//   node .../verify-rigs.mjs          # node pass only
//   SERFBOUND_RIG_SPAU_PA=… node …    # node + browser pass

import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// This file lives at pm/roadmap/serfbound/phase-44-gate-verification/playtest/.
const playtestDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(playtestDir, "../../../../..");
const rigsDir = resolve(repoRoot, "public/rigs");

if (!existsSync(rigsDir)) {
  console.error(`No baked rigs at ${rigsDir}. Run: npm run build:rigs`);
  process.exit(1);
}

const { restoreSerfboundLocalGame } = await import(
  resolve(repoRoot, "packages/engine/dist/index.js")
);
const { checkRigExpectation } = await import(
  resolve(repoRoot, "packages/test-support/dist/index.js")
);

const files = (await readdir(rigsDir)).filter(
  (name) => name.endsWith(".json") && name !== "manifest.json",
);

let failures = 0;
let localGameRigs = 0;

for (const file of files.sort()) {
  const fixture = JSON.parse(await readFile(resolve(rigsDir, file), "utf8"));
  if (fixture.rigKind !== "local-game") {
    console.log(`• ${fixture.id} (${fixture.rigKind}) — structural only`);
    continue;
  }
  localGameRigs += 1;

  const restored = restoreSerfboundLocalGame(fixture.snapshot);
  if (restored.status !== "started") {
    console.error(`✗ ${fixture.id}: restore rejected — ${restored.message}`);
    failures += 1;
    continue;
  }

  const world = restored.game.world();
  const misses = (fixture.expected ?? [])
    .map((expectation) => checkRigExpectation(world, expectation))
    .filter((message) => message !== null);
  if (misses.length > 0) {
    console.error(`✗ ${fixture.id}: ${misses.join("; ")}`);
    failures += 1;
    continue;
  }

  console.log(`✓ ${fixture.id} restores + meets ${(fixture.expected ?? []).length} expectation(s)`);
}

console.log(`\nNode pass: ${localGameRigs} local-game rig(s), ${failures} failure(s).`);

// ── Browser pass (opt-in) ────────────────────────────────────────────────
const spauPath = process.env["SERFBOUND_RIG_SPAU_PA"] ?? process.env["SERFBOUND_SPAU_PA"];
if (spauPath !== undefined && failures === 0) {
  console.log(`\nBrowser pass with ${spauPath} …`);
  const browserFailures = await runBrowserPass(spauPath, files, rigsDir, repoRoot);
  failures += browserFailures;
} else if (spauPath === undefined) {
  console.log("\nBrowser pass skipped (set SERFBOUND_RIG_SPAU_PA to a local SPAU.PA to run it).");
}

process.exit(failures > 0 ? 1 : 0);

async function runBrowserPass(spauPathValue, fileNames, rigsDirValue, repoRootValue) {
  const { chromium } = await import("@playwright/test");
  const { spawn } = await import("node:child_process");
  const port = Number.parseInt(process.env["SERFBOUND_RIG_PORT"] ?? "4187", 10);
  const baseURL = `http://127.0.0.1:${port}/`;

  // Serve the built site (vite preview) so `?rig=` and /rigs/ resolve as on prod.
  const server = spawn(
    "npx",
    ["vite", "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    { cwd: repoRootValue, stdio: "ignore" },
  );
  let browserFailures = 0;
  try {
    await waitForServer(baseURL);
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Import SPAU.PA once (persists in IndexedDB for the rig boots) — the
    // proven handshake from measure-performance.mjs.
    await page.goto(baseURL);
    await page.getByTestId("data-import-input").setInputFiles(spauPathValue);
    await page.waitForFunction(
      () => document.querySelector("[data-testid='data-state']")?.textContent === "Data imported",
      { timeout: 60_000 },
    );

    for (const file of fileNames.sort()) {
      const fixture = JSON.parse(await readFile(resolve(rigsDirValue, file), "utf8"));
      await page.goto(`${baseURL}?rig=${fixture.id}`);
      const hud = page.locator("[data-testid='rig-hud']");
      try {
        await hud.waitFor({ state: "visible", timeout: 15_000 });
      } catch {
        console.error(`✗ browser: ${fixture.id} did not mount the HUD`);
        browserFailures += 1;
        continue;
      }
      // A local-game rig must boot into a running game on the imported catalog.
      if (fixture.rigKind === "local-game") {
        const running = await page
          .waitForFunction(
            () => document.querySelector("[data-testid='game-state']")?.textContent === "Running",
            { timeout: 15_000 },
          )
          .then(() => true)
          .catch(() => false);
        if (!running) {
          console.error(`✗ browser: ${fixture.id} HUD mounted but game not Running`);
          browserFailures += 1;
          continue;
        }
      }
      console.log(`✓ browser: ${fixture.id} boots + HUD`);
    }
    await browser.close();
  } finally {
    server.kill();
  }
  return browserFailures;
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`server at ${url} did not start`);
}
