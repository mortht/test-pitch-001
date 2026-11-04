const fmt = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

export function formatPrice(cents: number): string {
  return fmt.format(cents / 100);
}
