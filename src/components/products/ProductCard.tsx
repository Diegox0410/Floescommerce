import {
  ArrowUpRight,
  ShoppingBag,
} from "lucide-react";

import { Link } from "react-router-dom";

import type { Product } from "../../types/product";

import { useCartStore } from "../../store/cartStore";

import { canPurchase, hasKnownPrice, catalogPrice } from "../../services/chopify/catalog";
import { editorialImagesForProduct } from "../../data/editorialProductImages";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({
  product,
}: ProductCardProps) {
  const addItem = useCartStore(
    (state) => state.addItem,
  );

  const price = catalogPrice(product);
  const href = `/producto/${product.slug || product.id}`;
  const colorCount = new Set(product.variants.filter((variant) => variant.active).map((variant) => variant.color).filter(Boolean)).size;
  const editorialImages = editorialImagesForProduct(product.slug);
  const primaryImage = editorialImages[0];
  const alternateImage = editorialImages.find((image) => image !== primaryImage);

  const handleAddToCart = () => {
    addItem(product, 1);
  };
  const knownPrice = hasKnownPrice(product);

  return (
    <article className="product-card" data-scroll-item="product">
      <Link
        to={href}
        className="product-media"
        aria-label={`Ver ${product.name}`}
      >
        {primaryImage ? (
          <>
            <img
              src={primaryImage}
              alt={product.name}
              className="product-card-image-primary"
              loading="lazy"
              decoding="async"
              width={600}
              height={750}
            />
          {alternateImage && <img
            src={alternateImage}
            alt=""
            aria-hidden="true"
            className="product-card-image-secondary"
            loading="lazy"
            decoding="async"
            width={600}
            height={750}
          />}
          </>
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
            <small>Fotografía editorial pendiente</small>
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
          to={href}
        >
          <h3>{product.name}</h3>
        </Link>
        {colorCount > 0 && <p className="product-color-count">{colorCount} color{colorCount === 1 ? "" : "es"} en catálogo</p>}

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
              {product.variants.length ? "Desde " : ""}${price.toFixed(2)}
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

          {product.variants.length || !canPurchase(product) ? <Link className="product-add-button" to={href}><ArrowUpRight size={17} /><span>Ver modelo</span></Link> : <button
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
