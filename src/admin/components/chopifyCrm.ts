export type ConversationAction = "take" | "release" | "mark-read" | "close" | "reopen";

export const conversationStatusLabels: Record<string, string> = {
  OPEN: "Abierta", NEEDS_HUMAN: "Requiere humano", CLOSED: "Cerrada", ARCHIVED: "Archivada",
  AI_ACTIVE: "IA atendiendo", WAITING_CUSTOMER: "Esperando cliente", WAITING_PAYMENT: "Esperando pago",
  PAYMENT_REVIEW: "Pago pendiente de revisión", HUMAN_ACTIVE: "Humano atendiendo",
  PREPARING: "En preparación", SHIPPED: "Enviado", DELIVERED: "Entregado", POST_SALE: "Postventa",
};
export const statusLabel = (value: string) => conversationStatusLabels[value] ?? (value || "Sin estado informado");
export const dateLabel = (value: unknown) => {
  if (typeof value !== "string" || !value) return "Fecha no informada";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Fecha no informada" : date.toLocaleString("es-EC");
};

export const messageActor = (message: Record<string, unknown>) => {
  if (message.direction === "INBOUND" || message.role === "user" || message.actorType === "CUSTOMER") return "Cliente";
  if (message.actorType === "HUMAN" || message.source === "HUMAN" || message.senderType === "HUMAN" || message.role === "operator") return "Operador";
  if (message.direction === "EVENT" || message.senderType === "SYSTEM" || message.direction === "SYSTEM" || message.role === "system" || message.kind === "EVENT") return "Evento";
  return "GanoBot";
};

/** Only deliberate actions use these prompts; reading never releases a HUMAN thread. */
export const conversationActionPrompt = (action: ConversationAction) => ({
  take: "Tomar el control humano detendrá las respuestas automáticas de GanoBot en este hilo. ¿Confirmas?",
  release: "Devolver esta conversación a GanoBot permite nuevas respuestas automáticas con su contexto. ¿Confirmas?",
  "mark-read": "Marcar los mensajes actuales como leídos. ¿Confirmas?",
  close: "Cerrar este hilo registrará el motivo y conservará su historial. ¿Confirmas?",
  reopen: "Reabrir conservará la atención humana hasta que decidas devolverla a GanoBot. ¿Confirmas?",
})[action];
