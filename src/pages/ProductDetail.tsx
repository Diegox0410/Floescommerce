import {
  Link,
  useParams,
} from "react-router-dom";

import {
  ChevronLeft,
} from "lucide-react";

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
            key={displayProduct.id}
            name={displayProduct.name}
            image={displayProduct.image}
            images={displayProduct.images}
          />

          <div className="product-detail-content">

            <ProductInfo
              product={displayProduct}
            />

            <ProductPurchase
              product={displayProduct}
            />

          </div>

        </section>

      </div>

    </main>
  );
}
