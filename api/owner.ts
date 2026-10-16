import { executeCommerce, tenantId } from "./_lib/chopify.js";
import { OwnerAuthError, requireFloesOwner } from "./_lib/firebaseAuth.js";
import { json, parseBody, type ApiRequest, type ApiResponse } from "./_lib/http.js";

const allowed = new Set([
  "verifyOwnerAccess",
  "ownerDashboard",
  "getCatalogSnapshot",
  "listOrders",
  "getOrderDetail",
  "listPaymentReviews",
  "listCustomers",
  "listProducts",
  "searchProducts",
  "approvePayment",
  "setShippingQuote",
  "rejectPaymentProof",
  "startPreparation",
  "markReady",
  "dispatchOrder",
  "markDelivered",
  "recordOrderFollowUp",
  "addCustomerNote",
  "resolveEscalation",
]);
const mutations = new Set([
  "approvePayment",
  "setShippingQuote",
  "rejectPaymentProof",
  "startPreparation",
  "markReady",
  "dispatchOrder",
  "markDelivered",
  "recordOrderFollowUp",
  "addCustomerNote",
  "resolveEscalation",
]);
const clean = (value: unknown, max = 160) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const safeImages = (value: unknown) => Array.isArray(value) ? value.flatMap((entry) => {
  const image = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
  const url = typeof image.url === "string" ? image.url : "";
  return /^(?:https:\/\/|\/(?!\/))/.test(url) ? [{ url, alt: clean(image.alt, 200) }] : [];
}) : [];

const ownerSizeStock = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const entries: Array<[string, number | null]> = [];
  for (const [rawSize, amount] of Object.entries(value as Record<string, unknown>)) {
    const size = clean(rawSize, 40);
    if (!size) continue;
    if (amount === null || typeof amount === "number" && Number.isInteger(amount) && amount >= 0) entries.push([size, amount]);
  }
  return entries.length ? Object.fromEntries(entries) : undefined;
};

/** Owner-only inventory audit projection; excludes costs, private notes, and credentials. */
const ownerCatalogView = (value: unknown) => Array.isArray(value) ? value.flatMap((entry) => {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
  const product = entry as Record<string, unknown>;
  if (product.tenantId && product.tenantId !== tenantId) return [];
  const variants = Array.isArray(product.variants) ? product.variants.flatMap((variantEntry) => {
    if (!variantEntry || typeof variantEntry !== "object" || Array.isArray(variantEntry)) return [];
    const variant = variantEntry as Record<string, unknown>;
    return [{
      variantId: clean(variant.id), sku: clean(variant.sku), color: clean(variant.color), size: clean(variant.size),
      sizes: Array.isArray(variant.sizes) ? variant.sizes.map((size) => clean(size, 40)).filter(Boolean) : [],
      status: clean(variant.status), visibility: clean(variant.visibility), available: typeof variant.available === "boolean" ? variant.available : null,
      stock: typeof variant.stock === "number" ? variant.stock : null,
      initialStockBySize: ownerSizeStock(variant.initialStockBySize),
      sizeAvailability: Array.isArray(variant.sizeAvailability) ? variant.sizeAvailability.flatMap((row) => {
        if (!row || typeof row !== "object" || Array.isArray(row)) return [];
        const sizeRow = row as Record<string, unknown>;
        const size = clean(sizeRow.size, 40);
        const amount = sizeRow.availableQuantity;
        const current = typeof amount === "number" && Number.isInteger(amount) && amount >= 0 ? amount : null;
        return size ? [{ size, availableQuantity: current, available: current !== null && current > 0 }] : [];
      }) : [],
      salePriceCents: typeof variant.salePriceCents === "number" ? variant.salePriceCents : null,
      promotionalPriceCents: typeof variant.promotionalPriceCents === "number" ? variant.promotionalPriceCents : null,
      images: safeImages(variant.images),
    }];
  }) : [];
  return [{
    productId: clean(product.id), tenantId: clean(product.tenantId), sku: clean(product.sku), slug: clean(product.slug),
    name: clean(product.name, 200), description: clean(product.description, 4000), category: clean(product.category, 120),
    status: clean(product.status), visibility: clean(product.visibility), pricingStatus: clean(product.pricingStatus),
    salePriceCents: typeof product.salePriceCents === "number" ? product.salePriceCents : null,
    promotionalPriceCents: typeof product.promotionalPriceCents === "number" ? product.promotionalPriceCents : null,
    currency: clean(product.currency, 3) || null, images: safeImages(product.images), variants,
  }];
}) : [];

/** Owner-only customer projection; omits internal notes and commerce metadata. */
const ownerCustomerView = (value: unknown) => Array.isArray(value) ? value.flatMap((entry) => {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
  const customer = entry as Record<string, unknown>;
  if (customer.tenantId && customer.tenantId !== tenantId) return [];
  return [{
    id: clean(customer.id), tenantId: clean(customer.tenantId), name: clean(customer.name, 200),
    phone: clean(customer.phone, 40), email: clean(customer.email, 200),
    acquisitionSource: clean(customer.acquisitionSource, 80),
  }];
}) : [];

