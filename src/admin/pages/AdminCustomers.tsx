import { useState } from "react";
import { Link } from "react-router-dom";
import { useCustomerStore } from "../../store/customerStore";
import { useOrderStore } from "../../store/orderStore";
import { getCustomerMetrics } from "../../utils/orderMetrics";
import { AdminSectionHeader } from "../components/AdminSectionHeader";
import { OperationStats, Field, DataTable, EmptyState } from "../components/OperationsUI";
import { dateTime } from "../components/operationFormat";
import { money } from "../components/format";
export function AdminCustomers() {
  const customers = useCustomerStore((s) => s.customers),
    orders = useOrderStore((s) => s.orders);
  const [query, setQuery] = useState("");
  const metrics = customers.map((c) => ({
    customer: c,
    ...getCustomerMetrics(c.id, orders),
  }));
  const now = new Date();
  const visible = metrics.filter(({ customer: c }) =>
    `${c.firstName} ${c.lastName} ${c.email} ${c.phone} ${c.city} ${c.tags.join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <AdminSectionHeader
        eyebrow="ADMIN / RELACIONES"
        title="Clientes"
        description="Conoce quién compra, cuánto compra y cuándo volver a contactarlo."
      />
      <OperationStats
        items={[
          { label: "Clientes totales", value: String(customers.length) },
          {
            label: "Nuevos este mes",
            value: String(
              customers.filter((c) => {
                const d = new Date(c.createdAt);
                return (
                  d.getMonth() === now.getMonth() &&
                  d.getFullYear() === now.getFullYear()
                );
              }).length,
            ),
          },
          {
            label: "Clientes recurrentes",
            value: String(metrics.filter((m) => m.totalOrders > 1).length),
          },
          {
            label: "Valor promedio cliente",
            value: money(
              customers.length
                ? metrics.reduce((sum, m) => sum + m.totalSpent, 0) /
                    customers.length
                : 0,
            ),
          },
        ]}
      />
      <section className="admin-card">
        <div className="admin-toolbar">
          <Field label="Buscar clientes">
            <input
              type="search"
              placeholder="Nombre, contacto, ciudad o etiqueta"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Field>
        </div>
        <DataTable
          columns={[
            "Cliente",
            "Contacto",
            "Ciudad",
            "Pedidos",
            "Total gastado",
            "Ticket promedio",
            "Última compra",
            "Acciones",
          ]}
        >
          {visible.map(({ customer: c, ...m }) => (
            <tr key={c.id}>
              <th scope="row">
                <Link to={`/admin/clientes/${c.id}`}>
                  {c.firstName} {c.lastName}
                </Link>
              </th>
              <td>
                <div>{c.email}</div>
                <div>{c.phone}</div>
              </td>
              <td>{c.city}</td>
              <td>{m.totalOrders}</td>
              <td>{money(m.totalSpent)}</td>
              <td>{money(m.averageTicket)}</td>
              <td>{dateTime(m.lastOrderAt)}</td>
              <td>
                <Link
                  className="admin-text-link"
                  to={`/admin/clientes/${c.id}`}
                >
                  Ver perfil →
                </Link>
              </td>
            </tr>
          ))}
        </DataTable>
        {!visible.length && (
          <EmptyState
            title="No hay clientes para mostrar"
            description="Los clientes se crean automáticamente al registrar pedidos."
          />
        )}
      </section>
      <p className="admin-footnote admin-metrics-note">
        Las métricas comerciales excluyen pedidos cancelados.
      </p>
    </>
  );
}
