import { expect, test } from "@playwright/test";

import { storyboard } from "./support";

test("example app", async ({ page }) => {
  await page.goto("/");

  const heading = page.getByRole("heading", { name: "visual-storyboard sample producer" });
  await expect(heading).toBeVisible();
  await storyboard.capture("Homepage", heading);

  const link = page.getByRole("link", { name: "Sample NDJSON" });
  await storyboard.capture("Ready to navigate", link);

  await link.click();
  await page.waitForLoadState("networkidle");
  await storyboard.capture("NDJSON contents", page);
});