const safeInput = (operation: string, raw: unknown) => {
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  if (["ownerDashboard", "getCatalogSnapshot", "listOrders", "listPaymentReviews", "listCustomers", "listProducts"].includes(operation)) return {};
  if (operation === "searchProducts") {
    const limit = Number(input.limit);
    return { query: clean(input.query, 120), limit: Number.isFinite(limit) ? Math.max(1, Math.min(200, Math.floor(limit))) : 200 };
  }
  if (operation === "addCustomerNote") return { customerId: clean(input.customerId), body: clean(input.body, 1000) };
  if (operation === "setShippingQuote") return { orderId: clean(input.orderId), amountCents: Number(input.amountCents), expectedVersion: Number(input.expectedVersion) };
  if (operation === "recordOrderFollowUp") return { orderId: clean(input.orderId), customerId: clean(input.customerId), outcome: clean(input.outcome), note: clean(input.note, 500) };
  if (operation === "resolveEscalation") return { escalationId: clean(input.escalationId), resolution: clean(input.resolution, 500) };
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

const hasRequiredInput = (operation: string, input: Record<string, unknown>) => {
  const has = (...fields: string[]) => fields.every((field) => clean(input[field]));
  if (["getOrderDetail", "startPreparation", "markReady", "markDelivered"].includes(operation)) return has("orderId");
  if (operation === "dispatchOrder") return has("orderId", "courier", "trackingCode");
  if (["approvePayment", "rejectPaymentProof"].includes(operation)) {
    return has("paymentId", "proofId") && (operation !== "rejectPaymentProof" || has("reason"));
  }
  if (operation === "setShippingQuote") return has("orderId") && Number.isSafeInteger(input.amountCents) && Number(input.amountCents) >= 0 && Number.isInteger(input.expectedVersion) && Number(input.expectedVersion) >= 0;
  if (operation === "recordOrderFollowUp") return has("orderId", "customerId") && ["RECEIVED", "SATISFIED", "ISSUE", "HUMAN_REQUESTED"].includes(String(input.outcome));
  if (operation === "addCustomerNote") return has("customerId", "body");
  if (operation === "resolveEscalation") return has("escalationId", "resolution");
  return true;
};

export interface OwnerHandlerDependencies {
  authorize?: (request: ApiRequest) => Promise<unknown>;
  execute?: typeof executeCommerce;
}

export function createOwnerHandler(dependencies: OwnerHandlerDependencies = {}) {
  const authorize = dependencies.authorize ?? requireFloesOwner;
  const execute = dependencies.execute ?? executeCommerce;
  return async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== "POST") return json(response, 405, { error: "Method not allowed" });
  try {
    await authorize(request);
  } catch (error) {
    const code = error instanceof OwnerAuthError ? error.code : "FLOES_OWNER_TOKEN_INVALID";
    const status = code === "FLOES_OWNER_UID_NOT_ALLOWED" ? 403
      : code === "FLOES_OWNER_CONFIG" || code === "FLOES_OWNER_PROJECT_MISMATCH" || code === "FLOES_OWNER_VERIFICATION_UNAVAILABLE" ? 503
        : 401;
    console.error("FLOES_OWNER_AUTH_FAILED", { code });
    return json(response, status, { error: "Owner access could not be verified.", code });
  }

  let body: Record<string, unknown>;
  try {
    body = parseBody(request.body);
  } catch {
    return json(response, 400, { error: "Invalid JSON" });
  }
  const operation = clean(body.operation, 80);
  if (!allowed.has(operation)) return json(response, 403, { error: "Operation not allowed" });
  if (operation === "verifyOwnerAccess") return json(response, 200, { ok: true, tenantId, data: { authorized: true } });
  const idempotencyKey = clean(body.idempotencyKey, 160);
  if (mutations.has(operation) && !/^[A-Za-z0-9:_-]{16,160}$/.test(idempotencyKey)) {
    return json(response, 400, { error: "Idempotency key is required" });
  }
  const input = safeInput(operation, body.input);
  if (!hasRequiredInput(operation, input)) {
    return json(response, 400, { error: "Required operation fields are missing." });
  }

  try {
    const data = await execute(operation, input, {
      scope: operation === "searchProducts" ? "commerce" : "owner",
      ...(idempotencyKey ? { idempotencyKey } : {}),
    });
    const safeData = operation === "listProducts" ? ownerCatalogView(data) : operation === "listCustomers" ? ownerCustomerView(data) : data;
    return json(response, 200, { ok: true, tenantId, data: safeData });
  } catch {
    console.error("FLOES_OWNER_OPERATION_FAILED", { operation });
    return json(response, 409, { error: "La operación no pudo completarse en el estado actual." });
  }
  };
}

export default createOwnerHandler();
