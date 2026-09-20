import "./storage-fixture";
import { testStorage } from "./storage-fixture";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { useProductStore } from "../src/store/productStore";
import { useInventoryStore } from "../src/store/inventoryStore";
import { useOrderStore } from "../src/store/orderStore";
import { useCustomerStore } from "../src/store/customerStore";
import { useCheckoutStore } from "../src/store/checkoutStore";
import { demoProducts } from "../src/data/products";
import { normalizeOrder, normalizeProduct } from "../src/utils/normalization";
import {
  getProductRealCost,
  getProductProfit,
  getProductMargin,
  getInventoryValue,
  getPotentialRevenue,
  getPotentialProfit,
} from "../src/utils/productMetrics";
import { getCustomerMetrics } from "../src/utils/orderMetrics";
import { promotionalPrice } from "../src/utils/storefront";
import { financeMetrics } from "../src/analytics/financeMetrics";

beforeEach(() => {
  testStorage.clear();
  useProductStore.setState({
    products: demoProducts.map((p) => ({ ...p })),
    appliedInventoryBatches: [],
  });
  useInventoryStore.setState({ movements: [], pendingBatch: null });
  useOrderStore.setState({ orders: [] });
  useCustomerStore.setState({ customers: [] });
  useCheckoutStore.setState({ lastOrderId: null });
});
const stock = (id = "demo-01") =>
  useProductStore.getState().products.find((p) => p.id === id)!.stock;
function order(id = "TEST-1") {
  return normalizeOrder({
    id,
    customer: {
      firstName: "Cliente",
      lastName: "Demo",
      email: "demo@example.test",
      phone: "099 123 4567",
    },
    shipping: {
      province: "Guayas",
      city: "Guayaquil",
      address: "Dirección demo",
    },
    items: [
      {
        productId: "demo-01",
        name: "Hair Growth",
        sku: "DGNG-HG-001",
        price: 15,
        cost: 11,
        quantity: 2,
      },
    ],
  });
}

test("costs and profits use current price, never oldPrice; legacy defaults avoid NaN", () => {
  const p = demoProducts[0];
  assert.equal(getProductRealCost(p), 11);
  assert.equal(getProductProfit(p), 4);
  assert.equal(getProductMargin(p), (4 / 15) * 100);
  assert.equal(getInventoryValue(p), 275);
  assert.equal(getPotentialRevenue(p), 375);
  assert.equal(getPotentialProfit(p), 100);
  assert.equal(getProductRealCost({}), 0);
  assert.equal(getProductMargin({ price: 0 }), 0);
  assert.equal(getInventoryValue({}), 0);
  assert.equal(normalizeProduct({ id: "old", name: "Antiguo" }).active, true);
});

test("product store rejects negatives, fractional stock and duplicate SKU", () => {
  assert.throws(() =>
    useProductStore.getState().updateProduct("demo-01", { price: -1 }),
  );
  assert.throws(() =>
    useProductStore.getState().updateProduct("demo-01", { stock: 1.5 }),
  );
  assert.throws(() =>
    useProductStore.getState().updateProduct("demo-01", { sku: "DGNG-SF-002" }),
  );
  assert.equal(stock(), 25);
});

