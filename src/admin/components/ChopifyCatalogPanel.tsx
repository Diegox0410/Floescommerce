import { useEffect, useMemo, useState } from "react";
import { ownerOperation } from "../../services/chopify/owner";
import { record, text } from "../../utils/normalization";
import { ownerAvailability } from "./chopifyStock";
import { isCanonicalOwnerSnapshot } from "./chopifySnapshot";

const models = [
  { name: "Daniela" },
  { name: "María José" },
  { name: "Élite" },
  { name: "Maemi" },
  { name: "Esperanza" },
  { name: "Klit" },
  { name: "Florma" },
  { name: "Girasol" },
  { name: "Bruni" },
  { name: "Laly" },
  { name: "Esencial" },
  { name: "Mabe" },
] as const;

const pants = [
  { name: "Jogger", details: "Basta con elástico; dos bolsillos cargo exteriores con tapa." },
  { name: "Basta recta", details: "Pierna recta; un bolsillo rectangular abierto en la pierna derecha." },
  { name: "Basta ancha", details: "Pierna ancha y relajada; un bolsillo rectangular abierto en la pierna derecha." },
] as const;

const photoModules = import.meta.glob<string>("/12_modelos/*/*.jpeg", {
  eager: true,
  query: "?url",
  import: "default",
});
const photosByModel = Object.entries(photoModules).reduce<Record<string, string[]>>((groups, [path, url]) => {
  const parts = path.replaceAll("\\", "/").split("/");
  const folder = modelKey(parts.at(-2) ?? "");
  (groups[folder] ??= []).push(url);
  return groups;
}, {});
for (const photos of Object.values(photosByModel)) photos.sort((a, b) => a.localeCompare(b));

