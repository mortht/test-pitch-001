import { afterEach, expect, test, vi } from "vitest";
import { simulatePayment } from "./payment";
import type { CheckoutForm } from "./types";

const good: CheckoutForm = { name: "A", email: "a@b.co", cardNumber: "4242 4242 4242 4242", expiry: "12/99", cvc: "123" };

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); localStorage.clear(); });

test("payment outcomes with delay", async () => {
  vi.useFakeTimers();
  const f = vi.fn();
  vi.stubGlobal("fetch", f);
  let done = false;
  const pr = simulatePayment(good, { delayMs: 1000 }).then((r) => { done = true; return r; });
  await vi.advanceTimersByTimeAsync(999);
  expect(done).toBe(false);
  await vi.advanceTimersByTimeAsync(1);
  expect(await pr).toEqual({ status: "approved" });
  const d = simulatePayment({ ...good, cardNumber: "4000 0000 0000 0002" }, { delayMs: 10 });
  await vi.advanceTimersByTimeAsync(10);
  expect(await d).toEqual({ status: "declined", message: "Your card was declined." });
  expect(f).not.toHaveBeenCalled();
});
