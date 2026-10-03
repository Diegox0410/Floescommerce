import {
  ArrowRight,
  Check,
  PackageCheck,
} from "lucide-react";

import { Link, Navigate, useSearchParams } from "react-router-dom";

import {
  useCheckoutStore,
} from "../store/checkoutStore";
import { WhatsAppCTA } from "../components/common/WhatsAppCTA";

export function OrderSuccess() {
  const [params] = useSearchParams();
  const lastOrderId = useCheckoutStore(state => state.lastOrderId);
  const order = useCheckoutStore(state => state.lastOrder);
  const requestedOrderId = params.get("pedido");

  if (!order || (requestedOrderId && requestedOrderId !== lastOrderId)) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  const paymentLabel =
    order.paymentMethod === "transfer"
      ? "Transferencia"
      : order.paymentMethod === "cash"
        ? "Efectivo"
        : "Coordinación por WhatsApp (pedido histórico)";

  const itemsSummary =
    order.items
      .map(
        (item) =>
          `${item.quantity}× ${item.name}`,
      )
      .join(", ");

  const whatsappMessage =
    `🛍️✨ ¡Hola, FLOES.ec! Acabo de registrar el pedido ${order.id}. ` +
    `Soy ${order.customer.firstName} ${order.customer.lastName}. ` +
    `Productos: ${itemsSummary}. ` +
    `Total provisional: $${order.total.toFixed(2)}. ` +
    `Entrega: ${order.shipping.city}, ${order.shipping.province}. ` +
    `Forma de pago: ${paymentLabel}. ` +
    `¿Me ayudan a confirmar el pedido, el pago y el valor del envío por Servientrega? 💜`;

  return (
    <main className="order-success-page">
      <div className="container order-success-container">

        <div className="order-success-icon">
          <PackageCheck
            size={32}
          />

          <span>
            <Check
              size={14}
            />
          </span>
        </div>

        <span className="eyebrow">
          PEDIDO REGISTRADO
        </span>

        <h1>
          Gracias,
          <span>
            {" "}
            {
              order.customer
                .firstName
            }.
          </span>
        </h1>

        <p className="order-success-copy">
          Hemos registrado la
          información de tu pedido.
          FLOES podrá continuar con la
          confirmación del pago y la
          coordinación de la entrega.
        </p>

        <div className="order-success-number">
          <span>
            NÚMERO DE PEDIDO
          </span>

          <strong>
            {order.id}
          </strong>
        </div>

        <div className="order-success-grid">

          <div>
            <span>
              Entrega
            </span>

            <strong>
              {
                order.shipping
                  .city
              }
              ,{" "}
              {
                order.shipping
                  .province
              }
            </strong>
          </div>

          <div>
            <span>
              Total provisional
            </span>

            <strong>
              $
              {order.total.toFixed(
                2
              )}
            </strong>
          </div>

          <div>
            <span>
              Forma de pago
            </span>

            <strong>
              {paymentLabel}
            </strong>
          </div>

        </div>

        <WhatsAppCTA
          className="order-whatsapp-button"
          message={whatsappMessage}
          label="Continuar por WhatsApp"
        />

        <Link
          to="/catalogo"
          className="order-success-shop"
        >
          Volver a la tienda

          <ArrowRight
            size={17}
          />
        </Link>

      </div>
    </main>
  );
}