function normalizedKey(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function modelKey(value: string) {
  return normalizedKey(value).replace(/^(modelo|scrub)/, "");
}

function productName(value: unknown) {
  const key = normalizedKey(text(value));
  return key.startsWith("modelo") ? key.slice("modelo".length) : key;
}

function productId(product: Record<string, unknown>) {
  return text(product.id, text(product.productId));
}

function priceLabel(product: Record<string, unknown>) {
  const variants = Array.isArray(product.variants) ? product.variants.map(record) : [];
  const currency = text(product.currency, "USD");
  const format = (amount: unknown) => typeof amount === "number" && Number.isInteger(amount) && amount > 0
    ? new Intl.NumberFormat("es-EC", { style: "currency", currency }).format(amount / 100) : null;
  const entries = variants.length ? variants.map((variant) => ({
    regular: format(variant.salePriceCents ?? product.salePriceCents),
    promotion: format(variant.promotionalPriceCents ?? product.promotionalPriceCents),
  })) : [{ regular: format(product.salePriceCents), promotion: format(product.promotionalPriceCents) }];
  const labels = [...new Set(entries.map(({ regular, promotion }) => regular ? `${regular}${promotion ? ` · promoción registrada ${promotion}; vigencia por confirmar` : ""}` : "" ).filter(Boolean))];
  return labels.length ? labels.join(" / ") : "Pendiente de confirmación";
}

function variantPrice(variant: Record<string, unknown>, product: Record<string, unknown>) {
  const format = (amount: unknown) => typeof amount === "number" && Number.isInteger(amount) && amount > 0
    ? new Intl.NumberFormat("es-EC", { style: "currency", currency: text(product.currency, "USD") }).format(amount / 100) : "Pendiente";
  const regular = format(variant.salePriceCents ?? product.salePriceCents);
  const promotion = format(variant.promotionalPriceCents ?? product.promotionalPriceCents);
  return regular === "Pendiente" ? "Pendiente de confirmación" : `${regular}${promotion !== "Pendiente" ? ` · promoción registrada ${promotion}; vigencia por confirmar` : ""}`;
}

export function ChopifyCatalogPanel() {
  const [products, setProducts] = useState<unknown[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotError, setSnapshotError] = useState("");
  const matched = useMemo(() => models.map((model) => {
    const key = modelKey(model.name);
    const entries = products.map((entry, index) => ({ product: record(entry), index }))
      .filter(({ product }) => text(product.status) !== "ARCHIVED" && (productName(product.name) === key || productName(product.slug) === key));
    entries.sort((a, b) => Number(text(a.product.status) === "ARCHIVED") - Number(text(b.product.status) === "ARCHIVED"));
    return { model, product: entries[0]?.product, productIndex: entries[0]?.index, extraRecords: entries.slice(1).map(({ product, index }) => ({ product, index })) };
  }), [products]);

  const downloadSnapshot = async () => {
    setSnapshotLoading(true); setSnapshotError("");
    try {
      const snapshot = await ownerOperation("getCatalogSnapshot");
      if (!isCanonicalOwnerSnapshot(snapshot)) throw new Error("Chopify no devolvió un snapshot canónico completo. No se descargó un respaldo parcial.");
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = `floes-chopify-owner-snapshot-${new Date().toISOString().replaceAll(":", "-")}.json`;
      link.click();
      if (snapshot.paymentConfiguration === null) setSnapshotError("Respaldo de catálogo e inventario descargado. La configuración de pagos no fue incluida por Chopify; requiere verificación independiente.");
      window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch (cause) { setSnapshotError(cause instanceof Error ? cause.message : "No se pudo descargar el respaldo canónico de Chopify."); }
    finally { setSnapshotLoading(false); }
  };

  useEffect(() => {
    let active = true;
    void ownerOperation("listProducts").then((value) => {
      if (active) setProducts(Array.isArray(value) ? value : []);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "No fue posible consultar el catálogo Owner de Chopify.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const primaryProductIndexes = new Set(matched.flatMap(({ productIndex }) => productIndex === undefined ? [] : [productIndex]));
  const historical = products.map((entry, index) => ({ product: record(entry), index }))
    .filter(({ index }) => !primaryProductIndexes.has(index));

  return <section className="admin-card admin-module" aria-labelledby="chopify-catalog-title">
    <h2 id="chopify-catalog-title">Modelos FLOES · catálogo Owner de Chopify</h2>
    <p>Las fichas, SKU, precios, variantes y estados provienen de Chopify. Las galerías son fotos generales de referencia; no asignan color ni presentación vendible. Una ficha publicada no confirma precio vigente ni stock físico por talla.</p>
    <button className="admin-button" type="button" onClick={() => void downloadSnapshot()} disabled={loading || snapshotLoading || products.length === 0}>{snapshotLoading ? "Leyendo respaldo completo…" : "Descargar snapshot de reversión"}</button>
    {snapshotError && <p role="alert">{snapshotError}</p>}
    {loading ? <p role="status">Consultando catálogo Owner de Chopify…</p> : error ? <p role="alert">{error}</p> : <>
      <div className="admin-table-scroll"><table className="admin-table">
        <thead><tr><th>Modelo oficial</th><th>Ficha Chopify</th><th>Precio registrado en Chopify</th><th>Variantes / estado</th><th>Galería</th><th>Presentaciones documentadas</th></tr></thead>
        <tbody>{matched.map(({ model, product, extraRecords }) => {
          const variants = product && Array.isArray(product.variants) ? product.variants.map(record) : [];
          return <tr key={modelKey(model.name)}>
            <th scope="row">{model.name}</th>
            <td>{product ? <>{text(product.sku, "SKU pendiente")}<br />{text(product.status, "Estado no informado")} · {text(product.visibility, "Visibilidad no informada")}{extraRecords.length > 0 && <p>Hay {extraRecords.length} registro(s) adicional(es) para revisión histórica.</p>}</> : "Sin ficha coincidente en Chopify"}</td>
            <td>{product ? priceLabel(product) : "Pendiente de confirmación"}</td>
            <td>{product && variants.length ? <details><summary>{variants.length} variante(s) recibidas de Chopify</summary><ul>{variants.map((variant, index) => <li key={text(variant.id, text(variant.sku, `${modelKey(model.name)}-variant-${index}`))}>
              {text(variant.color, "Color no informado")} · {text(variant.sku, "SKU pendiente")} · {Array.isArray(variant.sizes) ? variant.sizes.map(String).join("/") : text(variant.size, "Tallas no informadas")} · {variantPrice(variant, product)} · {typeof variant.stock === "number" ? `${variant.stock} unidades agrupadas en variante; no confirma talla` : "Stock por confirmar"} · {ownerAvailability(variant)} · {text(variant.status, "Estado no informado")}
            </li>)}</ul><p>Las tallas y el stock solo habilitan compra cuando Chopify tiene disponibilidad verificable para la variante solicitada.</p></details> : "Sin variantes comerciales confirmadas"}</td>
            <td>{(photosByModel[modelKey(model.name)] ?? []).length} foto(s) generales
              {(photosByModel[modelKey(model.name)] ?? []).length > 0 && <details><summary>Ver galería de referencia</summary><div className="admin-toolbar">{(photosByModel[modelKey(model.name)] ?? []).map((url, index) => <img key={url} src={url} alt={`${model.name}, fotografía general ${index + 1}; color y presentación no verificados`} loading="lazy" style={{ width: 112, height: 132, objectFit: "cover", borderRadius: 8 }} />)}</div></details>}
            </td>
            <td><details><summary>3 tipos de pantalón documentados</summary><ul>{pants.map((presentation) => <li key={presentation.name}><strong>{presentation.name}:</strong> {presentation.details} <span>Combinación potencial; disponibilidad por modelo, talla y color requiere validación.</span></li>)}</ul></details></td>
          </tr>;
        })}</tbody>
      </table></div>
      {historical.length > 0 && <details className="admin-card">
        <summary>Registros históricos o fuera de los 12 modelos ({historical.length})</summary>
        <p>Se conservan visibles para historial y auditoría; esta sección no los trata como modelos oficiales operativos.</p>
        <ul>{historical.map(({ product, index }) => <li key={productId(product) || `historical-${index}`}>{text(product.name, "Producto sin nombre")} · ID: {productId(product) || "no informado"} · {text(product.sku, "SKU no informado")} · {text(product.status, "Estado no informado")} · {text(product.visibility, "Visibilidad no informada")}</li>)}</ul>
      </details>}
    </>}
  </section>;
}
