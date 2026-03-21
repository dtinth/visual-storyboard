import { expect } from "@playwright/test";

import { test } from "./fixtures";

test("example app", async ({ page, storyboard }) => {
  await page.goto("/");

  const heading = page.getByRole("heading", { name: "visual-storyboard sample producer" });
  await expect(heading).toBeVisible();

  const headingBox = await heading.boundingBox();
  await storyboard.createFrame("Homepage", {
    imageBuffer: await page.screenshot(),
    highlights: headingBox
      ? [
          {
            x: headingBox.x,
            y: headingBox.y,
            width: headingBox.width,
            height: headingBox.height,
            text: "h1",
          },
        ]
      : [],
    viewport: page.viewportSize()!,
    annotations: {
      ariaSnapshot: await page.locator("body").ariaSnapshot(),
    },
  });

  const link = page.getByRole("link", { name: "Sample NDJSON" });
  const linkBox = await link.boundingBox();
  await storyboard.createFrame("Ready to navigate", {
    imageBuffer: await page.screenshot(),
    highlights: linkBox
      ? [
          {
            x: linkBox.x,
            y: linkBox.y,
            width: linkBox.width,
            height: linkBox.height,
            text: "Sample NDJSON",
          },
        ]
      : [],
    viewport: page.viewportSize()!,
  });

  await link.click();
  await page.waitForLoadState("networkidle");

  await storyboard.createFrame("NDJSON contents", {
    imageBuffer: await page.screenshot(),
    highlights: [],
    viewport: page.viewportSize()!,
  });
});
