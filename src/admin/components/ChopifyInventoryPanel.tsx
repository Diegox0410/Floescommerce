import { useEffect, useState } from "react";
import { ownerOperation } from "../../services/chopify/owner";
import { record, text } from "../../utils/normalization";

export function ChopifyInventoryPanel() {
  const [products, setProducts] = useState<unknown[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void ownerOperation("searchProducts", { query: "", limit: 200 }).then((value) => {
      if (active) setProducts(Array.isArray(value) ? value : []);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "No fue posible consultar inventario en Chopify.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return <section className="admin-card admin-module" aria-labelledby="chopify-inventory-title">
    <h2 id="chopify-inventory-title">Catálogo e inventario en Chopify</h2>
    <p>Disponibilidad por variante y talla consultada al servicio comercial de Chopify. Esta vista no modifica existencias.</p>
    {loading ? <p role="status">Consultando disponibilidad…</p> : error ? <p role="alert">{error}</p> : !products.length ? <p>Chopify no devolvió productos visibles para FLOES.</p> :
      <div className="admin-table-scroll"><table className="admin-table">
        <thead><tr><th>Producto</th><th>Variante</th><th>Disponibilidad por talla</th><th>Modo</th></tr></thead>
        <tbody>{products.flatMap((entry, index) => {
          const product = record(entry);
          const variants = Array.isArray(product.variants) ? product.variants : [];
          return variants.length ? variants.map((variantEntry, variantIndex) => {
            const variant = record(variantEntry);
            const sizes = Array.isArray(variant.sizeAvailability) ? variant.sizeAvailability : [];
            const availability = sizes.length ? sizes.map((sizeEntry) => {
              const size = record(sizeEntry);
              const quantity = typeof size.availableQuantity === "number" ? `${size.availableQuantity} disp.` : "No configurado";
              return `${text(size.size, "Talla")}: ${quantity}`;
            }).join(" · ") : "Sin tallas configuradas";
            return <tr key={`${text(product.productId, `product-${index}`)}-${text(variant.variantId, String(variantIndex))}`}>
              <th scope="row">{text(product.name, "Producto")}</th>
              <td>{text(variant.color, text(variant.name, "Variante"))}</td>
              <td>{availability}</td>
              <td>{text(variant.fulfillmentMode, text(product.fulfillmentMode, "—"))}</td>
            </tr>;
          }) : [<tr key={text(product.productId, `product-${index}`)}><th scope="row">{text(product.name, "Producto")}</th><td>—</td><td>Sin variantes</td><td>{text(product.fulfillmentMode, "—")}</td></tr>];
        })}</tbody>
      </table></div>}
  </section>;
}
