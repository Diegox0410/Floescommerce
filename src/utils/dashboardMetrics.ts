// Compatibility adapter: all commercial formulas now live in analytics.
import type { Product } from "../types/product";
import type { Order } from "../types/order";
import type { Customer } from "../types/customer";
import { businessMetrics } from "../analytics/businessMetrics";
import { dailySeries, rankProducts } from "../analytics/salesMetrics";
import { getPeriod } from "../analytics/periods";
export function getDashboardMetrics(
  products: Product[],
  orders: Order[],
  _customers: Customer[],
  now = new Date(),
) {
  const m = businessMetrics(
    products,
    orders,
    getPeriod("month", now),
    {
      monthlySalesGoal: 0,
      fixedCosts: 0,
      contributionMargin: null,
      scenarios: [],
    },
    now,
  );
  return {
    sales: m.finance.netRevenue,
    profit: m.finance.grossProfit,
    orderCount: m.finance.validOrders,
    newCustomers: m.customers.newCustomers,
    ticket: m.finance.averageOrderValue,
    margin: m.finance.grossMargin,
    inventoryValue: m.finance.inventoryCostValue,
    critical: m.inventory.low + m.inventory.out,
    chart: dailySeries(orders, getPeriod("7d", now)),
    topProducts: rankProducts(m.profitability, "revenue").slice(0, 4),
    alerts: m.alerts,
  };
}
