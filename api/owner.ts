import { executeCommerce, tenantId } from "./_lib/chopify.js";
import { requireFloesOwner } from "./_lib/firebaseAuth.js";
import { json, parseBody, type ApiRequest, type ApiResponse } from "./_lib/http.js";

const allowed = new Set([
  "ownerDashboard",
  "listOrders",
  "getOrderDetail",
  "listPaymentReviews",
  "listCustomers",
  "searchProducts",
  "approvePayment",
  "rejectPaymentProof",
  "startPreparation",
  "markReady",
  "dispatchOrder",
  "markDelivered",
]);
const mutations = new Set([
  "approvePayment",
  "rejectPaymentProof",
  "startPreparation",
  "markReady",
  "dispatchOrder",
  "markDelivered",
]);
const clean = (value: unknown, max = 160) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const safeInput = (operation: string, raw: unknown) => {
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  if (["ownerDashboard", "listOrders", "listPaymentReviews", "listCustomers"].includes(operation)) return {};
  if (operation === "searchProducts") {
    const limit = Number(input.limit);
    return { query: clean(input.query, 120), limit: Number.isFinite(limit) ? Math.max(1, Math.min(200, Math.floor(limit))) : 200 };
  }
  if (["getOrderDetail", "startPreparation", "markReady", "markDelivered"].includes(operation)) {
    return { orderId: clean(input.orderId) };
  }
  if (operation === "dispatchOrder") {
    return { orderId: clean(input.orderId), courier: clean(input.courier, 100), trackingCode: clean(input.trackingCode, 100) };
  }
  if (operation === "approvePayment") {
    return { paymentId: clean(input.paymentId), proofId: clean(input.proofId) };
  }
  return { paymentId: clean(input.paymentId), proofId: clean(input.proofId), reason: clean(input.reason, 300) };
};

export interface OwnerHandlerDependencies {
  authorize?: (request: ApiRequest) => Promise<unknown>;
}

export function createOwnerHandler(dependencies: OwnerHandlerDependencies = {}) {
  const authorize = dependencies.authorize ?? requireFloesOwner;
  return async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== "POST") return json(response, 405, { error: "Method not allowed" });
  try {
    await authorize(request);
  } catch (error) {
    console.error("FLOES owner auth:", error instanceof Error ? error.message : "unknown");
    return json(response, 401, { error: "Unauthorized" });
  }

  let body: Record<string, unknown>;
  try {
    body = parseBody(request.body);
  } catch {
    return json(response, 400, { error: "Invalid JSON" });
  }
  const operation = clean(body.operation, 80);
  if (!allowed.has(operation)) return json(response, 403, { error: "Operation not allowed" });
  const idempotencyKey = clean(body.idempotencyKey, 160);
  if (mutations.has(operation) && !/^[A-Za-z0-9:_-]{16,160}$/.test(idempotencyKey)) {
    return json(response, 400, { error: "Idempotency key is required" });
  }

  try {
    const data = await executeCommerce(operation, safeInput(operation, body.input), {
      scope: operation === "searchProducts" ? "commerce" : "owner",
      ...(idempotencyKey ? { idempotencyKey } : {}),
    });
    return json(response, 200, { ok: true, tenantId, data });
  } catch (error) {
    console.error("FLOES owner operation:", error instanceof Error ? error.message : "unknown");
    return json(response, 409, { error: "La operación no pudo completarse en el estado actual." });
  }
  };
}

export default createOwnerHandler();
