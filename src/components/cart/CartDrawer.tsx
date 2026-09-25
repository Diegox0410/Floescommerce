import { useCartItems } from "../../store/useCartItems";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import { useCartStore } from "../../store/cartStore";

import {
  getCartQuantity,
  getCartSubtotal,
} from "../../store/cartSelectors";

export function CartDrawer() {
  const items = useCartItems();

  const isOpen =
    useCartStore(
      (state) =>
        state.isOpen
    );

  const closeCart =
    useCartStore(
      (state) =>
        state.closeCart
    );

  const increaseQuantity =
    useCartStore(
      (state) =>
        state.increaseQuantity
    );

  const decreaseQuantity =
    useCartStore(
      (state) =>
        state.decreaseQuantity
    );

  const removeItem =
    useCartStore(
      (state) =>
        state.removeItem
    );

  const quantity =
    getCartQuantity(items);

  const subtotal =
    getCartSubtotal(items);

  return (
    <>
      <div
        className={
          isOpen
            ? "cart-drawer-overlay active"
            : "cart-drawer-overlay"
        }
        onClick={closeCart}
      />

      <aside
        className={
          isOpen
            ? "cart-drawer active"
            : "cart-drawer"
        }
        aria-hidden={
          !isOpen
        }
      >
        <div className="cart-drawer-header">

          <div>
            <span>
              TU CARRITO
            </span>

            <h2>
              {quantity === 0
                ? "Todavía está vacío."
                : `${quantity} ${
                    quantity === 1
                      ? "producto"
                      : "productos"
                  }`}
            </h2>
          </div>

          <button
            type="button"
            className="cart-close-button"
            onClick={closeCart}
            aria-label="Cerrar carrito"
          >
            <X size={20} />
          </button>

        </div>

        {items.length === 0 ? (

          <div className="cart-empty">

            <div className="cart-empty-icon">
              <ShoppingBag
                size={28}
              />
            </div>

            <h3>
              Tu selección te espera.
            </h3>

            <p>
              Explora nuestro catálogo y agrega tus productos favoritos.
            </p>

            <Link
              to="/catalogo"
              className="cart-empty-button"
              onClick={closeCart}
            >
              Explorar catálogo

              <ArrowRight
                size={17}
              />
            </Link>

          </div>

        ) : (

          <>
            <div className="cart-drawer-items">

              {items.map(
                ({
                  product,
                  quantity:
                    itemQuantity,
                  lineId,
                  variant,
                }) => {
                  const initials =
                    product.name
                      .split(" ")
                      .map(
                        (word) =>
                          word.charAt(
                            0
                          )
                      )
                      .slice(
                        0,
                        2
                      )
                      .join("");

                  return (
                    <article
                      className="cart-drawer-item"
                      key={
                        product.id
                      }
                    >

                      <Link
                        to={`/producto/${product.id}`}
                        className="cart-item-media"
                        onClick={
                          closeCart
                        }
                      >
                        {product.image ? <img src={product.image} alt="" loading="lazy" /> : <div>
                          {initials}
                        </div>}
                      </Link>

                      <div className="cart-item-info">

                        <div className="cart-item-heading">

                          <div>
                            <span>
                              {
                                product.category
                              }
                            </span>

                            <Link
                              to={`/producto/${product.id}`}
                              onClick={
                                closeCart
                              }
                            >
                              <h3>
                                {
                                  product.name
                                }
                              </h3>
                            </Link>
                          </div>

                          <button
                            type="button"
                            className="cart-remove"
                            onClick={() =>
                              removeItem(
                                lineId
                              )
                            }
                            aria-label={`Eliminar ${product.name}`}
                          >
                            <Trash2
                              size={15}
                            />
                          </button>

                        </div>

                        <div className="cart-item-bottom">

                          <div className="cart-item-quantity">

                            <button
                              type="button"
                              onClick={() =>
                                decreaseQuantity(
                                  lineId
                                )
                              }
                            >
                              <Minus
                                size={13}
                              />
                            </button>

                            <span>
                              {
                                itemQuantity
                              }
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                increaseQuantity(
                                  lineId
                                )
                              }
                            >
                              <Plus
                                size={13}
                              />
                            </button>

                          </div>

                          <strong>
                            $
                            {(
                              (variant?.price ?? product.price) *
                              itemQuantity
                            ).toFixed(
                              2
                            )}
                          </strong>

                        </div>

                      </div>

                    </article>
                  );
                }
              )}

            </div>

            <div className="cart-drawer-footer">

              <div className="cart-subtotal">

                <span>
                  Subtotal
                </span>

                <strong>
                  $
                  {subtotal.toFixed(
                    2
                  )}
                </strong>

              </div>

              <p>
                Envío e impuestos se calcularán posteriormente.
              </p>

              <Link
                to="/carrito"
                onClick={closeCart}
                className="cart-checkout-button"
              >
                Ver carrito

                <ArrowRight
                  size={18}
                />
              </Link>

              <button
                type="button"
                className="cart-continue-button"
                onClick={
                  closeCart
                }
              >
                Seguir comprando
              </button>

            </div>
          </>
        )}

      </aside>
    </>
  );
}
