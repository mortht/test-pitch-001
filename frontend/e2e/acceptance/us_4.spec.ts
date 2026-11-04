import { test, expect } from "@playwright/test";

async function firstProduct(request: any) {
  const products = await (await request.get("/api/products")).json();
  return products.find((p: any) => p.stock > 1);
}
const addFor = (page: any, name: string) =>
  page.getByRole("article", { name }).getByRole("button", { name: /add to cart/i });

async function toCheckout(page: any, request: any) {
  const p = await firstProduct(request);
  await page.goto("/");
  await addFor(page, p.name).click();
  await page.getByRole("button", { name: "Checkout" }).click();
  await expect(page).toHaveURL(/#\/checkout/);
  return p;
}
async function fill(page: any, o: any = {}) {
  const v = { name: "Ann Golfer", email: "ann@example.com", card: "4242 4242 4242 4242", exp: "12/99", cvc: "123", ...o };
  await page.getByLabel(/name/i).first().fill(v.name);
  await page.getByLabel(/email/i).fill(v.email);
  await page.getByLabel(/card number/i).fill(v.card);
  await page.getByLabel(/expiry/i).fill(v.exp);
  await page.getByLabel(/cvc/i).fill(v.cvc);
}
const pay = (page: any) => page.getByRole("button", { name: /^pay/i });

test("checkout shows summary and form", async ({ page, request }) => {
  const p = await toCheckout(page, request);
  await expect(page.getByText(p.name).first()).toBeVisible();
  for (const l of [/name/i, /email/i, /card number/i, /expiry/i, /cvc/i]) {
    await expect(page.getByLabel(l).first()).toBeVisible();
  }
  await expect(pay(page)).toBeVisible();
});

test("invalid input blocks submission with errors", async ({ page, request }) => {
  await toCheckout(page, request);
  let posted = 0;
  page.on("request", (r: any) => { if (r.method() === "POST") posted++; });
  await pay(page).click();
  await expect(page.getByRole("alert").first()).toBeVisible();
  expect(await page.getByRole("alert").count()).toBeGreaterThanOrEqual(5);

  const bad = [
    { name: " ", email: "a@b.co", card: "4242 4242 4242 4242", exp: "12/99", cvc: "123" },
    { name: "A", email: "not-an-email", card: "4242 4242 4242 4242", exp: "12/99", cvc: "123" },
    { name: "A", email: "a@b.co", card: "4242 4242 4242 4241", exp: "12/99", cvc: "123" },
    { name: "A", email: "a@b.co", card: "4242", exp: "12/99", cvc: "123" },
    { name: "A", email: "a@b.co", card: "4242 4242 4242 4242", exp: "01/20", cvc: "123" },
    { name: "A", email: "a@b.co", card: "4242 4242 4242 4242", exp: "13/99", cvc: "123" },
    { name: "A", email: "a@b.co", card: "4242 4242 4242 4242", exp: "12/99", cvc: "12" },
    { name: "A", email: "a@b.co", card: "4242 4242 4242 4242", exp: "12/99", cvc: "12345" },
  ];
  for (const b of bad) {
    await fill(page, b);
    await pay(page).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
    await expect(page.getByText("Order confirmed")).toHaveCount(0);
  }
  expect(posted).toBe(0);
  await expect(page).toHaveURL(/#\/checkout/);
});

test("decline keeps cart", async ({ page, request }) => {
  const p = await toCheckout(page, request);
  await fill(page, { card: "4000 0000 0000 0002" });
  await pay(page).click();
  await expect(page.getByText("Payment declined: Your card was declined. Your cart has been kept.")).toBeVisible();
  await expect(page).toHaveURL(/#\/checkout/);
  await page.goto("/#/");
  await expect(page.getByRole("link", { name: /^Cart, 1 items?$/ })).toBeVisible();
  await expect(page.getByLabel(`Quantity for ${p.name}`)).toHaveValue("1");
});

test("success: processing, one order, no card data sent, double click safe", async ({ page, request }) => {
  await toCheckout(page, request);
  const reqs: any[] = [];
  page.on("request", (r: any) => { if (r.url().includes("/api/")) reqs.push(r); });
  await fill(page);
  await pay(page).dblclick();
  await expect(page.getByText("Processing…").first()).toBeVisible();
  await expect(page.getByText("Order confirmed")).toBeVisible();
  const posts = reqs.filter((r) => r.method() === "POST");
  expect(posts.length).toBe(1);
  expect(posts[0].url()).toMatch(/\/api\/orders$/);
  const body = posts[0].postData() ?? "";
  expect(body).not.toContain("4242");
  expect(body).not.toMatch(/cvc|expiry|card/i);
  expect(Object.keys(JSON.parse(body)).sort()).toEqual(["customerName", "email", "items"]);
  expect(reqs.filter((r) => r.method() !== "POST" || !r.url().endsWith("/api/orders")).filter((r) => !/\/api\/products/.test(r.url()))).toHaveLength(0);
});

test("Pay disabled while processing", async ({ page, request }) => {
  await toCheckout(page, request);
  await fill(page);
  await pay(page).click();
  await expect(page.getByRole("button", { name: /processing/i })).toBeDisabled();
  await expect(page.getByText("Order confirmed")).toBeVisible();
});
