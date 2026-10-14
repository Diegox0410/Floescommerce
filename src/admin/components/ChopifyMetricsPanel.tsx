import { useCallback, useEffect, useState } from "react";
import { ownerOperation } from "../../services/chopify/owner";
import { record } from "../../utils/normalization";
import { ownerOrderMetrics } from "./chopifyMetrics";

const count = (value: unknown) => typeof value === "number" && Number.isInteger(value) && value >= 0 ? String(value) : "No informado";
export function ChopifyMetricsPanel() {
  const [dashboard, setDashboard] = useState<Record<string, unknown>>({});
  const [orders, setOrders] = useState<unknown>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [result, orderResult] = await Promise.all([ownerOperation("ownerDashboard"), ownerOperation("listOrders")]);
      if (!Array.isArray(orderResult)) throw new Error("Chopify no devolvió una lista válida de pedidos.");
      setDashboard(record(result)); setOrders(orderResult);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudieron consultar las métricas."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const frame = requestAnimationFrame(() => void load()); return () => cancelAnimationFrame(frame); }, [load]);
  const metrics = ownerOrderMetrics(orders);
  return <section className="admin-card admin-module">
    <h2>Métricas de operaciones Chopify</h2><p>Datos protegidos de tenant-floes. Los conteos de pedidos y totales derivados corresponden a los registros devueltos en esta consulta, sin inferir conversiones ni rentabilidad.</p>
    <button type="button" className="admin-button" disabled={loading} onClick={() => void load()}>Actualizar métricas</button>
    {loading ? <p role="status">Consultando operaciones…</p> : error ? <p role="alert">{error}</p> : <>
      <dl className="admin-toolbar">
        <div><dt>Pedidos en dashboard</dt><dd>{count(dashboard.orders)}</dd></div>
        <div><dt>Comprobantes por revisar</dt><dd>{count(dashboard.paymentsToVerify)}</dd></div>
        <div><dt>Por preparar</dt><dd>{count(dashboard.ordersToPrepare)}</dd></div>
        <div><dt>Listos para despacho</dt><dd>{count(dashboard.readyToDispatch)}</dd></div>
        <div><dt>Pedidos devueltos</dt><dd>{metrics.ordersReturned}</dd></div>
        <div><dt>Pagos aprobados</dt><dd>{metrics.paidOrders}</dd></div>
        <div><dt>Pedidos entregados</dt><dd>{metrics.deliveredOrders}</dd></div>
      </dl>
      <h3>Importe de pedidos con pago aprobado</h3>
      {metrics.paidTotals.length ? <ul>{metrics.paidTotals.map(({ currency, cents }) => <li key={currency}>{new Intl.NumberFormat("es-EC", { style: "currency", currency }).format(cents / 100)}</li>)}</ul> : <p>No hay totales monetarios completos de pagos aprobados en esta consulta.</p>}
      {metrics.incompletePaidOrders > 0 && <p>{metrics.incompletePaidOrders} pedido(s) pagado(s) sin importe o moneda completos fueron excluidos del total.</p>}
      <p>Costos, margen, tiempo de primera respuesta y conversiones: pendientes de una base completa verificable. Los totales de diferentes monedas se mantienen separados.</p>
    </>}
  </section>;
}
