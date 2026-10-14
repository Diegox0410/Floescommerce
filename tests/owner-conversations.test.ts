import assert from "node:assert/strict";
import test from "node:test";
import { createConversationsHandler } from "../api/conversations.ts";

function response() {
  const result = { statusCode: 0, headers: {} as Record<string, string>, body: "" };
  return Object.assign(result, { setHeader(name: string, value: string) { result.headers[name] = value; }, end(body = "") { result.body = body; } });
}
const serviceHeaders = () => ({ Authorization: "Bearer test-service-owner", "X-Chopify-Tenant-Id": "tenant-floes", "X-Chopify-Access-Scope": "owner" });

test("Owner conversation reads are tenant-pinned, paginated and use server credentials", async () => {
  let calledUrl = "", headers = new Headers();
  const handler = createConversationsHandler({ authorize: async () => "owner", baseUrl: () => "https://chopify.example", ownerHeaders: serviceHeaders,
    fetcher: async (url, init) => { calledUrl = String(url); headers = new Headers(init?.headers); return Response.json({ ok: true, conversations: [], nextCursor: null }); } });
  const res = response();
  await handler({ method: "GET", headers: { authorization: "Bearer browser-token" }, query: { view: "list", tenantId: "tenant-mg", limit: "1000", token: "attacker", url: "https://other.example" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(new URL(calledUrl).pathname, "/api/conversations");
  assert.equal(new URL(calledUrl).searchParams.get("tenantId"), "tenant-floes");
  assert.equal(new URL(calledUrl).searchParams.get("limit"), "50");
  assert.equal(new URL(calledUrl).searchParams.has("token"), false);
  assert.equal(headers.get("authorization"), "Bearer test-service-owner");
  assert.equal(headers.get("x-chopify-access-scope"), "owner");
  assert.equal(res.headers["Cache-Control"], "no-store");
});

test("Owner conversation actions ignore arbitrary tenant, bearer and fields", async () => {
  let sent: Record<string, unknown> = {};
  const handler = createConversationsHandler({ authorize: async () => "owner", baseUrl: () => "https://chopify.example", ownerHeaders: serviceHeaders,
    fetcher: async (_, init) => { sent = JSON.parse(String(init?.body)); return Response.json({ ok: true, conversationId: "conv-1", mode: "HUMAN", status: "OPEN" }); } });
  const res = response();
  await handler({ method: "POST", headers: {}, body: { tenantId: "tenant-mg", conversationId: "conv-1", action: "take", token: "client-token", idempotencyKey: "owner:test:1234567890" } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(sent, { tenantId: "tenant-floes", conversationId: "conv-1", action: "take", idempotencyKey: "owner:test:1234567890" });
});

test("Unauthorized, malformed and unsafe conversation actions never reach Chopify", async () => {
  let calls = 0;
  const handler = createConversationsHandler({ authorize: async () => "owner", fetcher: async () => { calls++; return Response.json({ ok: true }); } });
  for (const body of [{ action: "send", conversationId: "conv-1", idempotencyKey: "owner:valid:1234567890" }, { action: "close", conversationId: "conv-1", idempotencyKey: "owner:valid:1234567890" }, { action: "take", conversationId: "conv-1" }]) {
    const res = response(); await handler({ method: "POST", headers: {}, body }, res); assert.equal(res.statusCode, 400);
  }
  const denied = createConversationsHandler({ authorize: async () => { throw new Error("unauthorized"); }, fetcher: async () => { calls++; return Response.json({ ok: true }); } });
  const res = response(); await denied({ method: "GET", headers: {}, query: { view: "list" } }, res);
  assert.equal(res.statusCode, 401); assert.equal(calls, 0);
});

test("Private upstream errors never expose service credentials or request content", async () => {
  const handler = createConversationsHandler({ authorize: async () => "owner", baseUrl: () => "https://chopify.example", ownerHeaders: serviceHeaders,
    fetcher: async () => Response.json({ error: "secret upstream detail" }, { status: 401 }) });
  const res = response(); await handler({ method: "GET", headers: {} }, res);
  assert.equal(res.statusCode, 502); assert.equal(res.body.includes("secret upstream detail"), false);
});

test("Human reply forwards only message and fixed thread, never arbitrary recipient or attachment", async () => {
  let sent: Record<string, unknown> = {};
  const handler = createConversationsHandler({ authorize: async () => "owner", baseUrl: () => "https://chopify.example", ownerHeaders: serviceHeaders,
    fetcher: async (_, init) => { sent = JSON.parse(String(init?.body)); return Response.json({ ok: true, status: "ACCEPTED", deliveryStatus: "ACCEPTED", outboundId: "out-1" }); } });
  const res = response(); await handler({ method: "POST", headers: {}, body: { conversationId: "conv-1", action: "send-human", text: " Confirmación humana ", idempotencyKey: "owner:reply:1234567890", phone: "+00000000", attachmentUrl: "https://other.example", tenantId: "tenant-mg" } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(sent, { tenantId: "tenant-floes", conversationId: "conv-1", action: "send-human", text: "Confirmación humana", idempotencyKey: "owner:reply:1234567890" });
});
