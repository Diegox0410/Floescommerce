import test from "node:test";
import assert from "node:assert/strict";

import { availableQuantityForSize, canPurchase, catalogPrice, hasKnownPrice, mapChopifyCatalog, resolveVariant, variantSizes } from "../src/services/chopify/catalog.ts";
import { normalizeProduct } from "../src/utils/normalization.ts";

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

test("an empty upstream catalog is a valid empty result, not an integration error", () => {
  assert.deepEqual(mapChopifyCatalog([]), []);
});

test("one parent keeps color SKUs, real image, declared sizes and flat garment guide", () => {
  const [product] = mapChopifyCatalog([{
    ...base, price: { amount: 45, currency: "USD" }, pricingStatus: "READY", characteristics: ["Bolsillo lateral"], material: "Tela registrada",
    sizeGuide: { measurement: "FLAT_GARMENT_CM", instructions: "Medir una prenda extendida", blouse: [{ size: "M", measurementsCm: { pecho: 50 } }] },
    variants: [
      { variantId: "vino", sku: "TEST-VINO", color: "Vino", price: { amount: 45, currency: "USD" }, promotionalPrice: { amount: 40, currency: "USD" }, pricingStatus: "READY", available: true, sizes: ["S", "M"], images: [{ url: "https://example.test/vino.jpg" }], fulfillmentMode: "STOCK", availableQuantity: 10 },
      { variantId: "negro", sku: "TEST-NEGRO", color: "Negro", price: { amount: 47, currency: "USD" }, pricingStatus: "READY", available: false, sizes: ["M"], images: [{ url: "https://example.test/negro.jpg" }] },
    ],
  }]);
  const hydrated = normalizeProduct(product);
  assert.equal(hydrated.variants.length, 2);
  assert.deepEqual(hydrated.sizes, ["S", "M"]);
  assert.deepEqual(hydrated.characteristics, ["Bolsillo lateral"]);
  assert.equal(hydrated.material, "Tela registrada");
  const selected = resolveVariant(hydrated, "VINO", "M")!;
  assert.equal(selected.sku, "TEST-VINO");
  assert.equal(selected.images?.[0], "https://example.test/vino.jpg");
  assert.deepEqual(variantSizes(selected), ["S", "M"]);
  assert.equal(catalogPrice(hydrated, selected), 40);
  assert.equal(canPurchase(hydrated, selected), true);
  assert.equal(canPurchase(hydrated, resolveVariant(hydrated, "Negro", "M")), false);
  assert.equal(resolveVariant(hydrated, "Azul", "M"), undefined);
  assert.equal(resolveVariant(hydrated, "Vino", "XL"), undefined);
  assert.equal(hydrated.sizeGuide?.rows[0].values[0], "50 cm");
  assert.equal(hydrated.sizeGuide?.measurement, "FLAT_GARMENT_CM");
});

test("unconfigured availability and local Windows images do not become a purchasable variant", () => {
  const [product] = mapChopifyCatalog([{ ...base, price: { amount: 45 }, pricingStatus: "READY", variants: [{ variantId: "pending", sku: "PENDING", color: "Vino", price: { amount: 45 }, pricingStatus: "READY", images: [{ url: "C:\\catalog\\vino.jpeg" }], availabilityStatus: "NOT_CONFIGURED" }] }]);
  assert.deepEqual(product.variants[0].images, []);
  assert.equal(canPurchase(product, product.variants[0]), false);
});

test("stock availability is derived independently for each normalized size", () => {
  const [product] = mapChopifyCatalog([{
    ...base,
    price: { amount: 45, currency: "USD" },
    pricingStatus: "READY",
    variants: [{
      variantId: "dan-vino", sku: "FLOES-DAN-11", color: "Vino", price: { amount: 45, currency: "USD" },
      pricingStatus: "READY", available: true, fulfillmentMode: "STOCK", sizes: ["XS", "S", "M", "L", "XL"],
      availableQuantity: 49,
      sizeAvailability: [
        { size: "xs", availableQuantity: 0 },
        { size: "S", availableQuantity: 10 },
        { size: "M", availableQuantity: 9 },
        { size: "L", availableQuantity: 10 },
        { size: "XL", availableQuantity: 10 },
      ],
    }],
  }]);
  const variant = product.variants[0];
  assert.equal(availableQuantityForSize(variant, "XS"), 0);
  assert.equal(availableQuantityForSize(variant, "m"), 9);
  assert.equal(canPurchase(product, variant, "XS"), false);
  assert.equal(canPurchase(product, variant, "M"), true);
  assert.equal(canPurchase(product, variant), true);
});
