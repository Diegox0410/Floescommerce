import assert from "node:assert/strict";
import test from "node:test";
import { createOwnerHandler } from "../api/owner.ts";

const response = () => {
  const result = { statusCode: 0, headers: {} as Record<string, string>, body: "" };
  return Object.assign(result, {
    setHeader(name: string, value: string) { result.headers[name] = value; },
    end(body = "") { result.body = body; },
  });
};

const idempotencyKey = (operation: string) => `owner:${operation}:1234567890`;

test("Owner payment and fulfillment actions send only required bounded tenant-scoped inputs", async () => {
  const calls: unknown[] = [];
  const handler = createOwnerHandler({
    authorize: async () => ({ uid: "floes-owner" }),
    execute: async (operation, input, options) => {
      calls.push({ operation, input, options });
      return { ok: true };
    },
  });
  const operations = [
    { operation: "approvePayment", input: { paymentId: " pay-1 ", proofId: " proof-1 ", tenantId: "tenant-mg", actorRole: "GANOBOT" } },
    { operation: "rejectPaymentProof", input: { paymentId: "pay-2", proofId: "proof-2", reason: " No coincide ", tenantId: "tenant-mg" } },
    { operation: "startPreparation", input: { orderId: "order-1", tenantId: "tenant-mg" } },
    { operation: "markReady", input: { orderId: "order-1", tenantId: "tenant-mg" } },
    { operation: "dispatchOrder", input: { orderId: "order-1", courier: " Courier local ", trackingCode: " Guia-123 ", tenantId: "tenant-mg", url: "https://other.example" } },
    { operation: "markDelivered", input: { orderId: "order-1", tenantId: "tenant-mg" } },
  ];

  for (const { operation, input } of operations) {
    const res = response();
    await handler({ method: "POST", headers: {}, body: { operation, input, idempotencyKey: idempotencyKey(operation) } }, res);
    assert.equal(res.statusCode, 200, operation);
  }

  assert.deepEqual(calls, [
    { operation: "approvePayment", input: { paymentId: "pay-1", proofId: "proof-1" }, options: { scope: "owner", idempotencyKey: idempotencyKey("approvePayment") } },
    { operation: "rejectPaymentProof", input: { paymentId: "pay-2", proofId: "proof-2", reason: "No coincide" }, options: { scope: "owner", idempotencyKey: idempotencyKey("rejectPaymentProof") } },
    { operation: "startPreparation", input: { orderId: "order-1" }, options: { scope: "owner", idempotencyKey: idempotencyKey("startPreparation") } },
    { operation: "markReady", input: { orderId: "order-1" }, options: { scope: "owner", idempotencyKey: idempotencyKey("markReady") } },
    { operation: "dispatchOrder", input: { orderId: "order-1", courier: "Courier local", trackingCode: "Guia-123" }, options: { scope: "owner", idempotencyKey: idempotencyKey("dispatchOrder") } },
    { operation: "markDelivered", input: { orderId: "order-1" }, options: { scope: "owner", idempotencyKey: idempotencyKey("markDelivered") } },
  ]);
});

test("Owner rejects incomplete dispatch, payment, rejection, note and post-sale actions before calling Chopify", async () => {
  let executions = 0;
  const handler = createOwnerHandler({
    authorize: async () => ({ uid: "floes-owner" }),
    execute: async () => { executions++; return {}; },
  });
  const invalid = [
    { operation: "dispatchOrder", input: { orderId: "order-1", courier: "Courier" } },
    { operation: "dispatchOrder", input: { orderId: "order-1", trackingCode: "Guide-1" } },
    { operation: "approvePayment", input: { paymentId: "payment-1" } },
    { operation: "rejectPaymentProof", input: { paymentId: "payment-1", proofId: "proof-1" } },
    { operation: "startPreparation", input: {} },
    { operation: "markReady", input: {} },
    { operation: "markDelivered", input: {} },
    { operation: "addCustomerNote", input: { customerId: "customer-1", body: " " } },
    { operation: "resolveEscalation", input: { escalationId: "case-1" } },
  ];

  for (const { operation, input } of invalid) {
    const res = response();
    await handler({ method: "POST", headers: {}, body: { operation, input, idempotencyKey: idempotencyKey(operation) } }, res);
    assert.equal(res.statusCode, 400, operation);
    assert.match(res.body, /Required operation fields/);
  }

  assert.equal(executions, 0);
});

test("Owner operation mutations still require idempotency before remote execution", async () => {
  let executions = 0;
  const handler = createOwnerHandler({
    authorize: async () => ({ uid: "floes-owner" }),
    execute: async () => { executions++; return {}; },
  });
  const res = response();
  await handler({ method: "POST", headers: {}, body: { operation: "dispatchOrder", input: { orderId: "order-1", courier: "Courier", trackingCode: "Guide-1" } } }, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body, /Idempotency key/);
  assert.equal(executions, 0);
});
