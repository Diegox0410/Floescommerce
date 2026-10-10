import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/catalog.js";
import type { ApiRequest, ApiResponse } from "../api/_lib/http.js";

test("FLOES public proxy fixes its tenant, bypasses Preview protection and does not cache stock", async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.CHOPIFY_BASE_URL;
  const originalBypass = process.env.CHOPIFY_VERCEL_PROTECTION_BYPASS_SECRET;
  let upstreamUrl = "";
  let upstreamHeaders: Headers | undefined;
  let body = "";
  const headers = new Map<string, string>();
  const response: ApiResponse = { statusCode: 0, setHeader: (name, value) => { headers.set(name, String(value)); }, end: (value) => { body = value ?? ""; } };
  try {
    process.env.CHOPIFY_BASE_URL = "https://chopify-preview.example.test";
    process.env.CHOPIFY_VERCEL_PROTECTION_BYPASS_SECRET = "test-preview-secret";
    globalThis.fetch = async (input, init) => {
      upstreamUrl = String(input);
      upstreamHeaders = new Headers(init?.headers);
      return new Response(JSON.stringify([{ productId: "floes", imageUrl: "/catalogo/floes/daniela/vino.jpeg" }]), { status: 200 });
    };
    await handler({ method: "GET", query: { tenant: "tenant-mg" } } as ApiRequest, response);
    assert.equal(new URL(upstreamUrl).searchParams.get("tenant"), "tenant-floes");
    assert.equal(upstreamHeaders?.get("x-vercel-protection-bypass"), "test-preview-secret");
    assert.equal(response.statusCode, 200);
    assert.equal(headers.get("Cache-Control"), "no-store");
    assert.equal(JSON.parse(body)[0].imageUrl, "https://chopify-preview.example.test/catalogo/floes/daniela/vino.jpeg");
    assert.equal(body.includes("test-preview-secret"), false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.CHOPIFY_BASE_URL; else process.env.CHOPIFY_BASE_URL = originalUrl;
    if (originalBypass === undefined) delete process.env.CHOPIFY_VERCEL_PROTECTION_BYPASS_SECRET; else process.env.CHOPIFY_VERCEL_PROTECTION_BYPASS_SECRET = originalBypass;
  }
});
