import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ownerConversationRead, ownerOperation } from "../../services/chopify/owner";
import { record, text } from "../../utils/normalization";
import { ChopifyConversationThread } from "./ChopifyConversationThread";
import { dateLabel, statusLabel } from "./chopifyCrm";
import "./chopify-crm.css";

export function ChopifyCustomerContext({ customerId }: { customerId: string }) {
  const [context, setContext] = useState<Record<string, unknown>>({});
  const [conversations, setConversations] = useState<Record<string, unknown>[]>([]);
  const [selected, setSelected] = useState("");
  const [cursor, setCursor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState("");
  const load = useCallback(async (next = "") => {
    setLoading(true); setError("");
    try {
      const result = await ownerConversationRead("customer", { customerId, limit: 25, ...(next ? { cursor: next } : {}) });
      setContext(result);
      setConversations((previous) => next ? [...previous, ...(Array.isArray(result.conversations) ? result.conversations.map(record) : [])] : Array.isArray(result.conversations) ? result.conversations.map(record) : []);
      setCursor(text(result.nextCursor));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo consultar la ficha."); }
    finally { setLoading(false); }
  }, [customerId]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => void load());
    return () => cancelAnimationFrame(frame);
  }, [load]);
  const customer = record(context.customer);
  const commerce = record(context.commerce);
  const identities = Array.isArray(customer.identities) ? customer.identities.map(record) : [];
  const orders = Array.isArray(commerce.orders) ? commerce.orders.map(record) : [];
  const activities = Array.isArray(commerce.activities) ? commerce.activities.map(record) : [];
  const notes = Array.isArray(commerce.notes) ? commerce.notes.map(record) : [];
  const escalations = Array.isArray(commerce.escalations) ? commerce.escalations.map(record) : [];
  const addNote = async () => {
    const body = note.trim();
    if (!body || !window.confirm("Esta nota interna se asociará al cliente en Chopify y quedará auditada. ¿Confirmas?")) return;
    setWorking(true); setNotice(""); setError("");
    try { await ownerOperation("addCustomerNote", { customerId, body }, true); setNote(""); setNotice("Nota interna registrada."); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo registrar la nota."); }
    finally { setWorking(false); }
  };
  const resolve = async (escalationId: string) => {
    const resolution = window.prompt("Describe la resolución verificada. No cierres una incidencia pendiente:")?.trim() ?? "";
    if (!resolution || !window.confirm("¿Confirmas que la intervención fue resuelta por una persona? Esto quedará registrado en Chopify.")) return;
    setWorking(true); setNotice(""); setError("");
    try { await ownerOperation("resolveEscalation", { escalationId, resolution }, true); setNotice("Resolución humana registrada."); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo registrar la resolución."); }
    finally { setWorking(false); }
  };

  return <>
    <section className="admin-card admin-module">
      <Link to="/admin/clientes">← Clientes FLOES</Link>
      <h1>{text(customer.name, "Ficha de cliente Chopify")}</h1>
      <p>ID: {customerId}</p><p>{text(customer.phone, "Teléfono no informado")} · {text(customer.email, "Correo no informado")}</p>
      <p>Origen: {text(customer.acquisitionSource, text(customer.origin, "No informado"))} · Estado: {text(customer.status, "No informado")}</p>
      {identities.length > 0 && <><h2>Canales vinculados</h2><ul>{identities.map((identity, index) => <li key={text(identity.id, `identity-${index}`)}>{text(identity.channel, "Canal")} · {text(identity.displayName, text(identity.externalUserId, "Identidad vinculada"))}</li>)}</ul></>}
      <button type="button" className="admin-button" disabled={loading} onClick={() => void load()}>Actualizar ficha</button>
      {loading && <p role="status">Consultando contexto de Chopify…</p>}{error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
    </section>
    <section className="admin-card admin-module">
      <h2>Conversaciones asociadas</h2><p>El historial de cada hilo utiliza la misma fuente que la bandeja de conversaciones.</p>
      {!loading && !error && !conversations.length && <p>Este cliente no tiene conversaciones vinculadas en esta página.</p>}
      <ul className="admin-crm-list">{conversations.map((conversation) => {
        const id = text(conversation.id, text(conversation.conversationId));
        return <li key={id}><button type="button" className="admin-crm-list-item" aria-pressed={id === selected} onClick={() => setSelected(id)}><strong>{text(conversation.channel, "Canal no informado")} · {statusLabel(text(conversation.status))}</strong><span>{text(conversation.lastMessage)}</span><time>{dateLabel(conversation.lastActivityAt ?? conversation.updatedAt)}</time></button></li>;
      })}</ul>
      {cursor && <button type="button" className="admin-button" disabled={loading} onClick={() => void load(cursor)}>Cargar conversaciones anteriores</button>}
    </section>
    {selected && <ChopifyConversationThread key={selected} conversationId={selected} onChanged={() => void load()} />}
    <section className="admin-card admin-module"><h2>Pedidos persistidos</h2>{orders.length ? <ul>{orders.map((order) => <li key={text(order.id)}><Link to={`/admin/pedidos/${encodeURIComponent(text(order.id))}`}>{text(order.id)}</Link> · {text(order.paymentStatus, "Pago no informado")} · {text(order.fulfillmentStatus, "Estado no informado")}</li>)}</ul> : <p>No hay pedidos asociados devueltos por Chopify.</p>}</section>
    <section className="admin-card admin-module"><h2>Seguimiento y cronología comercial</h2>{activities.length ? <ul>{activities.map((activity, index) => <li key={text(activity.id, `activity-${index}`)}>{text(activity.type, text(activity.event, "Actividad"))} · {dateLabel(activity.createdAt)}{text(activity.description) && <p>{text(activity.description)}</p>}</li>)}</ul> : <p>No hay actividades registradas para este cliente en esta consulta.</p>}</section>
    {escalations.length > 0 && <section className="admin-card admin-module"><h2>Atención humana y postventa</h2><ul>{escalations.map((escalation, index) => <li key={text(escalation.id, `escalation-${index}`)}><strong>{text(escalation.reason, "Intervención")}</strong> · {text(escalation.status, "Estado no informado")} · {dateLabel(escalation.createdAt)}{text(escalation.resolution) && <p>Resolución: {text(escalation.resolution)}</p>}{text(escalation.id) && !["RESOLVED", "CLOSED"].includes(text(escalation.status)) && <button type="button" className="admin-button" disabled={working || loading} onClick={() => void resolve(text(escalation.id))}>Registrar resolución humana</button>}</li>)}</ul></section>}
    <section className="admin-card admin-module"><h2>Notas internas autorizadas</h2>{notes.length ? <ul>{notes.map((entry, index) => <li key={text(entry.id, `note-${index}`)}>{text(entry.body, text(entry.text, text(entry.content)))} · {dateLabel(entry.createdAt)}</li>)}</ul> : <p>No hay notas internas devueltas en esta consulta.</p>}
      <form className="admin-crm-composer" onSubmit={(event) => { event.preventDefault(); void addNote(); }}><label htmlFor="customer-note">Nueva nota interna</label><textarea id="customer-note" value={note} maxLength={1000} rows={3} onChange={(event) => setNote(event.target.value)} disabled={working || loading || Boolean(error)} /><button className="admin-button" type="submit" disabled={working || loading || !note.trim() || Boolean(error)}>Confirmar registro de nota</button></form>
    </section>
  </>;
}
