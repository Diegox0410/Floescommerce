import type { Order } from "../types/order";
import type { Product } from "../types/product";
import { safeNumber } from "../utils/productMetrics";
import type {
  PeriodRange,
  ProfitRow,
  RankKey,
  DailyPoint,
} from "./analyticsTypes";
import { inPeriod, dateKey, addDays, dayStart } from "./periods";
export const isValidSale = (order: Partial<Order>) =>
  order.orderStatus !== "cancelled" &&
  order.paymentStatus !== "rejected" &&
  order.paymentStatus !== "refunded" &&
  Array.isArray(order.items) &&
  order.items.some((i) => Math.floor(safeNumber(i.quantity)) > 0);
export const periodOrders = (orders: Order[], range: PeriodRange) =>
  orders.filter((o) => inPeriod(o.createdAt, range));
export const validSales = (orders: Order[], range: PeriodRange) =>
  periodOrders(orders, range).filter(isValidSale);
export function orderAmounts(order: Partial<Order>) {
  const items = Array.isArray(order.items) ? order.items : [];
  const gross = items.reduce(
    (sum, i) => sum + safeNumber(i.price) * Math.floor(safeNumber(i.quantity)),
    0,
  );
  const discount = Math.min(gross, safeNumber(order.discount));
  const cost = items.reduce(
    (sum, i) => sum + safeNumber(i.cost) * Math.floor(safeNumber(i.quantity)),
    0,
  );
  return {
    gross,
    discount,
    net: gross - discount,
    cost,
    profit: gross - discount - cost,
    units: items.reduce(
      (sum, i) => sum + Math.floor(safeNumber(i.quantity)),
      0,
    ),
  };
}
export function productProfitability(
  orders: Order[],
  products: Product[],
  range: PeriodRange,
): ProfitRow[] {
  const rows = new Map<string, ProfitRow>();
  const categoryById = new Map(products.map((p) => [p.id, p.category]));
  for (const order of validSales(orders, range)) {
    const a = orderAmounts(order);
    for (const item of order.items) {
      const units = Math.floor(safeNumber(item.quantity));
      if (!units) continue;
      const gross = safeNumber(item.price) * units;
      const revenue = gross * (a.gross > 0 ? 1 - a.discount / a.gross : 0);
      const cost = safeNumber(item.cost) * units;
      const row = rows.get(item.productId) ?? {
        id: item.productId,
        name: item.name || "Producto histórico",
        category: categoryById.get(item.productId) || "Sin categoría histórica",
        units: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        margin: 0,
      };
      row.units += units;
      row.revenue += revenue;
      row.cost += cost;
      row.profit += revenue - cost;
      row.margin = row.revenue > 0 ? (row.profit / row.revenue) * 100 : 0;
      rows.set(item.productId, row);
    }
  }
  return [...rows.values()];
}
export const rankProducts = (rows: ProfitRow[], key: RankKey) =>
  [...rows]
    .filter((r) => r.units > 0)
    .sort((a, b) => b[key] - a[key] || a.id.localeCompare(b.id));
export function categoryProfitability(rows: ProfitRow[]): ProfitRow[] {
  const grouped = new Map<string, ProfitRow>();
  for (const r of rows) {
    const row = grouped.get(r.category) ?? {
      id: r.category,
      name: r.category,
      category: r.category,
      units: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
      margin: 0,
    };
    row.units += r.units;
    row.revenue += r.revenue;
    row.cost += r.cost;
    row.profit += r.profit;
    row.margin = row.revenue > 0 ? (row.profit / row.revenue) * 100 : 0;
    grouped.set(r.category, row);
  }
  return rankProducts([...grouped.values()], "revenue");
}
export function dailySeries(orders: Order[], range: PeriodRange): DailyPoint[] {
  if (!range.start || range.start > range.end) return [];
  const totals = new Map<string, DailyPoint>();
  for (let d = dayStart(range.start); d <= range.end; d = addDays(d, 1)) {
    const date = dateKey(d);
    totals.set(date, {
      date,
      label: new Intl.DateTimeFormat("es-EC", {
        day: "numeric",
        month: "short",
      }).format(d),
      sales: 0,
      profit: 0,
      orders: 0,
    });
  }
  for (const o of validSales(orders, range)) {
    const row = totals.get(dateKey(new Date(o.createdAt)));
    if (row) {
      const a = orderAmounts(o);
      row.sales += a.net;
      row.profit += a.profit;
      row.orders++;
    }
  }
  return [...totals.values()];
}
