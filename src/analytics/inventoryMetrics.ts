import type { Product } from "../types/product";
import {
  safeNumber,
  getProductRealCost,
  getStockStatus,
} from "../utils/productMetrics";
export function inventoryMetrics(products: Product[]) {
  const rows = products.map((p) => {
    const stock = Math.floor(safeNumber(p.stock)),
      price = safeNumber(p.price),
      cost = getProductRealCost(p),
      profit = price - cost;
    return {
      id: p.id,
      name: p.name,
      active: p.active !== false,
      stock,
      price,
      cost,
      profit,
      margin: price > 0 ? (profit / price) * 100 : 0,
      costValue: cost * stock,
      retailValue: price * stock,
      potentialProfit: profit * stock,
      status: getStockStatus(p),
    };
  });
  return {
    rows,
    costValue: rows.reduce((s, r) => s + r.costValue, 0),
    retailValue: rows.reduce((s, r) => s + r.retailValue, 0),
    potentialProfit: rows.reduce((s, r) => s + r.potentialProfit, 0),
    totalStock: rows.reduce((s, r) => s + r.stock, 0),
    out: rows.filter((r) => r.stock === 0).length,
    low: rows.filter((r) => r.status === "Bajo").length,
    normal: rows.filter((r) => r.status === "Normal").length,
    activeRetailValue: rows
      .filter((r) => r.active)
      .reduce((s, r) => s + r.retailValue, 0),
    activePotentialProfit: rows
      .filter((r) => r.active)
      .reduce((s, r) => s + r.potentialProfit, 0),
  };
}
export function inventoryPlan(products: Product[], target: number) {
  const remainingTarget = safeNumber(target);
  let missing = remainingTarget;
  const eligible = inventoryMetrics(products).rows.filter(
    (r) => r.active && r.stock > 0 && r.price > 0 && r.profit > 0,
  );
  const maxProfit = Math.max(1, ...eligible.map((r) => r.profit)),
    maxStock = Math.max(1, ...eligible.map((r) => r.stock));
  const scored = eligible
    .map((r) => ({
      ...r,
      score:
        (0.5 * r.margin) / 100 +
        (0.35 * r.profit) / maxProfit +
        (0.15 * r.stock) / maxStock,
    }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const rows = scored.flatMap((r) => {
    if (missing <= 0) return [];
    const units = Math.min(r.stock, Math.ceil(missing / r.price));
    const revenue = units * r.price,
      profit = units * r.profit;
    missing = Math.max(0, missing - revenue);
    return [{ ...r, units, revenue, estimatedProfit: profit }];
  });
  const revenue = rows.reduce((s, r) => s + r.revenue, 0),
    profit = rows.reduce((s, r) => s + r.estimatedProfit, 0);
  return {
    rows,
    revenue,
    profit,
    uncovered: Math.max(0, remainingTarget - revenue),
    coverage:
      remainingTarget > 0
        ? Math.min(100, (revenue / remainingTarget) * 100)
        : 0,
    overage: Math.max(0, revenue - remainingTarget),
  };
}
