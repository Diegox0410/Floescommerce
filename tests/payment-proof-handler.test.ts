import assert from "node:assert/strict";
import test from "node:test";
import { createPaymentProofForwarder } from "../api/payment-proof.ts";

function response() {
  const result = { statusCode: 0, headers: {} as Record<string, string>, body: "" as string | Uint8Array };
  return Object.assign(result, {
    setHeader(name: string, value: string) { result.headers[name] = value; },
    end(body: string | Uint8Array = "") { result.body = body; },
  });
}

test("Owner proof forwarding is authenticated and tenant-pinned", async () => {
  let requestedUrl = "";
  let forwardedAuthorization = "";
  let forwardedBypass = "";
  let forwardedScope = "", forwardedTenant = "", redirectMode: RequestRedirect | undefined;
  const handler = createPaymentProofForwarder({
    authorize: async () => ({ uid: "owner" }),
    baseUrl: () => "https://chopify.example/",
    ownerHeaders: () => ({ Authorization: "Bearer test-owner-service", "x-vercel-protection-bypass": "local-test-bypass", "X-Chopify-Access-Scope": "owner", "X-Chopify-Tenant-Id": "tenant-floes" }),
    fetcher: async (input, init) => {
      requestedUrl = String(input);
      forwardedAuthorization = new Headers(init?.headers).get("authorization") ?? "";
      forwardedBypass = new Headers(init?.headers).get("x-vercel-protection-bypass") ?? "";
      forwardedScope = new Headers(init?.headers).get("x-chopify-access-scope") ?? "";
      forwardedTenant = new Headers(init?.headers).get("x-chopify-tenant-id") ?? "";
      redirectMode = init?.redirect;
      return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "image/jpeg", "content-length": "3" } });
    },
  });
  const res = response();
  await handler({ method: "GET", headers: { authorization: "Bearer owner-id-token" }, query: { proofId: "proof_123" } }, res);
  assert.equal(res.statusCode, 200);
  assert.match(requestedUrl, /tenantId=tenant-floes/);
  assert.match(requestedUrl, /proofId=proof_123/);
  assert.equal(forwardedAuthorization, "Bearer test-owner-service");
  assert.equal(forwardedBypass, "local-test-bypass");
  assert.equal(forwardedScope, "owner");
  assert.equal(forwardedTenant, "tenant-floes");
  assert.equal(redirectMode, "error");
  assert.equal(res.headers["Cache-Control"], "private, no-store, max-age=0");
  assert.deepEqual(Array.from(res.body as Uint8Array), [1, 2, 3]);
});

test("proof forwarding ignores browser credentials and prevents path/tenant injection", async () => {
  let fetches = 0;
  const handler = createPaymentProofForwarder({ authorize: async () => "owner", baseUrl: () => "https://chopify.example", ownerHeaders: () => ({ Authorization: "Bearer dedicated-service" }),
    fetcher: async (url, init) => {
      fetches++;
      assert.equal(new URL(String(url)).searchParams.get("tenantId"), "tenant-floes");
      assert.equal(new Headers(init?.headers).get("authorization"), "Bearer dedicated-service");
      return new Response(new Uint8Array([1]), { headers: { "content-type": "image/jpeg" } });
    } });
  const invalid = response();
  await handler({ method: "GET", headers: {}, query: { proofId: "../../other", tenantId: "tenant-mg" } }, invalid);
  assert.equal(invalid.statusCode, 400); assert.equal(fetches, 0);
  const valid = response();
  await handler({ method: "GET", headers: { authorization: "Bearer browser-user" }, query: { proofId: "proof-1", tenantId: "tenant-mg" } }, valid);
  assert.equal(valid.statusCode, 200); assert.equal(fetches, 1);
});

test("proof forwards neither private upstream error nor unsupported media to Owner", async () => {
  for (const upstream of [Response.json({ error: "private auth detail" }, { status: 403 }), new Response("<script>unsafe</script>", { headers: { "content-type": "text/html" } }), new Response("large", { headers: { "content-type": "image/jpeg", "content-length": String(11 * 1024 * 1024) } })]) {
    const handler = createPaymentProofForwarder({ authorize: async () => "owner", baseUrl: () => "https://chopify.example", ownerHeaders: () => ({ Authorization: "Bearer service" }), fetcher: async () => upstream });
    const res = response(); await handler({ method: "GET", headers: {}, query: { proofId: "proof-1" } }, res);
    assert.ok([502, 415].includes(res.statusCode)); assert.equal(String(res.body).includes("private auth detail"), false); assert.equal(String(res.body).includes("<script>"), false);
  }
});

test("proof forwarding rejects unauthenticated and malformed requests before upstream access", async () => {
  let fetched = false;
  const handler = createPaymentProofForwarder({
    authorize: async () => { throw new Error("unauthorized"); },
    fetcher: async () => { fetched = true; return new Response(); },
  });
  const res = response();
  await handler({ method: "GET", headers: {}, query: { proofId: "proof_123" } }, res);
  assert.equal(res.statusCode, 401);
  assert.equal(fetched, false);
});
