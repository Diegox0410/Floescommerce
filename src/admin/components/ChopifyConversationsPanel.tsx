import { useCallback, useEffect, useRef, useState } from "react";
import { ownerConversationRead } from "../../services/chopify/owner";
import { record, text } from "../../utils/normalization";
import { ChopifyConversationThread } from "./ChopifyConversationThread";
import { dateLabel, statusLabel } from "./chopifyCrm";
import "./chopify-crm.css";

export function ChopifyConversationsPanel() {
  const [conversations, setConversations] = useState<Record<string, unknown>[]>([]);
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [channel, setChannel] = useState("");
  const [cursor, setCursor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const version = useRef(0);
  const load = useCallback(async (nextCursor = "") => {
    const request = ++version.current;
    setLoading(true); setError("");
    try {
      const result = await ownerConversationRead("list", { query, status, channel, limit: 25, ...(nextCursor ? { cursor: nextCursor } : {}) });
      if (request !== version.current) return;
      setConversations((previous) => nextCursor ? [...previous, ...(Array.isArray(result.conversations) ? result.conversations.map(record) : [])] : Array.isArray(result.conversations) ? result.conversations.map(record) : []);
      setCursor(text(result.nextCursor));
    } catch (reason) { if (request === version.current) setError(reason instanceof Error ? reason.message : "No se pudo cargar la bandeja."); }
    finally { if (request === version.current) setLoading(false); }
  }, [query, status, channel]);

  useEffect(() => {
    const generation = version;
    const timer = window.setTimeout(() => void load(), 300);
    return () => { clearTimeout(timer); generation.current++; };
  }, [load]);

  return <>
    <section className="admin-card admin-module">
      <h1>Conversaciones FLOES</h1><p>Mensajes y contexto persistidos en Chopify para tenant-floes. Consulta paginada sin listeners permanentes.</p>
      <div className="admin-toolbar">
        <label>Buscar cliente o mensaje <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label>Estado <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todos</option><option value="OPEN">Abiertas</option><option value="NEEDS_HUMAN">Requiere humano</option><option value="CLOSED">Cerradas</option></select></label>
        <label>Canal <select value={channel} onChange={(event) => setChannel(event.target.value)}><option value="">Todos</option><option value="whatsapp">WhatsApp</option><option value="web">Web</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option></select></label>
        <button className="admin-button" type="button" disabled={loading} onClick={() => void load()}>Actualizar bandeja</button>
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
    <div className="admin-crm-layout">
      <aside className="admin-card admin-module" aria-label="Bandeja de conversaciones">
        {loading && <p role="status">Consultando conversaciones…</p>}
        {!loading && !conversations.length && !error && <p>No hay conversaciones que coincidan.</p>}
        <ul className="admin-crm-list">
          {conversations.map((conversation) => {
            const id = text(conversation.id, text(conversation.conversationId));
            const lastMessage = record(conversation.lastMessage);
            return <li key={id}><button className="admin-crm-list-item" type="button" aria-pressed={selected === id} onClick={() => setSelected(id)}>
              <strong>{text(conversation.customerName, text(conversation.contact, text(conversation.contactName, "Cliente")))}</strong>
              <span>{text(conversation.lastMessage, text(lastMessage.text, text(conversation.lastMessageText, "Sin texto disponible")))}</span>
              <small>{text(conversation.channel, "Canal no informado")} · {statusLabel(text(conversation.status))}</small>
              <time>{dateLabel(conversation.lastActivityAt ?? conversation.updatedAt)}</time>
              {typeof conversation.unreadCount === "number" && conversation.unreadCount > 0 && <strong>{conversation.unreadCount} sin leer</strong>}
            </button></li>;
          })}
        </ul>
        {cursor && <button className="admin-button" type="button" disabled={loading} onClick={() => void load(cursor)}>Cargar más conversaciones</button>}
      </aside>
      {selected ? <ChopifyConversationThread key={selected} conversationId={selected} onChanged={() => void load()} /> : <section className="admin-card admin-module"><h2>Selecciona una conversación</h2><p>El historial y la ficha del cliente usan los mismos mensajes de Chopify.</p></section>}
    </div>
  </>;
}
