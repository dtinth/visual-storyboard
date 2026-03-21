import { expect, test } from "@playwright/test";

import { storyboard } from "./support";

const STORYBOARD_URL =
  "https://storyboard.t3.storage.dev/dtinth/visual-storyboard/main/storyboards/example-spec-ts-swag-labs-checkout-flow.ndjson";

test("viewer supports keyboard navigation between frames", async ({ page }) => {
  await page.goto(`/?url=${encodeURIComponent(STORYBOARD_URL)}`);

  const firstFrame = page.getByRole("tab", { name: /Login page/ });
  const secondFrame = page.getByRole("tab", { name: /Product listing/ });

  await expect(firstFrame).toHaveAttribute("aria-selected", "true");
  await storyboard.capture("Viewing first frame", page);

  await firstFrame.focus();
  await page.keyboard.press("ArrowDown");

  await expect(secondFrame).toBeFocused();
  await expect(secondFrame).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText("Product listing");
  await expect(page.getByRole("img", { name: "Product listing" })).toBeVisible();
  await storyboard.capture("After keyboard navigation", page);
});
