import { useCartItems } from "../store/useCartItems";
import { useProductStore } from "../store/productStore";
import { useStoreConfigStore } from "../store/storeConfigStore";
import { availableQuantityForSize, canPurchase, hasKnownPrice, catalogPrice, variantSizes } from "../services/chopify/catalog";
import { getProductRealCost } from "../utils/productMetrics";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Banknote,
  CreditCard,
  MapPin,
  Package,
  UserRound,
} from "lucide-react";

import { type FormEvent, useMemo, useState } from "react";

import { Link, Navigate, useNavigate } from "react-router-dom";

import { useCartStore } from "../store/cartStore";

import { getCartQuantity, getCartSubtotal } from "../store/cartSelectors";

import { useCheckoutStore } from "../store/checkoutStore";

import type {
  CheckoutFormData,
  CheckoutPaymentMethod,
  StoreOrder,
} from "../types/order";

const initialForm: CheckoutFormData = {
  customer: {
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  },

  shipping: {
    province: "",
    city: "",
    address: "",
    reference: "",
  },

  paymentMethod: "transfer",
};

export function Checkout() {
  const commerce = useStoreConfigStore((s) => s.config.commerce);
  // FLOES no define una restricción geográfica para efectivo todavía.
  // Conservamos este indicador para los controles heredados sin bloquear ciudades.
  const isGuayaquil = true;
  const navigate = useNavigate();

  const items = useCartItems();

  const clearCart = useCartStore((state) => state.clearCart);

  const saveOrder = useCheckoutStore((state) => state.saveOrder);

  const [form, setForm] = useState<CheckoutFormData>(initialForm);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [processing, setProcessing] = useState(false);

  const subtotal = useMemo(() => getCartSubtotal(items), [items]);

  const quantity = useMemo(() => getCartQuantity(items), [items]);

  /*
   * Todavía no conocemos las tarifas
   * definitivas de FLOES.
   *
   * Más adelante esto vendrá de:
   * Admin → Configuración → Envíos.
   */
  const shippingCost: number | null = commerce.shippingEnabled && commerce.shippingMode === "fixed" ? commerce.shippingCost : null;
  const shippingConfirmed = shippingCost !== null && Number.isFinite(shippingCost) && shippingCost >= 0;
  const hasPaymentMethods = commerce.paymentMethods.transfer || (commerce.paymentMethods.cash && isGuayaquil);

  const total = subtotal + (shippingCost ?? 0);

  if (items.length === 0 && !processing) {
    return <Navigate to="/carrito" replace />;
  }

  const updateCustomer = (
    field: keyof CheckoutFormData["customer"],
    value: string,
  ) => {
    setForm((current) => ({
      ...current,

      customer: {
        ...current.customer,

        [field]: value,
      },
    }));

    setErrors((current) => ({
      ...current,
      [field]: "",
    }));
  };

  const updateShipping = (
    field: keyof CheckoutFormData["shipping"],
    value: string,
  ) => {
    setForm((current) => {
      const nextShipping = {
        ...current.shipping,
        [field]: value,
      };

      return {
        ...current,
        shipping:
          nextShipping,
        paymentMethod: current.paymentMethod,
      };
    });

    setErrors((current) => ({
      ...current,
      [field]: "",
    }));
  };

  const selectPayment = (method: CheckoutPaymentMethod) => {
    setForm((current) => ({
      ...current,

      paymentMethod: method,
    }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.customer.firstName.trim()) {
      nextErrors.firstName = "Ingresa tu nombre.";
    }

    if (!form.customer.lastName.trim()) {
      nextErrors.lastName = "Ingresa tu apellido.";
    }

    if (!form.customer.phone.trim()) {
      nextErrors.phone = "Ingresa tu teléfono.";
    }

    if (!form.customer.email.trim()) {
      nextErrors.email = "Ingresa tu correo.";
    }

    if (!form.shipping.province.trim()) {
      nextErrors.province = "Ingresa la provincia.";
    }

    if (!form.shipping.city.trim()) {
      nextErrors.city = "Ingresa la ciudad.";
    }

    if (!form.shipping.address.trim()) {
      nextErrors.address = "Ingresa la dirección.";
    }

    if (!shippingConfirmed) {
      nextErrors.shippingCost = "La tarifa de entrega está pendiente. No se puede confirmar un pedido con el total provisional.";
    }

    if (!hasPaymentMethods) {
      nextErrors.payment = "No hay métodos de pago configurados para Preview. El pedido no puede confirmarse.";
    }

    if (
      form.paymentMethod ===
        "transfer" &&
      !commerce.paymentMethods
        .transfer
    ) {
      nextErrors.payment =
        "La transferencia no está disponible en este momento.";
    }

    if (
      form.paymentMethod ===
        "cash" &&
      !commerce.paymentMethods.cash
    ) {
      nextErrors.payment =
        "El pago en efectivo no está disponible en este momento.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setProcessing(true);

    try {
      const current = useProductStore.getState().products;
      const snapshots = items.map(({ product, quantity, variant, size }) => {
        const latest = current.find((p) => p.id === product.id);
        if (
          !latest ||
          !latest.active ||
          latest.inStock === false
        )
          throw new Error(
            `${product.name} ya no está disponible. Retíralo del carrito.`,
          );
        const latestVariant = variant ? latest.variants.find((entry) => entry.id === variant.id && entry.active) : undefined;
        if (variant && !latestVariant) throw new Error(`${product.name}: la variante seleccionada ya no está disponible.`);
        if (latestVariant && variantSizes(latestVariant).length && !variantSizes(latestVariant).includes(size ?? latestVariant.size ?? "")) throw new Error(`${product.name}: selecciona una talla vigente.`);
        if (!hasKnownPrice(latest, latestVariant)) throw new Error(`${product.name} todavía no tiene un precio publicado.`);
        if (!canPurchase(latest, latestVariant, size)) throw new Error(`${product.name} ya no está disponible en la talla seleccionada.`);
        const sizeQuantity = latestVariant?.fulfillmentMode === "STOCK" ? availableQuantityForSize(latestVariant, size) : null;
        if (latestVariant?.fulfillmentMode === "STOCK" && sizeQuantity !== null && sizeQuantity !== undefined && sizeQuantity < quantity) throw new Error(`${product.name}: no hay unidades suficientes en la talla seleccionada.`);
        return {
          productId: latest.id,
          name: latest.name,
          sku: latestVariant?.sku ?? latest.sku,
          price: catalogPrice(latest, latestVariant),
          cost: latestVariant?.productCost ?? getProductRealCost(latest),
          quantity,
          variantId: latestVariant?.id,
          variantSku: latestVariant?.sku,
          variantLabel: latestVariant ? [latestVariant.color, size || latestVariant.size].filter(Boolean).join(" / ") : undefined,
          size: size || latestVariant?.size,
          color: latestVariant?.color,
          measurement: latestVariant?.measurement,
          material: latestVariant?.material,
        };
      });
      const now = new Date().toISOString();
      const order: StoreOrder = {
        id: `FLOES-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        createdAt: now,
        updatedAt: now,
        customer: { ...form.customer },
        shipping: { ...form.shipping },
        paymentMethod: form.paymentMethod,
        items: snapshots,
        subtotal: snapshots.reduce((sum, i) => sum + i.price * i.quantity, 0),
        shippingCost,
        total: 0,
        discount: 0,
        paymentStatus: "pending",
        orderStatus: "new",
        estimatedCost: null,
        estimatedProfit: null,
        notes: [],
        inventoryCommitted: false,
      };
      order.total = order.subtotal + (shippingCost ?? 0);
      const saved = await saveOrder(order);
      clearCart();
      navigate(`/pedido-confirmado?pedido=${encodeURIComponent(saved.id)}`);
    } catch (error) {
      setErrors((current) => ({
        ...current,
        submit:
          error instanceof Error
            ? error.message
            : "No se pudo registrar el pedido.",
      }));
      setProcessing(false);
      return;
    }

  };

  return (
    <main className="checkout-page">
      <div className="container">
        <div className="checkout-topbar">
          <Link to="/carrito" className="checkout-back">
            <ArrowLeft size={16} />
            Volver al carrito
          </Link>

          <div className="checkout-secure">
            <Check size={14} />
            Compra segura
          </div>
        </div>

        <header className="checkout-header">
          <span className="eyebrow">FINALIZAR COMPRA</span>

          <h1>
            Completa tu
            <span> pedido.</span>
          </h1>

          <p>Solo necesitamos algunos datos para preparar tu compra.</p>
        </header>

        <form className="checkout-layout" onSubmit={handleSubmit}>
          <div className="checkout-form-column">
            {/* =========================
                CUSTOMER
            ========================= */}

            <section className="checkout-card">
              <div className="checkout-card-heading">
                <div className="checkout-step-icon">
                  <UserRound size={19} />
                </div>

                <div>
                  <span>PASO 01</span>

                  <h2>Tus datos</h2>
                </div>
              </div>

              <div className="checkout-fields checkout-fields-two">
                <label className="checkout-field">
                  <span>Nombre</span>

                  <input
                    value={form.customer.firstName}
                    onChange={(event) =>
                      updateCustomer("firstName", event.target.value)
                    }
                    placeholder="Tu nombre"
                  />

                  {errors.firstName && <small>{errors.firstName}</small>}
                </label>

                <label className="checkout-field">
                  <span>Apellido</span>

                  <input
                    value={form.customer.lastName}
                    onChange={(event) =>
                      updateCustomer("lastName", event.target.value)
                    }
                    placeholder="Tu apellido"
                  />

                  {errors.lastName && <small>{errors.lastName}</small>}
                </label>

                <label className="checkout-field">
                  <span>Teléfono</span>

                  <input
                    type="tel"
                    value={form.customer.phone}
                    onChange={(event) =>
                      updateCustomer("phone", event.target.value)
                    }
                    placeholder="09..."
                  />

                  {errors.phone && <small>{errors.phone}</small>}
                </label>

                <label className="checkout-field">
                  <span>Correo electrónico</span>

                  <input
                    type="email"
                    value={form.customer.email}
                    onChange={(event) =>
                      updateCustomer("email", event.target.value)
                    }
                    placeholder="nombre@correo.com"
                  />

                  {errors.email && <small>{errors.email}</small>}
                </label>
              </div>
            </section>

            {/* =========================
                SHIPPING
            ========================= */}

            <section className="checkout-card">
              <div className="checkout-card-heading">
                <div className="checkout-step-icon">
                  <MapPin size={19} />
                </div>

                <div>
                  <span>PASO 02</span>

                  <h2>Entrega</h2>
                </div>
              </div>

              <p className="checkout-summary-note">
                Los envíos nacionales se coordinan por Servientrega. El valor del envío se confirmará antes de completar la compra.
              </p>

              <div className="checkout-fields checkout-fields-two">
                <label className="checkout-field">
                  <span>Provincia</span>

                  <input
                    value={form.shipping.province}
                    onChange={(event) =>
                      updateShipping("province", event.target.value)
                    }
                    placeholder="Ej. Guayas"
                  />

                  {errors.province && <small>{errors.province}</small>}
                </label>

                <label className="checkout-field">
                  <span>Ciudad</span>

                  <input
                    value={form.shipping.city}
                    onChange={(event) =>
                      updateShipping("city", event.target.value)
                    }
                    placeholder="Ej. Guayaquil"
                  />

                  {errors.city && <small>{errors.city}</small>}
                </label>

                <label className="checkout-field checkout-field-full">
                  <span>Dirección</span>

                  <input
                    value={form.shipping.address}
                    onChange={(event) =>
                      updateShipping("address", event.target.value)
                    }
                    placeholder="Dirección de entrega"
                  />

                  {errors.address && <small>{errors.address}</small>}
                </label>

                <label className="checkout-field checkout-field-full">
                  <span>Referencia</span>

                  <textarea
                    rows={3}
                    value={form.shipping.reference}
                    onChange={(event) =>
                      updateShipping("reference", event.target.value)
                    }
                    placeholder="Casa, edificio, referencia o indicación adicional"
                  />
                </label>
              </div>
            </section>

            {/* =========================
                PAYMENT
            ========================= */}

            <section className="checkout-card">
              <div className="checkout-card-heading">
                <div className="checkout-step-icon">
                  <CreditCard size={19} />
                </div>

                <div>
                  <span>PASO 03</span>

                  <h2>Forma de pago</h2>
                </div>
              </div>

              <div className="payment-options">
                {!hasPaymentMethods && (
                  <p role="alert">
                    No hay métodos de pago configurados. El pedido permanece pendiente de configuración.
                  </p>
                )}
                {commerce.paymentMethods.transfer && (
                  <button
                    type="button"
                    className={
                      form.paymentMethod === "transfer"
                        ? "payment-option active"
                        : "payment-option"
                    }
                    onClick={() => selectPayment("transfer")}
                  >
                    <div className="payment-option-icon">
                      <CreditCard size={19} />
                    </div>

                    <div>
                      <strong>Transferencia</strong>

                      <span>
                        Recibirás los datos para completar el pago.
                      </span>
                    </div>

                    <span className="payment-selector">
                      {form.paymentMethod === "transfer" && (
                        <Check size={14} />
                      )}
                    </span>
                  </button>
                )}

                {commerce.paymentMethods.cash && isGuayaquil && (
                  <button
                    type="button"
                    className={
                      form.paymentMethod === "cash"
                        ? "payment-option active"
                        : "payment-option"
                    }
                    onClick={() => selectPayment("cash")}
                  >
                    <div className="payment-option-icon">
                      <Banknote size={19} />
                    </div>

                    <div>
                      <strong>Efectivo</strong>

                      <span>
                        Disponible únicamente para entregas en Guayaquil.
                      </span>
                    </div>

                    <span className="payment-selector">
                      {form.paymentMethod === "cash" && (
                        <Check size={14} />
                      )}
                    </span>
                  </button>
                )}

                {!isGuayaquil && commerce.paymentMethods.cash && (
                  <p className="checkout-summary-note">
                    El pago en efectivo se habilita al seleccionar Guayaquil como ciudad de entrega.
                  </p>
                )}

                {errors.payment && (
                  <p role="alert">
                    {errors.payment}
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* =============================
              SUMMARY
          ============================= */}

          <aside className="checkout-summary">
            <div className="checkout-summary-heading">
              <div>
                <span>TU PEDIDO</span>

                <h2>Resumen</h2>
              </div>

              <div className="checkout-summary-count">
                <Package size={16} />

                {quantity}
              </div>
            </div>

            <div className="checkout-summary-products">
              {items.map(({ product, quantity: itemQuantity, variant, size, lineId }) => {
                const initials = product.name
                  .split(" ")
                  .map((word) => word.charAt(0))
                  .slice(0, 2)
                  .join("");

                return (
                  <div className="checkout-summary-product" key={lineId}>
                    <div className="checkout-summary-media">
                      <span>{initials}</span>

                      <small>{itemQuantity}</small>
                    </div>

                    <div className="checkout-summary-product-info">
                      <span>{product.category}</span>

                      <strong>{product.name}</strong>
                      {variant && <small>{[variant.color, size || variant.size].filter(Boolean).join(" / ")}</small>}
                    </div>

                    <div className="checkout-summary-product-price">
                      ${(catalogPrice(product, variant) * itemQuantity).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="checkout-summary-lines">
              <div>
                <span>Subtotal</span>

                <strong>${subtotal.toFixed(2)}</strong>
              </div>

              <div>
                <span>Envío</span>

                <strong>
                  {shippingConfirmed
                    ? `$${shippingCost!.toFixed(2)} confirmado`
                    : commerce.shippingEnabled ? "Servientrega · Por confirmar" : "Coordinar entrega · Por confirmar"}
                </strong>
              </div>
            </div>

            <div className="checkout-summary-total">
              <span>Total provisional</span>

              <strong>${total.toFixed(2)}</strong>
            </div>

            {errors.submit && <p role="alert">{errors.submit}</p>}
            {!shippingConfirmed && <p role="alert">La tarifa de entrega no está confirmada. No se puede crear el pedido con un total provisional.</p>}
            <button
              type="submit"
              className="checkout-submit"
              disabled={processing || !shippingConfirmed || !hasPaymentMethods}
            >
              {processing ? "Procesando..." : "Confirmar pedido"}

              {!processing && <ArrowRight size={18} />}
            </button>

            <p className="checkout-summary-note">
              El valor final del envío será confirmado antes de completar la
              compra.
            </p>
          </aside>
        </form>
      </div>
    </main>
  );
}
