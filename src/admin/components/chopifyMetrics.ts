export function ownerOrderMetrics(value: unknown) {
  const orders = Array.isArray(value) ? value.filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === "object" && !Array.isArray(entry)) : [];
  const paidTotals = new Map<string, number>();
  let incompletePaidOrders = 0;
  for (const order of orders) {
    if (order.paymentStatus !== "PAID" || ["CANCELLED", "REFUNDED"].includes(String(order.status))) continue;
    if (typeof order.grandTotalCents !== "number" || !Number.isInteger(order.grandTotalCents) || order.grandTotalCents < 0 || typeof order.currency !== "string" || !/^[A-Z]{3}$/.test(order.currency)) {
      incompletePaidOrders++; continue;
    }
    paidTotals.set(order.currency, (paidTotals.get(order.currency) ?? 0) + order.grandTotalCents);
  }
  return {
    ordersReturned: orders.length,
    paidOrders: orders.filter((order) => order.paymentStatus === "PAID" && !["CANCELLED", "REFUNDED"].includes(String(order.status))).length,
    deliveredOrders: orders.filter((order) => order.fulfillmentStatus === "DELIVERED").length,
    pendingOrders: orders.filter((order) => ["PENDING", "PENDING_REVIEW", "PARTIALLY_PAID"].includes(String(order.paymentStatus))).length,
    paidTotals: [...paidTotals].map(([currency, cents]) => ({ currency, cents })), incompletePaidOrders,
  };
}
