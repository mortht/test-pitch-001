import { test, expect } from "@playwright/test";

test("confirmation after payment, cart emptied, also after reload", async ({ page, request }) => {
  const products = await (await request.get("/api/products")).json();
  const p = products.find((x: any) => x.stock > 1);
  await page.goto("/");
  await page.getByRole("article", { name: p.name }).getByRole("button", { name: /add to cart/i }).click();
  await page.getByRole("button", { name: "Checkout" }).click();
  await page.getByLabel(/name/i).first().fill("Bob Putter");
  await page.getByLabel(/email/i).fill("bob@example.com");
  await page.getByLabel(/card number/i).fill("4242424242424242");
  await page.getByLabel(/expiry/i).fill("12/99");
  await page.getByLabel(/cvc/i).fill("1234");
  await page.getByRole("button", { name: /^pay/i }).click();

  await expect(page.getByRole("heading", { name: "Order confirmed" })).toBeVisible();
  await expect(page).toHaveURL(/#\/confirmation/);
  await expect(page.getByText(/GG-[A-Z0-9]{8}\b/).first()).toBeVisible();
  await expect(page.getByText(p.name).first()).toBeVisible();
  await expect(page.getByText(/simulated/i).first()).toBeVisible();
  const total = (p.priceCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 });
  await expect(page.getByText("€" + total).first()).toBeVisible();

  await expect(page.getByRole("link", { name: /^Cart, 0 items$/ })).toBeVisible();
  await page.goto("/#/");
  await expect(page.getByText("Your cart is empty")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Your cart is empty")).toBeVisible();
  await expect(page.getByRole("link", { name: /^Cart, 0 items$/ })).toBeVisible();
});

test("confirmation without order shows Continue shopping", async ({ page }) => {
  await page.goto("/#/confirmation");
  const link = page.getByRole("link", { name: "Continue shopping" });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page.getByText("Your cart is empty")).toBeVisible();
});
