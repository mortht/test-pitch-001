# Design: Golf Gear Shop

_The approved design of run 589064eb (2026-11-04), kept up to date by agent-platform. Edit it freely and commit the edit: the next run reads it as it is._

## Architecture

Single page app with a thin layered backend: React frontend (pure logic modules + presentational components + app shell with hash routing) served by a FastAPI backend that provides the seeded catalog and order confirmation API; payment is mocked entirely in the browser.

## Tech stack

- Stack: `web-react-python` (React 19.3 with a Python 3.14 FastAPI backend)
- TypeScript 7.0
- React 19.3
- Vite
- Vitest + Testing Library (jsdom)
- Python 3.14
- FastAPI 0.162.0
- uvicorn 0.54.0
- pytest
- Playwright (acceptance tests)

## Dependencies

None beyond the Python standard library and pytest, FastAPI 0.162.0, uvicorn 0.54.0 with websockets 17.3 (WebSocket routes) and httpx 0.28.1 (for FastAPI's TestClient); for the frontend React 19.3, TypeScript, Vite, Vitest with jsdom and Testing Library, and Playwright.

## Components

### backend

FastAPI app: seeded in-memory product catalog, GET /api/products, POST /api/orders (validates items against catalog, recomputes totals, generates order number, persists nothing, never accepts card data).

- Kind: backend
- Interface: `backend/app/main.py: app = FastAPI(); backend/app/catalog.py: PRODUCTS: list[Product], get_product(id) -> Product | None; GET /api/products -> Product[]; POST /api/orders body {customerName, email, items:[{productId, quantity}]} -> 201 Order | 400 {detail} | 422`

### frontend-core

Pure TypeScript logic in frontend/src/lib: types, euro formatting, cart operations and totals, catalog filtering, checkout validation (Luhn, expiry), mocked payment, localStorage cart persistence, API client.

- Kind: frontend
- Interface: `types.ts: Product, Category, CartLine, Order, CheckoutForm, CheckoutErrors, PaymentResult, CATEGORY_LABELS; money.ts: formatPrice(cents): string; cart.ts: addItem(cart, product), setQuantity(cart, productId, qty), removeItem(cart, productId), clearCart(), cartItemCount(cart), lineSubtotalCents(line), cartTotalCents(cart); filters.ts: filterProducts(products, {category: Category|'all', query}); validation.ts: luhnValid(digits), isExpiryInFuture(mmYY, now?), validateCheckout(form, now?): CheckoutErrors; payment.ts: simulatePayment(form, {delayMs?}): Promise<PaymentResult>; storage.ts: loadCart(): CartLine[], saveCart(cart); api.ts: fetchProducts(): Promise<Product[]>, createOrder({customerName, email, items}): Promise<Order>`

### frontend-ui

Presentational React components in frontend/src/components: catalog with filters and product cards, cart panel, checkout page with payment form, confirmation page.

- Kind: frontend
- Interface: `Catalog({products, onAdd}): heading 'Catalog', input label 'Search', select label 'Category' (options 'All categories','Clubs','Balls','Bags','Apparel','Accessories'), button 'Clear filters', text 'No products found'; ProductCard({product, onAdd}): article labelled by name heading, category, price, placeholder img alt=name, button 'Add to cart', text 'Out of stock'; CartPanel({lines, onQuantityChange, onRemove, onCheckout}): heading 'Your cart', input label 'Quantity for {name}', button 'Remove', 'Total: €X.XX', 'Your cart is empty', button 'Checkout'; CheckoutPage({lines, onPay}): heading 'Checkout', section 'Order summary', labels 'Name','Email','Card number','Expiry (MM/YY)','CVC', button 'Pay now'/'Processing…', status 'Processing payment…', alert 'Payment declined: …', link 'Back to shop'; ConfirmationPage({order}): heading 'Order confirmed', 'Order number: …', 'Total: €X.XX', 'This was a simulated payment. No real charge was made.', link 'Continue shopping'`
- Uses: frontend-core

### app

Assembled app: App.tsx root with hash routing, Header with cart badge, cart state (useReducer) persisted to localStorage, product loading, checkout orchestration (mock payment then createOrder), main.tsx entry, serve.sh.

- Kind: app
- Interface: `Routes: #/ (catalog + cart panel), #/checkout, #/confirmation; Header: title 'Golf Gear Shop', link 'Cart' with item count badge (aria-label 'Cart, N items'); texts 'Loading products…', 'Could not load products'`
- Uses: backend, frontend-core, frontend-ui

## Shared conventions

Currency: EUR. All money is integer cents (priceCents, unitPriceCents, lineTotalCents, totalCents); never use floats for sums. Display via formatPrice(cents) = new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR'}).format(cents/100) -> '€59.97', '€1,234.50'.

Product (JSON, camelCase, backend and frontend): {id: string (slug, e.g. 'pro-driver'), name: string, category: 'clubs'|'balls'|'bags'|'apparel'|'accessories', priceCents: int, stock: int (>=0, static, never decremented), imageUrl: string|null (all seeds use null; UI shows a placeholder, no external URLs), description: string}. CATEGORY_LABELS: clubs 'Clubs', balls 'Balls', bags 'Bags', apparel 'Apparel', accessories 'Accessories'. Seed (backend/app/catalog.py): >=12 products, every category present, >=1 with stock 0, >=1 with stock 1-5.

CartLine (frontend only): {productId, name, unitPriceCents, maxQuantity (= min(stock, 99)), quantity}. Cart = CartLine[] in insertion order. Persisted in localStorage key 'golf-gear-cart' as JSON array; corrupt/missing -> [].

POST /api/orders request: {customerName: string (non-empty), email: string, items: [{productId: string, quantity: int}]}; pydantic model with extra='forbid' (card fields -> 422). Response 201 Order: {orderNumber: 'GG-' + 8 uppercase alphanumerics, customerName, email, items: [{productId, name, unitPriceCents, quantity, lineTotalCents}], totalCents, currency: 'EUR', paymentSimulated: true, createdAt: ISO-8601}. Business errors -> 400 {detail: string}. No tax/shipping/discounts: total = sum of lines.

Checkout validation (frontend lib/validation.ts) error messages: name empty -> 'Name is required'; email not /^[^\s@]+@[^\s@]+\.[^\s@]+$/ -> 'Enter a valid email address'; card number after removing spaces not 13-19 digits or failing Luhn -> 'Enter a valid card number'; expiry not MM/YY with month 01-12 -> 'Enter a valid expiry date (MM/YY)'; expiry before current month -> 'Card has expired' (current month is valid); CVC not 3-4 digits -> 'Enter a valid CVC'. CheckoutForm: {name, email, cardNumber, expiry, cvc}; CheckoutErrors: partial map of same keys to message.

Mock payment (lib/payment.ts, browser only): simulatePayment waits delayMs (default 1500), then card digits '4000000000000002' -> {status:'declined', message:'Your card was declined.'}; any other valid card (e.g. 4242424242424242) -> {status:'approved'}. Card data is never sent over the network, never written to localStorage/sessionStorage, never logged. Only after approval the app calls createOrder with customerName, email, items.

Routing: hash routes '#/', '#/checkout', '#/confirmation' (no server-side SPA fallback needed). API base: same origin, paths '/api/...'.

Layout: backend package backend/app (main.py with `app`, catalog.py, orders.py; tests in backend/tests). Frontend: frontend/src/lib/*.ts, frontend/src/components/*.tsx, frontend/src/App.tsx, frontend/src/main.tsx; tests next to sources as *.test.ts(x). Use the stack's design system; accent color golf green #1f7a3d. Responsive: product grid + cart panel side by side on desktop, stacked under 768px.

Runtime data: none on the server (no database, no files, orders are not stored). The only persisted state is the browser's localStorage cart. Task 1 creates the root .gitignore (node_modules, frontend/dist, __pycache__, .venv, .pytest_cache).

## Risks

- Spec says no card data may be transmitted while a backend is required: resolved by mocking payment in the browser and sending only name, email and items to POST /api/orders (extra fields rejected).
- Cart lines store a price snapshot in localStorage; if seed prices change, a persisted cart may show stale prices, while the server-side order recomputes totals from the catalog.
- Expiry check depends on the current date; tests must inject 'now' to stay deterministic.
- Payment delay slows end-to-end tests; keep default delay short (1500 ms).
