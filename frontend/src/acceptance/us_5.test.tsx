import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
afterEach(cleanup);
import { ConfirmationPage } from "../components/ConfirmationPage";
import type { Order } from "../lib/types";

const order: Order = {
  orderNumber: "GG-12345",
  customerName: "Ann",
  email: "ann@example.com",
  items: [
    { productId: "a", name: "Driver X", unitPriceCents: 10000, quantity: 2, lineTotalCents: 20000 },
    { productId: "b", name: "Ball Pack", unitPriceCents: 2550, quantity: 1, lineTotalCents: 2550 },
  ],
  totalCents: 22550,
  currency: "EUR",
  paymentSimulated: true,
  createdAt: "2025-01-01T00:00:00Z",
};

test("confirmation content", () => {
  render(<ConfirmationPage order={order} />);
  expect(screen.getByRole("heading", { name: "Order confirmed" })).toBeInTheDocument();
  expect(screen.getByText(/Order number:\s*GG-12345/)).toBeInTheDocument();
  expect(screen.getByText(/Driver X/)).toBeInTheDocument();
  expect(screen.getByText(/Ball Pack/)).toBeInTheDocument();
  expect(screen.getByText(/€200\.00/)).toBeInTheDocument();
  expect(screen.getAllByText(/€25\.50/).length).toBeGreaterThan(0);
  expect(screen.getByText(/Total:\s*€225\.50/)).toBeInTheDocument();
  expect(screen.getByText("This was a simulated payment. No real charge was made.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Continue shopping" })).toHaveAttribute("href", "#/");
});
