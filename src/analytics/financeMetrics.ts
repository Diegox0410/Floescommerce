import type { Product } from "../types/product";
import type { Order } from "../types/order";
import type { FinanceMetrics, PeriodRange } from "./analyticsTypes";
import {
  periodOrders,
  validSales,
  orderAmounts,
  productProfitability,
} from "./salesMetrics";
import { inventoryMetrics } from "./inventoryMetrics";
import { customerAnalytics } from "./customerMetrics";
export function financeMetrics(
  products: Product[],
  orders: Order[],
  range: PeriodRange,
): FinanceMetrics {
  const total = periodOrders(orders, range),
    valid = validSales(orders, range),
    inventory = inventoryMetrics(products),
    rows = productProfitability(orders, products, range);
  const sums = valid.reduce(
    (s, o) => {
      const a = orderAmounts(o);
      s.gross += a.gross;
      s.net += a.net;
      s.cost += a.cost;
      s.units += a.units;
      return s;
    },
    { gross: 0, net: 0, cost: 0, units: 0 },
  );
  const profit = sums.net - sums.cost;
  const pricedRows = rows.filter((r) => r.revenue > 0);
  return {
    grossRevenue: sums.gross,
    netRevenue: sums.net,
    discounts: sums.gross - sums.net,
    costOfGoodsSold: sums.cost,
    grossProfit: profit,
    grossMargin: sums.net > 0 ? (profit / sums.net) * 100 : 0,
    averageOrderValue: valid.length ? sums.net / valid.length : 0,
    totalOrders: total.length,
    validOrders: valid.length,
    cancelledOrders: total.filter((o) => o.orderStatus === "cancelled").length,
    excludedOrders: total.length - valid.length,
    unitsSold: sums.units,
    averageProductMargin: pricedRows.length
      ? pricedRows.reduce((s, r) => s + r.margin, 0) / pricedRows.length
      : 0,
    customerLifetimeRevenue: customerAnalytics(orders, range)
      .averageLifetimeRevenue,
    inventoryCostValue: inventory.costValue,
    inventoryRetailValue: inventory.retailValue,
    inventoryPotentialProfit: inventory.potentialProfit,
  };
}