test("real product flow preserves promotional snapshot through CRM, inventory and analytics", () => {
  const product = useProductStore.getState().addProduct({
    sku: "REAL-QA-001", slug: "producto-real-qa", name: "Producto Real QA",
    category: "Bienestar", brand: "Marca USA", description: "Producto temporal",
    shortDescription: "Importado", price: 40, productCost: 18, importCost: 4,
    otherCost: 2, stock: 5, minimumStock: 1, images: [], featured: false,
    bestSeller: false, active: true, barcode: "123456", weight: 0.5,
    sizeVolume: "500 ml",
  });
  const paid = promotionalPrice(product, [{ id: "qa", name: "QA", type: "percentage", value: 25, startAt: "", endAt: "", active: true, scope: "product", targetIds: [product.id], headline: "", description: "" }]);
  assert.equal(paid, 30);
  const created = normalizeOrder({ id: "REAL-FLOW-QA", createdAt: new Date().toISOString(), customer: { firstName: "Real", lastName: "QA", email: "real-flow@example.test", phone: "0999999999" }, shipping: { province: "Pichincha", city: "Quito", address: "Test" }, items: [{ productId: product.id, name: product.name, sku: product.sku, price: paid, cost: 24, quantity: 1 }] });
  useCheckoutStore.getState().saveOrder(created);
  const snapshot = useOrderStore.getState().orders[0];
  assert.equal(snapshot.items[0].price, 30);
  assert.equal(useCustomerStore.getState().customers.length, 1);
  assert.equal(useProductStore.getState().products.find((p) => p.id === product.id)?.stock, 5);
  useOrderStore.getState().updateOrderStatus(snapshot.id, "confirmed");
  assert.equal(useProductStore.getState().products.find((p) => p.id === product.id)?.stock, 4);
  useProductStore.getState().updateProduct(product.id, { price: 99 });
  const metrics = financeMetrics(useProductStore.getState().products, useOrderStore.getState().orders, { start: new Date("2000-01-01"), end: new Date("2100-01-01"), label: "QA", key: "all" });
  assert.equal(metrics.netRevenue, 30);
  assert.equal(metrics.grossProfit, 6);
  useOrderStore.getState().cancelOrder(snapshot.id);
  assert.equal(useProductStore.getState().products.find((p) => p.id === product.id)?.stock, 5);
  useProductStore.getState().deleteProduct(product.id);
  assert.ok(!useProductStore.getState().products.some((p) => p.id === product.id));
});

test("create order leaves stock untouched; confirm/cancel stay idempotent after rehydration", async () => {
  const saved = useOrderStore.getState().addOrder(order());
  assert.equal(stock(), 25);
  useOrderStore.getState().updateOrderStatus(saved.id, "confirmed");
  assert.equal(stock(), 23);
  useOrderStore.getState().updateOrderStatus(saved.id, "confirmed");
  useOrderStore.getState().updateOrderStatus(saved.id, "preparing");
  useOrderStore.getState().updateOrderStatus(saved.id, "confirmed");
  await useProductStore.persist.rehydrate();
  await useInventoryStore.persist.rehydrate();
  await useOrderStore.persist.rehydrate();
  assert.equal(stock(), 23);
  assert.equal(useInventoryStore.getState().movements.length, 1);
  useOrderStore.getState().cancelOrder(saved.id);
  useOrderStore.getState().cancelOrder(saved.id);
  assert.equal(stock(), 25);
  assert.equal(useInventoryStore.getState().movements.length, 2);
  assert.equal(useOrderStore.getState().orders[0].inventoryCommitted, false);
  assert.throws(() =>
    useOrderStore.getState().updateOrderStatus(saved.id, "confirmed"),
  );
});

test("insufficient stock preflights the entire order without partial movements", () => {
  const input = order();
  input.items.push({
    productId: "demo-06",
    name: "Body Care Demo",
    sku: "DGNG-BC-006",
    price: 22,
    cost: 13,
    quantity: 1,
  });
  useOrderStore.getState().addOrder(input);
  assert.throws(
    () => useOrderStore.getState().updateOrderStatus(input.id, "confirmed"),
    /Stock insuficiente/,
  );
  assert.equal(stock(), 25);
  assert.equal(stock("demo-06"), 0);
  assert.equal(useInventoryStore.getState().movements.length, 0);
  assert.equal(useInventoryStore.getState().pendingBatch, null);
});

test("movement journal recovers without double application; order flags reconcile", async () => {
  useOrderStore.getState().addOrder(order());
  useInventoryStore
    .getState()
    .commitBatch(
      [{ productId: "demo-01", type: "out", quantity: 2, reason: "Test" }],
      "order:TEST-1:commit",
    );
  const movement = useInventoryStore.getState().movements[0];
  useInventoryStore.setState({
    movements: [],
    pendingBatch: { batchId: movement.batchId, movements: [movement] },
  });
  useInventoryStore.getState().recoverPendingBatch();
  assert.equal(stock(), 23);
  assert.equal(useInventoryStore.getState().movements.length, 1);
  await useOrderStore.persist.rehydrate();
  assert.equal(useOrderStore.getState().orders[0].inventoryCommitted, true);
  assert.equal(useOrderStore.getState().orders[0].orderStatus, "confirmed");
});

