import "./storage-fixture";
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeOrder, normalizeProduct } from "../src/utils/normalization";
import { financeMetrics } from "../src/analytics/financeMetrics";
import {
  productProfitability,
  categoryProfitability,
  dailySeries,
  orderAmounts,
} from "../src/analytics/salesMetrics";
import {
  inventoryMetrics,
  inventoryPlan,
} from "../src/analytics/inventoryMetrics";
import { customerAnalytics } from "../src/analytics/customerMetrics";
import {
  projectionEngine,
  scenarioProjection,
  breakEvenRevenue,
} from "../src/analytics/projectionEngine";
import {
  getPeriod,
  previousPeriod,
  percentChange,
} from "../src/analytics/periods";
import { businessMetrics } from "../src/analytics/businessMetrics";
import {
  defaultBusinessSettings,
  normalizeBusinessSettings,
  useBusinessSettingsStore,
} from "../src/store/businessSettingsStore";
const now = new Date(2026, 8, 14, 12),
  period = getPeriod("month", now);
const products = [
  normalizeProduct({
    id: "a",
    name: "A",
    category: "Uno",
    price: 100,
    productCost: 60,
    stock: 5,
    minimumStock: 2,
  }),
  normalizeProduct({
    id: "b",
    name: "B",
    category: "Dos",
    price: 50,
    productCost: 30,
    stock: 3,
  }),
];
const sale = (id = "one", extra = {}) =>
  normalizeOrder({
    id,
    createdAt: new Date(2026, 8, 10, 10).toISOString(),
    customerId: "customer-1",
    customer: { email: "demo@example.test" },
    items: [
      {
        productId: "a",
        name: "A histórico",
        price: 100,
        cost: 60,
        quantity: 2,
      },
      { productId: "b", name: "B histórico", price: 50, cost: 30, quantity: 1 },
    ],
    discount: 25,
    shippingCost: 20,
    ...extra,
  });
