import "./storage-fixture.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { mapChopifyCatalog } from "../src/services/chopify/catalog.ts";
import { cartLineId, useCartStore } from "../src/store/cartStore.ts";
import { getCartSubtotal } from "../src/store/cartSelectors.ts";
import { whatsappUrl } from "../src/utils/storefront.ts";

const [product] = mapChopifyCatalog([{ productId: "test-model", sku: "TEST", name: "Modelo test", slug: "modelo-test", status: "ACTIVE", visibility: "VISIBLE", available: true, price: { amount: 45, currency: "USD" }, pricingStatus: "READY", variants: [{ variantId: "test-vino", sku: "TEST-VINO", color: "Vino", sizes: ["S", "M"], available: true, price: { amount: 45 }, promotionalPrice: { amount: 40 }, pricingStatus: "READY" }] }]);

test("cart preserves separate sizes for one color SKU and uses Chopify promotion", () => {
  const store = useCartStore.getState(); store.clearCart();
  store.addItem(product, 1, product.variants[0], "S");
  store.addItem(product, 2, product.variants[0], "M");
  store.addItem(product, 1, product.variants[0], "XL");
  const items = useCartStore.getState().items;
  assert.equal(items.length, 2);
  assert.deepEqual(items.map((item) => item.size), ["S", "M"]);
  assert.equal(items[0].lineId, cartLineId(product.id, product.variants[0].id, "S"));
  assert.equal(getCartSubtotal(items), 120);
  store.clearCart();
});

test("WhatsApp URL encodes a contextual model/color/size message", () => {
  const result = new URL(whatsappUrl("+593 99 000 0000", "Hola, estoy interesada en Modelo test color Vino talla M."));
  assert.equal(result.searchParams.get("text"), "Hola, estoy interesada en Modelo test color Vino talla M.");
  assert.equal(result.pathname, "/593990000000");
  assert.equal(whatsappUrl("", "Hola"), "");
});
