import {
  Link,
  useParams,
} from "react-router-dom";

import {
  ChevronLeft,
} from "lucide-react";
import { useEffect, useState } from "react";

import { useProductStore } from "../store/productStore";
import { useMarketingStore } from "../store/marketingStore";
import { promotionalPrice } from "../utils/storefront";

import { ProductGallery } from "../components/products/ProductGallery";
import { ProductInfo } from "../components/products/ProductInfo";
import { ProductPurchase } from "../components/products/ProductPurchase";

export function ProductDetail() {
  const products = useProductStore(state => state.products);
  const promotions = useMarketingStore((s) => s.promotions);
  const { id } = useParams();

  const product =
    products.find(
      (item) =>
        item.id === id
    );
  const displayProduct = product ? { ...product, oldPrice: promotionalPrice(product, promotions) < product.price ? product.price : product.oldPrice, price: promotionalPrice(product, promotions) } : undefined;
  const availableColors = displayProduct?.variants.filter((variant) => variant.active).map((variant) => variant.color).filter((color): color is string => Boolean(color)) ?? [];
  const [selectedColor, setSelectedColor] = useState(availableColors.length === 1 ? availableColors[0] : "");
  useEffect(() => {
    if (availableColors.length === 1 && !selectedColor) {
      setSelectedColor(availableColors[0]);
    }
  }, [availableColors, selectedColor]);
  const colorGallery = displayProduct?.colors.find((color) => color.name === selectedColor)?.images ?? [];
  const galleryImages = colorGallery.length ? colorGallery : displayProduct?.images ?? [];
  const galleryImage = colorGallery[0] ?? displayProduct?.image;

  if (!displayProduct || !displayProduct.active) {
    return (
      <main className="product-not-found">

        <div className="container">

          <h1>
            Producto no encontrado.
          </h1>

          <Link to="/catalogo">
            Volver al catálogo
          </Link>

        </div>

      </main>
    );
  }

  return (
    <main className="product-detail-page">

      <div className="container">

        <Link
          to="/catalogo"
          className="product-back-link"
        >
          <ChevronLeft
            size={16}
          />

          Volver al catálogo
        </Link>

        <section className="product-detail-layout">

          <ProductGallery
            key={`${displayProduct.id}:${selectedColor}`}
            name={displayProduct.name}
            image={galleryImage}
            images={galleryImages}
          />

          <div className="product-detail-content">

            <ProductInfo
              product={displayProduct}
            />

            <ProductPurchase
              product={displayProduct}
              color={selectedColor}
              onColorChange={setSelectedColor}
            />

          </div>

        </section>

        {displayProduct.sizeGuide && <section className="size-guide-section" aria-labelledby="size-guide-title">
          <div><span className="eyebrow">MEDIDAS DEL MODELO</span><h2 id="size-guide-title">{displayProduct.sizeGuide.title || "Guía de tallas"}</h2>{displayProduct.sizeGuide.note && <p>{displayProduct.sizeGuide.note}</p>}</div>
          <div className="size-guide-scroll"><table><thead><tr><th>Medida</th>{displayProduct.sizeGuide.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{displayProduct.sizeGuide.rows.map((row) => <tr key={row.label}><th>{row.label}</th>{displayProduct.sizeGuide!.columns.map((column, index) => <td key={column}>{row.values[index] || "—"}</td>)}</tr>)}</tbody></table></div>
        </section>}

      </div>

    </main>
  );
}
