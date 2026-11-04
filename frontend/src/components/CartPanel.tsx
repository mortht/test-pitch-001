import type { CartLine } from "../lib/types";
import { cartItemCount, cartTotalCents, lineSubtotalCents } from "../lib/cart";
import { formatPrice } from "../lib/money";

export interface CartPanelProps {
  lines: CartLine[];
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
}

export function CartPanel({ lines, onQuantityChange, onRemove, onCheckout }: CartPanelProps) {
  const count = cartItemCount(lines);
  return (
    <section aria-labelledby="cart-heading">
      <h2 id="cart-heading">Your cart</h2>
      {lines.length === 0 ? (
        <p className="muted">Your cart is empty</p>
      ) : (
        <ul className="stack">
          {lines.map((line) => (
            <li key={line.productId} className="card">
              <div className="between">
                <strong>{line.name}</strong>
                <span>{formatPrice(line.unitPriceCents)}</span>
              </div>
              <div className="row">
                <label htmlFor={`qty-${line.productId}`} className="visually-hidden">
                  Quantity for {line.name}
                </label>
                <input
                  id={`qty-${line.productId}`}
                  type="number"
                  min={0}
                  max={line.maxQuantity}
                  value={line.quantity}
                  onChange={(e) => {
                    const n = e.target.valueAsNumber;
                    if (Number.isFinite(n)) onQuantityChange(line.productId, n);
                  }}
                />
                <span>{formatPrice(lineSubtotalCents(line))}</span>
                <button type="button" className="secondary" onClick={() => onRemove(line.productId)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="muted">
        {count} {count === 1 ? "item" : "items"}
      </p>
      <p className="total">Total: {formatPrice(cartTotalCents(lines))}</p>
      <button type="button" disabled={lines.length === 0} onClick={onCheckout}>
        Checkout
      </button>
    </section>
  );
}
