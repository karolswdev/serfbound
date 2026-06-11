import { expect, test } from "@playwright/test";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

// SB-26-04: the localized UI gate — ?lang=de drives the whole in-game
// surface through the German table (asserted via the notification
// pipeline, which renders the same strings the canvas draws), and the
// choice persists across reloads.

test("the game speaks German end to end and the choice persists", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/?seed=6235842872325272&window=512&lang=de");
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-language", "de");

  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(createDecodableGeneratedPaArchive()),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");

  // A hot-seat match drives the notice pipeline through the German
  // table: your-window, the hand-over countdown, the recap.
  await page.getByTestId("hotseat-button").click();
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-notification",
    "SPIELER 1 - DEIN ZUG",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-notification",
    /SPIELER 2 ENTER - \d+/,
    { timeout: 30_000 },
  );
  await page.keyboard.press("Enter");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-notification",
    /RÜCKBLICK - SPIELER 2 SIEHT ZU/,
  );
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-cor-mode", "your-window", {
    timeout: 30_000,
  });
  // The digest attribute speaks German too.
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-cor-digest",
    /ZUG 1 - SPIELER 1 ZOG/,
  );

  // The persisted choice survives a reload without ?lang.
  await page.goto("/?seed=6235842872325272");
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-language", "de");

  // The shell toggle switches back to English and persists.
  await page.getByTestId("language-button").click();
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-language", "en");
  await page.reload();
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-language", "en");
});
