import { expect, test } from "@playwright/test";

import { storyboard } from "./support";

const STORYBOARD_URL =
  "https://storyboard.t3.storage.dev/dtinth/visual-storyboard/main/storyboards/example-spec-ts-swag-labs-checkout-flow.ndjson";

test("viewer works on mobile screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/?url=${encodeURIComponent(STORYBOARD_URL)}`);
  await page.waitForLoadState("networkidle");

  // Sidebar should be laid out above the main content
  const sidebarBox = await page.locator("aside").boundingBox();
  const mainBox = await page.locator("main").boundingBox();
  expect(sidebarBox!.y).toBeLessThan(mainBox!.y);

  // Tap the second frame in the filmstrip
  const secondFrame = page.getByRole("tab", { name: /Product listing/ });
  await expect(secondFrame).toBeVisible();
  await storyboard.capture("Mobile filmstrip", page);

  await secondFrame.click();
  await expect(page.getByRole("img", { name: "Product listing" })).toBeVisible();
  await storyboard.capture("Mobile frame detail", page);
});

test("viewer supports keyboard navigation between frames", async ({ page }) => {
  await page.goto(`/?url=${encodeURIComponent(STORYBOARD_URL)}`);
  await page.waitForLoadState("networkidle");

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
