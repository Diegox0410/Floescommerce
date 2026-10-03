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
