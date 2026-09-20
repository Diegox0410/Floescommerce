import { Link } from "react-router-dom";
import type { AdminTopProduct } from "../types/admin";
import { money } from "./format";
export function TopProductsTable({
  products,
}: {
  products: AdminTopProduct[];
}) {
  return (
    <section className="admin-card">
      <div className="admin-card-heading">
        <div>
          <h2>Productos destacados</h2>
          <p>Los protagonistas del periodo</p>
        </div>
        <Link className="admin-text-link" to="/admin/productos">
          Ver catálogo →
        </Link>
      </div>
      <div className="admin-table-scroll">
        <table className="admin-table">
          <caption className="admin-sr-only">
            Productos más vendidos, datos locales
          </caption>
          <thead>
            <tr>
              {["Producto", "Categoría", "Unidades", "Ventas", "Utilidad"].map(
                (c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.name}>
                <th scope="row">
                  <span className="admin-product-rank">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {p.name}
                </th>
                <td>{p.category}</td>
                <td>{p.units}</td>
                <td>{money(p.revenue)}</td>
                <td>{money(p.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
