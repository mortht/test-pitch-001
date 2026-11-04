import type { Order, Product } from "./types";

async function failure(res: Response): Promise<Error> {
  let msg = `Request failed (${res.status})`;
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") msg = body.detail;
  } catch {
    /* keep default */
  }
  return new Error(msg);
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("/api/products");
  if (!res.ok) throw await failure(res);
  return res.json();
}

export async function createOrder(input: {
  customerName: string;
  email: string;
  items: { productId: string; quantity: number }[];
}): Promise<Order> {
  const body = {
    customerName: input.customerName,
    email: input.email,
    items: input.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
  };
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await failure(res);
  return res.json();
}
