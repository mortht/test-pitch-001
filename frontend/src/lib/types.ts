export type Category = "clubs" | "balls" | "bags" | "apparel" | "accessories";

export const CATEGORY_LABELS: Record<Category, string> = {
  clubs: "Clubs",
  balls: "Balls",
  bags: "Bags",
  apparel: "Apparel",
  accessories: "Accessories",
};

export interface Product {
  id: string;
  name: string;
  category: Category;
  priceCents: number;
  stock: number;
  imageUrl: string | null;
  description: string;
}

export interface CartLine {
  productId: string;
  name: string;
  unitPriceCents: number;
  maxQuantity: number;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export interface Order {
  orderNumber: string;
  customerName: string;
  email: string;
  items: OrderItem[];
  totalCents: number;
  currency: string;
  paymentSimulated: boolean;
  createdAt: string;
}

export interface CheckoutForm {
  name: string;
  email: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
}

export type CheckoutErrors = Partial<Record<keyof CheckoutForm, string>>;

export type PaymentResult =
  | { status: "approved" }
  | { status: "declined"; message: string };
