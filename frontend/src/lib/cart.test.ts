import { afterEach, expect, test, vi } from "vitest";
import { addItem, setQuantity, removeItem, cartItemCount, cartTotalCents, lineSubtotalCents } from "./cart";
import { formatPrice } from "./money";
import type { Product } from "./types";

const p = (o: Partial<Product> = {}): Product => ({
  id: "a", name: "Pro Driver", category: "clubs", priceCents: 1999, stock: 5, imageUrl: null, description: "", ...o,
});
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

test("setQuantity ignores NaN and floors fractions", () => {
  const c = addItem([], p({ stock: 5 }));
  expect(setQuantity(c, "a", NaN)).toEqual(c);
  expect(setQuantity(c, "a", 0.5)).toEqual([]);
  expect(setQuantity(c, "a", 2.7)[0].quantity).toBe(2);
});

test("addItem refreshes stock and price on existing line", () => {
  const c = addItem([], p({ stock: 5 }));
  const n = addItem(c, p({ stock: 1, priceCents: 1000 }));
  expect(n[0]).toMatchObject({ maxQuantity: 1, unitPriceCents: 1000, quantity: 1 });
});
