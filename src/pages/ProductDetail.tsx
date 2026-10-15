import { Link, useParams, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useProductStore } from "../store/productStore";
import { catalogPrice, hasKnownPrice, resolveVariant, variantSizes } from "../services/chopify/catalog";
import { slugify } from "../utils/normalization";
import { ProductGallery } from "../components/products/ProductGallery";
import { ProductInfo } from "../components/products/ProductInfo";
import { ProductPurchase } from "../components/products/ProductPurchase";
import { ProductCard } from "../components/products/ProductCard";
import { StoreSEO } from "../components/common/StoreSEO";
import { SizeGuideDialog } from "../components/products/SizeGuideDialog";
import { editorialImagesForProduct, hasEditorialImagesForColor } from "../data/editorialProductImages";

export function ProductDetail() {
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const products = useProductStore((state) => state.products);
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const product = products.find((item) => item.id === id || item.slug === id);
  const variants = product?.variants.filter((variant) => variant.active) ?? [];
  const colors = [...new Set(variants.map((variant) => variant.color).filter((value): value is string => Boolean(value)))];
  const color = colors.find((value) => slugify(value) === slugify(params.get("color") ?? "")) ?? (colors.length === 1 ? colors[0] : "");
  const pantsType = params.get("pantalon") ?? "";
  const possibleSizes = [...new Set(variants.filter((variant) => (!color || slugify(variant.color ?? "") === slugify(color)) && (!pantsType || slugify(variant.pantsType ?? "") === slugify(pantsType))).flatMap(variantSizes))];
  const size = possibleSizes.includes(params.get("talla") ?? "") ? params.get("talla")! : possibleSizes.length === 1 ? possibleSizes[0] : "";
  const select = (key: string, value: string) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, key === "color" ? slugify(value) : value); else next.delete(key);
      return next;
    }, { replace: true });
  };
  const selected = product ? resolveVariant(product, color, size, pantsType) : undefined;
  const colorVariant = variants.find((variant) => variant.color === color);
  const images = product ? editorialImagesForProduct(product.slug, color || undefined) : [];
  const image = images[0];
  const colorPhotoIsReference = Boolean(color && images.length && !hasEditorialImagesForColor(product?.slug ?? "", color));

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
        <div className="product-gallery-wrap"><ProductGallery key={`${product.id}:${color}`} name={product.name} image={image} images={images} />{colorPhotoIsReference && <p className="product-photo-reference-note" role="note">Fotografía referencial del modelo. El tono exacto de {color} puede variar; consúltanos si necesitas confirmar el color.</p>}</div>
        <div className="product-detail-content"><ProductInfo product={display} /><ProductPurchase key={product.id} product={product} color={color} size={size} pantsType={pantsType} onColorChange={(value) => select("color", value)} onSizeChange={(value) => select("talla", value)} onPantsTypeChange={(value) => select("pantalon", value)} onOpenSizeGuide={() => setSizeGuideOpen(true)} /></div>
      </section>
      <section className="product-detail-sections">
        {(product.description || product.characteristics?.length) && <details open><summary>El diseño, en detalle</summary>{product.description && <p>{product.description}</p>}{Boolean(product.characteristics?.length) && <ul>{product.characteristics!.map((value) => <li key={value}>{value}</li>)}</ul>}</details>}
        {(product.deliveryType || product.preparationTime) && <details><summary>Preparación y entrega</summary>{product.deliveryType && <p>{product.deliveryType}</p>}{product.preparationTime && <p>{product.preparationTime}</p>}</details>}
        {product.exchangePolicy && <details><summary>Cambios</summary>{product.exchangePolicy.conditions ? <p>{product.exchangePolicy.conditions}</p> : product.exchangePolicy.allowed === false ? <p>Este modelo no admite cambios según su política registrada.</p> : <p>Consulta con FLOES las condiciones de cambio antes de completar tu pedido.</p>}</details>}
      </section>
      {related.length > 0 && <section className="related-models"><header className="model-collection-heading"><div><span className="eyebrow">SIGUE EXPLORANDO</span><h2>Otros modelos, tu mismo estilo.</h2></div></header><div className="model-collection-grid">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}
    </div>
    {sizeGuideOpen && <SizeGuideDialog product={product} color={color} size={size} onClose={() => setSizeGuideOpen(false)} />}
  </main>;
}
