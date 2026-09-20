import { useState } from "react";
import { Link } from "react-router-dom";
import { useOrderStore } from "../../store/orderStore";
import {
  orderStatusLabels,
  paymentStatusLabels,
} from "../../utils/orderMetrics";
import { AdminSectionHeader } from "../components/AdminSectionHeader";
import { OperationStats, Field, DataTable, Status, EmptyState } from "../components/OperationsUI";
import { dateTime } from "../components/operationFormat";
import { money } from "../components/format";
export function AdminOrders() {
  const orders = useOrderStore((s) => s.orders);
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [payment, setPayment] = useState(""),
    [date, setDate] = useState("");
  const visible = orders.filter(
    (o) =>
      `${o.id} ${o.customer.firstName} ${o.customer.lastName} ${o.customer.email} ${o.customer.phone}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!status || o.orderStatus === status) &&
      (!payment || o.paymentStatus === payment) &&
      (!date || new Date(o.createdAt).toLocaleDateString("en-CA") === date),
  );
  return (
    <>
      <AdminSectionHeader
        eyebrow="ADMIN / OPERACIONES"
        title="Pedidos"
        description="Controla pagos, preparación, entrega y rentabilidad."
      />
      <OperationStats
        items={[
          {
            label: "Nuevos",
            value: String(orders.filter((o) => o.orderStatus === "new").length),
          },
          {
            label: "Pendientes de pago",
            value: String(
              orders.filter(
                (o) =>
                  o.paymentStatus === "pending" &&
                  o.orderStatus !== "cancelled",
              ).length,
            ),
          },
          {
            label: "En preparación",
            value: String(
              orders.filter((o) => o.orderStatus === "preparing").length,
            ),
          },
          {
            label: "Entregados",
            value: String(
              orders.filter((o) => o.orderStatus === "delivered").length,
            ),
          },
        ]}
      />
      <section className="admin-card">
        <div className="admin-toolbar">
          <Field label="Buscar pedidos">
            <input
              type="search"
              placeholder="Pedido o cliente"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Field>
          <Field label="Estado pedido">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(orderStatusLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Estado pago">
            <select
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
            >
              <option value="">Todos</option>
              {Object.entries(paymentStatusLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fecha">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
        </div>
        <DataTable
          columns={[
            "Pedido",
            "Cliente",
            "Fecha",
            "Estado",
            "Pago",
            "Total",
            "Utilidad",
            "Acciones",
          ]}
        >
          {visible.map((o) => (
            <tr key={o.id}>
              <th scope="row">
                <Link to={`/admin/pedidos/${o.id}`}>{o.id}</Link>
              </th>
              <td>
                {o.customer.firstName} {o.customer.lastName}
              </td>
              <td>{dateTime(o.createdAt)}</td>
              <td>
                <Status>{orderStatusLabels[o.orderStatus]}</Status>
              </td>
              <td>
                <Status>{paymentStatusLabels[o.paymentStatus]}</Status>
              </td>
              <td>{money(o.total)}</td>
              <td>{money(o.estimatedProfit)}</td>
              <td>
                <Link className="admin-text-link" to={`/admin/pedidos/${o.id}`}>
                  Ver detalle →
                </Link>
              </td>
            </tr>
          ))}
        </DataTable>
        {!visible.length && (
          <EmptyState
            title="No hay pedidos para mostrar"
            description="Los pedidos registrados desde checkout aparecerán aquí."
          />
        )}
      </section>
    </>
  );
}
