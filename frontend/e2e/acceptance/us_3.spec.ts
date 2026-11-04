import { test, expect } from "@playwright/test";

async function inStock(request: any) {
  const products = await (await request.get("/api/products")).json();
  return products.filter((p: any) => p.stock > 1);
}
const money = (c: number) => "€" + (c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const badge = (page: any, n: number) =>
  page.getByRole("link", { name: n === 1 ? /^Cart, 1 items?$/ : new RegExp(`^Cart, ${n} items$`) });
const addFor = (page: any, name: string) =>
  page.getByRole("article", { name }).getByRole("button", { name: /add to cart/i });
const cartRegion = (page: any) => page.getByRole("region", { name: "Your cart" });

test("empty cart state", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Your cart is empty")).toBeVisible();
  await expect(page.getByRole("button", { name: "Checkout" })).toBeDisabled();
  await expect(badge(page, 0)).toBeVisible();
});

test("add, increment, change quantity, cap, persist, checkout, zero removes", async ({ page, request }) => {
  const p = (await inStock(request))[0];
  await page.goto("/");
  await addFor(page, p.name).click();
  await expect(badge(page, 1)).toBeVisible();
  await expect(page.getByText("Your cart is empty")).toHaveCount(0);
  await addFor(page, p.name).click();
  await expect(badge(page, 2)).toBeVisible();
  await expect(cartRegion(page).getByText(money(p.priceCents * 2)).first()).toBeVisible();

  const qty = page.getByLabel(`Quantity for ${p.name}`);
  await expect(qty).toHaveValue("2");

  const max = Math.min(p.stock, 99);
  await qty.fill(String(max + 5));
  await qty.blur();
  await expect(badge(page, max)).toBeVisible();
  await expect(cartRegion(page).getByText(`Total: ${money(p.priceCents * max)}`)).toBeVisible();

  await qty.fill("1");
  await qty.blur();
  await expect(badge(page, 1)).toBeVisible();

  await page.reload();
  await expect(badge(page, 1)).toBeVisible();
  await expect(page.getByLabel(`Quantity for ${p.name}`)).toHaveValue("1");
  await expect(cartRegion(page).getByText(`Total: ${money(p.priceCents)}`)).toBeVisible();

  const co = page.getByRole("button", { name: "Checkout" });
  await expect(co).toBeEnabled();
  await co.click();
  await expect(page).toHaveURL(/#\/checkout/);

  await page.goto("/#/");
  const q2 = page.getByLabel(`Quantity for ${p.name}`);
  await q2.fill("0");
  await expect(page.getByText("Your cart is empty")).toBeVisible();
  await expect(badge(page, 0)).toBeVisible();
});

test("remove button deletes line and persists", async ({ page, request }) => {
  const p = (await inStock(request))[0];
  await page.goto("/");
  await addFor(page, p.name).click();
  await cartRegion(page).getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("Your cart is empty")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Your cart is empty")).toBeVisible();
});

test("two products total is correct to 2 decimals", async ({ page, request }) => {
  const ps = await inStock(request);
  const [a, b] = [ps.find((x: any) => x.priceCents % 100 !== 0)!, ps[1]];
  await page.goto("/");
  await addFor(page, a.name).click();
  await addFor(page, b.name).click();
  await expect(badge(page, 2)).toBeVisible();
  await expect(cartRegion(page).getByText(`Total: ${money(a.priceCents + b.priceCents)}`)).toBeVisible();
  await cartRegion(page).getByRole("button", { name: "Remove" }).first().click();
  await cartRegion(page).getByRole("button", { name: "Remove" }).first().click();
  await expect(page.getByText("Your cart is empty")).toBeVisible();
});
