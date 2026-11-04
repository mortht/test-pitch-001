import { test, expect, vi, afterEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
afterEach(cleanup);
import userEvent from "@testing-library/user-event";
import { Catalog } from "../components/Catalog";
import type { Product } from "../lib/types";

const mk = (id: string, name: string, category: Product["category"], extra: Partial<Product> = {}): Product => ({
  id, name, category, priceCents: 12999, stock: 5, imageUrl: null, description: "d", ...extra,
});
const products = [
  mk("1", "Pro Driver", "clubs"),
  mk("2", "Tour Ball", "balls", { priceCents: 500, imageUrl: "/x.png" }),
  mk("3", "Sold Putter", "clubs", { stock: 0 }),
];

test("cards show name, category, price, placeholder", () => {
  render(<Catalog products={products} onAdd={() => {}} />);
  expect(screen.getByRole("heading", { name: "Catalog" })).toBeInTheDocument();
  const card = screen.getByRole("article", { name: "Pro Driver" });
  expect(within(card).getByText("Clubs")).toBeInTheDocument();
  expect(within(card).getByText("€129.99")).toBeInTheDocument();
  expect(within(card).getByRole("img", { name: "Pro Driver" })).toBeInTheDocument();
  const ball = screen.getByRole("article", { name: "Tour Ball" });
  expect(within(ball).getByText("€5.00")).toBeInTheDocument();
  expect(within(ball).getByText("Balls")).toBeInTheDocument();
});

test("add to cart calls onAdd with product", async () => {
  const onAdd = vi.fn();
  render(<Catalog products={products} onAdd={onAdd} />);
  const card = screen.getByRole("article", { name: "Tour Ball" });
  await userEvent.click(within(card).getByRole("button", { name: "Add to cart" }));
  expect(onAdd).toHaveBeenCalledTimes(1);
  expect(onAdd).toHaveBeenCalledWith(products[1]);
});

test("out of stock disabled, in stock enabled", async () => {
  const onAdd = vi.fn();
  render(<Catalog products={products} onAdd={onAdd} />);
  const sold = screen.getByRole("article", { name: "Sold Putter" });
  expect(within(sold).getByText("Out of stock")).toBeInTheDocument();
  const btn = within(sold).getByRole("button", { name: "Add to cart" });
  expect(btn).toBeDisabled();
  await userEvent.click(btn);
  expect(onAdd).not.toHaveBeenCalled();
  const ok = screen.getByRole("article", { name: "Pro Driver" });
  expect(within(ok).queryByText("Out of stock")).toBeNull();
  expect(within(ok).getByRole("button", { name: "Add to cart" })).toBeEnabled();
});

test("add button is keyboard operable", async () => {
  const onAdd = vi.fn();
  render(<Catalog products={[products[0]]} onAdd={onAdd} />);
  screen.getByRole("button", { name: "Add to cart" }).focus();
  await userEvent.keyboard("{Enter}");
  expect(onAdd).toHaveBeenCalledTimes(1);
});
