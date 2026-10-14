import assert from "node:assert/strict";
import test from "node:test";
import { ownerOrderMetrics } from "../src/admin/components/chopifyMetrics.ts";

test("Owner metrics use real paid orders, keep currencies separate and omit missing financial data", () => {
  const result = ownerOrderMetrics([
    { id: "a", paymentStatus: "PAID", fulfillmentStatus: "DELIVERED", grandTotalCents: 3999, currency: "USD" },
    { id: "b", paymentStatus: "PAID", grandTotalCents: 100000, currency: "COP" },
    { id: "c", paymentStatus: "PAID", grandTotalCents: null, currency: "USD" },
    { id: "d", paymentStatus: "PAID", status: "CANCELLED", grandTotalCents: 1000, currency: "USD" },
    { id: "e", paymentStatus: "PENDING", grandTotalCents: 4999, currency: "USD" },
  ]);
  assert.equal(result.ordersReturned, 5); assert.equal(result.paidOrders, 3); assert.equal(result.deliveredOrders, 1);
  assert.equal(result.incompletePaidOrders, 1);
  assert.deepEqual(result.paidTotals, [{ currency: "USD", cents: 3999 }, { currency: "COP", cents: 100000 }]);
});
