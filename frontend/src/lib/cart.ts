import type { CartLine, Product } from "./types";

export function addItem(cart: CartLine[], product: Product): CartLine[] {
  const max = Math.min(product.stock, 99);
  if (max <= 0) return cart;
  const existing = cart.find((l) => l.productId === product.id);
  if (existing) {
    return cart.map((l) =>
      l.productId === product.id
        ? { ...l, quantity: Math.min(l.quantity + 1, l.maxQuantity) }
        : l,
    );
  }
  return [
    ...cart,
    {
      productId: product.id,
      name: product.name,
      unitPriceCents: product.priceCents,
      maxQuantity: max,
      quantity: 1,
    },
  ];
}

export function setQuantity(cart: CartLine[], productId: string, qty: number): CartLine[] {
  if (!(qty > 0)) return removeItem(cart, productId);
  const q = Math.floor(qty);
  return cart.map((l) =>
    l.productId === productId
      ? { ...l, quantity: Math.max(1, Math.min(q, l.maxQuantity)) }
      : l,
  );
}

export function removeItem(cart: CartLine[], productId: string): CartLine[] {
  return cart.filter((l) => l.productId !== productId);
}

export function clearCart(): CartLine[] {
  return [];
}

export function cartItemCount(cart: CartLine[]): number {
  return cart.reduce((n, l) => n + l.quantity, 0);
}

export function lineSubtotalCents(line: CartLine): number {
  return line.unitPriceCents * line.quantity;
}

export function cartTotalCents(cart: CartLine[]): number {
  return cart.reduce((n, l) => n + lineSubtotalCents(l), 0);
}
