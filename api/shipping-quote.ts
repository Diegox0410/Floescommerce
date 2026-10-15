import { executeCommerce } from "./_lib/chopify.js";
import { json, parseBody, type ApiRequest, type ApiResponse } from "./_lib/http.js";

const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const keyOk = (value: unknown) => typeof value === "string" && /^[A-Za-z0-9:_-]{16,160}$/.test(value);

/** Customer acceptance endpoint. It accepts only an Owner's saved quote version; it never accepts an amount. */
export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== "POST") return json(response, 405, { error: "Method not allowed" });
  let body: Record<string, unknown>;
  try { body = parseBody(request.body); } catch { return json(response, 400, { error: "JSON inválido." }); }
  const orderId = clean(body.orderId, 160);
  const customerId = clean(body.customerId, 160);
  const version = body.version;
  const idempotencyKey = body.idempotencyKey;
  if (!orderId || !customerId || !Number.isSafeInteger(version) || Number(version) < 1 || !keyOk(idempotencyKey)) {
    return json(response, 400, { error: "Pedido, cliente, versión e idempotencia son obligatorios." });
  }
  try {
    const order = await executeCommerce("acceptShippingQuote", { orderId, customerId, expectedVersion: version }, { idempotencyKey: String(idempotencyKey) });
    return json(response, 200, { ok: true, order });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "No se pudo aceptar el envío.";
    return json(response, 409, { error: reason });
  }
}
