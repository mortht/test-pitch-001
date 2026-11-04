import { useState } from "react";
import type { Category, Product } from "../lib/types";
import { filterProducts } from "../lib/filters";
import { CatalogFilters } from "./CatalogFilters";
import { ProductCard } from "./ProductCard";

export function Catalog({ products, onAdd }: { products: Product[]; onAdd: (p: Product) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const shown = filterProducts(products, { category, query });
  return (
    <section aria-labelledby="catalog-heading">
      <h2 id="catalog-heading">Catalog</h2>
      <CatalogFilters query={query} category={category} onQueryChange={setQuery}
        onCategoryChange={setCategory}
        onClear={() => { setQuery(""); setCategory("all"); }} />
      {shown.length === 0 ? (
        <p role="status">No products found</p>
      ) : (
        <ul className="grid">
          {shown.map((p) => (
            <li key={p.id}><ProductCard product={p} onAdd={onAdd} /></li>
          ))}
        </ul>
      )}
    </section>
  );
}
