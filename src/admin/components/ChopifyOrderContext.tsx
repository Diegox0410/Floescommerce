import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ownerOperation } from "../../services/chopify/owner";
import { record, text } from "../../utils/normalization";
import { dateLabel } from "./chopifyCrm";

export function ChopifyOrderContext({ orderId }: { orderId: string }) {
  const [detail, setDetail] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void ownerOperation("getOrderDetail", { orderId }).then((value) => {
      const result = record(value);
      if (!Object.keys(result).length) throw new Error("Chopify no devolvió el pedido solicitado.");
      if (active) setDetail(result);
    }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "No se pudo consultar el pedido."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [orderId]);
  const order = Object.keys(record(detail.order)).length ? record(detail.order) : detail;
  const customer = record(detail.customer);
  const items = Array.isArray(order.items) ? order.items.map(record) : [];
  const followUp = record(order.followUp);
  const amount = typeof order.grandTotalCents === "number" && typeof order.currency === "string" ? new Intl.NumberFormat("es-EC", { style: "currency", currency: order.currency }).format(order.grandTotalCents / 100) : "No informado";
  return <section className="admin-card admin-module">
    <Link to="/admin/pedidos">← Todos los pedidos</Link><h1>Pedido {orderId}</h1>
    {loading ? <p role="status">Consultando pedido y relaciones en Chopify…</p> : error ? <p role="alert">{error}</p> : <>
      <p>Cliente: {text(customer.name, text(record(order.customer).name, "No informado"))} · {text(customer.phone, "Contacto no informado")}</p>
      {text(order.customerId) && <Link to={`/admin/clientes/${encodeURIComponent(text(order.customerId))}`}>Abrir contexto del cliente asociado</Link>}
      <dl className="admin-toolbar"><div><dt>Creación</dt><dd>{dateLabel(order.createdAt)}</dd></div><div><dt>Pago</dt><dd>{text(order.paymentStatus, "No informado")}</dd></div><div><dt>Operación</dt><dd>{text(order.fulfillmentStatus, "No informado")}</dd></div><div><dt>Total</dt><dd>{amount}</dd></div></dl>
      <h2>Productos del pedido</h2>{items.length ? <ul>{items.map((item, index) => <li key={text(item.id, text(item.variantId, `item-${index}`))}>{text(item.productName, text(item.name, "Producto"))} · {text(item.variantName, text(item.color))} · {text(item.size, "Talla no informada")} · SKU {text(item.variantSku, text(item.sku, "No informado"))} · Cantidad {typeof item.quantity === "number" ? item.quantity : "No informada"}</li>)}</ul> : <p>El detalle no devolvió productos asociados.</p>}
      {Object.keys(followUp).length > 0 && <><h2>Seguimiento del pedido</h2><p>Estado: {text(followUp.status, "No informado")} · {text(followUp.description, text(followUp.reason))}</p></>}
      <p>Los comprobantes asociados y las acciones permitidas se presentan debajo. Un comprobante recibido no significa pago aprobado.</p>
    </>}
  </section>;
}
