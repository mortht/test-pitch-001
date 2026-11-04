import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Catalog } from "./Catalog";
import type { Product } from "../lib/types";

afterEach(cleanup);

const mk = (id: string, name: string, category: Product["category"], stock = 5): Product => ({
  id, name, category, priceCents: 5997, stock, imageUrl: null, description: "",
});
const ps = [mk("a", "Pro Driver", "clubs"), mk("b", "Tour Ball", "balls", 0), mk("c", "Driver Cover", "accessories")];

test("renders cards, price, placeholder, out of stock", () => {
  render(<Catalog products={ps} onAdd={() => {}} />);
  expect(screen.getByRole("article", { name: "Pro Driver" })).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Tour Ball" })).toBeInTheDocument();
  expect(screen.getAllByText("€59.97")).toHaveLength(3);
  expect(screen.getByText("Out of stock")).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "Add to cart" })[1]).toBeDisabled();
});

test("add calls onAdd", async () => {
  const onAdd = vi.fn();
  render(<Catalog products={ps} onAdd={onAdd} />);
  await userEvent.click(screen.getAllByRole("button", { name: "Add to cart" })[0]);
  expect(onAdd).toHaveBeenCalledWith(ps[0]);
});

test("filters combine, empty state, clear", async () => {
  render(<Catalog products={ps} onAdd={() => {}} />);
  await userEvent.type(screen.getByLabelText("Search"), "DRIVER");
  expect(screen.getAllByRole("article")).toHaveLength(2);
  await userEvent.selectOptions(screen.getByLabelText("Category"), "Clubs");
  expect(screen.getAllByRole("article")).toHaveLength(1);
  await userEvent.selectOptions(screen.getByLabelText("Category"), "Balls");
  expect(screen.getByText("No products found")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(screen.getAllByRole("article")).toHaveLength(3);
  expect(screen.getByLabelText("Search")).toHaveValue("");
});
