import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutPage } from "./CheckoutPage";
import { ConfirmationPage } from "./ConfirmationPage";

afterEach(cleanup);

const lines = [{ productId: "a", name: "Driver", unitPriceCents: 1999, maxQuantity: 5, quantity: 3 }];

async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Name"), "Ann");
  await user.type(screen.getByLabelText("Email"), "ann@example.com");
  await user.type(screen.getByLabelText("Card number"), "4242424242424242");
  await user.type(screen.getByLabelText("Expiry (MM/YY)"), "12/99");
  await user.type(screen.getByLabelText("CVC"), "123");
}

test("invalid submit shows errors, no onPay", async () => {
  const onPay = vi.fn();
  const user = userEvent.setup();
  render(<CheckoutPage lines={lines} onPay={onPay} />);
  expect(screen.getByText("Total: €59.97")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Pay now" }));
  expect(onPay).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Name")).toHaveAccessibleDescription("Name is required");
});

test("processing then declined", async () => {
  let resolve!: (v: { status: "declined"; message: string }) => void;
  const onPay = vi.fn(() => new Promise<any>((r) => (resolve = r)));
  const user = userEvent.setup();
  render(<CheckoutPage lines={lines} onPay={onPay} />);
  await fill(user);
  await user.click(screen.getByRole("button", { name: "Pay now" }));
  const btn = screen.getByRole("button", { name: "Processing…" });
  expect(btn).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("Processing payment…");
  await user.click(btn);
  expect(onPay).toHaveBeenCalledTimes(1);
  resolve({ status: "declined", message: "Nope." });
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Payment declined: Nope. Your cart has been kept.",
  );
  expect(screen.getByRole("button", { name: "Pay now" })).toBeEnabled();
});

test("thrown error shown", async () => {
  const user = userEvent.setup();
  render(<CheckoutPage lines={lines} onPay={vi.fn().mockRejectedValue(new Error("boom"))} />);
  await fill(user);
  await user.click(screen.getByRole("button", { name: "Pay now" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("boom");
});

test("empty cart", () => {
  render(<CheckoutPage lines={[]} onPay={vi.fn()} />);
  expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to shop" })).toHaveAttribute("href", "#/");
});

test("confirmation", () => {
  render(
    <ConfirmationPage
      order={{
        orderNumber: "GG-ABCD1234", customerName: "A", email: "a@b.co", totalCents: 5997,
        currency: "EUR", paymentSimulated: true, createdAt: "",
        items: [{ productId: "a", name: "Driver", unitPriceCents: 1999, quantity: 3, lineTotalCents: 5997 }],
      }}
    />,
  );
  expect(screen.getByRole("heading", { name: "Order confirmed" })).toBeInTheDocument();
  expect(screen.getByText("Order number: GG-ABCD1234")).toBeInTheDocument();
  expect(screen.getByText("Total: €59.97")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Continue shopping" })).toHaveAttribute("href", "#/");
});
