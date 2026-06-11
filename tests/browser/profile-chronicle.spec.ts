import { expect, test } from "@playwright/test";

// SB-30-02: the chronicle — statistics, the campaign ledger, and the
// recent record, fully populated from local data with zero network.
// The profile store's schema is a public contract; the spec seeds it
// the way any past session would have written it.

const seededProfile = {
  schemaVersion: 1,
  storageKey: "current-profile",
  name: "KAROL",
  history: [
    { mode: "online", opponentName: "BOB", localPlayer: 0, result: "won", endedAtIso: "2026-06-11T10:00:00Z" },
    { mode: "hotseat", opponentName: "PLAYER2", localPlayer: 0, result: "won", endedAtIso: "2026-06-10T10:00:00Z" },
    { mode: "async-loopback", opponentName: "ALICE", localPlayer: 1, result: "lost", endedAtIso: "2026-06-09T10:00:00Z" },
  ],
  avatarId: "knight",
  guildId: "wolf",
  missionsCompleted: ["1", "2", "3"],
};

test("the chronicle renders the local record without a single network call", async ({ page }) => {
  // Dead API on purpose: any online call would fail loudly; we also
  // count every request that leaves for it.
  const onlineRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().startsWith("http://127.0.0.1:9")) {
      onlineRequests.push(request.url());
    }
  });

  await page.goto("/?seed=6235842872325272&api=http://127.0.0.1:9");
  await page.evaluate(async (profile) => {
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open("serfbound-profile", 1);
      open.onupgradeneeded = () => {
        if (!open.result.objectStoreNames.contains("profiles")) {
          open.result.createObjectStore("profiles");
        }
      };
      open.onsuccess = () => {
        const tx = open.result.transaction("profiles", "readwrite");
        tx.objectStore("profiles").put(profile, "current-profile");
        tx.oncomplete = () => {
          open.result.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      open.onerror = () => reject(open.error);
    });
  }, seededProfile);
  await page.reload();

  // The summary line and the identity restored from the seed.
  await expect(page.getByTestId("profile-chronicle")).toHaveText("3 matches recorded", {
    timeout: 15_000,
  });
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-avatar", "knight");

  // Open the chronicle: statistics, campaign, the record.
  await page.getByTestId("chronicle").locator("summary").click();
  await expect(page.getByTestId("chronicle-stats")).toContainText("2");
  await expect(page.locator(".chronicle__stat").first()).toContainText("won");
  await expect(page.getByTestId("chronicle-campaign")).toHaveText("3 of 31 missions won");
  await expect(page.locator(".chronicle__entry")).toHaveCount(3);
  await expect(page.locator(".chronicle__entry--won")).toHaveCount(2);
  await expect(page.locator(".chronicle__entry").first()).toContainText("BOB");
  await expect(page.locator(".chronicle__entry").first()).toContainText("Online");
  await expect(page.getByTestId("chronicle-rating")).toBeHidden();
  await expect(page.getByTestId("chronicle")).toContainText("never uploaded");

  // The whole journey cost zero online requests.
  expect(onlineRequests).toEqual([]);
});
