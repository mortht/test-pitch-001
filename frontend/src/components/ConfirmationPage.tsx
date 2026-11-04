import type { Order } from "../lib/types";
import { formatPrice } from "../lib/money";

export function ConfirmationPage({ order }: { order: Order }) {
  return (
    <main className="container">
      <h1>Order confirmed</h1>
      <p>Order number: {order.orderNumber}</p>
      <ul className="stack">
        {order.items.map((i) => (
          <li key={i.productId} className="between">
            <span>
              {i.name} × {i.quantity}
            </span>
            <span>{formatPrice(i.lineTotalCents)}</span>
          </li>
        ))}
      </ul>
      <p className="total">Total: {formatPrice(order.totalCents)}</p>
      <p className="muted">This was a simulated payment. No real charge was made.</p>
      <p>
        <a href="#/">Continue shopping</a>
      </p>
    </main>
  );
}
