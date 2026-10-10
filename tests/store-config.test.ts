import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/store-config.js";
import type { ApiResponse } from "../api/_lib/http.js";
import { applyPublicStoreConfig } from "../src/services/chopify/storeConfig.js";
import { defaultStoreConfig } from "../src/store/storeConfigStore.js";

test("public contact exposes only a valid configured WhatsApp number for FLOES", async () => {
  const originalNumber = process.env.FLOES_WHATSAPP_NUMBER;
  let body = "";
  const response: ApiResponse = { statusCode: 0, setHeader: () => {}, end: (value) => { body = value ?? ""; } };
  try {
    process.env.FLOES_WHATSAPP_NUMBER = "+593 (99) 000-0000";
    await handler({ method: "GET", headers: {} }, response);
    const payload = JSON.parse(body);
    assert.equal(payload.tenantId, "tenant-floes");
    assert.equal(payload.contact.whatsapp, "593990000000");
    assert.equal(payload.commerce.whatsappPurchaseEnabled, true);
    assert.deepEqual(Object.keys(payload).sort(), ["commerce", "contact", "tenantId"]);
    process.env.FLOES_WHATSAPP_NUMBER = "phone-number-id-invalid";
    await handler({ method: "GET", headers: {} }, response);
    assert.equal(JSON.parse(body).commerce.whatsappPurchaseEnabled, false);
  } finally {
    if (originalNumber === undefined) delete process.env.FLOES_WHATSAPP_NUMBER; else process.env.FLOES_WHATSAPP_NUMBER = originalNumber;
  }
});

test("fresh visitors receive the configured CTA and stale local contact cannot survive a disabled config", () => {
  const enabled = applyPublicStoreConfig(defaultStoreConfig, { tenantId: "tenant-floes", contact: { whatsapp: "593990000000" }, commerce: { whatsappPurchaseEnabled: true } });
  assert.equal(enabled.contact.whatsapp, "593990000000");
  assert.equal(enabled.commerce.whatsappPurchaseEnabled, true);
  const disabled = applyPublicStoreConfig(enabled, { tenantId: "tenant-floes", contact: { whatsapp: "" }, commerce: { whatsappPurchaseEnabled: false } });
  assert.equal(disabled.contact.whatsapp, "");
  assert.equal(disabled.commerce.whatsappPurchaseEnabled, false);
  assert.throws(() => applyPublicStoreConfig(defaultStoreConfig, { tenantId: "tenant-mg" }), /no corresponde a FLOES/);
});