const approx = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} ≠ ${expected}`);
const input = {
  monthlyGoal: 1000,
  currentRevenue: 500,
  daysElapsed: 10,
  daysRemaining: 20,
  averageTicket: 50,
  averageMargin: 40,
};

test("financial revenue, snapshot COGS, profit, margin, ticket and units reconcile", () => {
  const f = financeMetrics(products, [sale()], period);
  assert.equal(f.grossRevenue, 250);
  assert.equal(f.netRevenue, 225);
  assert.equal(f.discounts, 25);
  assert.equal(f.costOfGoodsSold, 150);
  assert.equal(f.grossProfit, 75);
  approx(f.grossMargin, 100 / 3);
  assert.equal(f.averageOrderValue, 225);
  assert.equal(f.validOrders, 1);
  assert.equal(f.unitsSold, 3);
});
test("one policy excludes cancelled, rejected and refunded across all modules", () => {
  const orders = [
    sale(),
    sale("cancel", { orderStatus: "cancelled" }),
    sale("reject", { paymentStatus: "rejected" }),
    sale("refund", { paymentStatus: "refunded" }),
  ];
  const f = financeMetrics(products, orders, period);
  assert.equal(f.totalOrders, 4);
  assert.equal(f.validOrders, 1);
  assert.equal(f.cancelledOrders, 1);
  assert.equal(f.excludedOrders, 3);
  assert.equal(f.netRevenue, 225);
  assert.equal(productProfitability(orders, products, period)[0].units, 2);
  assert.equal(
    dailySeries(orders, period).reduce((s, r) => s + r.orders, 0),
    1,
  );
  assert.equal(customerAnalytics(orders, period).recurringCustomers, 0);
});
test("historical profitability ignores current product cost, price and deletion", () => {
  const changed = products.map((p) => ({ ...p, price: 999, productCost: 900 }));
  assert.equal(financeMetrics(changed, [sale()], period).costOfGoodsSold, 150);
  assert.equal(financeMetrics([], [sale()], period).grossProfit, 75);
  assert.equal(
    productProfitability([sale()], changed, period)[0].name,
    "A histórico",
  );
});
test("proportional discount allocation reconciles product and category totals", () => {
  const rows = productProfitability([sale()], products, period),
    categories = categoryProfitability(rows);
  approx(
    rows.reduce((s, r) => s + r.revenue, 0),
    225,
  );
  approx(
    rows.reduce((s, r) => s + r.profit, 0),
    75,
  );
  approx(
    categories.reduce((s, r) => s + r.cost, 0),
    150,
  );
  assert.equal(rows.length, 2);
});
test("inventory uses current balances and costs including inactive capital", () => {
  const inventory = inventoryMetrics(products);
  assert.equal(inventory.costValue, 390);
  assert.equal(inventory.retailValue, 650);
  assert.equal(inventory.potentialProfit, 260);
  assert.equal(inventory.totalStock, 8);
  const f = financeMetrics(products, [], period);
  assert.equal(f.inventoryCostValue, 390);
  assert.equal(f.inventoryRetailValue, 650);
  assert.equal(f.inventoryPotentialProfit, 260);
});
test("customer recurrence and lifetime use valid history without double revenue", () => {
  const orders = [
    sale("prior", { createdAt: new Date(2026, 7, 10).toISOString() }),
    sale(),
    sale("new", { customerId: "customer-2" }),
    sale("cancel", { customerId: "customer-3", orderStatus: "cancelled" }),
  ];
  const c = customerAnalytics(orders, period);
  assert.equal(c.uniqueCustomers, 2);
  assert.equal(c.newCustomers, 1);
  assert.equal(c.recurringCustomers, 1);
  assert.equal(c.newRevenue, 225);
  assert.equal(c.recurringRevenue, 225);
  assert.equal(c.averageLifetimeRevenue, 337.5);
});
test("daily series includes zero days and respects current cutoff", () => {
  const rows = dailySeries(
    [
      sale(),
      sale("future", { createdAt: new Date(2026, 8, 15).toISOString() }),
    ],
    period,
  );
  assert.equal(rows.length, 14);
  assert.equal(rows[9].sales, 225);
  assert.equal(rows[9].profit, 75);
  assert.equal(rows[0].orders, 0);
});
test("projection derives progress, required daily revenue, orders, close and profit", () => {
  const p = projectionEngine(input);
  assert.equal(p.goalProgress, 50);
  assert.equal(p.remainingRevenue, 500);
  assert.equal(p.requiredDailyRevenue, 25);
  assert.equal(p.requiredOrders, 10);
  assert.equal(p.projectedEndRevenue, 1500);
  assert.equal(p.projectedProfit, 600);
  assert.equal(p.goalGap, 0);
  assert.equal(p.status, "onTrack");
});
test("goal states cover achieved, attention and risk with documented thresholds", () => {
  assert.equal(
    projectionEngine({ ...input, currentRevenue: 1200 }).status,
    "achieved",
  );
  assert.equal(
    projectionEngine({ ...input, currentRevenue: 300 }).status,
    "attention",
  );
  assert.equal(
    projectionEngine({ ...input, currentRevenue: 100 }).status,
    "atRisk",
  );
  assert.equal(
    projectionEngine({ ...input, currentRevenue: 0, hasData: false }).status,
    "attention",
  );
});
test("zero goal, ticket, elapsed and remaining days produce explicit unavailable values", () => {
  const p = projectionEngine({
    ...input,
    monthlyGoal: 0,
    currentRevenue: 0,
    daysElapsed: 0,
    daysRemaining: 0,
    averageTicket: 0,
  });
  assert.equal(p.status, null);
  assert.equal(p.goalProgress, 0);
  assert.equal(p.projectedEndRevenue, null);
  assert.equal(p.requiredOrders, 0);
  const closed = projectionEngine({
    ...input,
    daysRemaining: 0,
    averageTicket: 0,
  });
  assert.equal(closed.requiredDailyRevenue, null);
  assert.equal(closed.requiredOrders, null);
  assert.equal(closed.status, "atRisk");
});
test("scenarios preserve actual sales and vary future volume, ticket and margin", () => {
  const base = scenarioProjection(input, {
    name: "Base",
    volumeVariation: 0,
    averageTicket: 50,
    margin: 40,
  });
  assert.equal(base.revenue, 1500);
  assert.equal(base.profit, 600);
  const aggressive = scenarioProjection(input, {
    name: "Agresivo",
    volumeVariation: 25,
    averageTicket: 60,
    margin: 30,
  });
  assert.equal(aggressive.orders, 35);
  assert.equal(aggressive.revenue, 2000);
  assert.equal(aggressive.profit, 650);
  const stopped = scenarioProjection(input, {
    name: "Detenido",
    volumeVariation: -100,
    averageTicket: 60,
    margin: 30,
  });
  assert.equal(stopped.revenue, 500);
  assert.equal(stopped.profit, 200);
  assert.equal(
    scenarioProjection(
      { ...input, daysElapsed: 0 },
      { name: "Base", volumeVariation: 0, averageTicket: 50, margin: 40 },
    ).revenue,
    null,
  );
});
test("inventory plan never exceeds stock or uses inactive, empty or losing products", () => {
  const invalid = [
    normalizeProduct({
      id: "inactive",
      price: 100,
      productCost: 1,
      stock: 100,
      active: false,
    }),
    normalizeProduct({ id: "loss", price: 10, productCost: 20, stock: 100 }),
    normalizeProduct({ id: "empty", price: 100, stock: 0 }),
    normalizeProduct({ id: "zero", price: 0, stock: 100 }),
    normalizeProduct({ id: "flat", price: 10, productCost: 10, stock: 100 }),
  ];
  const plan = inventoryPlan([...products, ...invalid], 10000);
  assert.equal(plan.revenue, 650);
  assert.equal(plan.uncovered, 9350);
  for (const r of plan.rows) {
    assert.ok(r.units <= r.stock);
    assert.ok(r.active && r.profit > 0);
    assert.ok(["a", "b"].includes(r.id));
  }
  assert.equal(plan.rows.length, 2);
  assert.deepEqual(plan, inventoryPlan([...products, ...invalid], 10000));
  assert.equal(inventoryPlan(products, 0).rows.length, 0);
});
test("combination covers small target with bounded integer rounding and no mutations", () => {
  const before = JSON.stringify(products),
    plan = inventoryPlan(products, 10);
  assert.equal(plan.coverage, 100);
  assert.ok(plan.revenue >= 10);
  assert.ok(plan.overage > 0);
  assert.equal(JSON.stringify(products), before);
  for (const r of plan.rows) assert.ok(Number.isInteger(r.units));
});
test("break-even uses explicit contribution percentage and rejects nonpositive margin", () => {
  assert.equal(breakEvenRevenue(1000, 25), 4000);
  assert.equal(breakEvenRevenue(0, 25), 0);
  assert.equal(breakEvenRevenue(1000, 0), null);
  assert.equal(breakEvenRevenue(1000, -10), null);
  assert.equal(breakEvenRevenue(1000, 101), null);
});
test("equivalent periods and comparisons avoid fictitious growth without a base", () => {
  const prior = previousPeriod(getPeriod("7d", now))!;
  assert.equal(prior.start!.getDate(), 1);
  assert.equal(prior.end.getDate(), 7);
  assert.equal(prior.end.getHours(), 12);
  assert.equal(percentChange(10, 0), null);
  assert.equal(percentChange(0, 10), -100);
  assert.equal(previousPeriod(getPeriod("all", now)), null);
  assert.equal(
    businessMetrics(products, [], period, defaultBusinessSettings, now)
      .comparison.sales,
    null,
  );
});
test("legacy, undefined fields and negative margins remain finite", () => {
  const legacy = normalizeOrder({
    id: "old",
    createdAt: now.toISOString(),
    items: [{ product: { id: "a", price: 10 }, quantity: 1 }],
  });
  assert.equal(financeMetrics([], [legacy], period).costOfGoodsSold, 0);
  const loss = sale("loss", {
    items: [{ productId: "a", price: 10, cost: 20, quantity: 1 }],
    discount: 0,
  });
  assert.equal(financeMetrics(products, [loss], period).grossProfit, -10);
  assert.equal(financeMetrics(products, [loss], period).grossMargin, -100);
  assert.equal(orderAmounts({}).net, 0);
  const empty = financeMetrics([], [], period);
  for (const value of Object.values(empty)) assert.ok(Number.isFinite(value));
});
test("dashboard shares finance totals, configured projection and deterministic alerts", () => {
  const settings = { ...defaultBusinessSettings, monthlySalesGoal: 1000 };
  const m = businessMetrics(products, [sale()], period, settings, now);
  assert.deepEqual(m.finance, financeMetrics(products, [sale()], period));
  assert.equal(m.projectionInput.monthlyGoal, 1000);
  assert.equal(m.projectionInput.currentRevenue, 225);
  assert.ok(m.alerts.some((a) => a.id === "goal-risk"));
  assert.ok(m.alerts.some((a) => a.id === "orders-pending"));
});
test("settings persist only assumptions and normalize invalid legacy configuration", async () => {
  const s = normalizeBusinessSettings({
    monthlySalesGoal: NaN,
    fixedCosts: -1,
    contributionMargin: 0,
    scenarios: [{ volumeVariation: -200, margin: Infinity }],
  });
  assert.equal(s.monthlySalesGoal, 0);
  assert.equal(s.fixedCosts, 0);
  assert.equal(s.contributionMargin, null);
  assert.equal(s.scenarios[0].volumeVariation, -100);
  useBusinessSettingsStore
    .getState()
    .updateSettings({ monthlySalesGoal: 1234, fixedCosts: 100 });
  await useBusinessSettingsStore.persist.rehydrate();
  assert.equal(useBusinessSettingsStore.getState().monthlySalesGoal, 1234);
});

test("unidentified legacy orders do not fabricate unique customers or lifetime revenue", () => {
  const unknown = sale("unknown", { customerId: undefined, customer: {} });
  const c = customerAnalytics([unknown], period);
  assert.equal(c.uniqueCustomers, 0);
  assert.equal(c.unidentifiedOrders, 1);
  assert.equal(c.averageLifetimeRevenue, 0);
  assert.equal(c.newRevenue, 0);
  assert.equal(c.averageTicket, 225);
});

test("zero net sales cannot supply a revenue pace even if zero-price orders exist", () => {
 const p=projectionEngine({...input,currentRevenue:0,averageTicket:0,hasData:true});
 assert.equal(p.projectedEndRevenue,null);assert.equal(p.projectedProfit,null);assert.equal(p.status,"attention");
});
