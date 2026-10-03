import type { Product } from "../../types/product";

import { useStoreConfigStore } from "../../store/storeConfigStore";
import { hasKnownPrice } from "../../services/chopify/catalog";

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
        {[product.productType, product.category, product.collection, product.audience].filter(Boolean).join(" · ")}
      </span>

      {product.badge && (
        <span className="product-detail-badge">
          {product.badge}
        </span>
      )}

      <h1 className="product-info-name">{product.name}</h1>

      {hasKnownPrice(product) ? <div className="product-detail-price">
        <strong>
          ${product.price.toFixed(2)}
        </strong>

        {product.oldPrice && (
          <span>
            ${product.oldPrice.toFixed(2)}
          </span>
        )}
      </div> : <div className="product-detail-price"><strong>Precio por confirmar</strong></div>}

      <p className="product-detail-description">
        {product.shortDescription ||
          product.description ||
          ""}
      </p>

      {product.fulfillmentMode === "MADE_TO_ORDER" && <p className="product-purchase-note">Confección bajo pedido. La disponibilidad no representa unidades en inventario.</p>}

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
