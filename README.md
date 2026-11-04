# Golf Gear

A single-page golf shop. Browse a seeded product catalog, fill a cart, check out with a mocked card payment and get an order confirmation. A React frontend is served by a FastAPI backend in one process.

## Features

- Product catalog (seeded on the server) with category filter and name search.
- Cart with quantity limits (`min(stock, 99)`), persisted in the browser's `localStorage` under `golf-gear-cart`.
- Checkout form with client-side validation (name, email, card number with Luhn check, expiry MM/YY, CVC).
- Mock payment, in the browser only: card `4000000000000002` is declined, any other valid card (e.g. `4242424242424242`) is approved. Card data is never sent to the server or stored.
- After approval the app calls `POST /api/orders`; the server validates items against the catalog and returns an order (`GG-` plus 8 uppercase alphanumerics) with `paymentSimulated: true`.
- Hash routes: `#/`, `#/checkout`, `#/confirmation`.
- All money is EUR, in integer cents. Orders are not stored; there is no database.

## Requirements

- Python >= 3.14 with FastAPI 0.162.0, uvicorn 0.54.0, websockets 17.3, httpx 0.28.1 (declared in `pyproject.toml`)
- Node.js with npm; frontend: React 19.3, TypeScript 7.0, Vite 8, Vitest 5 with jsdom and Testing Library, Playwright (see `frontend/package.json`)

## Build and run

```sh
cd frontend && npm run build && cd ..   # type-checks, builds into frontend/dist
PORT=8000 ./serve.sh                    # uvicorn backend.app.main:app on 127.0.0.1
```

Open http://127.0.0.1:8000/. `serve.sh` builds nothing, so build first.

API examples:

```sh
curl http://127.0.0.1:8000/api/products
curl -X POST http://127.0.0.1:8000/api/orders -H 'Content-Type: application/json' \
  -d '{"customerName":"Ada","email":"ada@example.com","items":[{"productId":"pro-driver","quantity":1}]}'
```

`POST /api/orders` returns 201 with the order, 400 `{detail}` for business errors (empty order, unknown product, out of stock, quantity over stock) and 422 for malformed bodies (including any extra fields such as card data).
Any other GET path returns the file from `frontend/dist` if it exists, else `index.html`.

## Tests

```sh
python -m pytest                 # backend tests (tests/)
cd frontend && npm test          # frontend unit tests (Vitest)
```

The full suite, including the Playwright acceptance tests in `frontend/e2e/acceptance/`, is run by the project's `run_tests`.

## Project structure

- `serve.sh`, `pyproject.toml`: start script and Python project definition.
- `backend/app/main.py`: FastAPI `app`, `/api/products`, `/api/orders`, static frontend serving.
- `backend/app/catalog.py`: seeded products.
- `backend/app/orders.py`: order request models and order building/validation.
- `tests/`: backend tests (`tests/acceptance/` holds acceptance tests).
- `frontend/src/main.tsx`, `App.tsx`: entry point and app shell with hash routing.
- `frontend/src/components/`: Catalog, CatalogFilters, ProductCard, CartPanel, CheckoutPage, ConfirmationPage (tests alongside).
- `frontend/src/lib/`: pure logic: `cart`, `storage`, `filters`, `money` (price formatting), `validation`, `payment` (mock), `api`, `types`.
- `frontend/src/styles.css`: design tokens and styles.
- `frontend/src/acceptance/`, `frontend/e2e/acceptance/`: acceptance tests.
