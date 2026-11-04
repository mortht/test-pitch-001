import { test, expect, beforeEach, afterEach, vi } from "vitest";
import {
  addItem, setQuantity, removeItem, clearCart, cartItemCount, lineSubtotalCents, cartTotalCents,
} from "../lib/cart";
import { formatPrice } from "../lib/money";
import { loadCart, saveCart } from "../lib/storage";
import { fetchProducts, createOrder } from "../lib/api";
import type { Product, CartLine } from "../lib/types";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartPanel } from "../components/CartPanel";

const p = (id: string, price: number, stock: number): Product => ({
  id, name: "N" + id, category: "clubs", priceCents: price, stock, imageUrl: null, description: "",
});

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

test("addItem adds and increments, caps at stock", () => {
  const prod = p("a", 1999, 2);
  let c = addItem([], prod);
  expect(c).toHaveLength(1);
  expect(c[0]).toMatchObject({ productId: "a", quantity: 1, unitPriceCents: 1999, maxQuantity: 2 });
  c = addItem(c, prod);
  expect(c[0].quantity).toBe(2);
  c = addItem(c, prod);
  expect(c[0].quantity).toBe(2);
  expect(c).toHaveLength(1);
});
test("max is 99", () => {
  const prod = p("a", 1, 500);
  let c = addItem([], prod);
  expect(c[0].maxQuantity).toBe(99);
  for (let i = 0; i < 120; i++) c = addItem(c, prod);
  expect(c[0].quantity).toBe(99);
});
test("out of stock is no-op", () => {
  expect(addItem([], p("a", 1, 0))).toEqual([]);
});
test("setQuantity clamps and removes", () => {
  const c = addItem(addItem([], p("a", 100, 5)), p("b", 200, 5));
  expect(setQuantity(c, "a", 50).find((l) => l.productId === "a")!.quantity).toBe(5);
  expect(setQuantity(c, "a", 3).find((l) => l.productId === "a")!.quantity).toBe(3);
  expect(setQuantity(c, "a", 0).map((l) => l.productId)).toEqual(["b"]);
  expect(setQuantity(c, "a", -2).map((l) => l.productId)).toEqual(["b"]);
});
test("removeItem and immutability", () => {
  const c = addItem(addItem([], p("a", 100, 5)), p("b", 200, 5));
  const snap = JSON.parse(JSON.stringify(c));
  expect(removeItem(c, "a").map((l) => l.productId)).toEqual(["b"]);
  setQuantity(c, "a", 4);
  setQuantity(c, "a", 0);
  addItem(c, p("a", 100, 5));
  expect(c).toEqual(snap);
  expect(clearCart()).toEqual([]);
});
test("count and totals exact", () => {
  let c = addItem([], p("a", 1999, 5));
  c = setQuantity(c, "a", 3);
  c = addItem(c, p("b", 10, 5));
  expect(cartItemCount(c)).toBe(4);
  expect(lineSubtotalCents(c[0])).toBe(5997);
  expect(cartTotalCents(c)).toBe(6007);
  expect(cartTotalCents([])).toBe(0);
  expect(cartItemCount([])).toBe(0);
});
test("formatPrice", () => {
  expect(formatPrice(5997)).toBe("€59.97");
  expect(formatPrice(123450)).toBe("€1,234.50");
  expect(formatPrice(0)).toBe("€0.00");
  expect(formatPrice(5)).toBe("€0.05");
  expect(formatPrice(100000000)).toBe("€1,000,000.00");
});
test("storage round trip and corrupt", () => {
  expect(loadCart()).toEqual([]);
  const c = addItem([], p("a", 100, 5));
  saveCart(c);
  expect(localStorage.getItem("golf-gear-cart")).not.toBeNull();
  expect(loadCart()).toEqual(c);
  localStorage.setItem("golf-gear-cart", "{not json");
  expect(loadCart()).toEqual([]);
});
test("fetchProducts ok and error detail", async () => {
  const f = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [p("a", 1, 1)] });
  vi.stubGlobal("fetch", f);
  expect(await fetchProducts()).toHaveLength(1);
  expect(String(f.mock.calls[0][0])).toContain("/api/products");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ detail: "boom" }) }));
  await expect(fetchProducts()).rejects.toThrow("boom");
});
test("createOrder posts without card fields, errors with detail", async () => {
  const f = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ orderNumber: "X" }) });
  vi.stubGlobal("fetch", f);
  const input = {
    customerName: "A", email: "a@b.co", items: [{ productId: "a", quantity: 2 }],
    cardNumber: "4242424242424242", cvc: "123", expiry: "12/40",
  } as any;
  await createOrder(input);
  const [url, init] = f.mock.calls[0];
  expect(String(url)).toContain("/api/orders");
  expect(init.method).toBe("POST");
  const body = JSON.parse(init.body);
  expect(body.customerName).toBe("A");
  expect(body.items).toEqual([{ productId: "a", quantity: 2 }]);
  expect(init.body).not.toMatch(/card|cvc|expiry|4242/i);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ detail: "Out of stock" }) }));
  await expect(createOrder(input)).rejects.toThrow("Out of stock");
});

