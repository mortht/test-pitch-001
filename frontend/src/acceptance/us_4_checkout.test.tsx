import { test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
afterEach(cleanup);
import userEvent from "@testing-library/user-event";
import { CheckoutPage } from "../components/CheckoutPage";
import type { CartLine, PaymentResult } from "../lib/types";

const lines: CartLine[] = [
  { productId: "a", name: "Driver X", unitPriceCents: 10000, maxQuantity: 5, quantity: 2 },
  { productId: "b", name: "Ball Pack", unitPriceCents: 2550, maxQuantity: 5, quantity: 1 },
];

async function fill(u: ReturnType<typeof userEvent.setup>, card = "4242 4242 4242 4242") {
  await u.type(screen.getByLabelText("Name"), "Ann");
  await u.type(screen.getByLabelText("Email"), "ann@example.com");
  await u.type(screen.getByLabelText("Card number"), card);
  await u.type(screen.getByLabelText("Expiry (MM/YY)"), "12/99");
  await u.type(screen.getByLabelText("CVC"), "123");
}

test("renders summary and fields", () => {
  render(<CheckoutPage lines={lines} onPay={vi.fn()} />);
  expect(screen.getByRole("heading", { name: "Checkout" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Order summary" })).toBeInTheDocument();
  expect(screen.getByText(/Driver X/)).toBeInTheDocument();
  expect(screen.getByText(/Total:\s*€225\.50/)).toBeInTheDocument();
  for (const l of ["Name", "Email", "Card number", "Expiry (MM/YY)", "CVC"])
    expect(screen.getByLabelText(l)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Pay now" })).toBeInTheDocument();
});

test("invalid submit shows errors linked by aria-describedby, no onPay", async () => {
  const onPay = vi.fn();
  const u = userEvent.setup();
  render(<CheckoutPage lines={lines} onPay={onPay} />);
  await u.click(screen.getByRole("button", { name: "Pay now" }));
  for (const l of ["Name", "Email", "Card number", "Expiry (MM/YY)", "CVC"]) {
    const el = screen.getByLabelText(l);
    const id = el.getAttribute("aria-describedby");
    expect(id).toBeTruthy();
    const msg = document.getElementById(id!.split(" ")[0]);
    expect(msg?.textContent?.trim()).toBeTruthy();
  }
  expect(onPay).not.toHaveBeenCalled();
});

test("blur validates a field", async () => {
  const u = userEvent.setup();
  render(<CheckoutPage lines={lines} onPay={vi.fn()} />);
  await u.type(screen.getByLabelText("Email"), "bad");
  await u.tab();
  expect(screen.getByLabelText("Email").getAttribute("aria-describedby")).toBeTruthy();
});

test("processing state prevents double submit, then approved calls onPay with form", async () => {
  let resolve!: (r: PaymentResult) => void;
  const onPay = vi.fn(() => new Promise<PaymentResult>((r) => { resolve = r; }));
  const u = userEvent.setup();
  render(<CheckoutPage lines={lines} onPay={onPay} />);
  await fill(u);
  await u.click(screen.getByRole("button", { name: "Pay now" }));
  const btn = await screen.findByRole("button", { name: "Processing…" });
  expect(btn).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("Processing payment…");
  await u.click(btn);
  await u.type(screen.getByLabelText("CVC"), "{Enter}");
  expect(onPay).toHaveBeenCalledTimes(1);
  expect(onPay).toHaveBeenCalledWith(expect.objectContaining({ name: "Ann", email: "ann@example.com", cvc: "123" }));
  resolve({ status: "approved" });
});

test("declined shows alert and re-enables", async () => {
  const onPay = vi.fn().mockResolvedValue({ status: "declined", message: "Your card was declined." });
  const u = userEvent.setup();
  render(<CheckoutPage lines={lines} onPay={onPay} />);
  await fill(u, "4000 0000 0000 0002");
  await u.click(screen.getByRole("button", { name: "Pay now" }));
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("Payment declined: Your card was declined. Your cart has been kept.");
  await waitFor(() => expect(screen.getByRole("button", { name: "Pay now" })).toBeEnabled());
});

test("thrown error shows alert with message", async () => {
  const onPay = vi.fn().mockRejectedValue(new Error("Network exploded"));
  const u = userEvent.setup();
  render(<CheckoutPage lines={lines} onPay={onPay} />);
  await fill(u);
  await u.click(screen.getByRole("button", { name: "Pay now" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Network exploded");
  await waitFor(() => expect(screen.getByRole("button", { name: "Pay now" })).toBeEnabled());
});

test("empty cart", () => {
  render(<CheckoutPage lines={[]} onPay={vi.fn()} />);
  expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to shop" })).toBeInTheDocument();
  expect(screen.queryByLabelText("Card number")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Pay now" })).not.toBeInTheDocument();
});
