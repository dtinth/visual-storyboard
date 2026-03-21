import { expect, test } from "@playwright/test";

test("viewer supports keyboard navigation between frames", async ({ page }) => {
  await page.goto("/?url=http://127.0.0.1:4174/storyboards/basic.ndjson");

  const firstCheckpoint = page.getByRole("tab", { name: /Landing state/ });
  const secondCheckpoint = page.getByRole("tab", { name: /Menu open/ });

  await expect(firstCheckpoint).toHaveAttribute("aria-selected", "true");
  await firstCheckpoint.focus();
  await page.keyboard.press("ArrowDown");

  await expect(secondCheckpoint).toBeFocused();
  await expect(secondCheckpoint).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText("Menu open");
  await expect(page.getByRole("img", { name: "Menu open" })).toBeVisible();
});
