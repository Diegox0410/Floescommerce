import test from "node:test";
import assert from "node:assert/strict";

import { canPurchase, hasKnownPrice, mapChopifyCatalog } from "../src/services/chopify/catalog.ts";

const base = {
  productId: "floes-test",
  name: "Modelo test",
  sku: "FLO-TEST",
  slug: "modelo-test",
  category: "Scrubs",
  available: true,
  availabilityStatus: "AVAILABLE_BY_MODE",
  fulfillmentMode: "MADE_TO_ORDER",
  status: "ACTIVE",
  visibility: "VISIBLE",
  images: [{ url: "https://example.test/modelo.jpg" }],
  variants: [],
};

test("catalog mapping preserves unknown pricing instead of presenting zero", () => {
  const [product] = mapChopifyCatalog([{ ...base, price: null, pricingStatus: "PENDING" }]);
  assert.equal(product.pricingStatus, "PENDING");
  assert.equal(hasKnownPrice(product), false);
  assert.equal(canPurchase(product), false);
});

test("made-to-order products remain available when price is known and stock is unknown", () => {
  const [product] = mapChopifyCatalog([{
    ...base,
    price: { amount: 42.5, currency: "USD" },
    pricingStatus: "READY",
  }]);
  assert.equal(product.price, 42.5);
  assert.equal(product.fulfillmentMode, "MADE_TO_ORDER");
  assert.equal(product.stock, 0);
  assert.equal(hasKnownPrice(product), true);
  assert.equal(canPurchase(product), true);
});

test("catalog mapping rejects a malformed upstream payload", () => {
  assert.throws(() => mapChopifyCatalog({ products: [] }), /catálogo inválido/);
});
