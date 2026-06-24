import { expect, test, type Locator, type Page } from "@playwright/test";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

const seed = "6235842872325272";

type CanvasPoint = {
  readonly x: number;
  readonly y: number;
};

type CssRect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

async function importAndStart(page: Page): Promise<Locator> {
  await page.goto(`/?dev=1&seed=${seed}`);
  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(createDecodableGeneratedPaArchive()),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");
  await page.getByTestId("start-game-button").click();
  await expect(page.getByTestId("game-state")).toHaveText("Running", { timeout: 15_000 });
  return page.getByTestId("terrain-preview");
}

async function foundCastle(page: Page, canvas: Locator): Promise<void> {
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("canvas has no bounding box");
  }

  const columns = 8;
  const rows = 8;
  const stepX = Math.floor((box.width - 80) / (columns - 1));
  const stepY = Math.floor((box.height - 150) / (rows - 1));
  for (let attempt = 0; attempt < columns * rows; attempt += 1) {
    const x = 40 + (attempt % columns) * stepX;
    const y = 80 + Math.floor(attempt / columns) * stepY;
    await canvas.click({ position: { x, y }, force: true });
    if (
      (await page.locator("#app").getAttribute("data-serfbound-world-has-castle")) === "true"
    ) {
      await expect(page.locator("#app")).toHaveAttribute("data-serfbound-world-has-castle", "true");
      return;
    }
  }

  throw new Error("no visible castle site found");
}

async function currentBuildButton(page: Page): Promise<number> {
  const raw = await page.locator("#app").getAttribute("data-serfbound-panel-buttons");
  if (raw === null) {
    throw new Error("panel button state is not published");
  }

  return Number(raw.split(",")[0]);
}

async function findTerrainPointForBuildButton(
  page: Page,
  canvas: Locator,
  buildButton: number,
): Promise<CanvasPoint> {
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("canvas has no bounding box");
  }

  const columns = 12;
  const rows = 9;
  const stepX = Math.floor((box.width - 80) / (columns - 1));
  const stepY = Math.floor((box.height - 200) / (rows - 1));
  const scrolls = [
    undefined,
    "ArrowRight",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowLeft",
    "ArrowUp",
    "ArrowUp",
    "ArrowRight",
  ] as const;

  for (const scroll of scrolls) {
    if (scroll !== undefined) {
      await page.keyboard.press(scroll);
    }

    for (let attempt = 0; attempt < columns * rows; attempt += 1) {
      const point = {
        x: 40 + (attempt % columns) * stepX,
        y: 80 + Math.floor(attempt / columns) * stepY,
      };
      await canvas.click({ position: point, force: true });
      if ((await currentBuildButton(page)) === buildButton) {
        return point;
      }
    }
  }

  throw new Error(`no visible terrain point found for build button ${buildButton}`);
}

async function publishedRect(page: Page, attribute: string): Promise<CssRect> {
  const raw = await page.locator("#app").getAttribute(attribute);
  if (raw === null) {
    throw new Error(`${attribute} is not published`);
  }

  const [x, y, width, height] = raw.split(",").map(Number);
  return { x: x!, y: y!, width: width!, height: height! };
}

test("large terrain opens advanced buildings but can cycle back to basic", async ({ page }) => {
  test.setTimeout(120_000);
  const app = page.locator("#app");
  const canvas = await importAndStart(page);
  await foundCastle(page, canvas);

  const largeSite = await findTerrainPointForBuildButton(page, canvas, 4);
  await page.waitForTimeout(500);
  await canvas.dblclick({ position: largeSite, force: true });
  await expect(app).toHaveAttribute("data-serfbound-popup", "buildAdv1");

  const popup = await publishedRect(page, "data-serfbound-popup-rect");
  const scale = popup.width / 144;
  const flip = { x: popup.x + 16 * scale, y: popup.y + 145 * scale };
  await canvas.click({ position: flip, force: true });
  await expect(app).toHaveAttribute("data-serfbound-popup", "buildAdv2");
  await canvas.click({ position: flip, force: true });
  await expect(app).toHaveAttribute("data-serfbound-popup", "buildBasic");

  const buildingCountBefore = Number(await app.getAttribute("data-serfbound-world-building-count"));
  const lumberjack = { x: popup.x + 30 * scale, y: popup.y + 87 * scale };
  await canvas.click({ position: lumberjack, force: true });
  await expect(app).toHaveAttribute("data-serfbound-command-type", "game.build-building");
  await expect(app).toHaveAttribute("data-serfbound-last-effect", "building-built");
  await expect(app).toHaveAttribute(
    "data-serfbound-world-building-count",
    String(buildingCountBefore + 1),
  );
});

test("small terrain opens basic buildings without the advanced-page flip", async ({ page }) => {
  test.setTimeout(120_000);
  const app = page.locator("#app");
  const canvas = await importAndStart(page);
  await foundCastle(page, canvas);

  const smallSite = await findTerrainPointForBuildButton(page, canvas, 3);
  await page.waitForTimeout(500);
  await canvas.dblclick({ position: smallSite, force: true });
  await expect(app).toHaveAttribute("data-serfbound-popup", "buildBasic");

  const popup = await publishedRect(page, "data-serfbound-popup-rect");
  const scale = popup.width / 144;
  const disabledFlip = { x: popup.x + 16 * scale, y: popup.y + 145 * scale };
  await canvas.click({ position: disabledFlip, force: true });
  await expect(app).toHaveAttribute("data-serfbound-popup", "buildBasic");
});

test("terrain double-click invokes flag and road primary actions", async ({ page }) => {
  test.setTimeout(120_000);
  const app = page.locator("#app");
  const canvas = await importAndStart(page);
  await foundCastle(page, canvas);

  const flagSite = await findTerrainPointForBuildButton(page, canvas, 1);
  const flagsBefore = Number(await app.getAttribute("data-serfbound-world-flag-count"));
  await page.waitForTimeout(500);
  await canvas.dblclick({ position: flagSite, force: true });
  await expect(app).toHaveAttribute("data-serfbound-command-type", "game.build-flag");
  await expect(app).toHaveAttribute("data-serfbound-last-effect", "world-flag-built");
  await expect(app).toHaveAttribute(
    "data-serfbound-world-flag-count",
    String(flagsBefore + 1),
  );

  await page.waitForTimeout(500);
  await canvas.dblclick({ position: flagSite, force: true });
  await expect(app).toHaveAttribute("data-serfbound-road-mode", "building");
});

test("terrain double-click can still open advanced buildings directly", async ({ page }) => {
  test.setTimeout(120_000);
  const app = page.locator("#app");
  const canvas = await importAndStart(page);
  await foundCastle(page, canvas);

  const largeSite = await findTerrainPointForBuildButton(page, canvas, 4);
  await page.waitForTimeout(500);
  await canvas.dblclick({ position: largeSite, force: true });
  await expect(app).toHaveAttribute("data-serfbound-popup", "buildAdv1");

  await canvas.click({ position: { x: 30, y: 300 }, force: true });
  await expect(app).not.toHaveAttribute("data-serfbound-popup", /.+/);
});
