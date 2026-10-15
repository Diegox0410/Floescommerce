import {
  ArrowRight,
  Check,
  PackageCheck,
} from "lucide-react";

import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  useCheckoutStore,
} from "../store/checkoutStore";
import { WhatsAppCTA } from "../components/common/WhatsAppCTA";
import { getChopifyOrderStatus } from "../services/chopify/orders";

export function OrderSuccess() {
  const [params] = useSearchParams();
  const lastOrderId = useCheckoutStore(state => state.lastOrderId);
  const order = useCheckoutStore(state => state.lastOrder);
  const requestedOrderId = params.get("pedido");
  const [remote, setRemote] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!order?.id) return;
    let active = true;
    void getChopifyOrderStatus(order.id).then(value => { if (active) setRemote(value); }).catch(() => { if (active) setError("No se pudo actualizar el estado del pedido."); });
    return () => { active = false; };
  }, [order?.id]);

  const refresh = async () => {
    if (!order?.id) return;
    setError("");
    try { setRemote(await getChopifyOrderStatus(order.id)); } catch { setError("No se pudo actualizar el estado del pedido."); }
  };

  const acceptQuote = async () => {
    const quote = remote.shippingQuote as { status?: string; version?: number } | undefined;
    if (!order?.chopifyCustomerId || !quote?.version) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/shipping-quote", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ orderId: order.id, customerId: order.chopifyCustomerId, version: quote.version, idempotencyKey: `floes-web-quote:${order.id}:${quote.version}` }) });
      const payload = await response.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "No se pudo aceptar el envío.");
      setMessage("Cotización aceptada. El total definitivo ya está listo para el pago."); await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo aceptar el envío."); }
    finally { setBusy(false); }
  };

  const submitSyntheticProof = async () => {
    if (!order?.chopifyCustomerId) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/submit-synthetic-payment-proof", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ orderId: order.id, customerId: order.chopifyCustomerId, confirmation: "SYNTHETIC_TEST_RECEIPT", idempotencyKey: `floes-web-test-proof:${order.id}` }) });
      const payload = await response.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "No se pudo registrar el comprobante ficticio.");
      setMessage("Comprobante ficticio registrado y enviado a revisión Owner."); await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo registrar el comprobante ficticio."); }
    finally { setBusy(false); }
  };

  if (!order || (requestedOrderId && requestedOrderId !== lastOrderId)) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  const paymentLabel =
    order.paymentMethod === "transfer-test"
      ? "Transferencia sintética de prueba"
      : order.paymentMethod === "transfer"
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

  const quote = remote.shippingQuote as { status?: string; version?: number; amount?: { amount?: number; currency?: string } } | undefined;
  const total = remote.total as { amount?: number; currency?: string } | undefined;
  const totalIsDefinitive = quote?.status === "ACCEPTED" && typeof total?.amount === "number";
  const displayedTotal = (totalIsDefinitive ? total?.amount : order.total) ?? order.total;

  const whatsappMessage =
    `🛍️✨ ¡Hola, FLOES.ec! Acabo de registrar el pedido ${order.id}. ` +
    `Soy ${order.customer.firstName} ${order.customer.lastName}. ` +
    `Productos: ${itemsSummary}. ` +
    `${totalIsDefinitive ? `Total definitivo: $${displayedTotal.toFixed(2)} ${total?.currency ?? ""}. ` : `Total provisional de productos (envío pendiente): $${displayedTotal.toFixed(2)}. `}` +
    `Entrega: ${order.shipping.city}, ${order.shipping.province}. ` +
    `Forma de pago: ${paymentLabel}. ` +
    `¿Me ayudan a confirmar el pedido y la cotización de entrega? 💜`;

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
        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
        <section className="order-success-grid" aria-live="polite">
          <div><span>Envío</span><strong>{quote?.status === "ACCEPTED" ? `$${(quote.amount?.amount ?? 0).toFixed(2)} aceptado` : quote?.status === "QUOTED" ? `$${(quote.amount?.amount ?? 0).toFixed(2)} · pendiente de aceptación` : "Cotización pendiente de Owner"}</strong></div>
          <div><span>Total Chopify</span><strong>{quote?.status === "ACCEPTED" && typeof total?.amount === "number" ? `$${total.amount.toFixed(2)} ${total.currency ?? ""}` : "Provisional · productos únicamente"}</strong></div>
        </section>
        {quote?.status === "QUOTED" && <button type="button" className="order-success-shop" disabled={busy} onClick={() => void acceptQuote()}>{busy ? "Procesando…" : `Aceptar envío · $${(quote.amount?.amount ?? 0).toFixed(2)}`}</button>}
        {quote?.status === "REQUESTED" && <button type="button" className="order-success-shop" disabled={busy} onClick={() => void refresh()}>{busy ? "Actualizando…" : "Actualizar cotización de envío"}</button>}
        {quote?.status === "ACCEPTED" && order.paymentMethod === "transfer-test" && <section className="order-success-grid"><div><span>Instrucciones sintéticas</span><strong>No realices transferencias. No existe una cuenta bancaria.</strong></div><button type="button" className="order-success-shop" disabled={busy || remote.paymentStatus === "pending_review" || remote.paymentStatus === "approved"} onClick={() => void submitSyntheticProof()}>{busy ? "Registrando…" : remote.paymentStatus === "pending_review" ? "Comprobante en revisión Owner" : "Adjuntar comprobante ficticio"}</button></section>}

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
              {totalIsDefinitive ? "Total definitivo" : "Total provisional"}
            </span>

            <strong>
              $
              {displayedTotal.toFixed(
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
