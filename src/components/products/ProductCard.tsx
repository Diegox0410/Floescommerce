import {
  ArrowUpRight,
  ShoppingBag,
} from "lucide-react";

import { Link } from "react-router-dom";

import type { Product } from "../../types/product";

import { useCartStore } from "../../store/cartStore";

import { useMarketingStore } from "../../store/marketingStore";

import { promotionalPrice } from "../../utils/storefront";
import { canPurchase, hasKnownPrice } from "../../services/chopify/catalog";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({
  product,
}: ProductCardProps) {
  const addItem = useCartStore(
    (state) => state.addItem,
  );

  const promotions = useMarketingStore(
    (state) => state.promotions,
  );

  const price = promotionalPrice(
    product,
    promotions,
  );

  const handleAddToCart = () => {
    addItem(product, 1);
  };
  const knownPrice = hasKnownPrice(product);

  return (
    <article className="product-card">
      <Link
        to={`/producto/${product.id}`}
        className="product-media"
        aria-label={`Ver ${product.name}`}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
          />
        ) : (
          <div className="product-image-placeholder">
            <span>
              {product.name
                .split(" ")
                .map((word) =>
                  word.charAt(0),
                )
                .slice(0, 2)
                .join("")}
            </span>
          </div>
        )}

        <span className="product-view-button">
          <ArrowUpRight size={18} />
        </span>
      </Link>

      <div className="product-content">
        <span className="product-category">
          {[product.collection, product.category].filter(Boolean).join(" · ")}
        </span>

        <Link
          to={`/producto/${product.id}`}
        >
          <h3>{product.name}</h3>
        </Link>

        {product.colors.some((color) => color.hex) && (
          <div className="product-color-preview" aria-label={`Colores disponibles para ${product.name}`}>
            {product.colors.filter((color) => color.hex).slice(0, 5).map((color) => (
              <span
                key={`${product.id}:${color.name}`}
                className="product-color-dot"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
            {product.colors.filter((color) => color.hex).length > 5 && (
              <small>+{product.colors.filter((color) => color.hex).length - 5}</small>
            )}
          </div>
        )}

        <div className="product-footer">
          {knownPrice ? <div className="product-pricing">
            <strong>
              ${price.toFixed(2)}
            </strong>

            {(price < product.price ||
              product.oldPrice) && (
              <span>
                $
                {(
                  price < product.price
                    ? product.price
                    : product.oldPrice!
                ).toFixed(2)}
              </span>
            )}
          </div> : <div className="product-pricing"><strong>Precio por confirmar</strong></div>}

          {product.variants.length || !canPurchase(product) ? <Link className="product-add-button" to={`/producto/${product.id}`}><ArrowUpRight size={17} /><span>Ver modelo</span></Link> : <button
            className="product-add-button"
            type="button"
            onClick={handleAddToCart}
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <ShoppingBag size={17} />

            <span>
              Agregar al carrito
            </span>
          </button>}
        </div>
      </div>
    </article>
  );
}
