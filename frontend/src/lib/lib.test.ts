import { afterEach, expect, test, vi } from "vitest";
import { addItem, setQuantity, removeItem, cartItemCount, cartTotalCents, lineSubtotalCents } from "./cart";
import { formatPrice } from "./money";
import { filterProducts } from "./filters";
import { luhnValid, isExpiryInFuture, validateCheckout } from "./validation";
import { simulatePayment } from "./payment";
import { loadCart, saveCart } from "./storage";
import { createOrder, fetchProducts } from "./api";
import type { Product, CheckoutForm } from "./types";

const p = (o: Partial<Product> = {}): Product => ({
  id: "a", name: "Pro Driver", category: "clubs", priceCents: 1999, stock: 5, imageUrl: null, description: "", ...o,
});
const good: CheckoutForm = { name: "A", email: "a@b.co", cardNumber: "4242 4242 4242 4242", expiry: "12/99", cvc: "123" };

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); localStorage.clear(); });

test("cart add/increment/cap/out of stock", () => {
  let c = addItem([], p({ stock: 2 }));
  expect(c[0].quantity).toBe(1);
  const orig = c;
  c = addItem(c, p({ stock: 2 }));
  expect(c[0].quantity).toBe(2);
  expect(orig[0].quantity).toBe(1);
  expect(addItem(c, p({ stock: 2 }))[0].quantity).toBe(2);
  expect(addItem([], p({ stock: 0 }))).toEqual([]);
  expect(addItem([], p({ stock: 500 }))[0].maxQuantity).toBe(99);
});

test("setQuantity and removeItem", () => {
  const c = addItem(addItem([], p({ stock: 3 })), p({ id: "b" }));
  expect(setQuantity(c, "a", 10)[0].quantity).toBe(3);
  expect(setQuantity(c, "a", 2)[0].quantity).toBe(2);
  expect(setQuantity(c, "a", 0).map((l) => l.productId)).toEqual(["b"]);
  expect(setQuantity(c, "a", -1)).toHaveLength(1);
  expect(removeItem(c, "b")).toHaveLength(1);
  expect(c).toHaveLength(2);
});

test("totals and format", () => {
  const c = setQuantity(addItem([], p({ stock: 5 })), "a", 3);
  expect(lineSubtotalCents(c[0])).toBe(5997);
  expect(cartTotalCents(c)).toBe(5997);
  expect(cartItemCount(c)).toBe(3);
  expect(formatPrice(5997)).toBe("€59.97");
  expect(formatPrice(123450)).toBe("€1,234.50");
});

test("filters", () => {
  const list = [p(), p({ id: "b", name: "Tour Ball", category: "balls" })];
  expect(filterProducts(list, { category: "all", query: "" })).toHaveLength(2);
  expect(filterProducts(list, { category: "balls", query: "" })).toHaveLength(1);
  expect(filterProducts(list, { category: "all", query: "DRIVER" })[0].id).toBe("a");
  expect(filterProducts(list, { category: "balls", query: "driver" })).toHaveLength(0);
});

test("luhn and expiry", () => {
  expect(luhnValid("4242424242424242")).toBe(true);
  expect(luhnValid("4242424242424241")).toBe(false);
  const now = new Date(2025, 5, 15);
  expect(isExpiryInFuture("06/25", now)).toBe(true);
  expect(isExpiryInFuture("05/25", now)).toBe(false);
  expect(isExpiryInFuture("00/30", now)).toBe(false);
  expect(isExpiryInFuture("13/30", now)).toBe(false);
  expect(isExpiryInFuture("1/30", now)).toBe(false);
});

test("validateCheckout", () => {
  expect(validateCheckout(good)).toEqual({});
  const e = validateCheckout({ name: " ", email: "x", cardNumber: "1234", expiry: "99/99", cvc: "12" });
  expect(e).toEqual({
    name: "Name is required", email: "Enter a valid email address", cardNumber: "Enter a valid card number",
    expiry: "Enter a valid expiry date (MM/YY)", cvc: "Enter a valid CVC",
  });
  expect(validateCheckout({ ...good, expiry: "01/20" }).expiry).toBe("Card has expired");
});

test("payment outcomes with delay", async () => {
  vi.useFakeTimers();
  const f = vi.fn();
  vi.stubGlobal("fetch", f);
  let done = false;
  const pr = simulatePayment(good, { delayMs: 1000 }).then((r) => { done = true; return r; });
  await vi.advanceTimersByTimeAsync(999);
  expect(done).toBe(false);
  await vi.advanceTimersByTimeAsync(1);
  expect(await pr).toEqual({ status: "approved" });
  const d = simulatePayment({ ...good, cardNumber: "4000 0000 0000 0002" }, { delayMs: 10 });
  await vi.advanceTimersByTimeAsync(10);
  expect(await d).toEqual({ status: "declined", message: "Your card was declined." });
  expect(f).not.toHaveBeenCalled();
});

test("storage", () => {
  expect(loadCart()).toEqual([]);
  const c = addItem([], p());
  saveCart(c);
  expect(localStorage.getItem("golf-gear-cart")).toBe(JSON.stringify(c));
  expect(loadCart()).toEqual(c);
  localStorage.setItem("golf-gear-cart", "{bad");
  expect(loadCart()).toEqual([]);
});

test("api", async () => {
  const f = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => [p()] })
    .mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ detail: "Out of stock" }) });
  vi.stubGlobal("fetch", f);
  expect(await fetchProducts()).toHaveLength(1);
  expect(f.mock.calls[0][0]).toBe("/api/products");
  const input = { customerName: "A", email: "a@b.co", items: [{ productId: "a", quantity: 1 }], cardNumber: "4242" } as never;
  await expect(createOrder(input)).rejects.toThrow("Out of stock");
  expect(f.mock.calls[1][0]).toBe("/api/orders");
  expect(f.mock.calls[1][1].body).not.toContain("card");
});
