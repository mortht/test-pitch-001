import { CATEGORY_LABELS, type Product } from "../lib/types";
import { formatPrice } from "../lib/money";

export function ProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  const headingId = `product-${product.id}-name`;
  const out = product.stock <= 0;
  return (
    <article className="card stack" aria-labelledby={headingId}>
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} />
      ) : (
        <div role="img" aria-label={product.name} className="summary muted">
          <span aria-hidden="true">No image</span>
        </div>
      )}
      <h3 id={headingId}>{product.name}</h3>
      <p><span className="badge">{CATEGORY_LABELS[product.category]}</span></p>
      <p className="total">{formatPrice(product.priceCents)}</p>
      {out && <p className="muted">Out of stock</p>}
      <button type="button" disabled={out} onClick={() => onAdd(product)}>Add to cart</button>
    </article>
  );
}
