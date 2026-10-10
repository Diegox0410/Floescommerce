import type { ApiRequest, ApiResponse } from "./_lib/http.js";
import { json } from "./_lib/http.js";
import { tenantId } from "./_lib/chopify.js";

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== "GET") return json(response, 405, { error: "Method not allowed" });
  const configured = process.env.FLOES_WHATSAPP_NUMBER?.trim() ?? "";
  const digits = configured.replace(/[\s()+-]/g, "");
  const number = /^[1-9]\d{7,14}$/.test(digits) ? digits : "";
  return json(response, 200, {
    tenantId,
    contact: { whatsapp: number },
    commerce: { whatsappPurchaseEnabled: Boolean(number) },
  });
}
