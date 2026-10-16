import assert from "node:assert/strict";
import test from "node:test";
import { createOwnerHandler } from "../api/owner.ts";
import { OwnerAuthError } from "../api/_lib/firebaseAuth.ts";

const response = () => {
  const result = { statusCode: 0, headers: {} as Record<string, string>, body: "" };
  return Object.assign(result, {
    setHeader(name: string, value: string) { result.headers[name] = value; },
    end(body = "") { result.body = body; },
  });
};

test("Owner listProducts reads the complete tenant catalog through the owner scope and returns a minimized projection", async () => {
  const calls: unknown[] = [];
  const handler = createOwnerHandler({
    authorize: async () => ({ uid: "owner" }),
    execute: async (operation, input, options) => {
      calls.push({ operation, input, options });
      return [{
        id: "tenant-floes:model:daniela", tenantId: "tenant-floes", sku: "MODEL-DANIELA", slug: "daniela",
        name: "Modelo Daniela", description: "Descripción", category: "", status: "ACTIVE", visibility: "VISIBLE",
        pricingStatus: "PENDING", salePriceCents: null, currency: null, costCents: 1000, internalNotes: "private note",
        images: [{ url: "/images/editorial/modelos/daniela-01.webp", alt: "Daniela" }],
        variants: [{ id: "variant-1", sku: "VAR-DANIELA-1", color: "Vino", status: "DRAFT", visibility: "HIDDEN", stock: 3, initialStockBySize: { XS: 2, S: null, M: -1 }, salePriceCents: 4000, internalNotes: "private variant note" }],
      }];
    },
  });
  const res = response();
  await handler({ method: "POST", headers: {}, body: { operation: "listProducts", input: { tenantId: "tenant-mg" } }, }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(calls, [{ operation: "listProducts", input: {}, options: { scope: "owner" } }]);
  const body = JSON.parse(res.body) as { tenantId: string; data: Array<Record<string, unknown>> };
  assert.equal(body.tenantId, "tenant-floes");
  assert.equal(body.data[0].status, "ACTIVE");
  assert.equal(body.data[0].currency, null);
  assert.deepEqual(body.data[0].images, [{ url: "/images/editorial/modelos/daniela-01.webp", alt: "Daniela" }]);
  assert.equal("costCents" in body.data[0], false);
  assert.equal("internalNotes" in body.data[0], false);
  assert.deepEqual((body.data[0].variants as Array<Record<string, unknown>>)[0], {
    variantId: "variant-1", sku: "VAR-DANIELA-1", color: "Vino", size: "", sizes: [],
    status: "DRAFT", visibility: "HIDDEN", available: null, stock: 3, initialStockBySize: { XS: 2, S: null }, sizeAvailability: [], salePriceCents: 4000, promotionalPriceCents: null, images: [],
  });
});

test("Owner catalog listing rejects unauthenticated callers before reading commerce", async () => {
  let executed = false;
  const handler = createOwnerHandler({ authorize: async () => { throw new Error("unauthorized"); }, execute: async () => { executed = true; return []; } });
  const res = response();
  await handler({ method: "POST", headers: {}, body: { operation: "listProducts" } }, res);
  assert.equal(res.statusCode, 401);
  assert.equal(executed, false);
});

test("Owner access verification authenticates without running a commerce operation", async () => {
  let executed = false;
  const handler = createOwnerHandler({
    authorize: async () => ({ uid: "owner" }),
    execute: async () => { executed = true; return []; },
  });
  const res = response();
  await handler({ method: "POST", headers: {}, body: { operation: "verifyOwnerAccess" } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(res.body), { ok: true, tenantId: "tenant-floes", data: { authorized: true } });
  assert.equal(executed, false);
});

test("Owner login exposes safe configuration and UID authorization categories", async () => {
  for (const [error, expectedStatus, expectedCode] of [
    [new OwnerAuthError("FLOES_OWNER_CONFIG"), 503, "FLOES_OWNER_CONFIG"],
    [new OwnerAuthError("FLOES_OWNER_PROJECT_MISMATCH"), 503, "FLOES_OWNER_PROJECT_MISMATCH"],
    [new OwnerAuthError("FLOES_OWNER_UID_NOT_ALLOWED"), 403, "FLOES_OWNER_UID_NOT_ALLOWED"],
    [new OwnerAuthError("FLOES_OWNER_TOKEN_INVALID"), 401, "FLOES_OWNER_TOKEN_INVALID"],
  ] as const) {
    const handler = createOwnerHandler({
      authorize: async () => { throw error; },
      execute: async () => { throw new Error("Must not execute commerce"); },
    });
    const res = response();
    await handler({ method: "POST", headers: {}, body: { operation: "verifyOwnerAccess" } }, res);
    assert.equal(res.statusCode, expectedStatus);
    assert.deepEqual(JSON.parse(res.body), {
      error: "Owner access could not be verified.",
      code: expectedCode,
    });
  }
});

test("Owner listCustomers uses the owner scope and excludes private customer metadata", async () => {
  let call: unknown;
  const handler = createOwnerHandler({
    authorize: async () => ({ uid: "owner" }),
    execute: async (operation, input, options) => {
      call = { operation, input, options };
      return [{ id: "customer-1", tenantId: "tenant-floes", name: "Cliente", phone: "+593000000000", email: "client@example.test", acquisitionSource: "WhatsApp", internalNotes: "private", lifetimeValueCents: 12345 }];
    },
  });
  const res = response();
  await handler({ method: "POST", headers: {}, body: { operation: "listCustomers" } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(call, { operation: "listCustomers", input: {}, options: { scope: "owner" } });
  const body = JSON.parse(res.body) as { data: Array<Record<string, unknown>> };
  assert.deepEqual(body.data[0], { id: "customer-1", tenantId: "tenant-floes", name: "Cliente", phone: "+593000000000", email: "client@example.test", acquisitionSource: "WhatsApp" });
});

test("payment review includes only the linked customer's display details", async () => {
  const calls: string[] = [];
  const handler = createOwnerHandler({
    authorize: async () => ({ uid: "owner" }),
    execute: async (operation) => {
      calls.push(operation);
      if (operation === "listPaymentReviews") return [{ proof: { id: "proof_1", orderId: "order_1" }, payment: { id: "payment_1" }, order: { id: "order_1", customerId: "customer_1" }, customer: { id: "customer_1", name: "Clienta FLOES", phone: "+593900000001" } }];
      throw new Error(`Unexpected operation: ${operation}`);
    },
  });
  const res = response();
  await handler({ method: "POST", headers: {}, body: { operation: "listPaymentReviews" } }, res);
  assert.deepEqual(calls, ["listPaymentReviews"]);
  const body = JSON.parse(res.body) as { data: Array<Record<string, unknown>> };
  assert.deepEqual(body.data[0].customer, { id: "customer_1", name: "Clienta FLOES", phone: "+593900000001" });
  assert.equal("internalNotes" in (body.data[0].customer as Record<string, unknown>), false);
});

test("Owner projection rejects foreign tenant products and preserves only current bounded size stock", async () => {
  const handler = createOwnerHandler({ authorize: async () => "owner", execute: async () => [
    { id: "other", tenantId: "tenant-mg", variants: [] },
    { id: "daniela", tenantId: "tenant-floes", variants: [{ id: "navy", stock: 50, initialStockBySize: { XS: 50 }, sizeAvailability: [{ size: "XS", availableQuantity: 0 }, { size: "S", availableQuantity: null }, { size: "M", availableQuantity: -1 }, { size: "L", availableQuantity: 2, costCents: 500 }] }] },
  ] });
  const res = response(); await handler({ method: "POST", headers: {}, body: { operation: "listProducts" } }, res);
  const body = JSON.parse(res.body) as { data: Array<{ productId: string; variants: Array<Record<string, unknown>> }> };
  assert.equal(body.data.length, 1); assert.equal(body.data[0].productId, "daniela");
  assert.equal(body.data[0].variants[0].stock, 50);
  assert.deepEqual(body.data[0].variants[0].sizeAvailability, [{ size: "XS", availableQuantity: 0, available: false }, { size: "S", availableQuantity: null, available: false }, { size: "M", availableQuantity: null, available: false }, { size: "L", availableQuantity: 2, available: true }]);
});

test("Canonical Owner snapshot is read-only and ignores browser-supplied destination and tenant", async () => {
  let call: unknown;
  const snapshot = { schemaVersion: 2, tenantId: "tenant-floes", products: [{ id: "daniela", variants: [{ sku: "FLOES-DAN-01", stock: 50 }] }], paymentConfiguration: { methods: ["bank_transfer"] } };
  const handler = createOwnerHandler({ authorize: async () => "owner", execute: async (operation, input, options) => { call = { operation, input, options }; return snapshot; } });
  const res = response(); await handler({ method: "POST", headers: {}, body: { operation: "getCatalogSnapshot", input: { tenantId: "tenant-mg", destination: "https://other.example" } } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(call, { operation: "getCatalogSnapshot", input: {}, options: { scope: "owner" } });
  assert.deepEqual(JSON.parse(res.body).data, snapshot);
});

test("Owner internal notes and case resolution are idempotent, bounded and cannot inject roles or tenant", async () => {
  const calls: unknown[] = [];
  const handler = createOwnerHandler({ authorize: async () => "owner", execute: async (operation, input, options) => { calls.push({ operation, input, options }); return { id: "record-1" }; } });
  const denied = response(); await handler({ method: "POST", headers: {}, body: { operation: "addCustomerNote", input: { customerId: "client-1", body: "Note" } } }, denied);
  assert.equal(denied.statusCode, 400); assert.equal(calls.length, 0);
  const accepted = response(); await handler({ method: "POST", headers: {}, body: { operation: "addCustomerNote", input: { customerId: "client-1", body: " Verificada ", tenantId: "tenant-mg", actorRole: "GANOBOT" }, idempotencyKey: "owner:note:1234567890" } }, accepted);
  assert.equal(accepted.statusCode, 200);
  assert.deepEqual(calls[0], { operation: "addCustomerNote", input: { customerId: "client-1", body: "Verificada" }, options: { scope: "owner", idempotencyKey: "owner:note:1234567890" } });
  const resolved = response(); await handler({ method: "POST", headers: {}, body: { operation: "resolveEscalation", input: { escalationId: "case-1", resolution: "Atendida por Owner", tenantId: "tenant-mg" }, idempotencyKey: "owner:case:1234567890" } }, resolved);
  assert.equal(resolved.statusCode, 200);
  assert.deepEqual(calls[1], { operation: "resolveEscalation", input: { escalationId: "case-1", resolution: "Atendida por Owner" }, options: { scope: "owner", idempotencyKey: "owner:case:1234567890" } });
});
