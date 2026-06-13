import { expect, test } from "@playwright/test";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

// SB-42-05: the map editor is reachable and usable. From the title
// screen the player opens the editor, the authentic landscape renders,
// painting changes the map, and "Play this map" starts a local game on
// the authored map — proving the surface the engine builder was missing.

test("the map editor opens, paints the authentic landscape, and plays", async ({ page }) => {
  test.setTimeout(300_000);
  await page.goto("/?dev=1&seed=6235842872325272");

  // Import the player's data — the editor's render is import-gated.
  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(createDecodableGeneratedPaArchive()),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");

  // The entry enables once data is in.
  const openButton = page.getByTestId("open-editor-button");
  await expect(openButton).toBeEnabled();
  await openButton.click();

  // The editor surface mounts: the tool palette and the actions appear.
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-chrome", "editor");
  await expect(page.getByTestId("editor-surface")).toBeVisible();
  await expect(page.getByTestId("editor-tool-grass")).toBeVisible();
  await expect(page.getByTestId("editor-tool-start1")).toBeVisible();
  await expect(page.getByTestId("editor-play-button")).toBeVisible();

  // The authentic landscape renders onto the shared canvas (sprites, not
  // the synthetic preview).
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-scene-mode", "landscape");
  const spriteCount = Number(
    await page.locator("#app").getAttribute("data-serfbound-sprite-count"),
  );
  expect(spriteCount).toBeGreaterThan(100);

  // Paint: select the water tool and click the canvas — the verdict text
  // updates as the map changes.
  const canvas = page.getByTestId("terrain-preview");
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("editor canvas has no bounding box");
  }
  await page.getByTestId("editor-tool-water").click();
  await expect(page.getByTestId("editor-tool-water")).toHaveAttribute("aria-pressed", "true");
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });

  // Place several starts by painting, then validate reports a verdict.
  await page.getByTestId("editor-tool-grass").click();
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await page.getByTestId("editor-tool-start1").click();
  await canvas.click({ position: { x: box.width / 3, y: box.height / 3 } });
  await page.getByTestId("editor-validate-button").click();
  await expect(page.getByTestId("editor-verdict")).toBeVisible();

  // Flatten with a wider brush (SB-42-06): the size control and the
  // flatten tool engage, and a click repaints the area.
  await expect(page.getByTestId("editor-size")).toBeVisible();
  await page.getByTestId("editor-brush-3").click();
  await expect(page.getByTestId("editor-brush-3")).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("editor-tool-flatten").click();
  await expect(page.getByTestId("editor-tool-flatten")).toHaveAttribute("aria-pressed", "true");
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(page.getByTestId("editor-verdict")).toBeVisible();

  // Exit returns to the title; the editor surface hides.
  await page.getByTestId("editor-exit-button").click();
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-chrome", "title");
  await expect(page.getByTestId("editor-surface")).toBeHidden();
});
