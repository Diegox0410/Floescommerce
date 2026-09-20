import type { Product } from "../types/product";
import type { Order } from "../types/order";
import type { AdminAlert } from "../admin/types/admin";
import type { BusinessSettings } from "../store/businessSettingsStore";
import type { PeriodRange, ProjectionInput } from "./analyticsTypes";
import { financeMetrics } from "./financeMetrics";
import { inventoryMetrics, inventoryPlan } from "./inventoryMetrics";
import { customerAnalytics } from "./customerMetrics";
import {
  productProfitability,
  categoryProfitability,
  dailySeries,
  isValidSale,
} from "./salesMetrics";
import { getPeriod, previousPeriod, percentChange } from "./periods";
import {
  projectionEngine,
  scenarioProjection,
  breakEvenRevenue,
} from "./projectionEngine";
export function businessMetrics(
  products: Product[],
  orders: Order[],
  range: PeriodRange,
  settings: BusinessSettings,
  now = new Date(),
) {
  const finance = financeMetrics(products, orders, range),
    inventory = inventoryMetrics(products),
    customers = customerAnalytics(orders, range),
    profitability = productProfitability(orders, products, range),
    chart = dailySeries(orders, range);
  const monthly = financeMetrics(products, orders, getPeriod("month", now));
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const projectionInput: ProjectionInput = {
    monthlyGoal: settings.monthlySalesGoal,
    currentRevenue: monthly.netRevenue,
    daysElapsed: now.getDate(),
    daysRemaining: daysInMonth - now.getDate(),
    averageTicket: monthly.averageOrderValue,
    averageMargin: monthly.grossMargin,
    hasData: monthly.validOrders > 0,
  };
  const projection = projectionEngine(projectionInput),
    previous = previousPeriod(range),
    previousFinance = previous
      ? financeMetrics(products, orders, previous)
      : null;
  const comparison =
    previousFinance && previousFinance.validOrders > 0
      ? {
          sales: percentChange(finance.netRevenue, previousFinance.netRevenue),
          profit: percentChange(
            finance.grossProfit,
            previousFinance.grossProfit,
          ),
          orders: percentChange(
            finance.validOrders,
            previousFinance.validOrders,
          ),
        }
      : { sales: null, profit: null, orders: null };
  const alerts: AdminAlert[] = [];
  const add = (
    id: string,
    type: string,
    title: string,
    description: string,
    href: string,
    priority: AdminAlert["priority"] = "warning",
  ) => alerts.push({ id, type, title, description, href, priority });
  if (inventory.low)
    add(
      "stock-low",
      "Inventario",
      `${inventory.low} productos con stock bajo`,
      "Saldo positivo igual o inferior al mínimo.",
      "/admin/inventario",
    );
  if (inventory.out)
    add(
      "stock-out",
      "Inventario",
      `${inventory.out} productos agotados`,
      "No tienen unidades disponibles.",
      "/admin/inventario",
      "critical",
    );
  const activeOut = inventory.rows.filter(
    (r) => r.active && r.stock === 0,
  ).length;
  if (activeOut)
    add(
      "active-out",
      "Catálogo",
      `${activeOut} productos activos sin stock`,
      "Revisa su visibilidad y reposición.",
      "/admin/productos",
    );
  const negative = inventory.rows.filter(
    (r) => r.active && r.profit < 0,
  ).length;
  if (negative)
    add(
      "negative",
      "Rentabilidad",
      `${negative} productos activos con margen negativo`,
      "El costo actual supera el precio de venta.",
      "/admin/finanzas",
      "critical",
    );
  const negativeSales = profitability.filter((r) => r.profit < 0).length;
  if (negativeSales)
    add(
      "negative-sales",
      "Rentabilidad",
      `${negativeSales} productos vendidos con pérdida`,
      "Revisa costos históricos y descuentos del periodo.",
      "/admin/finanzas",
      "critical",
    );
  const pending = orders.filter(
    (o) => isValidSale(o) && o.orderStatus === "new",
  ).length;
  if (pending)
    add(
      "orders-pending",
      "Pedidos",
      `${pending} pedidos nuevos pendientes`,
      "Confirma disponibilidad y coordina el pago.",
      "/admin/pedidos",
      "info",
    );
  if (projection.status === "atRisk")
    add(
      "goal-risk",
      "Proyección",
      "Meta mensual en riesgo",
      "El ritmo proyectado está por debajo del 80% de la meta o el mes terminó sin alcanzarla.",
      "/admin/proyeccion",
      "critical",
    );
  return {
    finance,
    inventory,
    customers,
    profitability,
    categories: categoryProfitability(profitability),
    chart,
    monthly,
    projectionInput,
    projection,
    scenarios: settings.scenarios.map((s) =>
      scenarioProjection(projectionInput, {
        ...s,
        averageTicket: s.averageTicket ?? monthly.averageOrderValue,
        margin: s.margin ?? monthly.grossMargin,
      }),
    ),
    plan: inventoryPlan(products, projection.remainingRevenue),
    breakEven: breakEvenRevenue(
      settings.fixedCosts,
      settings.contributionMargin ?? 0,
    ),
    comparison,
    previousFinance,
    alerts,
  };
}
