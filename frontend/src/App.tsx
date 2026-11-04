import { useEffect, useReducer, useState } from "react";
import type { CartLine, CheckoutForm, Order, PaymentResult, Product } from "./lib/types";
import { addItem, cartItemCount, clearCart, removeItem, setQuantity } from "./lib/cart";
import { loadCart, saveCart } from "./lib/storage";
import { createOrder, fetchProducts } from "./lib/api";
import { simulatePayment } from "./lib/payment";
import { Catalog } from "./components/Catalog";
import { CartPanel } from "./components/CartPanel";
import { CheckoutPage } from "./components/CheckoutPage";
import { ConfirmationPage } from "./components/ConfirmationPage";

type Action =
  | { type: "add"; product: Product }
  | { type: "setQuantity"; productId: string; quantity: number }
  | { type: "remove"; productId: string }
  | { type: "clear" };

function reducer(cart: CartLine[], a: Action): CartLine[] {
  switch (a.type) {
    case "add": return addItem(cart, a.product);
    case "setQuantity": return setQuantity(cart, a.productId, a.quantity);
    case "remove": return removeItem(cart, a.productId);
    case "clear": return clearCart();
  }
}

function currentRoute(): string {
  const h = window.location.hash.replace(/^#/, "");
  return h === "/checkout" || h === "/confirmation" ? h : "/";
}

export function App() {
  const [cart, dispatch] = useReducer(reducer, undefined, loadCart);
  const [route, setRoute] = useState(currentRoute);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => saveCart(cart), [cart]);
  useEffect(() => {
    const on = () => setRoute(currentRoute());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  useEffect(() => {
    let live = true;
    fetchProducts().then(
      (p) => live && setProducts(p),
      () => live && setLoadError(true),
    );
    return () => { live = false; };
  }, []);

  async function pay(form: CheckoutForm): Promise<PaymentResult> {
    const result = await simulatePayment(form);
    if (result.status === "approved") {
      const created = await createOrder({
        customerName: form.name,
        email: form.email,
        items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      });
      setOrder(created);
      dispatch({ type: "clear" });
      window.location.hash = "#/confirmation";
    }
    return result;
  }

  const count = cartItemCount(cart);
  let page;
  if (route === "/checkout") {
    page = <CheckoutPage lines={cart} onPay={pay} />;
  } else if (route === "/confirmation") {
    page = order ? (
      <ConfirmationPage order={order} />
    ) : (
      <main className="container">
        <h1>No order to show</h1>
        <p><a href="#/">Continue shopping</a></p>
      </main>
    );
  } else {
    let catalog;
    if (loadError) catalog = <p role="alert">Could not load products</p>;
    else if (!products) catalog = <p role="status">Loading products…</p>;
    else catalog = <Catalog products={products} onAdd={(product) => dispatch({ type: "add", product })} />;
    page = (
      <main className="container layout">
        <div>{catalog}</div>
        <CartPanel
          lines={cart}
          onQuantityChange={(productId, quantity) => dispatch({ type: "setQuantity", productId, quantity })}
          onRemove={(productId) => dispatch({ type: "remove", productId })}
          onCheckout={() => { window.location.hash = "#/checkout"; }}
        />
      </main>
    );
  }

  return (
    <>
      <header className="site-header">
        <nav className="container">
          <a href="#/"><strong>Golf Gear Shop</strong></a>
          <a href="#/" aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}>
            Cart <span className="badge">{count}</span>
          </a>
        </nav>
      </header>
      {page}
    </>
  );
}
