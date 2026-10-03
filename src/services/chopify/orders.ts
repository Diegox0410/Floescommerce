import type { Order } from "../../types/order";
import { record, text } from "../../utils/normalization";

export async function createChopifyOrder(draft: Order): Promise<Order> {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      idempotencyKey: `floes-web:${draft.id}`,
      customer: draft.customer,
      shipping: draft.shipping,
      paymentMethod: draft.paymentMethod,
      lines: draft.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    }),
  });
  const payload: unknown = await response.json().catch(() => ({}));
  const body = record(payload);
  if (!response.ok || body.ok !== true) {
    throw new Error(text(body.error, "No se pudo registrar el pedido."));
  }
  const remote = record(body.order);
  const orderId = text(remote.orderId);
  const total = record(remote.total);
  if (!orderId || typeof total.amount !== "number" || !Number.isFinite(total.amount)) {
    throw new Error("Chopify no devolvió una confirmación de pedido válida.");
  }

  const now = new Date().toISOString();
  return {
    ...draft,
    id: orderId,
    customerId: text(remote.customerId) || undefined,
    subtotal: total.amount,
    shippingCost: null,
    total: total.amount,
    discount: 0,
    paymentStatus: "pending",
    orderStatus: "new",
    estimatedCost: 0,
    estimatedProfit: 0,
    inventoryCommitted: false,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getChopifyOrderStatus(orderId: string) {
  const response = await fetch(`/api/orders?id=${encodeURIComponent(orderId)}`, {
    headers: { Accept: "application/json" },
  });
  const payload: unknown = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(text(record(payload).error, "No se pudo consultar el pedido."));
  return record(record(payload).order);
}
