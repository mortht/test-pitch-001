import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
afterEach(cleanup);
import userEvent from "@testing-library/user-event";
import { Catalog } from "../components/Catalog";
import type { Product } from "../lib/types";

const mk = (id: string, name: string, category: Product["category"]): Product => ({
  id, name, category, priceCents: 100, stock: 5, imageUrl: null, description: "",
});
const ps = [
  mk("1", "Pro Driver", "clubs"),
  mk("2", "Tour Ball", "balls"),
  mk("3", "Driver Cover", "accessories"),
  mk("4", "Cart Bag", "bags"),
];
const names = () => screen.queryAllByRole("article").map((a) => a.getAttribute("aria-labelledby") ? a.querySelector("h2,h3")?.textContent : "");

test("category options", () => {
  render(<Catalog products={ps} onAdd={() => {}} />);
  const sel = screen.getByLabelText("Category");
  const opts = Array.from(sel.querySelectorAll("option")).map((o) => o.textContent);
  expect(opts).toEqual(["All categories", "Clubs", "Balls", "Bags", "Apparel", "Accessories"]);
  expect(names()).toHaveLength(4);
});

test("category select filters", async () => {
  render(<Catalog products={ps} onAdd={() => {}} />);
  await userEvent.selectOptions(screen.getByLabelText("Category"), "Balls");
  expect(names()).toEqual(["Tour Ball"]);
});

test("search is case-insensitive substring, combines with category", async () => {
  render(<Catalog products={ps} onAdd={() => {}} />);
  await userEvent.type(screen.getByLabelText("Search"), "dRiV");
  expect(names()).toEqual(["Pro Driver", "Driver Cover"]);
  await userEvent.selectOptions(screen.getByLabelText("Category"), "Clubs");
  expect(names()).toEqual(["Pro Driver"]);
});

test("no matches and clear filters", async () => {
  render(<Catalog products={ps} onAdd={() => {}} />);
  await userEvent.type(screen.getByLabelText("Search"), "zzz");
  expect(screen.getByText("No products found")).toBeInTheDocument();
  expect(screen.queryAllByRole("article")).toHaveLength(0);
  await userEvent.selectOptions(screen.getByLabelText("Category"), "Bags");
  await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(screen.queryByText("No products found")).toBeNull();
  expect(screen.getByLabelText("Search")).toHaveValue("");
  expect(screen.getByLabelText("Category")).toHaveValue("all");
  expect(names()).toHaveLength(4);
});

test("clear filters is keyboard operable", async () => {
  render(<Catalog products={ps} onAdd={() => {}} />);
  await userEvent.type(screen.getByLabelText("Search"), "bag");
  expect(screen.queryAllByRole("article")).toHaveLength(1);
  screen.getByRole("button", { name: "Clear filters" }).focus();
  await userEvent.keyboard(" ");
  expect(screen.queryAllByRole("article")).toHaveLength(4);
});
