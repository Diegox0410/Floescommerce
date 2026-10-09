import { Link, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useProductStore } from "../store/productStore";
import { catalogPrice, hasKnownPrice, resolveVariant, variantSizes } from "../services/chopify/catalog";
import { slugify } from "../utils/normalization";
import { ProductGallery } from "../components/products/ProductGallery";
import { ProductInfo } from "../components/products/ProductInfo";
import { ProductPurchase } from "../components/products/ProductPurchase";
import { ProductCard } from "../components/products/ProductCard";
import { StoreSEO } from "../components/common/StoreSEO";

export function ProductDetail() {
  const products = useProductStore((state) => state.products);
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const product = products.find((item) => item.id === id || item.slug === id);
  const variants = product?.variants.filter((variant) => variant.active) ?? [];
  const colors = [...new Set(variants.map((variant) => variant.color).filter((value): value is string => Boolean(value)))];
  const color = colors.find((value) => slugify(value) === slugify(params.get("color") ?? "")) ?? (colors.length === 1 ? colors[0] : "");
  const possibleSizes = [...new Set(variants.filter((variant) => !color || variant.color === color).flatMap(variantSizes))];
  const size = possibleSizes.includes(params.get("talla") ?? "") ? params.get("talla")! : possibleSizes.length === 1 ? possibleSizes[0] : "";
  const select = (key: string, value: string) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, key === "color" ? slugify(value) : value); else next.delete(key);
      return next;
    }, { replace: true });
  };
  const selected = product ? resolveVariant(product, color, size) : undefined;
  const colorVariant = variants.find((variant) => variant.color === color);
  const variantImages = (selected ?? colorVariant)?.images ?? [];
  const images = color ? variantImages : product?.images ?? [];
  const image = images[0] ?? (color ? undefined : product?.image);

  if (!product?.active) return <main className="product-not-found"><div className="container"><h1>Modelo no encontrado.</h1><Link to="/catalogo">Descubrir la colección</Link></div></main>;

  const amount = catalogPrice(product, color ? selected ?? colorVariant : undefined);
  const sourcePrice = color ? (selected ?? colorVariant)?.price ?? product.price : product.price;
  const display = { ...product, price: amount, oldPrice: amount < sourcePrice ? sourcePrice : undefined, pricingStatus: hasKnownPrice(product, color ? selected ?? colorVariant : undefined) ? "READY" as const : "PENDING" as const };
  const related = products.filter((item) => item.active && item.id !== product.id && item.category === product.category).slice(0, 3);
  return <main className="product-detail-page">
    <StoreSEO product={product} variant={color ? selected ?? colorVariant : undefined} />
    <div className="container">
      <Link to="/catalogo" className="product-back-link"><ChevronLeft size={16} />La colección</Link>
      <section className="product-detail-layout">
        <ProductGallery key={`${product.id}:${color}`} name={`${product.name}${color ? ` · ${color}` : ""}`} image={image} images={images} />
        <div className="product-detail-content"><ProductInfo product={display} /><ProductPurchase key={product.id} product={product} color={color} size={size} onColorChange={(value) => select("color", value)} onSizeChange={(value) => select("talla", value)} /></div>
      </section>
      <section className="product-detail-sections">
        {(product.description || product.characteristics?.length) && <details open><summary>El diseño, en detalle</summary>{product.description && <p>{product.description}</p>}{Boolean(product.characteristics?.length) && <ul>{product.characteristics!.map((value) => <li key={value}>{value}</li>)}</ul>}</details>}
        {(product.deliveryType || product.preparationTime) && <details><summary>Preparación y entrega</summary>{product.deliveryType && <p>{product.deliveryType}</p>}{product.preparationTime && <p>{product.preparationTime}</p>}</details>}
        {product.exchangePolicy && <details><summary>Cambios</summary>{product.exchangePolicy.conditions ? <p>{product.exchangePolicy.conditions}</p> : product.exchangePolicy.allowed === false ? <p>Este modelo no admite cambios según su política registrada.</p> : <p>Consulta con FLOES las condiciones de cambio antes de completar tu pedido.</p>}</details>}
      </section>
      <section className="size-guide-section" id="guia-tallas" aria-labelledby="size-guide-title">
        <div><span className="eyebrow">ELIGE CON CONFIANZA</span><h2 id="size-guide-title">{product.sizeGuide?.title || "Encuentra tu talla"}</h2>
          <p>Mide una prenda que te quede bien, extendida sobre una superficie plana. Compara su ancho horizontal con la guía FLOES. Estas medidas corresponden a la prenda, no al contorno del cuerpo.</p>
          {product.sizeGuide?.note && <p>{product.sizeGuide.note}</p>}{product.sizeRecommendation && <p>{product.sizeRecommendation}</p>}
          <p>Si estás entre dos tallas, consulta según tu preferencia de ajuste. La guía orienta la elección; el ajuste puede variar.</p>
        </div>
        {product.sizeGuide ? <div className="size-guide-scroll"><table><caption>Medidas de prenda</caption><thead><tr><th>Medida</th>{product.sizeGuide.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{product.sizeGuide.rows.map((row) => <tr key={row.label}><th>{row.label}</th>{product.sizeGuide!.columns.map((column, index) => <td key={column}>{row.values[index] || "—"}</td>)}</tr>)}</tbody></table></div> : <p className="product-purchase-note">FLOES aún no ha publicado la tabla de medidas de este modelo. Consulta antes de elegir talla.</p>}
      </section>
      {related.length > 0 && <section className="related-models"><header className="model-collection-heading"><div><span className="eyebrow">SIGUE EXPLORANDO</span><h2>Otros modelos, tu mismo estilo.</h2></div></header><div className="model-collection-grid">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}
    </div>
  </main>;
}
