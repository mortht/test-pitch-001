import { test, expect } from "@playwright/test";

test("catalog shows heading and at least 12 products with add buttons", async ({ page, request }) => {
  const products = await (await request.get("/api/products")).json();
  expect(products.length).toBeGreaterThanOrEqual(12);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Catalog" })).toBeVisible();
  await expect(page.getByRole("banner").getByText("Golf Gear Shop").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /add to cart/i }).first()).toBeVisible();
  const total = await page.getByRole("button", { name: /add to cart/i }).count();
  expect(total).toBeGreaterThanOrEqual(12 - products.filter((p: any) => p.stock === 0).length);
  await expect(page.getByText(products[0].name, { exact: false }).first()).toBeVisible();
});

test("failure shows error message", async ({ page }) => {
  await page.route("**/api/products", (r) => r.abort());
  await page.goto("/");
  await expect(page.getByText("Could not load products")).toBeVisible();
});

test("loading message shown while loading", async ({ page }) => {
  let release: () => void = () => {};
  const gate = new Promise<void>((r) => (release = r));
  await page.route("**/api/products", async (r) => {
    await gate;
    await r.continue();
  });
  await page.goto("/");
  await expect(page.getByText("Loading products…")).toBeVisible();
  release();
  await expect(page.getByText("Loading products…")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /add to cart/i }).first()).toBeVisible();
});

test("out-of-stock products show label and disabled button", async ({ page, request }) => {
  const products = await (await request.get("/api/products")).json();
  const oos = products.filter((p: any) => p.stock === 0);
  test.skip(oos.length === 0, "no out-of-stock product seeded");
  await page.goto("/");
  await expect(page.getByText("Out of stock").first()).toBeVisible();
  const card = page.getByRole("listitem").filter({ hasText: oos[0].name }).filter({ hasText: "Out of stock" }).last();
  await expect(card.getByRole("button", { name: /add to cart/i })).toBeDisabled();
});

test("layout has no horizontal scroll at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Catalog" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
