import { auth } from "../firebase/firebase";
import { record, text } from "../../utils/normalization";

export async function ownerOperation(operation: string, input: Record<string, unknown> = {}, mutate = false) {
  const user = auth.currentUser;
  if (!user) throw new Error("La sesión de Owner ya no está disponible.");
  const token = await user.getIdToken();
  const response = await fetch("/api/owner", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ operation, input, ...(mutate ? { idempotencyKey: `floes-owner:${operation}:${crypto.randomUUID()}` } : {}) }),
  });
  const payload: unknown = await response.json().catch(() => ({}));
  const body = record(payload);
  if (!response.ok || body.ok !== true) throw new Error(text(body.error, "No se pudo completar la operación."));
  return body.data;
}

export async function loadPaymentProof(proofId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("La sesión de Owner ya no está disponible.");
  const token = await user.getIdToken();
  const response = await fetch(`/api/payment-proof?proofId=${encodeURIComponent(proofId)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}`, Accept: "image/*,application/pdf" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("No se pudo recuperar el comprobante de Chopify.");
  const blob = await response.blob();
  if (!new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]).has(blob.type)) {
    throw new Error("Chopify devolvió un formato de comprobante no permitido.");
  }
  return { url: URL.createObjectURL(blob), contentType: blob.type };
}

export async function ownerConversationRead(view: "list" | "thread" | "customer", input: Record<string, string | number> = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("La sesión de Owner ya no está disponible.");
  const token = await user.getIdToken();
  const query = new URLSearchParams({ view });
  for (const [key, value] of Object.entries(input)) if (String(value)) query.set(key, String(value));
  const response = await fetch(`/api/conversations?${query}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store",
  });
  const payload = record(await response.json().catch(() => ({})));
  if (!response.ok || payload.ok !== true) throw new Error(text(payload.error, "No se pudo consultar la conversación."));
  return payload;
}

export async function ownerConversationAction(conversationId: string, action: "take" | "release" | "mark-read" | "close" | "reopen" | "send-human", reason = "", messageText = "", operationKey?: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("La sesión de Owner ya no está disponible.");
  const token = await user.getIdToken();
  const response = await fetch("/api/conversations", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ conversationId, action, reason, ...(action === "send-human" ? { text: messageText } : {}), idempotencyKey: operationKey ?? `floes-owner:${action}:${crypto.randomUUID()}` }),
  });
  const payload = record(await response.json().catch(() => ({})));
  if (!response.ok || payload.ok !== true) throw new Error(text(payload.error, "No se pudo actualizar la conversación."));
  return payload;
}
