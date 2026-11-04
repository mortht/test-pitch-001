import { afterEach, expect, test, vi } from "vitest";
import { addItem } from "./cart";
import { loadCart, saveCart } from "./storage";
import type { Product } from "./types";

const p = (o: Partial<Product> = {}): Product => ({
  id: "a", name: "Pro Driver", category: "clubs", priceCents: 1999, stock: 5, imageUrl: null, description: "", ...o,
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); localStorage.clear(); });

test("storage", () => {
  expect(loadCart()).toEqual([]);
  const c = addItem([], p());
  saveCart(c);
  expect(localStorage.getItem("golf-gear-cart")).toBe(JSON.stringify(c));
  expect(loadCart()).toEqual(c);
  localStorage.setItem("golf-gear-cart", "{bad");
  expect(loadCart()).toEqual([]);
});

test("loadCart rejects malformed lines", () => {
  for (const bad of [[1, null, {}], [{ productId: "a", name: "x", unitPriceCents: "1", maxQuantity: 5, quantity: 1 }],
    [{ productId: "a", name: "x", unitPriceCents: 1, maxQuantity: 2, quantity: 3 }], {}]) {
    localStorage.setItem("golf-gear-cart", JSON.stringify(bad));
    expect(loadCart()).toEqual([]);
  }
});
