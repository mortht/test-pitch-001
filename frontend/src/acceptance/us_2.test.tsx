import { test, expect } from "vitest";
import { filterProducts } from "../lib/filters";
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

test("all with empty query returns everything", () => {
  expect(filterProducts(ps, { category: "all", query: "" })).toEqual(ps);
});
test("category filter", () => {
  expect(filterProducts(ps, { category: "balls", query: "" }).map((p) => p.id)).toEqual(["2"]);
  expect(filterProducts(ps, { category: "apparel", query: "" })).toEqual([]);
});
test("case-insensitive substring", () => {
  expect(filterProducts(ps, { category: "all", query: "dRiV" }).map((p) => p.id)).toEqual(["1", "3"]);
});
test("combined", () => {
  expect(filterProducts(ps, { category: "clubs", query: "driver" }).map((p) => p.id)).toEqual(["1"]);
  expect(filterProducts(ps, { category: "bags", query: "driver" })).toEqual([]);
});
test("no match gives empty and input is not mutated", () => {
  const copy = [...ps];
  expect(filterProducts(ps, { category: "all", query: "zzz" })).toEqual([]);
  expect(ps).toEqual(copy);
});
