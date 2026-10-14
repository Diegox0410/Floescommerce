import { useEffect, useState } from "react";
import { ownerOperation } from "../../services/chopify/owner";
import { record, text } from "../../utils/normalization";
import { ownerAvailability } from "./chopifyStock";

function quantity(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function ChopifyInventoryPanel() {
  const [products, setProducts] = useState<unknown[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void ownerOperation("listProducts").then((value) => {
      if (active) setProducts(Array.isArray(value) ? value : []);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "No fue posible consultar inventario en Chopify.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const operational = products.map((entry, index) => ({ product: record(entry), index }))
    .filter(({ product }) => text(product.status) !== "ARCHIVED");
  const archivedCount = products.length - operational.length;

  return <section className="admin-card admin-module" aria-labelledby="chopify-inventory-title">
    <h2 id="chopify-inventory-title">Inventario Owner de Chopify</h2>
    <p>Lectura protegida de existencias reportadas por Chopify. Si solo hay saldo agregado o una base de importación, se etiqueta aparte y no se presenta como stock actual por talla.</p>
    {loading ? <p role="status">Consultando inventario de Chopify…</p> : error ? <p role="alert">{error}</p> : !products.length ? <p>Chopify no devolvió productos para FLOES.</p> : <>
      <div className="admin-table-scroll"><table className="admin-table">
        <thead><tr><th>Producto</th><th>Color / talla</th><th>SKU</th><th>Saldo verificado por talla</th><th>Saldo agregado</th><th>Estado / visibilidad</th></tr></thead>
        <tbody>{operational.flatMap(({ product, index }) => {
          const variants = Array.isArray(product.variants) ? product.variants : [];
          const id = text(product.id, text(product.productId, `product-${index}`));
          return variants.length ? variants.flatMap((entry, variantIndex) => {
            const variant = record(entry);
            const variantId = text(variant.id, text(variant.variantId, String(variantIndex)));
            const currentRows = Array.isArray(variant.sizeAvailability) ? variant.sizeAvailability.map(record) : [];
            const configuredBase = record(variant.initialStockBySize);
            const sizes = Array.isArray(variant.sizes) ? variant.sizes.map(String) : Object.keys(configuredBase);
            const aggregate = quantity(variant.stock) ?? quantity(variant.availableQuantity);
            const status = [text(variant.status, "—"), text(variant.visibility, "—"), ownerAvailability(variant)].join(" · ");
            if (currentRows.length) return currentRows.map((sizeEntry, sizeIndex) => <tr key={`${id}-${variantId}-${sizeIndex}`}>
              <th scope="row">{text(product.name, "Producto")}</th>
              <td>{[text(variant.color), text(sizeEntry.size)].filter(Boolean).join(" · ") || "—"}</td>
              <td>{text(variant.sku, "—")}</td>
              <td>{quantity(sizeEntry.availableQuantity) === null ? "No configurado" : `${quantity(sizeEntry.availableQuantity)} unidades actuales`}</td>
              <td>{aggregate === null ? "No configurado" : `${aggregate} en variante`}</td>
              <td>{status}</td>
            </tr>);
            if (sizes.length) return sizes.map((size, sizeIndex) => <tr key={`${id}-${variantId}-${sizeIndex}`}>
              <th scope="row">{text(product.name, "Producto")}</th>
              <td>{[text(variant.color), size].filter(Boolean).join(" · ")}</td>
              <td>{text(variant.sku, "—")}</td>
              <td>{quantity(configuredBase[size]) === null ? "No configurado" : `${quantity(configuredBase[size])} unidades iniciales importadas; saldo actual por talla no provisto`}</td>
              <td>{aggregate === null ? "No configurado" : `${aggregate} en variante`}</td>
              <td>{status}</td>
            </tr>);
            return [<tr key={`${id}-${variantId}`}>
              <th scope="row">{text(product.name, "Producto")}</th>
              <td>{text(variant.color, "Variante sin opciones")}</td>
              <td>{text(variant.sku, "—")}</td>
              <td>{"No configurado"}</td>
              <td>{aggregate === null ? "No configurado" : `${aggregate} en variante; desglose por talla no provisto`}</td>
              <td>{status}</td>
            </tr>];
          }) : [<tr key={id}><th scope="row">{text(product.name, "Producto")}</th><td>—</td><td>{text(product.sku, "—")}</td><td>No configurado</td><td>No configurado</td><td>{[text(product.status, "—"), text(product.visibility, "—")].join(" · ")}</td></tr>];
        })}</tbody>
      </table></div>
      {archivedCount > 0 && <p>{archivedCount} producto(s) archivado(s) quedan fuera de la tabla operativa; sus registros permanecen en Chopify.</p>}
    </>}
  </section>;
}
