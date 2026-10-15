import {
  ArrowRight,
  Check,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";

import { Link } from "react-router-dom";

import { useCartItems } from "../store/useCartItems";
import { availableQuantityForSize, catalogPrice } from "../services/chopify/catalog";
import { useCartStore } from "../store/cartStore";
import { useStoreConfigStore } from "../store/storeConfigStore";
import { WhatsAppCTA } from "../components/common/WhatsAppCTA";
import { editorialImagesForProduct } from "../data/editorialProductImages";

import {
  getCartQuantity,
  getCartSubtotal,
} from "../store/cartSelectors";

export function Cart() {
  const commerce = useStoreConfigStore(
    (state) => state.config.commerce,
  );

  const items = useCartItems();

  const increaseQuantity = useCartStore(
    (state) => state.increaseQuantity,
  );

  const decreaseQuantity = useCartStore(
    (state) => state.decreaseQuantity,
  );

  const removeItem = useCartStore(
    (state) => state.removeItem,
  );

  const clearCart = useCartStore(
    (state) => state.clearCart,
  );

  const quantity = getCartQuantity(items);
  const subtotal = getCartSubtotal(items);

  if (items.length === 0) {
    return (
      <main className="cart-page">
        <div className="container cart-page-empty">
          <div className="cart-empty-icon">
            <ShoppingBag size={30} />
          </div>

          <span className="eyebrow">
            TU CARRITO
          </span>

          <h1>
            Aún no has elegido
            <span>
              {" "}
              tus favoritos.
            </span>
          </h1>

          <p>
            Explora nuestra selección y encuentra
            productos para tu rutina.
          </p>

          <Link
            to="/catalogo"
            className="cart-page-shop"
          >
            Explorar catálogo

            <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <div className="container">
        <div className="cart-page-header">
          <div>
            <span className="eyebrow">
              TU SELECCIÓN
            </span>

            <h1>
              Tu carrito.
              <span>
                {" "}
                Casi listo.
              </span>
            </h1>
          </div>

          <div className="cart-page-header-meta">
            <span>
              {quantity}{" "}
              {quantity === 1
                ? "producto"
                : "productos"}
            </span>

            <button
              type="button"
              onClick={clearCart}
            >
              Vaciar carrito
            </button>
          </div>
        </div>

        <div className="cart-page-layout">
          <section className="cart-page-items">
            {items.map(
              ({
                product,
                quantity: itemQuantity,
                lineId,
                variant,
                size,
              }) => {
                const maxQuantity = variant?.fulfillmentMode === "STOCK" ? availableQuantityForSize(variant, size) : null;
                const initials =
                  product.name
                    .split(" ")
                    .map((word) =>
                      word.charAt(0),
                    )
                    .slice(0, 2)
                    .join("");
                const editorialImage = editorialImagesForProduct(product.slug, variant?.color)[0];

                return (
                  <article
                    className="cart-page-item"
                    key={lineId}
                  >
                    <Link
                      to={`/producto/${product.id}`}
                      className="cart-page-item-media"
                    >
                      {editorialImage ? (
                        <img
                          src={editorialImage}
                          alt={product.name}
                          loading="lazy"
                        />
                      ) : (
                        <div>
                          {initials}
                        </div>
                      )}
                    </Link>

                    <div className="cart-page-item-main">
                      <div className="cart-page-item-title">
                        <div>
                          <span>
                            {product.category}
                          </span>

                          <Link
                            to={`/producto/${product.id}`}
                          >
                            <h2>
                              {product.name}
                            </h2>
                          </Link>

                          <p>
                            $
                            {catalogPrice(product, variant).toFixed(
                              2,
                            )}{" "}
                            por unidad
                          </p>
                          {variant && <small>{[variant.color, variant.pantsType, size || variant.size].filter(Boolean).join(" / ")}</small>}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(
                              lineId,
                            )
                          }
                          aria-label={`Eliminar ${product.name} del carrito`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>

                      <div className="cart-page-item-footer">
                        <div className="cart-page-quantity">
                          <button
                            type="button"
                            onClick={() =>
                              decreaseQuantity(
                                lineId,
                              )
                            }
                            aria-label="Disminuir cantidad"
                          >
                            <Minus size={15} />
                          </button>

                          <span>
                            {itemQuantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              increaseQuantity(
                                lineId,
                              )
                            }
                            disabled={maxQuantity !== null && maxQuantity !== undefined && itemQuantity >= maxQuantity}
                            aria-label="Aumentar cantidad"
                          >
                            <Plus size={15} />
                          </button>
                        </div>

                        <strong>
                          $
                          {(
                            catalogPrice(product, variant) *
                            itemQuantity
                          ).toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  </article>
                );
              },
            )}
          </section>

          <aside className="cart-summary">
            <div className="cart-summary-heading">
              <div className="cart-summary-heading-icon">
                <ShoppingBag size={18} />
              </div>

              <div>
                <span className="cart-summary-eyebrow">
                  TU COMPRA
                </span>

                <h2>
                  Resumen del pedido
                </h2>
              </div>
            </div>

            <p className="cart-summary-intro">
              Revisa tu selección antes de continuar
              con los datos de entrega y pago.
            </p>

            <div className="cart-summary-lines">
              <div>
                <span>
                  {quantity === 1
                    ? "Producto"
                    : "Productos"}
                </span>

                <strong>
                  {quantity}
                </strong>
              </div>

              <div>
                <span>
                  Subtotal
                </span>

                <strong>
                  ${subtotal.toFixed(2)}
                </strong>
              </div>

              <div>
                <span>
                  Envío
                </span>

                <strong className="cart-summary-pending">
                  Por confirmar
                </strong>
              </div>
            </div>

            <div className="cart-summary-total">
              <div>
                <span>
                  Total provisional
                </span>

                <small>
                  Envío por confirmar
                </small>
              </div>

              <strong>
                ${subtotal.toFixed(2)}
              </strong>
            </div>

            <div className="cart-summary-benefits">
              <div>
                <span className="cart-summary-benefit-icon">
                  <Truck size={17} />
                </span>

                <div>
                  <strong>
                    Cotización de envío por Owner
                  </strong>

                  <span>
                    La tarifa y el total se confirman antes del pago.
                  </span>
                </div>
              </div>

              <div>
                <span className="cart-summary-benefit-icon">
                  <ShieldCheck size={17} />
                </span>

                <div>
                  <strong>
                    Compra coordinada
                  </strong>

                  <span>
                    Confirmamos los detalles antes
                    de completar tu pedido.
                  </span>
                </div>
              </div>

              <div>
                <span className="cart-summary-benefit-icon">
                  <PackageCheck size={17} />
                </span>

                <div>
                  <strong>
                    Atención FLOES
                  </strong>

                  <span>
                    Acompañamiento durante tu
                    compra y entrega.
                  </span>
                </div>
              </div>
            </div>

            <div className="cart-summary-ready">
              <Check size={14} />

              <span>
                Tu selección está lista para
                continuar.
              </span>
            </div>

            <div className="cart-summary-actions">
              {commerce.webCheckoutEnabled && (
                <Link
                  to="/checkout"
                  className="cart-summary-checkout"
                >
                  Continuar compra

                  <ArrowRight size={18} />
                </Link>
              )}

              <WhatsAppCTA
                className="cart-summary-checkout"
              />

              <Link
                to="/catalogo"
                className="cart-summary-back"
              >
                Seguir comprando
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
