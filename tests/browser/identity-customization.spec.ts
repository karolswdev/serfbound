import { expect, test } from "@playwright/test";

// SB-30-05: a settler chooses a face and a banner — locally, instantly,
// persistently. Nothing here touches the network.

test("choosing an avatar and a guild persists across reloads", async ({ page }) => {
  await page.goto("/?seed=6235842872325272");
  const app = page.locator("#app");

  // Nothing chosen yet: the row shows the name alone.
  await expect(page.getByTestId("identity-name")).toHaveText("PLAYER");
  await expect(page.getByTestId("identity-avatar")).toBeHidden();
  await expect(page.getByTestId("identity-guild")).toBeHidden();

  // Open the picker and choose.
  await page.getByTestId("identity-picker").locator("summary").click();
  await page.locator("[data-avatar-id='smith']").click();
  await page.locator("[data-guild-id='stag']").click();

  await expect(page.getByTestId("identity-avatar")).toBeVisible();
  await expect(page.getByTestId("identity-guild-name")).toHaveText("Guild of the Stag");
  await expect(app).toHaveAttribute("data-serfbound-avatar", "smith");
  await expect(app).toHaveAttribute("data-serfbound-guild", "stag");
  await expect(page.locator("[data-avatar-id='smith']")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-avatar-id='knight']")).toHaveAttribute("aria-pressed", "false");

  // The choice is the player's, kept on the device.
  await page.reload();
  await expect(app).toHaveAttribute("data-serfbound-avatar", "smith", { timeout: 15_000 });
  await expect(app).toHaveAttribute("data-serfbound-guild", "stag");
  await expect(page.getByTestId("identity-avatar")).toBeVisible();
  await expect(page.getByTestId("identity-guild-name")).toHaveText("Guild of the Stag");
});
