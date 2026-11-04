import { useRef, useState } from "react";
import type { CartLine, CheckoutErrors, CheckoutForm, PaymentResult } from "../lib/types";
import { cartTotalCents, lineSubtotalCents } from "../lib/cart";
import { formatPrice } from "../lib/money";
import { validateCheckout } from "../lib/validation";

interface Props {
  lines: CartLine[];
  onPay: (form: CheckoutForm) => Promise<PaymentResult>;
}

const FIELDS: { key: keyof CheckoutForm; label: string; type: string; autoComplete: string }[] = [
  { key: "name", label: "Name", type: "text", autoComplete: "name" },
  { key: "email", label: "Email", type: "email", autoComplete: "email" },
  { key: "cardNumber", label: "Card number", type: "text", autoComplete: "off" },
  { key: "expiry", label: "Expiry (MM/YY)", type: "text", autoComplete: "off" },
  { key: "cvc", label: "CVC", type: "text", autoComplete: "off" },
];

export function CheckoutPage({ lines, onPay }: Props) {
  const [form, setForm] = useState<CheckoutForm>({
    name: "",
    email: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [processing, setProcessing] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const busy = useRef(false);

  if (lines.length === 0) {
    return (
      <main className="container">
        <h1>Checkout</h1>
        <p>Your cart is empty</p>
        <p>
          <a href="#/">Back to shop</a>
        </p>
      </main>
    );
  }

  const total = cartTotalCents(lines);

  function onBlur(key: keyof CheckoutForm) {
    const msg = validateCheckout(form)[key];
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[key] = msg;
      else delete next[key];
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    const found = validateCheckout(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    busy.current = true;
    setProcessing(true);
    setFailure(null);
    try {
      const result = await onPay(form);
      if (result.status === "declined") {
        setFailure(`Payment declined: ${result.message} Your cart has been kept.`);
      }
    } catch (err) {
      setFailure(err instanceof Error ? err.message : String(err));
    } finally {
      busy.current = false;
      setProcessing(false);
    }
  }

  return (
    <main className="container">
      <h1>Checkout</h1>
      <section aria-labelledby="order-summary-heading" className="summary">
        <h2 id="order-summary-heading">Order summary</h2>
        <ul>
          {lines.map((l) => (
            <li key={l.productId}>
              <span>
                {l.name} × {l.quantity}
              </span>
              <span>{formatPrice(lineSubtotalCents(l))}</span>
            </li>
          ))}
        </ul>
        <p className="total">Total: {formatPrice(total)}</p>
      </section>
      <form onSubmit={submit} noValidate aria-label="Payment">
        <h2>Payment details</h2>
        {FIELDS.map((f) => {
          const id = `checkout-${f.key}`;
          const err = errors[f.key];
          return (
            <div key={f.key}>
              <label htmlFor={id}>{f.label}</label>
              <input
                id={id}
                name={f.key}
                type={f.type}
                autoComplete={f.autoComplete}
                value={form[f.key]}
                disabled={processing}
                aria-invalid={err ? true : undefined}
                aria-describedby={err ? `${id}-error` : undefined}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                onBlur={() => onBlur(f.key)}
              />
              {err && (
                <small id={`${id}-error`} role="alert">
                  {err}
                </small>
              )}
            </div>
          );
        })}
        {processing && <p role="status">Processing payment…</p>}
        {failure && <p role="alert">{failure}</p>}
        <button type="submit" disabled={processing}>
          {processing ? "Processing…" : "Pay now"}
        </button>
      </form>
    </main>
  );
}
