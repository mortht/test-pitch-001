import { expect, test } from "vitest";
import { formatPrice } from "./money";

test("formatPrice", () => {
  expect(formatPrice(5997)).toBe("€59.97");
  expect(formatPrice(123450)).toBe("€1,234.50");
});
