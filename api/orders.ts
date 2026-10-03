import { executeCommerce, tenantId } from "./_lib/chopify.js";
import { json, parseBody, queryValue, type ApiRequest, type ApiResponse } from "./_lib/http.js";

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const validIdempotencyKey = (value: unknown) =>
  typeof value === "string" && /^[A-Za-z0-9:_-]{16,160}$/.test(value);

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method === "GET") {
    const orderId = clean(queryValue(request.query?.id), 160);
    if (!orderId) return json(response, 400, { error: "order id is required" });
    try {
      const data = await executeCommerce("getOrderStatus", { orderId });
      return data
        ? json(response, 200, { ok: true, tenantId, order: data })
        : json(response, 404, { error: "Pedido no encontrado." });
    } catch (error) {
      console.error("FLOES order status:", error instanceof Error ? error.message : "unknown");
      return json(response, 502, { error: "No se pudo consultar el pedido." });
    }
  }

  if (request.method !== "POST") return json(response, 405, { error: "Method not allowed" });

  let body: Record<string, unknown>;
  try {
    body = parseBody(request.body);
  } catch {
    return json(response, 400, { error: "JSON inválido." });
  }

  const idempotencyKey = body.idempotencyKey;
  const customer = body.customer && typeof body.customer === "object"
    ? (body.customer as Record<string, unknown>)
    : {};
  const shipping = body.shipping && typeof body.shipping === "object"
    ? (body.shipping as Record<string, unknown>)
    : {};
  const name = `${clean(customer.firstName, 80)} ${clean(customer.lastName, 80)}`.trim();
  const phone = clean(customer.phone, 40);
  const email = clean(customer.email, 160).toLowerCase();
  const lines = Array.isArray(body.lines) ? body.lines : [];

  if (!validIdempotencyKey(idempotencyKey)) {
    return json(response, 400, { error: "Identificador de envío inválido." });
  }
  if (!name || !phone || !email || !email.includes("@")) {
    return json(response, 400, { error: "Completa los datos del cliente." });
  }
  if (!clean(shipping.province, 100) || !clean(shipping.city, 100) || !clean(shipping.address, 240)) {
    return json(response, 400, { error: "Completa los datos de entrega." });
  }
  if (!lines.length || lines.length > 30) {
    return json(response, 400, { error: "El pedido debe contener entre 1 y 30 productos." });
  }

  const normalizedLines = lines.map((entry) => {
    const line = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
    return {
      productId: clean(line.productId, 160),
      ...(clean(line.variantId, 160) ? { variantId: clean(line.variantId, 160) } : {}),
      quantity: typeof line.quantity === "number" ? Math.floor(line.quantity) : 0,
    };
  });
  if (normalizedLines.some((line) => !line.productId || line.quantity < 1 || line.quantity > 20)) {
    return json(response, 400, { error: "El pedido contiene cantidades o productos inválidos." });
  }

  try {
    const identity = (await executeCommerce("resolveCustomerIdentity", {
      channel: "WEB",
      externalIdentifier: email || phone,
      name,
      phone,
      email,
      acquisitionSource: "FLOES_STOREFRONT",
    })) as { customerId?: unknown };
    if (typeof identity.customerId !== "string") throw new Error("Customer identity was not returned");

    const order = await executeCommerce(
      "createOrderDraft",
      { customerId: identity.customerId, lines: normalizedLines },
      { idempotencyKey: String(idempotencyKey) },
    );
    return json(response, 201, {
      ok: true,
      tenantId,
      order,
      receipt: {
        customer: { firstName: clean(customer.firstName, 80), lastName: clean(customer.lastName, 80), phone, email },
        shipping: {
          province: clean(shipping.province, 100),
          city: clean(shipping.city, 100),
          address: clean(shipping.address, 240),
          reference: clean(shipping.reference, 240),
        },
        paymentMethod: clean(body.paymentMethod, 40),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el pedido.";
    console.error("FLOES order creation:", message);
    const isBusinessRejection = /pricing|inventory|variant|product|quantity|available/i.test(message);
    return json(response, isBusinessRejection ? 409 : 502, {
      error: isBusinessRejection
        ? "El pedido no puede completarse todavía. Revisa precio y disponibilidad."
        : "No se pudo registrar el pedido. Intenta nuevamente.",
    });
  }
}