const line = (id: string, name: string, price: number, qty: number, max = 5): CartLine => ({
  productId: id, name, unitPriceCents: price, maxQuantity: max, quantity: qty,
});
function setup(lines: CartLine[]) {
  const h = { onQuantityChange: vi.fn(), onRemove: vi.fn(), onCheckout: vi.fn() };
  const r = render(<CartPanel lines={lines} {...h} />);
  return { ...h, ...r };
}

test("CartPanel renders lines, total", () => {
  setup([line("a", "Driver", 1999, 3, 7), line("b", "Tee", 10, 1)]);
  expect(screen.getByRole("heading", { name: "Your cart" })).toBeInTheDocument();
  const q = screen.getByLabelText("Quantity for Driver") as HTMLInputElement;
  expect(q.type).toBe("number");
  expect(q.value).toBe("3");
  expect(q.min).toBe("0");
  expect(q.max).toBe("7");
  expect(screen.getByLabelText("Quantity for Tee")).toHaveValue(1);
  expect(screen.getByText("Driver")).toBeInTheDocument();
  expect(screen.getByText("€19.99")).toBeInTheDocument();
  expect(screen.getByText("€59.97")).toBeInTheDocument();
  expect(screen.getByText("Total: €60.07")).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(2);
  expect(screen.getByRole("button", { name: "Checkout" })).toBeEnabled();
  expect(screen.queryByText("Your cart is empty")).not.toBeInTheDocument();
});

test("CartPanel callbacks", async () => {
  const u = userEvent.setup();
  const { onQuantityChange, onRemove, onCheckout } = setup([line("a", "Driver", 100, 1), line("b", "Tee", 10, 2)]);
  const q = screen.getByLabelText("Quantity for Tee");
  fireEvent.change(q, { target: { value: "4" } });
  expect(onQuantityChange).toHaveBeenLastCalledWith("b", 4);
  await u.click(screen.getAllByRole("button", { name: "Remove" })[0]);
  expect(onRemove).toHaveBeenCalledWith("a");
  await u.click(screen.getByRole("button", { name: "Checkout" }));
  expect(onCheckout).toHaveBeenCalledTimes(1);
});

test("CartPanel entering 0", async () => {
  const { onQuantityChange } = setup([line("a", "Driver", 100, 1)]);
  fireEvent.change(screen.getByLabelText("Quantity for Driver"), { target: { value: "0" } });
  expect(onQuantityChange).toHaveBeenLastCalledWith("a", 0);
});

test("CartPanel empty", async () => {
  const u = userEvent.setup();
  const { onCheckout } = setup([]);
  expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Checkout" })).toBeDisabled();
  await u.click(screen.getByRole("button", { name: "Checkout" }));
  expect(onCheckout).not.toHaveBeenCalled();
  expect(screen.getByRole("heading", { name: "Your cart" })).toBeInTheDocument();
});

test("CartPanel rerender updates", () => {
  const h = { onQuantityChange: vi.fn(), onRemove: vi.fn(), onCheckout: vi.fn() };
  const { rerender } = render(<CartPanel lines={[line("a", "Driver", 1999, 1)]} {...h} />);
  expect(screen.getByText("Total: €19.99")).toBeInTheDocument();
  rerender(<CartPanel lines={[line("a", "Driver", 1999, 2)]} {...h} />);
  expect(screen.getByText("Total: €39.98")).toBeInTheDocument();
  expect(screen.getByText("€39.98", { selector: ":not(:has(*))" })).toBeInTheDocument();
  expect(screen.getByLabelText("Quantity for Driver")).toHaveValue(2);
  rerender(<CartPanel lines={[]} {...h} />);
  expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Checkout" })).toBeDisabled();
});
