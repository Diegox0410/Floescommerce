import assert from "node:assert/strict";
import test from "node:test";
import { ownerAvailability } from "../src/admin/components/chopifyStock.ts";
import { messageActor, conversationActionPrompt } from "../src/admin/components/chopifyCrm.ts";

test("Owner never reports aggregate color quantity as confirmed size inventory", () => {
  assert.equal(ownerAvailability({ status: "ACTIVE", available: true, stock: 50, sizes: ["XS", "S", "M"] }), "Disponibilidad por talla pendiente de confirmar");
  assert.equal(ownerAvailability({ status: "ACTIVE", initialStockBySize: { XS: 50 } }), "Disponibilidad por talla pendiente de confirmar");
  assert.equal(ownerAvailability({ status: "ACTIVE", sizeAvailability: [{ size: "XS", availableQuantity: 0 }, { size: "S", availableQuantity: null }] }), "Disponibilidad por talla pendiente de confirmar");
});

test("Owner distinguishes confirmed size stock, zero stock and hidden product", () => {
  assert.equal(ownerAvailability({ sizeAvailability: [{ size: "XS", availableQuantity: 2 }] }), "Disponible en las tallas confirmadas");
  assert.equal(ownerAvailability({ sizeAvailability: [{ size: "XS", availableQuantity: 0 }] }), "Sin stock en las tallas confirmadas");
  assert.equal(ownerAvailability({ status: "ARCHIVED", stock: 50 }), "No publicado");
  assert.equal(ownerAvailability({ visibility: "HIDDEN", sizeAvailability: [{ size: "XS", availableQuantity: 2 }] }), "No publicado");
});

test("Unified timeline distinguishes client, bot, human and transfer events", () => {
  assert.equal(messageActor({ direction: "INBOUND", senderType: "CLIENT" }), "Cliente");
  assert.equal(messageActor({ direction: "OUTBOUND", senderType: "GANOBOT" }), "GanoBot");
  assert.equal(messageActor({ direction: "OUTBOUND", senderType: "HUMAN" }), "Operador");
  assert.equal(messageActor({ direction: "EVENT", senderType: "SYSTEM" }), "Evento");
  assert.match(conversationActionPrompt("release"), /permite nuevas respuestas automáticas/);
  assert.match(conversationActionPrompt("take"), /detendrá las respuestas automáticas/);
});
