import type { CartLine } from "./types";

export const CART_KEY = "golf-gear-cart";

const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);

function isValidLine(v: unknown): v is CartLine {
  if (typeof v !== "object" || v === null) return false;
  const l = v as Record<string, unknown>;
  return (
    typeof l.productId === "string" &&
    typeof l.name === "string" &&
    isInt(l.unitPriceCents) &&
    l.unitPriceCents >= 0 &&
    isInt(l.maxQuantity) &&
    isInt(l.quantity) &&
    l.quantity >= 1 &&
    l.quantity <= l.maxQuantity
  );
}

export function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data) || !data.every(isValidLine)) return [];
    return data as CartLine[];
  } catch {
    return [];
  }
}

export function saveCart(cart: CartLine[]): void {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    /* ignore */
  }
}
