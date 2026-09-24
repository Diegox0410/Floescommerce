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

      <h2 className="product-info-name">{product.name}</h2>

      {product.price > 0 && <div className="product-detail-price">
        <strong>
          ${product.price.toFixed(2)}
        </strong>

        {product.oldPrice && (
          <span>
            ${product.oldPrice.toFixed(2)}
          </span>
        )}
      </div>}

      <p className="product-detail-description">
        {product.shortDescription ||
          product.description ||
          ""}
      </p>

      {(product.fabric || product.material) && <div className="product-textile-meta"><span>Tela / material</span><strong>{product.fabric || product.material}</strong></div>}

      {commerce.shippingEnabled && commerce.shippingText && <><div className="product-detail-divider" />
      <div className="product-detail-meta">
        <div>
          <span>Envíos</span>

          <strong>
            {commerce.shippingText}
          </strong>
        </div>
      </div></>}
    </div>
  );
}
