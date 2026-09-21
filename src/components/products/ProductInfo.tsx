import type { Product } from "../../types/product";

import { useStoreConfigStore } from "../../store/storeConfigStore";

interface ProductInfoProps {
  product: Product;
}

export function ProductInfo({
  product,
}: ProductInfoProps) {
  const commerce = useStoreConfigStore(
    (state) => state.config.commerce,
  );

  return (
    <div className="product-detail-info">
      <span className="product-detail-category">
        {[product.category, product.collection].filter(Boolean).join(" · ")}
      </span>

      {product.badge && (
        <span className="product-detail-badge">
          {product.badge}
        </span>
      )}

      <h1>{product.name}</h1>

      <div className="product-detail-price">
        <strong>
          ${product.price.toFixed(2)}
        </strong>

        {product.oldPrice && (
          <span>
            ${product.oldPrice.toFixed(2)}
          </span>
        )}
      </div>

      <p className="product-detail-description">
        {product.shortDescription ||
          product.description ||
          "Producto diseñado y seleccionado para ti."}
      </p>

      {(product.fabric || product.material) && <div className="product-textile-meta"><span>Tela / material</span><strong>{product.fabric || product.material}</strong></div>}

      <div className="product-detail-divider" />

      <div className="product-detail-meta">
        <div>
          <span>Envíos</span>

          <strong>
            {commerce.shippingEnabled
              ? commerce.shippingText
              : "Coordinar entrega"}
          </strong>
        </div>
      </div>
    </div>
  );
}
