import { afterEach, expect, test, vi } from "vitest";
import { createOrder, fetchProducts } from "./api";
import type { Product } from "./types";

const p = (o: Partial<Product> = {}): Product => ({
  id: "a", name: "Pro Driver", category: "clubs", priceCents: 1999, stock: 5, imageUrl: null, description: "", ...o,
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); localStorage.clear(); });

test("api", async () => {
  const f = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => [p()] })
    .mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ detail: "Out of stock" }) });
  vi.stubGlobal("fetch", f);
  expect(await fetchProducts()).toHaveLength(1);
  expect(f.mock.calls[0][0]).toBe("/api/products");
  const input = { customerName: "A", email: "a@b.co", items: [{ productId: "a", quantity: 1 }], cardNumber: "4242" } as never;
  await expect(createOrder(input)).rejects.toThrow("Out of stock");
  expect(f.mock.calls[1][0]).toBe("/api/orders");
  const sent = JSON.parse(f.mock.calls[1][1].body);
  expect(Object.keys(sent).sort()).toEqual(["customerName", "email", "items"]);
});
