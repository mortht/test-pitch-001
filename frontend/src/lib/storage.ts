import type { CartLine } from "./types";

export const CART_KEY = "golf-gear-cart";

export function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? (data as CartLine[]) : [];
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
