import type { Category, Product } from "./types";

export function filterProducts(
  products: Product[],
  { category, query }: { category: Category | "all"; query: string },
): Product[] {
  const q = query.trim().toLowerCase();
  return products.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      (q === "" || p.name.toLowerCase().includes(q)),
  );
}
