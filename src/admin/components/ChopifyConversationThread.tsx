import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ownerConversationAction, ownerConversationRead } from "../../services/chopify/owner";
import { record, text } from "../../utils/normalization";
import { conversationActionPrompt, dateLabel, messageActor, statusLabel, type ConversationAction } from "./chopifyCrm";

const rows = (value: unknown) => Array.isArray(value) ? value.map(record) : [];
const attachmentUrl = (value: unknown) => typeof value === "string" && /^(?:https:\/\/|\/(?!\/))/.test(value) ? value : "";

export function ChopifyConversationThread({ conversationId, onChanged }: { conversationId: string; onChanged?: () => void }) {
  const [thread, setThread] = useState<Record<string, unknown>>({});
  const [timeline, setTimeline] = useState<Record<string, unknown>[]>([]);
  const [cursor, setCursor] = useState("");
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState("");
  const [sendUncertain, setSendUncertain] = useState(false);
  const requestVersion = useRef(0);

  const load = useCallback(async (before = "") => {
    const version = ++requestVersion.current;
    setLoading(true); setError("");
    try {
      const result = await ownerConversationRead("thread", { conversationId, limit: 30, ...(before ? { before } : {}) });
      if (version !== requestVersion.current) return;
      setThread(result);
      setTimeline((previous) => {
        const next = rows(result.timeline);
        if (!before) return next;
        const unique = new Map([...next, ...previous].map((item) => [text(item.id), item]));
        return [...unique.values()].sort((a, b) => text(a.createdAt, text(a.timestamp)).localeCompare(text(b.createdAt, text(b.timestamp))));
      });
      setCursor(text(result.nextCursor));
    } catch (reason) {
      if (version === requestVersion.current) setError(reason instanceof Error ? reason.message : "No fue posible cargar el hilo.");
    } finally { if (version === requestVersion.current) setLoading(false); }
  }, [conversationId]);

  useEffect(() => {
    const generation = requestVersion;
    const frame = requestAnimationFrame(() => { setTimeline([]); setThread({}); setNotice(""); setDraft(""); setSendUncertain(false); void load(); });
    return () => { cancelAnimationFrame(frame); generation.current++; };
  }, [load]);

  const conversation = record(thread.conversation);
  const customer = record(thread.customer);
  const mode = text(conversation.mode);
  const status = text(conversation.status);
  const human = mode === "HUMAN" || status === "NEEDS_HUMAN";

  const act = async (action: ConversationAction) => {
    const reason = action === "close" ? window.prompt("Motivo de cierre (no borra el historial):")?.trim() ?? "" : "";
    if (action === "close" && !reason || !window.confirm(conversationActionPrompt(action))) return;
    setWorking(true); setError(""); setNotice("");
    try {
      await ownerConversationAction(conversationId, action, reason);
      setNotice("Acción registrada en Chopify.");
      await load(); onChanged?.();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo registrar la acción."); }
    finally { setWorking(false); }
  };

  const send = async () => {
    const message = draft.trim();
    if (!message || mode !== "HUMAN" || sendUncertain) return;
    const destination = text(conversation.maskedPhone, "destinatario de este hilo");
    if (!window.confirm(`Se enviará este mensaje humano por ${text(conversation.channel, "el canal original")} a ${destination}:\n\n${message}\n\n¿Confirmas el envío?`)) return;
    setWorking(true); setError(""); setNotice("");
    const operationKey = `floes-owner:send-human:${crypto.randomUUID()}`;
    try {
      const result = await ownerConversationAction(conversationId, "send-human", "", message, operationKey);
      const sendStatus = text(result.status);
      if (sendStatus === "ACCEPTED" || text(result.deliveryStatus) === "ACCEPTED") {
        setDraft(""); setNotice("El proveedor aceptó el mensaje humano. Actualiza el historial para comprobar entrega o lectura; aún no implica entrega al teléfono.");
      } else if (sendStatus === "BLOCKED") {
        setNotice("Envío bloqueado: la ventana del canal o la autorización no permite responder. Verifica el estado del hilo; puede ser necesaria una plantilla aprobada de Meta.");
      } else {
        setSendUncertain(true); setNotice("El resultado del envío no está confirmado. Actualiza el historial antes de intentar otra acción; no se reintentará automáticamente.");
      }
      await load(); onChanged?.();
    } catch (cause) {
      setSendUncertain(true);
      setError(`${cause instanceof Error ? cause.message : "No se confirmó el envío."} Actualiza el historial y verifica el mensaje antes de cualquier nuevo envío.`);
    } finally { setWorking(false); }
  };

  return <div className="admin-crm-thread">
    <section className="admin-card admin-module" aria-label="Historial de conversación">
      <div className="admin-toolbar">
        <h2>Historial compartido</h2>
        <button type="button" className="admin-button" disabled={loading || working} onClick={() => void load()}>Actualizar mensajes</button>
      </div>
      <p>Canal: {text(conversation.channel, "No informado")} · {statusLabel(status)} · {mode === "HUMAN" ? "Atención humana" : ["AI", "GANOBOT", "AUTO"].includes(mode) ? "Atención GanoBot" : "Modo no informado"}</p>
      {human && <p role="status">GanoBot está pausado en este hilo. Volver a leer el historial no lo reactiva.</p>}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <div className="admin-toolbar" aria-label="Control de la conversación">
        <button type="button" className="admin-button" disabled={working || loading || !mode || mode === "HUMAN" || status === "CLOSED"} onClick={() => void act("take")}>Tomar atención humana</button>
        <button type="button" className="admin-button" disabled={working || loading || !human || status === "CLOSED"} onClick={() => void act("release")}>Devolver a GanoBot</button>
        <button type="button" className="admin-button" disabled={working || loading || !mode} onClick={() => void act("mark-read")}>Marcar como leída</button>
        <button type="button" className="admin-button" disabled={working || loading || !mode} onClick={() => void act(status === "CLOSED" ? "reopen" : "close")}>{status === "CLOSED" ? "Reabrir con atención humana" : "Cerrar con motivo"}</button>
      </div>
      <p>Estas acciones se registran y no envían mensajes. Para nuevas entradas, actualiza el hilo.</p>
      {cursor && <button type="button" className="admin-button" disabled={loading} onClick={() => void load(cursor)}>Cargar mensajes anteriores</button>}
      {loading && <p role="status">Consultando mensajes en Chopify…</p>}
      {!loading && !timeline.length && !error && <p>No hay mensajes en esta página del historial.</p>}
      <ol className="admin-crm-timeline" aria-label="Cronología">
        {timeline.map((entry, index) => {
          const message = Object.keys(record(entry.message)).length ? record(entry.message) : entry;
          const media = rows(message.attachments);
          const content = text(message.text, text(message.content, text(entry.description)));
          return <li className="admin-card" key={text(entry.id, text(message.id, `event-${index}`))}>
            <div className="admin-toolbar"><strong>{messageActor(message)}</strong><time>{dateLabel(message.createdAt ?? message.timestamp ?? entry.createdAt)}</time></div>
            {content ? <p className="admin-crm-message-text">{content}</p> : <p>{text(entry.type, text(message.type, "Evento sin texto"))}</p>}
            {media.map((asset, i) => {
              const url = asset.private === true ? "" : attachmentUrl(asset.url);
              return url ? <div key={text(asset.id, `media-${i}`)}>{asset.type === "IMAGE" && <img className="admin-crm-attachment" src={url} alt={text(asset.caption, "Imagen autorizada de la conversación")} loading="lazy" />}<p><a href={url} target="_blank" rel="noreferrer">Abrir adjunto autorizado: {text(asset.name, text(asset.type, "archivo"))}</a>{text(asset.caption) && <span> · {text(asset.caption)}</span>}</p></div> : <p key={`media-${i}`}>Adjunto privado: {text(asset.name, text(asset.type, "archivo"))}. Consulta el comprobante desde Revisión de pagos cuando corresponda.</p>;
            })}
            {text(message.deliveryStatus) && <small>Estado del canal: {text(message.deliveryStatus)}. La aceptación por el proveedor no implica entrega física.</small>}
            {text(message.correlationId) && <p><small>Referencia técnica: {text(message.correlationId).slice(0, 12)}…</small></p>}
          </li>;
        })}
      </ol>
      <form className="admin-crm-composer" onSubmit={(event) => { event.preventDefault(); void send(); }}>
        <label htmlFor={`reply-${conversationId}`}>Respuesta humana al canal original</label>
        <textarea id={`reply-${conversationId}`} value={draft} maxLength={4000} rows={4} onChange={(event) => setDraft(event.target.value)} disabled={working || mode !== "HUMAN" || status === "CLOSED" || sendUncertain} />
        <p>El envío requiere control humano y confirmación. Respeta la ventana del canal; no crea pedidos ni aprueba pagos.</p>
        <button type="submit" className="admin-button" disabled={working || loading || mode !== "HUMAN" || status === "CLOSED" || sendUncertain || !draft.trim()}>Revisar y confirmar envío humano</button>
        {sendUncertain && <p role="status">Resultado incierto: este formulario permanece bloqueado para evitar duplicar el envío. Revisa el historial y el estado en Chopify.</p>}
      </form>
    </section>
    <aside className="admin-card admin-module" aria-label="Contexto del cliente">
      <h2>{text(customer.name, text(conversation.customerName, "Cliente"))}</h2>
      <p>{text(customer.phone, "Teléfono no informado")}</p>
      <p>{text(customer.email, "Correo no informado")}</p>
      <p>Origen: {text(customer.acquisitionSource, text(customer.origin, text(conversation.origin, "No informado")))}</p>
      <p>Responsable: {text(conversation.assignee, text(conversation.assignedTo, "Sin asignar"))}</p>
      <p>Última actividad: {dateLabel(conversation.lastActivityAt ?? conversation.updatedAt)}</p>
      {text(conversation.closeReason) && <p>Motivo de cierre: {text(conversation.closeReason)}</p>}
      <p>Selección: {[text(record(conversation.selection).model), text(record(conversation.selection).color), text(record(conversation.selection).size)].filter(Boolean).join(" · ") || "No registrada"}</p>
      {text(customer.id, text(conversation.customerId)) && <Link className="admin-text-link" to={`/admin/clientes/${encodeURIComponent(text(customer.id, text(conversation.customerId)))}`}>Abrir ficha completa del cliente</Link>}
      <p><Link className="admin-text-link" to="/admin/pedidos">Consultar pedidos y pagos persistidos</Link></p>
      {rows(record(thread.commerce).orders).length > 0 && <><h3>Pedidos asociados</h3><ul>{rows(record(thread.commerce).orders).map((order) => <li key={text(order.id)}><Link to={`/admin/pedidos/${encodeURIComponent(text(order.id))}`}>{text(order.id)}</Link> · {text(order.paymentStatus, "Pago no informado")} · {text(order.fulfillmentStatus, "Estado no informado")}</li>)}</ul></>}
      {rows(record(thread.commerce).activities).length > 0 && <><h3>Actividad comercial</h3><ul>{rows(record(thread.commerce).activities).map((activity, index) => <li key={text(activity.id, `activity-${index}`)}>{text(activity.type, text(activity.event, "Actividad"))} · {dateLabel(activity.createdAt)}{text(activity.description) && <p>{text(activity.description)}</p>}</li>)}</ul></>}
    </aside>
  </div>;
}
