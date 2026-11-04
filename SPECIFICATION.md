# Specification: Golf Gear Shop

_The approved specification of run 589064eb (2026-11-04), kept up to date by agent-platform. Edit it freely and commit the edit: the next run reads it as it is._

A simple web app that sells golf gear. Shoppers browse a catalog, use a live-updating shopping cart, and check out through a mocked payment flow with no real charges.

## User stories

### US-1 (must)

As **shopper**, I want **to browse a catalog of golf gear (clubs, balls, bags, apparel, accessories)**, so that I can find items to buy.

Acceptance criteria:

- Catalog page lists products with name, image or placeholder, price and category
- Catalog is loaded from a static/seeded data set of at least 12 products
- Each product has an Add to cart button
- Out-of-stock products show 'Out of stock' and the add button is disabled

### US-2 (should)

As **shopper**, I want **to filter the catalog by category and search by name**, so that I can find gear quickly.

Acceptance criteria:

- Selecting a category shows only products in that category
- Typing in search filters by case-insensitive name substring
- No matches shows a 'No products found' message
- Clearing filters shows all products

### US-3 (must)

As **shopper**, I want **a live shopping cart that updates immediately without page reload**, so that I always see what I'm buying and the total.

Acceptance criteria:

- Adding a product adds a line with quantity 1; adding it again increments quantity
- Cart shows per-line subtotal, item count badge and overall total, updated instantly on every change
- User can change quantity (min 1, max available stock or 99) and remove a line
- Setting quantity to 0 or clicking remove deletes the line
- Empty cart shows 'Your cart is empty' and checkout is disabled
- Cart persists across page reloads in the same browser (localStorage)
- Totals are computed correctly to 2 decimals

### US-4 (must)

As **shopper**, I want **to check out with a mocked payment form**, so that I can complete a simulated purchase.

Acceptance criteria:

- Checkout shows order summary and a form with name, email, card number, expiry (MM/YY), CVC
- Validation: name required, email valid format, card number 13-19 digits (spaces allowed) passing Luhn, expiry in the future, CVC 3-4 digits; errors shown per field and submit blocked
- Submitting shows a processing state, then a simulated result after a short delay
- Test card 4242 4242 4242 4242 succeeds; test card 4000 0000 0000 0002 simulates a decline with a message and cart retained
- No real payment provider is called and no card data is stored or sent anywhere
- Double submission is prevented while processing

### US-5 (must)

As **shopper**, I want **an order confirmation after successful payment**, so that I know the purchase went through.

Acceptance criteria:

- Confirmation shows a generated order number, purchased items, and total
- Cart is emptied after success
- Confirmation indicates payment was simulated

## Non-functional requirements

- Cart updates render in under 100 ms with no page reload
- Responsive layout for desktop and mobile
- Basic accessibility: keyboard-operable controls, labelled form fields
- Payment is fully mocked; no card data is persisted or transmitted
- Unit tests cover cart logic, totals and payment validation (Luhn, expiry)

## Out of scope

- User accounts and login
- Real payment provider integration
- Shipping, tax and discount codes
- Admin product management
- Persistent server-side order history
- Email sending

## Open questions and assumptions

- Is a backend required? Assumed: no; a client-side app with seeded product data and localStorage cart.
- Which currency? Assumed: USD.
- Should tax or shipping be included in the total? Assumed: no, total is the sum of items.
- Should stock be decremented after purchase? Assumed: no, stock is static.

## Decisions

Answers to the open questions:
- Is a backend required? yes
- Which currency? euro
