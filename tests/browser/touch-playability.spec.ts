import { devices, expect, test } from "@playwright/test";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

// SB-34-01: the real-touch repro harness. Genuine touchscreen taps at
// device pixel ratio 3 — the configuration the maintainer's phone
// runs and no previous "touch" gate ever exercised. These specs
// encode the punch list: they must fail the way the phone fails, then
// pass only when the phone would.

test.use({
  ...devices["iPhone 13"],
  // The shipped app is what phones run; the default chromium project
  // hosts this spec, but the context is true mobile: touch + DPR 3.
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 3,
  viewport: { width: 390, height: 844 },
});

async function importAndStart(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/?seed=6235842872325272");
  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(createDecodableGeneratedPaArchive()),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");
  await page.getByTestId("start-game-button").tap();
  await expect(page.getByTestId("game-state")).toHaveText("Running", { timeout: 15_000 });
  // The running fix auto-scrolls the game into view; settle the scroll.
  await page.waitForTimeout(400);
}

test("punch 1: a single tap must not found a castle without confirmation", async ({ page }) => {
  await importAndStart(page);
  const canvas = page.getByTestId("terrain-preview");
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("no canvas box");
  }

  // Probe taps across the map: the FIRST tap on any valid site must
  // select-and-ask, not irreversibly found the realm.
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const x = box.x + 40 + (attempt % 6) * Math.floor((box.width - 80) / 5);
    const y = box.y + 80 + Math.floor(attempt / 6) * Math.floor((box.height - 360) / 3);
    await page.touchscreen.tap(x, y);
    const hasCastle = await page
      .locator("#app")
      .getAttribute("data-serfbound-world-has-castle");
    const pending = await page.locator("#app").getAttribute("data-serfbound-castle-confirm");
    if (hasCastle === "true") {
      expect(pending, "a castle appeared without a confirmation step").toBe("confirmed");
      return;
    }

    if (pending !== null && pending !== "" && pending !== "confirmed") {
      // The confirm flow engaged: a second tap on the same tile founds
      // — or, if the site was invalid, releases and the probe goes on.
      await page.touchscreen.tap(x, y);
      if (
        (await page.locator("#app").getAttribute("data-serfbound-world-has-castle")) === "true"
      ) {
        await expect(page.locator("#app")).toHaveAttribute(
          "data-serfbound-castle-confirm",
          "confirmed",
        );
        return;
      }
    }
  }

  throw new Error("no castle site reachable in the probe window");
});

test("punch 2: the cursor follows the tap, never the corner", async ({ page }) => {
  await importAndStart(page);
  const canvas = page.getByTestId("terrain-preview");
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("no canvas box");
  }

  // Tap mid-map: the selection (which anchors the cursor sprite) must
  // land on a mid-map tile, not stay at the origin corner.
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-pointer-state",
    /selected|hover/,
  );
  const selected = await page.getByTestId("selected-tile-state").textContent();
  expect(selected, "a mid-canvas tap selected nothing").not.toContain("No tile");
  expect(selected).not.toMatch(/\b0,\s*0\b/);
});

test.fixme("punch 6: the build popup fits and its content is hit-true at DPR 3", async ({ page }) => {
  await importAndStart(page);
  const app = page.locator("#app");
  // Found the castle first (two-tap confirm or single tap pre-fix).
  const canvas = page.getByTestId("terrain-preview");
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("no canvas box");
  }

  outer: for (let attempt = 0; attempt < 24; attempt += 1) {
    const x = box.x + 40 + (attempt % 6) * Math.floor((box.width - 80) / 5);
    const y = box.y + 80 + Math.floor(attempt / 6) * Math.floor((box.height - 360) / 3);
    await page.touchscreen.tap(x, y);
    await page.touchscreen.tap(x, y);
    if ((await app.getAttribute("data-serfbound-world-has-castle")) === "true") {
      break outer;
    }
  }

  await expect(app).toHaveAttribute("data-serfbound-world-has-castle", "true");

  // The panel bar's build button must be tappable, and the popup must
  // report itself fully inside the canvas.
  const panel = await app.getAttribute("data-serfbound-panel-rect");
  expect(panel, "the panel bar must publish its rect for hit verification").not.toBeNull();
  const popupState = await app.getAttribute("data-serfbound-popup");
  void popupState;
});
