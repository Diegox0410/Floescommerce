import { chopifyBaseUrl, chopifyOwnerHeaders } from "./_lib/chopify.js";
import { queryValue, type ApiRequest } from "./_lib/http.js";
import { requireFloesOwner } from "./_lib/firebaseAuth.js";

interface ProofResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string | Uint8Array): void;
}

interface Dependencies {
  authorize?: (request: ApiRequest) => Promise<unknown>;
  fetcher?: typeof fetch;
  baseUrl?: () => string;
  ownerHeaders?: () => Record<string, string>;
}

const json = (response: ProofResponse, status: number, body: unknown) => {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "private, no-store, max-age=0");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.end(JSON.stringify(body));
};

export function createPaymentProofForwarder(dependencies: Dependencies = {}) {
  const authorize = dependencies.authorize ?? requireFloesOwner;
  const fetcher = dependencies.fetcher ?? fetch;
  const baseUrl = dependencies.baseUrl ?? chopifyBaseUrl;
  const ownerHeaders = dependencies.ownerHeaders ?? chopifyOwnerHeaders;

  return async function paymentProof(request: ApiRequest, response: ProofResponse) {
    if (request.method !== "GET") return json(response, 405, { error: "Method not allowed" });
    try {
      await authorize(request);
    } catch {
      return json(response, 401, { error: "Unauthorized" });
    }

    const proofId = queryValue(request.query?.proofId) ?? "";
    if (!/^[A-Za-z0-9:_-]{1,160}$/.test(proofId)) {
      return json(response, 400, { error: "Invalid proof request" });
    }

    try {
      const url = new URL("/api/payment-proof", `${baseUrl().replace(/\/$/, "")}/`);
      url.searchParams.set("tenantId", "tenant-floes");
      url.searchParams.set("proofId", proofId);
      const upstream = await fetcher(url, {
        method: "GET",
        headers: { Accept: "image/jpeg,image/png,image/webp,image/gif,application/pdf", ...ownerHeaders() },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15_000),
      });
      if (!upstream.ok) {
        const status = upstream.status === 404 || upstream.status === 415 ? upstream.status : 502;
        return json(response, status, { error: "No se pudo cargar el comprobante." });
      }
      const contentType = (upstream.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
      const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]);
      const declaredSize = Number(upstream.headers.get("content-length") ?? 0);
      if (!allowedTypes.has(contentType) || declaredSize > 10 * 1024 * 1024) {
        return json(response, 415, { error: "El tipo o tamaño del comprobante no está permitido." });
      }
      const bytes = new Uint8Array(await upstream.arrayBuffer());
      if (!bytes.length || bytes.length > 10 * 1024 * 1024) return json(response, 415, { error: "El tamaño del comprobante no está permitido." });
      response.statusCode = 200;
      response.setHeader("Content-Type", contentType);
      response.setHeader("Content-Length", String(bytes.byteLength));
      response.setHeader("Content-Disposition", "inline; filename=\"comprobante\"");
      response.setHeader("Cache-Control", "private, no-store, max-age=0");
      response.setHeader("X-Content-Type-Options", "nosniff");
      response.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
      response.end(bytes);
    } catch {
      return json(response, 502, { error: "No se pudo cargar el comprobante." });
    }
  };
}

export default createPaymentProofForwarder();
