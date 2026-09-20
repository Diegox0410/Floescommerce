import type { Order, OrderItem } from "../types/order";
import type { CustomerMetrics } from "../types/customer";
import { safeNumber } from "./productMetrics";
export const getOrderSubtotal = (items: OrderItem[]) =>
  items.reduce(
    (sum, i) => sum + safeNumber(i.price) * safeNumber(i.quantity),
    0,
  );
export const getOrderEstimatedCost = (order: Pick<Order, "items">) =>
  order.items.reduce(
    (sum, i) => sum + safeNumber(i.cost) * safeNumber(i.quantity),
    0,
  );
// Delivery charge is treated as a pass-through, excluded from product profit.
export const getOrderEstimatedProfit = (
  order: Pick<Order, "items" | "discount">,
) =>
  getOrderSubtotal(order.items) -
  safeNumber(order.discount) -
  getOrderEstimatedCost(order);
export const getCustomerOrders = (id: string, orders: Order[]) =>
  orders
    .filter((o) => o.customerId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
export const getCustomerMetrics = (
  id: string,
  orders: Order[],
): CustomerMetrics => {
  const purchases = getCustomerOrders(id, orders).filter(
    (o) => o.orderStatus !== "cancelled",
  );
  const totalSpent = purchases.reduce((sum, o) => sum + o.total, 0);
  return {
    totalOrders: purchases.length,
    totalSpent,
    averageTicket: purchases.length ? totalSpent / purchases.length : 0,
    lastOrderAt: purchases[0]?.createdAt ?? null,
  };
};
export const orderStatusLabels = {
  new: "Nuevo",
  confirmed: "Confirmado",
  preparing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
} as const;
export const paymentStatusLabels = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  rejected: "Rechazado",
  refunded: "Reembolsado",
} as const;
