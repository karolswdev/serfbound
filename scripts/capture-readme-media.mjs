// SB-28-01: the README media pipeline. Opt-in, real-data, seed-pinned
// — regenerates every committed image under docs/media/ from one
// deterministic run. Original data is read from the configured local
// path and never copied anywhere; the captures are screenshots of art
// decoded at runtime (the recorded gameplay-media decision).
//
//   SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 \
//   SERFBOUND_SPAU_PA=path/to/SPAU.PA \
//   npm run capture:readme:media

import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { basename } from "node:path";

import { chromium } from "@playwright/test";

const enabled = process.env["SERFBOUND_RUN_LOCAL_ASSET_TESTS"] === "1";
const configuredPath = process.env["SERFBOUND_SPAU_PA"];
const previewPort = 4193;
// The recorded scene seed: every committed image derives from it.
const seed = "6235842872325272";
const mediaDir = "docs/media";

if (!enabled || configuredPath === undefined || configuredPath.trim() === "") {
  console.log(
    "serfbound-readme-media-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 and SERFBOUND_SPAU_PA to capture.",
  );
  process.exit(0);
}

if (basename(configuredPath).toLowerCase() !== "spau.pa" || !existsSync(configuredPath)) {
  console.error(`serfbound-readme-media-failed: local SPAU.PA not found at ${configuredPath}.`);
  process.exit(1);
}

if (!existsSync("dist/index.html")) {
  console.error("serfbound-readme-media-failed: run npm run build:web first.");
  process.exit(1);
}

const REAL_PA = readFileSync(configuredPath);
const preview = spawn(
  "npx",
  ["vite", "preview", "--host", "127.0.0.1", "--port", String(previewPort)],
  { stdio: "ignore" },
);

async function waitForPreview() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${previewPort}/`);
      if (response.ok) {
        return;
      }
    } catch {
      // retry
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("preview never answered");
}

async function importData(page) {
  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: REAL_PA,
  });
  await page.waitForSelector("#app[data-serfbound-chrome='title']");
  await page.waitForTimeout(600);
}

async function startAndFoundCastle(page) {
  const canvas = page.getByTestId("terrain-preview");
  const box = await canvas.boundingBox();
  const initX = Math.max(0, Math.floor((box.width - 288) / 2));
  const initY = Math.max(0, Math.floor((box.height - 256) / 3));
  // START on the decoded init screen.
  await page.locator("[data-testid='start-game-button']").click();
  await page.waitForSelector("#app[data-serfbound-chrome='running']");
  // Found the castle: probe the pinned world for a valid site.
  const probeBox = (await canvas.boundingBox()) ?? box;
  const columns = 8;
  const rows = 9;
  const stepX = Math.floor((probeBox.width - 80) / (columns - 1));
  const stepY = Math.floor((probeBox.height - 170) / (rows - 1));
  for (let attempt = 0; attempt < columns * rows; attempt += 1) {
    const x = 40 + (attempt % columns) * stepX;
    const y = 90 + Math.floor(attempt / columns) * stepY;
    await canvas.click({ position: { x, y } });
    const hasCastle = await page
      .locator("#app")
      .getAttribute("data-serfbound-world-has-castle");
    if (hasCastle === "true") {
      return;
    }
  }

  throw new Error(`no castle site found on seed ${seed} (init ${initX},${initY})`);
}

try {
  await waitForPreview();
  await mkdir(mediaDir, { recursive: true });
  const browser = await chromium.launch();

  // 1+2. The welcome and the title, desktop.
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktop.goto(`http://127.0.0.1:${previewPort}/?seed=${seed}`, {
    waitUntil: "networkidle",
  });
  await desktop.screenshot({ path: `${mediaDir}/welcome.png` });
  await importData(desktop);
  await desktop.screenshot({ path: `${mediaDir}/title.png` });

  // 3. The living settlement: START, found the castle, let the serfs
  // march a moment, capture the world.
  await startAndFoundCastle(desktop);
  await desktop.waitForTimeout(8000);
  await desktop.screenshot({ path: `${mediaDir}/settlement.png` });

  // 4. The social preview (1200x630): the title composition.
  const social = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await social.goto(`http://127.0.0.1:${previewPort}/?seed=${seed}`, {
    waitUntil: "networkidle",
  });
  await importData(social);
  await social.screenshot({ path: `${mediaDir}/social-preview.png` });
  await social.close();

  // 5. Mobile, in play.
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(`http://127.0.0.1:${previewPort}/?seed=${seed}`, {
    waitUntil: "networkidle",
  });
  await importData(mobile);
  await mobile.screenshot({ path: `${mediaDir}/mobile.png` });
  await mobile.close();

  await desktop.close();
  await browser.close();

  // Pixel art is palette art: quantize to stay inside the recorded
  // budget (pngquant; `brew install pngquant`). check:media enforces.
  const quant = spawnSync("pngquant", [
    "--force",
    "--ext",
    ".png",
    "--quality",
    "40-85",
    `${mediaDir}/welcome.png`,
    `${mediaDir}/title.png`,
    `${mediaDir}/settlement.png`,
    `${mediaDir}/social-preview.png`,
    `${mediaDir}/mobile.png`,
  ]);
  if (quant.status !== 0) {
    console.warn("serfbound-readme-media-warning: pngquant unavailable; the budget check may fail.");
  }

  console.log(`serfbound-readme-media-ok: 5 scenes from seed ${seed} into ${mediaDir}/.`);
} finally {
  preview.kill();
}
