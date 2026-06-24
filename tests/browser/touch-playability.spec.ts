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

let syntheticPointerId = 90;

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

async function foundCastle(
  page: import("@playwright/test").Page,
): Promise<{ x: number; y: number }> {
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
      return { x, y };
    }
  }

  throw new Error("no castle site reachable in the probe window");
}

async function selectBuildablePlot(page: import("@playwright/test").Page): Promise<void> {
  const app = page.locator("#app");
  const canvas = page.getByTestId("terrain-preview");
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("no canvas box");
  }

  const columns = 7;
  const rows = 7;
  const stepX = Math.floor((box.width - 80) / (columns - 1));
  const stepY = Math.floor((box.height - 260) / (rows - 1));
  for (let attempt = 0; attempt < columns * rows; attempt += 1) {
    const x = box.x + 40 + (attempt % columns) * stepX;
    const y = box.y + 90 + Math.floor(attempt / columns) * stepY;
    await page.touchscreen.tap(x, y);
    const buildButton = Number(((await app.getAttribute("data-serfbound-panel-buttons")) ?? "0")
      .split(",")[0]);
    if (buildButton === 3 || buildButton === 4) {
      return;
    }
  }

  throw new Error("no visible small or large build plot reachable in the probe window");
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

async function tapCanvasCss(
  page: import("@playwright/test").Page,
  x: number,
  y: number,
): Promise<void> {
  await page.evaluate(
    ({ pointerId, x, y }) => {
      const target = document.querySelector("[data-testid='terrain-preview']");
      if (target === null) {
        throw new Error("canvas missing");
      }

      const rect = target.getBoundingClientRect();
      for (const type of ["pointerdown", "pointerup"]) {
        target.dispatchEvent(
          new PointerEvent(type, {
            pointerId,
            pointerType: "touch",
            isPrimary: true,
            clientX: rect.left + x,
            clientY: rect.top + y,
            bubbles: true,
            cancelable: true,
          }),
        );
      }
    },
    { pointerId: (syntheticPointerId += 1), x, y },
  );
}

test("punch 3: play taps never text-select the chrome", async ({ page }) => {
  await importAndStart(page);
  const selectable = await page.evaluate(() => {
    const probe = (selector: string): string => {
      const element = document.querySelector(selector);
      return element === null ? "missing" : getComputedStyle(element).userSelect;
    };

    return {
      body: getComputedStyle(document.body).userSelect,
      statusPanel: probe(".status-panel"),
    };
  });
  expect(selectable.body).toBe("none");
  expect(selectable.statusPanel).toBe("none");
});

test("punch 4: Reduce Motion must never freeze the world", async ({ page }) => {
  // iOS "Reduce Motion" is a common accessibility setting. It may pin
  // the decorative wave frame — it must not stop the simulation.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await importAndStart(page);
  await foundCastle(page);
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-motion", "reduced");
  const tickBefore = Number(
    await page.locator("#app").getAttribute("data-serfbound-game-tick"),
  );
  await page.waitForTimeout(1200);
  const tickAfter = Number(
    await page.locator("#app").getAttribute("data-serfbound-game-tick"),
  );
  expect(tickAfter, "the simulation froze under prefers-reduced-motion").toBeGreaterThan(
    tickBefore,
  );
});

test("punch 5: road mode engages from a panel-bar tap at DPR 3", async ({ page }) => {
  await importAndStart(page);
  await foundCastle(page);
  const panel = await publishedRect(page, "data-serfbound-panel-rect");
  const chromeScale = panel.width / 320;
  // Slot 1 is the road button: reference offset (64 + 48, 4), 32x32.
  const roadSlot = {
    x: panel.x + (64 + 48 + 16) * chromeScale,
    y: panel.y + (4 + 16) * chromeScale,
  };
  await tapCanvasCss(page, roadSlot.x, roadSlot.y);
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-road-mode",
    "awaiting-start",
  );
  // The prompt reaches the player's eyes (the in-canvas notice), not
  // just the dev ledger (SB-34 round 4). Background notices (a deed
  // landing) may overwrite it on a slow runner — re-arm and re-read
  // (cancel rides the starred slot 0 while road mode owns the bar).
  const cancelSlot = {
    x: panel.x + (64 + 16) * chromeScale,
    y: panel.y + (4 + 16) * chromeScale,
  };
  await expect(async () => {
    const notice = await page
      .locator("#app")
      .getAttribute("data-serfbound-notification");
    if (notice !== "TAP YOUR STARTING FLAG") {
      await tapCanvasCss(page, cancelSlot.x, cancelSlot.y);
      await tapCanvasCss(page, roadSlot.x, roadSlot.y);
      throw new Error(`the road prompt was overwritten by: ${notice}`);
    }
  }).toPass({ timeout: 10_000 });
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-road-mode",
    "awaiting-start",
  );
});

