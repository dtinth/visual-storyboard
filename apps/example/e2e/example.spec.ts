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

  // Product listing
  await expect(page).toHaveURL(/inventory/);
  const inventoryList = page.locator(".inventory_list");
  await expect(inventoryList).toBeVisible();
  await storyboard.capture("Product listing", inventoryList);

  // Add two items to cart
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

  const cartBadge = page.locator(".shopping_cart_badge");
  await expect(cartBadge).toHaveText("2");
  await storyboard.capture("Items added to cart", cartBadge);

  // View cart
  await page.locator(".shopping_cart_link").click();
  await expect(page).toHaveURL(/cart/);
  const cartList = page.locator(".cart_list");
  await expect(cartList).toBeVisible();
  await storyboard.capture("Cart", cartList);

  // Checkout step 1
  await page.getByRole("button", { name: "Checkout" }).click();
  await expect(page).toHaveURL(/checkout-step-one/);
  await page.getByPlaceholder("First Name").fill("John");
  await page.getByPlaceholder("Last Name").fill("Doe");
  await page.getByPlaceholder("Zip/Postal Code").fill("12345");
  const checkoutForm = page.locator(".checkout_info");
  await storyboard.capture("Checkout information", checkoutForm);

  // Checkout step 2
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/checkout-step-two/);
  const orderSummary = page.locator(".checkout_summary_container");
  await expect(orderSummary).toBeVisible();
  await storyboard.capture("Order summary", orderSummary);

  // Complete order
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page).toHaveURL(/checkout-complete/);
  const confirmation = page.locator(".checkout_complete_container");
  await expect(confirmation).toBeVisible();
  await storyboard.capture("Order confirmation", confirmation);
});