test("historical snapshots survive price and product edits; CRM deduplicates contact", () => {
  const first = useOrderStore.getState().addOrder(order());
  useProductStore
    .getState()
    .updateProduct("demo-01", {
      price: 50,
      productCost: 30,
      name: "Nuevo nombre",
    });
  assert.equal(first.items[0].price, 15);
  assert.equal(first.items[0].cost, 11);
  assert.equal(first.estimatedProfit, 8);
  const second = order("TEST-2");
  second.customer.email = " DEMO@EXAMPLE.TEST ";
  second.customer.phone = "0991234567";
  const saved = useOrderStore.getState().addOrder(second);
  assert.equal(first.customerId, saved.customerId);
  assert.equal(useCustomerStore.getState().customers.length, 1);
  assert.equal(
    getCustomerMetrics(saved.customerId!, useOrderStore.getState().orders)
      .totalSpent,
    60,
  );
  useCustomerStore.getState().addTag(saved.customerId!, "VIP");
  useCustomerStore.getState().addTag(saved.customerId!, "vip");
  assert.equal(
    useCustomerStore
      .getState()
      .customers[0].tags.filter((t) => t.toLowerCase() === "vip").length,
    1,
  );
});

test("legacy lastOrder imports once and saves only its ID", async () => {
  testStorage.setItem(
    "dgng-last-order",
    JSON.stringify({
      state: {
        lastOrder: {
          id: "OLD",
          customer: { firstName: "Antiguo", email: "old@example.test" },
          items: [
            {
              product: { id: "demo-01", name: "Hair Growth", price: 15 },
              quantity: 1,
            },
          ],
        },
      },
      version: 0,
    }),
  );
  await useCheckoutStore.persist.rehydrate();
  await useCheckoutStore.persist.rehydrate();
  assert.equal(useCheckoutStore.getState().lastOrderId, "OLD");
  assert.equal(useOrderStore.getState().orders.length, 1);
  assert.equal(useOrderStore.getState().orders[0].items[0].cost, 0);
  assert.equal(stock(), 25);
});

test("persisted empty product collection does not resurrect deleted demos", async () => {
  useProductStore.setState({ products: [] });
  await useProductStore.persist.rehydrate();
  assert.equal(useProductStore.getState().products.length, 0);
});

test("multi-product confirmation and cancellation apply every item exactly once", () => {
  const input = order("MULTI");
  input.items.push({ productId: "demo-02", name: "Serum Facial", sku: "DGNG-SF-002", price: 17, cost: 12, quantity: 3 });
  useOrderStore.getState().addOrder(input);
  useOrderStore.getState().updateOrderStatus(input.id, "confirmed");
  useOrderStore.getState().updateOrderStatus(input.id, "confirmed");
  assert.equal(stock(), 23);
  assert.equal(stock("demo-02"), 15);
  assert.equal(useInventoryStore.getState().movements.length, 2);
  useOrderStore.getState().cancelOrder(input.id);
  useOrderStore.getState().cancelOrder(input.id);
  assert.equal(stock(), 25);
  assert.equal(stock("demo-02"), 18);
  assert.equal(useInventoryStore.getState().movements.length, 4);
});

test("legacy persisted products hydrate missing operational fields without NaN", async () => {
  testStorage.setItem("dgng-products", JSON.stringify({ version: 0, state: { products: [{ id: "legacy", name: "Producto antiguo", price: 15 }] } }));
  await useProductStore.persist.rehydrate();
  const p = useProductStore.getState().products[0];
  assert.equal(p.id, "legacy");
  assert.equal(p.sku, "DGNG-legacy");
  assert.equal(p.active, true);
  assert.equal(p.stock, 0);
  assert.equal(p.minimumStock, 0);
  assert.ok(Number.isFinite(Date.parse(p.createdAt)));
  assert.ok(Number.isFinite(Date.parse(p.updatedAt)));
  assert.equal(getProductRealCost(p), 0);
  for (const value of [getProductProfit(p), getProductMargin(p), getInventoryValue(p), getPotentialRevenue(p), getPotentialProfit(p)]) assert.ok(Number.isFinite(value));
});
