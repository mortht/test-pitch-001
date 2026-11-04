import { afterEach, expect, test, vi } from "vitest";
import { filterProducts } from "./filters";
import type { Product } from "./types";

const p = (o: Partial<Product> = {}): Product => ({
  id: "a", name: "Pro Driver", category: "clubs", priceCents: 1999, stock: 5, imageUrl: null, description: "", ...o,
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); localStorage.clear(); });

test("filters", () => {
  const list = [p(), p({ id: "b", name: "Tour Ball", category: "balls" })];
  expect(filterProducts(list, { category: "all", query: "" })).toHaveLength(2);
  expect(filterProducts(list, { category: "balls", query: "" })).toHaveLength(1);
  expect(filterProducts(list, { category: "all", query: "DRIVER" })[0].id).toBe("a");
  expect(filterProducts(list, { category: "balls", query: "driver" })).toHaveLength(0);
});