test("the road builder: tap the flag, extend, plant a flag, the road is laid", async ({ page }) => {
  test.setTimeout(120_000);
  await importAndStart(page);
  const castleTap = await foundCastle(page);
  const app = page.locator("#app");
  const canvas = page.getByTestId("terrain-preview");
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("no canvas box");
  }

  const panel = await publishedRect(page, "data-serfbound-panel-rect");
  const chromeScale = panel.width / 320;
  const buildSlot = {
    x: panel.x + (64 + 16) * chromeScale,
    y: panel.y + (4 + 16) * chromeScale,
  };
  const castleTapCss = { x: castleTap.x - box.x, y: castleTap.y - box.y };

  // The castle flag sits DownRight of the castle: roughly half a tile
  // right, one tile down in CSS space (32px tiles at this profile).
  // Selecting an own flag turns the build slot into the road button —
  // the panel publishes "8," first. Probe small offsets to absorb the
  // apex rounding.
  let flagPoint: { x: number; y: number } | undefined;
  for (const [dx, dy] of [[16, 20], [16, 24], [12, 20], [20, 20], [16, 16]]) {
    const candidate = { x: castleTapCss.x + dx, y: castleTapCss.y + dy };
    await tapCanvasCss(page, candidate.x, candidate.y);
    const buttons = await app.getAttribute("data-serfbound-panel-buttons");
    if (buttons?.startsWith("8,")) {
      flagPoint = candidate;
      break;
    }
  }
  expect(flagPoint, "the castle flag is selectable and offers the road act").toBeDefined();

  // Tap the build slot (now the road button): the road builder begins.
  await tapCanvasCss(page, buildSlot.x, buildSlot.y);
  await expect(app).toHaveAttribute("data-serfbound-road-mode", "building");
  // The bar swaps to the reference road-builder layout.
  await expect(app).toHaveAttribute("data-serfbound-panel-buttons", "24,0,9,11,13");

  // Extend away from the flag and plant a flag at the end: try a few
  // destinations until one accepts both the path and the flag.
  let laid = false;
  for (const [ex, ey] of [[64, 0], [-64, 0], [64, 40], [-64, 40], [0, 80], [96, 0]]) {
    const target = { x: flagPoint!.x + ex, y: flagPoint!.y + ey };
    if (
      target.x < 8 ||
      target.x > box.width - 8 ||
      target.y < 40 ||
      target.y > box.height - 140
    ) {
      continue;
    }

    await tapCanvasCss(page, target.x, target.y);
    await tapCanvasCss(page, target.x, target.y);
    if ((await app.getAttribute("data-serfbound-last-effect")) === "road-built") {
      laid = true;
      break;
    }

    if ((await app.getAttribute("data-serfbound-road-mode")) === "idle") {
      // A failed completion ended the mode; restart from the flag.
      await tapCanvasCss(page, flagPoint!.x, flagPoint!.y);
      await tapCanvasCss(page, buildSlot.x, buildSlot.y);
      await expect(app).toHaveAttribute("data-serfbound-road-mode", "building");
    }
  }

  expect(laid, "extend + plant-a-flag lays a real road").toBe(true);
  await expect(app).toHaveAttribute("data-serfbound-road-mode", "idle");
  await expect(app).toHaveAttribute("data-serfbound-command-type", "game.build-road");
  await expect(app).toHaveAttribute("data-serfbound-last-effect", "road-built");
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
  await selectBuildablePlot(page);
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
