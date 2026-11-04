import { test, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartPanel } from "./CartPanel";

afterEach(cleanup);

const lines = [
  { productId: "a", name: "Driver", unitPriceCents: 1999, maxQuantity: 5, quantity: 3 },
];

function setup(l = lines) {
  const h = { onQuantityChange: vi.fn(), onRemove: vi.fn(), onCheckout: vi.fn() };
  const r = render(<CartPanel lines={l} {...h} />);
  return { h, ...r };
}

test("renders lines and total", () => {
  setup();
  expect(screen.getByRole("heading", { name: "Your cart" })).toBeInTheDocument();
  expect(screen.getByText("Total: €59.97")).toBeInTheDocument();
  expect(screen.getByText("3 items")).toBeInTheDocument();
  expect(screen.getByLabelText("Quantity for Driver")).toHaveAttribute("max", "5");
});

test("callbacks", async () => {
  const { h } = setup();
  await userEvent.click(screen.getByRole("button", { name: "Remove" }));
  expect(h.onRemove).toHaveBeenCalledWith("a");
  fireEvent.change(screen.getByLabelText("Quantity for Driver"), { target: { value: "0" } });
  expect(h.onQuantityChange).toHaveBeenCalledWith("a", 0);
  await userEvent.click(screen.getByRole("button", { name: "Checkout" }));
  expect(h.onCheckout).toHaveBeenCalled();
});

test("empty", () => {
  setup([]);
  expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Checkout" })).toBeDisabled();
});

test("rerender updates", () => {
  const { rerender, h } = setup();
  rerender(<CartPanel lines={[{ ...lines[0], quantity: 1 }]} {...h} />);
  expect(screen.getByText("Total: €19.99")).toBeInTheDocument();
});
