import { useEffect, useState } from "react";
import { ownerOperation } from "../../services/chopify/owner";
import { record, text } from "../../utils/normalization";

export function ChopifyCustomersPanel() {
  const [customers, setCustomers] = useState<unknown[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void ownerOperation("listCustomers").then((value) => {
      if (active) setCustomers(Array.isArray(value) ? value : []);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "No fue posible consultar clientes en Chopify.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return <section className="admin-card admin-module" aria-labelledby="chopify-customers-title">
    <h2 id="chopify-customers-title">Clientes registrados en Chopify</h2>
    <p>Vista de solo lectura del tenant FLOES en el sistema comercial.</p>
    {loading ? <p role="status">Consultando Chopify…</p> : error ? <p role="alert">{error}</p> : !customers.length ? <p>No hay clientes registrados en Chopify.</p> :
      <div className="admin-table-scroll"><table className="admin-table">
        <thead><tr><th>Cliente</th><th>Teléfono</th><th>Correo</th><th>Origen</th><th>ID Chopify</th></tr></thead>
        <tbody>{customers.map((entry, index) => {
          const customer = record(entry);
          return <tr key={text(customer.id, `customer-${index}`)}>
            <th scope="row">{text(customer.name, "Cliente")}</th>
            <td>{text(customer.phone, "—")}</td>
            <td>{text(customer.email, "—")}</td>
            <td>{text(customer.acquisitionSource, "—")}</td>
            <td>{text(customer.id, "—")}</td>
          </tr>;
        })}</tbody>
      </table></div>}
  </section>;
}
