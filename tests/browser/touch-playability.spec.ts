import { devices, expect, test } from "@playwright/test";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

// SB-34-01: the real-touch repro harness. Genuine touchscreen taps at
// device pixel ratio 3 — the configuration the maintainer's phone
// runs and no previous "touch" gate ever exercised. These specs
// encode the punch list: they must fail the way the phone fails, then
// pass only when the phone would.

test.use({
  ...devices["iPhone 13"],
  // The device profile defaults to WebKit; CI installs Chromium only.
  // The context is still true mobile: touch + DPR 3. The WebKit half
  // of the bar is the maintainer's device gate (SB-34-05).
  browserName: "chromium",
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

async function foundCastle(page: import("@playwright/test").Page): Promise<void> {
  const app = page.locator("#app");
  const canvas = page.getByTestId("terrain-preview");
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("no canvas box");
  }

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const x = box.x + 40 + (attempt % 6) * Math.floor((box.width - 80) / 5);
    const y = box.y + 80 + Math.floor(attempt / 6) * Math.floor((box.height - 360) / 3);
    await page.touchscreen.tap(x, y);
    await page.touchscreen.tap(x, y);
    if ((await app.getAttribute("data-serfbound-world-has-castle")) === "true") {
      return;
    }
  }

  throw new Error("no castle site reachable in the probe window");
}

// The published rect ("x,y,w,h" in canvas CSS space — SB-34-03) is the
// hit truth the chrome itself uses; taps derived from it must land.
async function publishedRect(
  page: import("@playwright/test").Page,
  attribute: string,
): Promise<{ x: number; y: number; width: number; height: number }> {
  const raw = await page.locator("#app").getAttribute(attribute);
  if (raw === null) {
    throw new Error(`${attribute} is not published`);
  }

  const [x, y, width, height] = raw.split(",").map(Number);
  return { x: x!, y: y!, width: width!, height: height! };
}

test("punch 5: road mode engages from a panel-bar tap at DPR 3", async ({ page }) => {
  await importAndStart(page);
  await foundCastle(page);
  const canvas = page.getByTestId("terrain-preview");
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("no canvas box");
  }

  const panel = await publishedRect(page, "data-serfbound-panel-rect");
  const chromeScale = panel.width / 320;
  // Slot 1 is the road button: reference offset (64 + 48, 4), 32x32.
  await page.touchscreen.tap(
    box.x + panel.x + (64 + 48 + 16) * chromeScale,
    box.y + panel.y + (4 + 16) * chromeScale,
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-road-mode",
    "awaiting-start",
  );
});

test("punch 6: the build popup fits and its content is hit-true at DPR 3", async ({ page }) => {
  await importAndStart(page);
  const app = page.locator("#app");
  await foundCastle(page);
  const canvas = page.getByTestId("terrain-preview");
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("no canvas box");
  }

  // Open the build popup from the panel bar's build slot (slot 0).
  const panel = await publishedRect(page, "data-serfbound-panel-rect");
  const chromeScale = panel.width / 320;
  await page.touchscreen.tap(
    box.x + panel.x + (64 + 16) * chromeScale,
    box.y + panel.y + (4 + 16) * chromeScale,
  );
  await expect(app).toHaveAttribute("data-serfbound-popup", /build/);

  // The popup must sit fully inside the visible canvas.
  const popup = await publishedRect(page, "data-serfbound-popup-rect");
  expect(popup.x).toBeGreaterThanOrEqual(0);
  expect(popup.y).toBeGreaterThanOrEqual(0);
  expect(popup.x + popup.width).toBeLessThanOrEqual(box.width + 1);
  expect(popup.y + popup.height).toBeLessThanOrEqual(box.height + 1);

  // The content must render beyond the background pattern. Honest
  // limit: the CI fixture's building sprites are shallow strips, so
  // this floor cannot catch the paint-order crop the phone showed —
  // tests/ci/app-popup.test.mjs ("paints in push order") gates that;
  // this asserts the popup is not an empty shell at DPR 3.
  const interiorScale = popup.width / 144;
  const fraction = await page.evaluate(
    ({ popup, interiorScale }) => {
      const source = document.querySelector(
        "[data-testid='terrain-preview']",
      ) as HTMLCanvasElement | null;
      if (source === null) {
        return -1;
      }

      const backingScale = source.width / source.clientWidth;
      const probe = document.createElement("canvas");
      probe.width = source.width;
      probe.height = source.height;
      const context = probe.getContext("2d");
      if (context === null) {
        return -1;
      }

      context.drawImage(source, 0, 0);
      // The reference interior is 128x144 at inset (8,9); the strip
      // above the first building row (y 9..21) is pure background.
      const rect = (refX: number, refY: number, refW: number, refH: number) => ({
        x: Math.round((popup.x + refX * interiorScale) * backingScale),
        y: Math.round((popup.y + refY * interiorScale) * backingScale),
        w: Math.round(refW * interiorScale * backingScale),
        h: Math.round(refH * interiorScale * backingScale),
      });
      const background = new Set<number>();
      const backgroundStrip = rect(8, 10, 128, 10);
      const stripData = context.getImageData(
        backgroundStrip.x, backgroundStrip.y, backgroundStrip.w, backgroundStrip.h,
      ).data;
      for (let index = 0; index < stripData.length; index += 4) {
        background.add(
          (stripData[index]! << 16) | (stripData[index + 1]! << 8) | stripData[index + 2]!,
        );
      }

      const interior = rect(8, 22, 128, 120);
      const interiorData = context.getImageData(
        interior.x, interior.y, interior.w, interior.h,
      ).data;
      let foreign = 0;
      const total = interiorData.length / 4;
      for (let index = 0; index < interiorData.length; index += 4) {
        const color =
          (interiorData[index]! << 16) |
          (interiorData[index + 1]! << 8) |
          interiorData[index + 2]!;
        if (!background.has(color)) {
          foreign += 1;
        }
      }

      return foreign / total;
    },
    { popup, interiorScale },
  );
  expect(fraction, "popup interior renders no content beyond the background").toBeGreaterThan(
    0.12,
  );

  // Content hit-truth: the flip button (reference 16x16 at (8,137))
  // cycles the build pages.
  const before = await app.getAttribute("data-serfbound-popup");
  await page.touchscreen.tap(
    box.x + popup.x + (8 + 8) * interiorScale,
    box.y + popup.y + (137 + 8) * interiorScale,
  );
  await expect(app).not.toHaveAttribute("data-serfbound-popup", before ?? "");
  await expect(app).toHaveAttribute("data-serfbound-popup", /build/);
});
