import type { CheckoutErrors, CheckoutForm } from "./types";

export function luhnValid(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

function parseExpiry(v: string): { month: number; year: number } | null {
  const m = /^(\d{2})\/(\d{2})$/.exec(v);
  if (!m) return null;
  const month = Number(m[1]);
  if (month < 1 || month > 12) return null;
  return { month, year: 2000 + Number(m[2]) };
}

export function isExpiryInFuture(mmYY: string, now: Date = new Date()): boolean {
  const e = parseExpiry(mmYY);
  if (!e) return false;
  const cur = now.getFullYear() * 12 + now.getMonth();
  return e.year * 12 + (e.month - 1) >= cur;
}

export function validateCheckout(form: CheckoutForm, now: Date = new Date()): CheckoutErrors {
  const errors: CheckoutErrors = {};
  if (form.name.trim() === "") errors.name = "Name is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email address";
  const digits = form.cardNumber.replace(/ /g, "");
  if (!/^\d{13,19}$/.test(digits) || !luhnValid(digits)) errors.cardNumber = "Enter a valid card number";
  if (!parseExpiry(form.expiry)) errors.expiry = "Enter a valid expiry date (MM/YY)";
  else if (!isExpiryInFuture(form.expiry, now)) errors.expiry = "Card has expired";
  if (!/^\d{3,4}$/.test(form.cvc)) errors.cvc = "Enter a valid CVC";
  return errors;
}
