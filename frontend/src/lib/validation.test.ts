import { afterEach, expect, test, vi } from "vitest";
import { luhnValid, isExpiryInFuture, validateCheckout } from "./validation";
import type { CheckoutForm } from "./types";

const good: CheckoutForm = { name: "A", email: "a@b.co", cardNumber: "4242 4242 4242 4242", expiry: "12/99", cvc: "123" };

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); localStorage.clear(); });

test("luhn and expiry", () => {
  expect(luhnValid("4242424242424242")).toBe(true);
  expect(luhnValid("4242424242424241")).toBe(false);
  const now = new Date(2025, 5, 15);
  expect(isExpiryInFuture("06/25", now)).toBe(true);
  expect(isExpiryInFuture("05/25", now)).toBe(false);
  expect(isExpiryInFuture("00/30", now)).toBe(false);
  expect(isExpiryInFuture("13/30", now)).toBe(false);
  expect(isExpiryInFuture("1/30", now)).toBe(false);
});

test("validateCheckout", () => {
  expect(validateCheckout(good)).toEqual({});
  const e = validateCheckout({ name: " ", email: "x", cardNumber: "1234", expiry: "99/99", cvc: "12" });
  expect(e).toEqual({
    name: "Name is required", email: "Enter a valid email address", cardNumber: "Enter a valid card number",
    expiry: "Enter a valid expiry date (MM/YY)", cvc: "Enter a valid CVC",
  });
  expect(validateCheckout({ ...good, expiry: "01/20" }).expiry).toBe("Card has expired");
});
