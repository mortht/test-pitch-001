import type { CheckoutForm, PaymentResult } from "./types";

export async function simulatePayment(
  form: CheckoutForm,
  { delayMs = 1500 }: { delayMs?: number } = {},
): Promise<PaymentResult> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  if (form.cardNumber.replace(/\s/g, "") === "4000000000000002") {
    return { status: "declined", message: "Your card was declined." };
  }
  return { status: "approved" };
}
