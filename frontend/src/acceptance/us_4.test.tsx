import { test, expect, vi } from "vitest";
import { luhnValid, isExpiryInFuture, validateCheckout } from "../lib/validation";
import { simulatePayment } from "../lib/payment";
import type { CheckoutForm } from "../lib/types";

const now = new Date(2025, 5, 15); // June 2025
const good: CheckoutForm = {
  name: "Ann", email: "ann@example.com", cardNumber: "4242 4242 4242 4242", expiry: "06/25", cvc: "123",
};

test("luhn", () => {
  expect(luhnValid("4242424242424242")).toBe(true);
  expect(luhnValid("4242424242424241")).toBe(false);
  expect(luhnValid("4000000000000002")).toBe(true);
});
test("expiry", () => {
  expect(isExpiryInFuture("06/25", now)).toBe(true);
  expect(isExpiryInFuture("07/25", now)).toBe(true);
  expect(isExpiryInFuture("05/25", now)).toBe(false);
  expect(isExpiryInFuture("12/24", now)).toBe(false);
  expect(isExpiryInFuture("01/26", now)).toBe(true);
  for (const bad of ["00/30", "13/30", "1/30", "0630", "ab/cd", "", "06/2030", "06-30"])
    expect(isExpiryInFuture(bad, now)).toBe(false);
});
test("valid form gives no errors", () => {
  expect(validateCheckout(good, now)).toEqual({});
});
test("field errors", () => {
  expect(validateCheckout({ ...good, name: "" }, now).name).toBeTruthy();
  expect(validateCheckout({ ...good, name: "   " }, now).name).toBeTruthy();
  for (const email of ["", "foo", "a@b", "a b@c.de", "@x.com"])
    expect(validateCheckout({ ...good, email }, now).email).toBeTruthy();
  for (const cvc of ["", "12", "12345", "abc", "1 2"])
    expect(validateCheckout({ ...good, cvc }, now).cvc).toBeTruthy();
  expect(validateCheckout({ ...good, cvc: "1234" }, now).cvc).toBeUndefined();
  expect(validateCheckout({ ...good, expiry: "05/25" }, now).expiry).toBeTruthy();
  expect(validateCheckout({ ...good, expiry: "13/30" }, now).expiry).toBeTruthy();
});
test("card number rules", () => {
  const e = (cardNumber: string) => validateCheckout({ ...good, cardNumber }, now).cardNumber;
  expect(e("")).toBeTruthy();
  expect(e("4242424242424241")).toBeTruthy();
  expect(e("4242 4242 4242 424a")).toBeTruthy();
  expect(e("424242424242")).toBeTruthy(); // 12 digits
  expect(e("42424242424242424242")).toBeTruthy(); // 20 digits
  expect(e("4242424242424242")).toBeUndefined();
  expect(e("4222222222222")).toBeUndefined(); // 13 digits, luhn valid
});
test("19 digit luhn-valid accepted", () => {
  // 6304000000000000000 is a known 19-digit Luhn-valid number
  expect(luhnValid("6304000000000000000")).toBe(true);
  expect(validateCheckout({ ...good, cardNumber: "6304 0000 0000 0000 000" }, now).cardNumber).toBeUndefined();
});
test("simulatePayment outcomes after delay, no network", async () => {
  const f = vi.fn();
  vi.stubGlobal("fetch", f);
  vi.useFakeTimers();
  let done = false;
  const pr = simulatePayment(good, { delayMs: 1000 }).then((r) => { done = true; return r; });
  await vi.advanceTimersByTimeAsync(999);
  expect(done).toBe(false);
  await vi.advanceTimersByTimeAsync(1);
  expect(await pr).toEqual({ status: "approved" });
  const pd = simulatePayment({ ...good, cardNumber: "4000 0000 0000 0002" }, { delayMs: 500 });
  await vi.advanceTimersByTimeAsync(500);
  expect(await pd).toEqual({ status: "declined", message: "Your card was declined." });
  expect(f).not.toHaveBeenCalled();
  vi.useRealTimers();
});
