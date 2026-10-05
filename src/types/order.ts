export type PaymentMethod = "transfer" | "cash" | "whatsapp";
export type CheckoutPaymentMethod = Exclude<PaymentMethod, "whatsapp">;
export type PaymentStatus = "pending" | "confirmed" | "rejected" | "refunded";
export type OrderStatus =
  "new" | "confirmed" | "preparing" | "shipped" | "delivered" | "cancelled";
export interface CustomerData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}
export interface ShippingData {
  province: string;
  city: string;
  address: string;
  reference: string;
}
export interface CheckoutFormData {
  customer: CustomerData;
  shipping: ShippingData;
  paymentMethod: CheckoutPaymentMethod;
}
export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  quantity: number;
  variantId?: string;
  variantSku?: string;
  variantLabel?: string;
  size?: string;
  color?: string;
  measurement?: string;
  material?: string;
}
export interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  customerId?: string;
  customer: CustomerData;
  shipping: ShippingData;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  subtotal: number;
  shippingCost: number | null;
  discount: number;
  total: number;
  estimatedCost: number | null;
  estimatedProfit: number | null;
  notes: string[];
  inventoryCommitted: boolean;
}
export type StoreOrder = Order;
