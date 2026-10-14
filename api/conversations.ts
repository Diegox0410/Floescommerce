import { chopifyBaseUrl, chopifyOwnerHeaders, tenantId } from "./_lib/chopify.js";
import { requireFloesOwner } from "./_lib/firebaseAuth.js";
import { json, parseBody, queryValue, type ApiRequest, type ApiResponse } from "./_lib/http.js";

interface Dependencies {
  authorize?: (request: ApiRequest) => Promise<unknown>;
  fetcher?: typeof fetch;
  baseUrl?: () => string;
  ownerHeaders?: () => Record<string, string>;
}

const actions = new Set(["take", "release", "mark-read", "close", "reopen", "send-human"]);
const clean = (value: unknown, limit = 160) => typeof value === "string" ? value.trim().slice(0, limit) : "";
const identifier = (value: string) => /^[A-Za-z0-9:_-]{1,160}$/.test(value);
const pageSize = (value: unknown) => Math.max(1, Math.min(50, Math.floor(Number(value) || 25)));

/** Owner bridge with a fixed tenant, route and service credential; never a generic proxy. */
export function createConversationsHandler(dependencies: Dependencies = {}) {
  const authorize = dependencies.authorize ?? requireFloesOwner;
  const fetcher = dependencies.fetcher ?? fetch;
  const baseUrl = dependencies.baseUrl ?? chopifyBaseUrl;
  const ownerHeaders = dependencies.ownerHeaders ?? chopifyOwnerHeaders;
  return async (request: ApiRequest, response: ApiResponse) => {
    if (request.method !== "GET" && request.method !== "POST") return json(response, 405, { error: "Method not allowed" });
    try { await authorize(request); } catch { return json(response, 401, { error: "Unauthorized" }); }

    let body: Record<string, unknown> | undefined;
    const params = new URLSearchParams({ tenantId });
    if (request.method === "GET") {
      const value = (key: string) => queryValue(request.query?.[key]) ?? "";
      const view = value("view") || "list";
      if (!["list", "thread", "customer"].includes(view)) return json(response, 400, { error: "Invalid view" });
      params.set("view", view);
      params.set("limit", String(pageSize(value("limit"))));
      if (view === "thread" || view === "customer") {
        const key = view === "thread" ? "conversationId" : "customerId";
        const id = value(key);
        if (!identifier(id)) return json(response, 400, { error: "Invalid identifier" });
        params.set(key, id);
      }
      for (const key of view === "list" ? ["query", "status", "channel", "cursor"] : view === "thread" ? ["before"] : ["cursor"]) {
        const input = clean(value(key), key === "cursor" || key === "before" ? 1200 : 160);
        if (input) params.set(key, input);
      }
    } else {
      let raw: Record<string, unknown>;
      try { raw = parseBody(request.body); } catch { return json(response, 400, { error: "Invalid JSON" }); }
      const conversationId = clean(raw.conversationId);
      const action = clean(raw.action, 40);
      const reason = clean(raw.reason, 500);
      const idempotencyKey = clean(raw.idempotencyKey);
      const messageText = typeof raw.text === "string" ? raw.text.trim() : "";
      if (!identifier(conversationId) || !actions.has(action) || !/^[A-Za-z0-9:_-]{16,160}$/.test(idempotencyKey) || action === "close" && !reason || action === "send-human" && (!messageText || messageText.length > 4000)) {
        return json(response, 400, { error: "Invalid conversation action" });
      }
      body = { tenantId, conversationId, action, idempotencyKey, ...(reason ? { reason } : {}), ...(action === "send-human" ? { text: messageText } : {}) };
    }

    try {
      const url = new URL("/api/conversations", `${baseUrl().replace(/\/$/, "")}/`);
      if (request.method === "GET") url.search = params.toString();
      const upstream = await fetcher(url, {
        method: request.method,
        headers: { ...ownerHeaders(), Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
        redirect: "error", cache: "no-store", signal: AbortSignal.timeout(12_000),
      });
      const result: unknown = await upstream.json().catch(() => null);
      if (!upstream.ok) return json(response, [400, 404, 409, 429].includes(upstream.status) ? upstream.status : 502, { error: "No se pudo completar la operación en Chopify." });
      if (!result || typeof result !== "object" || Array.isArray(result) || (result as { ok?: unknown }).ok !== true) {
        return json(response, 502, { error: "Chopify devolvió una respuesta no válida." });
      }
      return json(response, 200, result);
    } catch { return json(response, 502, { error: "No se pudo conectar con Chopify." }); }
  };
}

export default createConversationsHandler();
