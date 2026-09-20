import type { Order } from "../types/order";
import type { PeriodRange } from "./analyticsTypes";
import { isValidSale, validSales, orderAmounts } from "./salesMetrics";
export const customerKey = (o: Order) =>
  o.customerId ||
  (o.customer?.email?.trim().toLowerCase()
    ? `email:${o.customer.email.trim().toLowerCase()}`
    : o.customer?.phone?.replace(/\D/g, "")
      ? `phone:${o.customer.phone.replace(/\D/g, "")}`
      : "");
export function customerAnalytics(orders: Order[], range: PeriodRange) {
  const history = orders.filter(
    (o) =>
      isValidSale(o) &&
      customerKey(o) !== "" &&
      Date.parse(o.createdAt) <= range.end.getTime(),
  );
  const counts = new Map<string, number>(),
    first = new Map<string, number>(),
    lifetime = new Map<string, number>();
  for (const o of history) {
    const key = customerKey(o),
      date = Date.parse(o.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    first.set(key, Math.min(first.get(key) ?? date, date));
    lifetime.set(key, (lifetime.get(key) ?? 0) + orderAmounts(o).net);
  }
  const allCurrent = validSales(orders, range),
    current = allCurrent.filter((o) => customerKey(o) !== ""),
    unique = new Set(current.map(customerKey));
  const recurring = [...unique].filter((k) => (counts.get(k) ?? 0) > 1);
  const newCustomers = [...unique].filter(
    (k) => !range.start || (first.get(k) ?? 0) >= range.start.getTime(),
  );
  const firstOrder = new Map<string, string>();
  for (const o of [...history].sort(
    (a, b) =>
      a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  ))
    if (!firstOrder.has(customerKey(o))) firstOrder.set(customerKey(o), o.id);
  const recurringRevenue = current
    .filter((o) => firstOrder.get(customerKey(o)) !== o.id)
    .reduce((s, o) => s + orderAmounts(o).net, 0);
  const newRevenue = current
    .filter((o) => firstOrder.get(customerKey(o)) === o.id)
    .reduce((s, o) => s + orderAmounts(o).net, 0);
  return {
    uniqueCustomers: unique.size,
    unidentifiedOrders: allCurrent.length - current.length,
    newCustomers: newCustomers.length,
    recurringCustomers: recurring.length,
    recurringRevenue,
    newRevenue,
    averageTicket: allCurrent.length
      ? allCurrent.reduce((s, o) => s + orderAmounts(o).net, 0) /
        allCurrent.length
      : 0,
    averageLifetimeRevenue: lifetime.size
      ? [...lifetime.values()].reduce((s, v) => s + v, 0) / lifetime.size
      : 0,
  };
}
