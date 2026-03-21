import { expect, test } from "@playwright/test";

import { storyboard } from "./support";

test("swag labs checkout flow", async ({ page }) => {
  // Login
  await page.goto("/");
  await page.getByPlaceholder("Username").fill("standard_user");
  await page.getByPlaceholder("Password").fill("secret_sauce");
  const loginButton = page.getByRole("button", { name: "Login" });
  await storyboard.capture("Login page", loginButton);
  await loginButton.click();

  // Add items and go to cart
  await expect(page).toHaveURL(/inventory/);
  const inventoryList = page.locator(".inventory_list");
  await expect(inventoryList).toBeVisible();
  await storyboard.capture("Product listing", inventoryList);

  await page
    .locator(".inventory_item")
    .filter({ hasText: "Sauce Labs Backpack" })
    .getByRole("button", { name: /add to cart/i })
    .click();
  await page
    .locator(".inventory_item")
    .filter({ hasText: "Sauce Labs Bike Light" })
    .getByRole("button", { name: /add to cart/i })
    .click();
  await page.locator(".shopping_cart_link").click();

  // Checkout
  await expect(page).toHaveURL(/cart/);
  await page.getByRole("button", { name: "Checkout" }).click();
  await page.getByPlaceholder("First Name").fill("John");
  await page.getByPlaceholder("Last Name").fill("Doe");
  await page.getByPlaceholder("Zip/Postal Code").fill("12345");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Finish" }).click();

  // Confirmation
  await expect(page).toHaveURL(/checkout-complete/);
  const confirmation = page.locator(".checkout_complete_container");
  await expect(confirmation).toBeVisible();
  await storyboard.capture("Order confirmation", confirmation);
});
