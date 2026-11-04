import { test, expect } from "@playwright/test";

test("search filters case-insensitively, no match message, clear filters", async ({ page, request }) => {
  const products = await (await request.get("/api/products")).json();
  await page.goto("/");
  const addBtns = page.getByRole("button", { name: /add to cart/i });
  await expect(addBtns.first()).toBeVisible();
  const all = await addBtns.count();

  const search = page.getByLabel(/search/i);
  const name: string = products[0].name;
  await search.fill(name.toUpperCase());
  await expect(page.getByText(name).first()).toBeVisible();
  expect(await addBtns.count()).toBeLessThanOrEqual(all);

  await search.fill("zzzz-no-such-product-" + Date.now());
  await expect(page.getByText("No products found")).toBeVisible();
  await expect(addBtns).toHaveCount(0);

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByText("No products found")).toHaveCount(0);
  await expect(addBtns).toHaveCount(all);
  await expect(search).toHaveValue("");
});

test("category filter shows only that category", async ({ page, request }) => {
  const products = await (await request.get("/api/products")).json();
  const cats: string[] = [...new Set<string>(products.map((p: any) => p.category))];
  expect(cats.length).toBeGreaterThan(1);
  await page.goto("/");
  const sel = page.getByLabel(/category/i);
  await expect(sel).toBeVisible();
  const cat = cats[0];
  await sel.selectOption(cat);
  const inCat = products.filter((p: any) => p.category === cat);
  const other = products.find((p: any) => p.category !== cat);
  await expect(page.getByRole("heading", { name: inCat[0].name })).toBeVisible();
  await expect(page.getByRole("heading", { name: other.name })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /add to cart|out of stock/i })).toHaveCount(inCat.length);
});
