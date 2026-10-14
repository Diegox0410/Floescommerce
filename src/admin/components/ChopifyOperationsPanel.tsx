import { useCallback, useEffect, useRef, useState } from "react";
import { Banknote, PackageCheck, Receipt, Truck } from "lucide-react";
import { Link } from "react-router-dom";

import { loadPaymentProof, ownerOperation } from "../../services/chopify/owner";
import { record, text } from "../../utils/normalization";
import { AdminSectionHeader } from "./AdminSectionHeader";
import { AdminStatCard } from "./AdminStatCard";

interface OwnerDashboard {
  orders: number | null;
  paymentsToVerify: number | null;
  ordersToPrepare: number | null;
  readyToDispatch: number | null;
  managedRevenueBaseCents: number | null;
  managementFeesCents: number | null;
}

interface OwnerOrder {
  id: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  grandTotalCents: number | null;
  currency: string;
  customerName: string;
}

interface PaymentReview {
  proofId: string;
  paymentId: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  operationReference: string;
  proofType: string;
  proofStatus: string;
  paymentStatus: string;
  orderStatus: string;
  submittedAt: string;
  totalCents: number | null;
  currency: string;
  items: Array<{ productName: string; variantName: string; size: string; quantity: number }>;
}

interface ProofAsset { url: string; contentType: string }

const numeric = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value)
    ? value
    : 0;

const reportedNumber = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : null;
const countLabel = (value: number | null) => value === null ? "No informado" : String(value);

const money = (
  cents: number,
  currency = "USD",
) =>
  new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency,
  }).format(cents / 100);

const mapDashboard = (
  value: unknown,
): OwnerDashboard => {
  const item = record(value);

  return {
    orders: reportedNumber(item.orders),
    paymentsToVerify:
      reportedNumber(item.paymentsToVerify),
    ordersToPrepare:
      reportedNumber(item.ordersToPrepare),
    readyToDispatch:
      reportedNumber(item.readyToDispatch),
    managedRevenueBaseCents:
      reportedNumber(item.managedRevenueBaseCents),
    managementFeesCents:
      typeof item.managementFeesCents === "number"
        ? item.managementFeesCents
        : null,
  };
};

const mapOrders = (
  value: unknown,
): OwnerOrder[] =>
  (Array.isArray(value) ? value : [])
    .map((entry) => {
      const item = record(entry);
      const customer =
        record(item.customer);

      return {
        id: text(item.id),
        paymentStatus:
          text(item.paymentStatus),
        fulfillmentStatus:
          text(item.fulfillmentStatus),
        grandTotalCents:
          reportedNumber(item.grandTotalCents),
        currency:
          text(item.currency, "USD"),
        customerName:
          text(customer.name, "Cliente"),
      };
    })
    .filter((order) => order.id);

const mapReviews = (
  value: unknown,
): PaymentReview[] =>
  (Array.isArray(value) ? value : [])
    .map((entry) => {
      const item = record(entry);
      const proof =
        record(item.proof);
      const payment =
        record(item.payment);
      const order =
        record(item.order);
      const customer = record(item.customer);
      const items = Array.isArray(order.items) ? order.items.map(record).map((orderItem) => ({
        productName: text(orderItem.productName, "Producto"),
        variantName: text(orderItem.variantName),
        size: text(orderItem.size),
        quantity: numeric(orderItem.quantity),
      })) : [];

      return {
        proofId:
          text(proof.id),
        paymentId:
          text(
            payment.id,
            text(proof.paymentId),
          ),
        orderId:
          text(
            order.id,
            text(proof.orderId),
          ),
        customerName: text(customer.name, "Cliente"),
        customerPhone: text(customer.phone, "Número no informado"),
        operationReference: text(proof.reference, "No informado"),
        proofType: text(proof.type, "No informado"),
        proofStatus: text(proof.status, "No informado"),
        paymentStatus: text(payment.status, "No informado"),
        orderStatus: text(order.fulfillmentStatus, "No informado"),
        submittedAt: text(proof.submittedAt, "Fecha no informada"),
        totalCents: typeof order.grandTotalCents === "number" ? order.grandTotalCents : null,
        currency: text(order.currency, "USD"),
        items,
      };
    })
    .filter(
      (review) =>
        review.proofId &&
        review.paymentId &&
        review.orderId,
    );

export function ChopifyOperationsPanel({ orderId, onChanged }: { orderId?: string; onChanged?: () => void } = {}) {
  const [dashboard, setDashboard] =
    useState<OwnerDashboard | null>(null);

  const [orders, setOrders] =
    useState<OwnerOrder[]>([]);

  const [reviews, setReviews] =
    useState<PaymentReview[]>([]);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [working, setWorking] =
    useState("");

  const [proofAssets, setProofAssets] = useState<Record<string, ProofAsset>>({});
  const [proofErrors, setProofErrors] = useState<Record<string, string>>({});
  const proofObjectUrls = useRef<string[]>([]);
  const displayedOrders = orderId ? orders.filter((order) => order.id === orderId) : orders;
  const displayedReviews = orderId ? reviews.filter((review) => review.orderId === orderId) : reviews;

  useEffect(() => () => {
    proofObjectUrls.current.forEach(URL.revokeObjectURL);
  }, []);

  const load = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const [
          dashboardData,
          orderData,
          reviewData,
        ] = await Promise.all([
          ownerOperation(
            "ownerDashboard",
          ),
          ownerOperation(
            "listOrders",
          ),
          ownerOperation(
            "listPaymentReviews",
          ),
        ]);

        setDashboard(
          mapDashboard(
            dashboardData,
          ),
        );

        setOrders(
          mapOrders(
            orderData,
          ),
        );

        setReviews(
          mapReviews(
            reviewData,
          ),
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar Chopify.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const frame =
      window.requestAnimationFrame(
        () => {
          void load();
        },
      );

    return () =>
      window.cancelAnimationFrame(
        frame,
      );
  }, [load]);

  const transition = async (
    operation: string,
    orderId: string,
  ) => {
    let input:
      Record<string, unknown> = {
        orderId,
      };

    if (
      operation ===
      "dispatchOrder"
    ) {
      const courier =
        window
          .prompt(
            "Transportista / courier:",
          )
          ?.trim() ?? "";

      if (!courier) return;

      const trackingCode =
        window
          .prompt(
            "Número de guía / tracking:",
          )
          ?.trim() ?? "";

      if (!trackingCode) return;

      input = {
        orderId,
        courier,
        trackingCode,
      };
    }

    if (
      !window.confirm(
        "Confirma que deseas registrar esta transición operativa en Chopify.",
      )
    ) {
      return;
    }

    setWorking(orderId);
    setError("");

    try {
      await ownerOperation(
        operation,
        input,
        true,
      );

      await load();
      onChanged?.();
    } catch (operationError) {
      setError(
        operationError instanceof Error
          ? operationError.message
          : "No se pudo actualizar el pedido.",
      );
    } finally {
      setWorking("");
    }
  };

  const reviewPayment = async (
    review: PaymentReview,
    approve: boolean,
  ) => {
    const reason =
      approve
        ? ""
        : window
            .prompt(
              "Motivo del rechazo del comprobante:",
            )
            ?.trim() ?? "";

    if (
      !approve &&
      !reason
    ) {
      return;
    }

    if (
      approve &&
      !window.confirm(
        "Confirma únicamente si verificaste que el dinero llegó. Esta acción aprobará el pago en Chopify.",
      )
    ) {
      return;
    }

    setWorking(
      review.orderId,
    );
    setError("");

    try {
      await ownerOperation(
        approve
          ? "approvePayment"
          : "rejectPaymentProof",
        {
          paymentId:
            review.paymentId,
          proofId:
            review.proofId,
          ...(reason
            ? { reason }
            : {}),
        },
        true,
      );

      await load();
      onChanged?.();
    } catch (operationError) {
      setError(
        operationError instanceof Error
          ? operationError.message
          : "No se pudo revisar el pago.",
      );
    } finally {
      setWorking("");
    }
  };

  const openProof = async (review: PaymentReview) => {
    if (proofAssets[review.proofId]) return;
    setWorking(`proof:${review.proofId}`);
    setProofErrors((previous) => ({ ...previous, [review.proofId]: "" }));
    try {
      const asset = await loadPaymentProof(review.proofId);
      proofObjectUrls.current.push(asset.url);
      setProofAssets((previous) => ({ ...previous, [review.proofId]: asset }));
    } catch (reason) {
      setProofErrors((previous) => ({ ...previous, [review.proofId]: reason instanceof Error ? reason.message : "No se pudo cargar el comprobante." }));
    } finally {
      setWorking("");
    }
  };

  return (
    <>
      <AdminSectionHeader
        eyebrow="OWNER / CHOPIFY"
        title="Centro operativo FLOES"
        description="Estado comercial autoritativo para tenant-floes. Los pagos no se aprueban automáticamente."
        action={
          <button
            type="button"
            className="admin-button"
            onClick={() =>
              void load()
            }
            disabled={loading}
          >
            Actualizar
          </button>
        }
      />

      {error && (
        <div
          className="admin-card admin-module"
          role="alert"
        >
          <strong>
            No se pudo cargar el estado operativo.
          </strong>
          <p>{error}</p>
        </div>
      )}

      {loading &&
      !dashboard ? (
        <div className="admin-card admin-module">
          <p>
            Cargando datos autorizados desde Chopify…
          </p>
        </div>
      ) : (
        dashboard && (
          <>
            <div className="admin-kpi-grid">
              <AdminStatCard
                label="Pedidos"
                value={countLabel(
                  dashboard.orders,
                )}
                icon={Receipt}
                helper="Pedidos persistidos en Chopify"
              />

              <AdminStatCard
                label="Pagos por revisar"
                value={countLabel(
                  dashboard.paymentsToVerify,
                )}
                icon={Banknote}
                helper="Requieren verificación humana"
              />

              <AdminStatCard
                label="Por preparar"
                value={countLabel(
                  dashboard.ordersToPrepare,
                )}
                icon={PackageCheck}
                helper="Pago aprobado y sin preparar"
              />

              <AdminStatCard
                label="Listos para despacho"
                value={countLabel(
                  dashboard.readyToDispatch,
                )}
                icon={Truck}
                helper="Esperan transición de despacho"
              />
            </div>

            <section className="admin-card admin-module">
              <h2>
                Resumen comercial
              </h2>

              <p>
                Base de ingresos gestionados:{" "}
                <strong>
                  {dashboard.managedRevenueBaseCents === null ? "No informado" : money(dashboard.managedRevenueBaseCents)}
                </strong>
              </p>

              <p>
                Honorarios de gestión:{" "}
                <strong>
                  {dashboard.managementFeesCents ===
                  null
                    ? "No disponible: falta acuerdo comercial"
                    : money(
                        dashboard.managementFeesCents,
                      )}
                </strong>
              </p>
            </section>
          </>
        )
      )}

      <section className="admin-card admin-module">
        <h2>
          Revisión de pagos
        </h2>

        {!displayedReviews.length ? (
          <p>
            No hay comprobantes pendientes de revisión.
          </p>
        ) : (
          displayedReviews.map((review) => (
            <article key={review.proofId} className="admin-card">
              <div className="admin-toolbar">
                <h3>Pedido {review.orderId}</h3>
                <strong>{review.customerName}</strong>
                <span>{review.customerPhone}</span>
              </div>
              <dl className="admin-toolbar">
                <div><dt>Operación</dt><dd>{review.operationReference}</dd></div>
                <div><dt>Productos</dt><dd>{review.items.length ? review.items.map((item) => `${item.productName}${item.variantName ? ` · ${item.variantName}` : ""}${item.size ? ` · ${item.size}` : ""} × ${item.quantity}`).join("; ") : "Detalle no informado"}</dd></div>
                <div><dt>Total</dt><dd>{review.totalCents === null ? "No informado" : money(review.totalCents, review.currency)}</dd></div>
                <div><dt>Comprobante</dt><dd>{review.proofType} · {review.proofId}</dd></div>
                <div><dt>Fecha</dt><dd>{review.submittedAt === "Fecha no informada" ? review.submittedAt : new Date(review.submittedAt).toLocaleString("es-EC")}</dd></div>
                <div><dt>Estados</dt><dd>Pago: {review.paymentStatus} · Comprobante: {review.proofStatus} · Operación: {review.orderStatus}</dd></div>
              </dl>
              <button type="button" className="admin-button" disabled={working === `proof:${review.proofId}`} onClick={() => void openProof(review)}>
                {proofAssets[review.proofId] ? "Comprobante cargado" : working === `proof:${review.proofId}` ? "Cargando comprobante…" : "Cargar comprobante privado"}
              </button>
              {proofErrors[review.proofId] && <p role="alert">{proofErrors[review.proofId]}</p>}
              {proofAssets[review.proofId] && <p><a href={proofAssets[review.proofId].url} target="_blank" rel="noreferrer">Abrir comprobante ({proofAssets[review.proofId].contentType})</a></p>}
              <p>El comprobante queda pendiente hasta que el Owner verifique el abono en su cuenta.</p>
              <div className="admin-toolbar">
                <button type="button" className="admin-button" disabled={working === review.orderId} onClick={() => void reviewPayment(review, true)}>Aprobar pago verificado</button>
                <button type="button" className="admin-button" disabled={working === review.orderId} onClick={() => void reviewPayment(review, false)}>Rechazar comprobante</button>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="admin-card admin-module">
        <h2>
          Cola operativa
        </h2>

        {!displayedOrders.length &&
        !loading ? (
          <p>
            No hay pedidos persistidos en Chopify.
          </p>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Pago</th>
                  <th>
                    Preparación
                  </th>
                  <th>Total</th>
                  <th>
                    Acción válida
                  </th>
                </tr>
              </thead>

              <tbody>
                {displayedOrders.map(
                  (order) => (
                    <tr
                      key={
                        order.id
                      }
                    >
                      <th scope="row">
                        <Link to={`/admin/pedidos/${encodeURIComponent(order.id)}`}>{order.id}</Link>
                      </th>

                      <td>
                        {
                          order.customerName
                        }
                      </td>

                      <td>
                        {
                          order.paymentStatus
                        }
                      </td>

                      <td>
                        {
                          order.fulfillmentStatus
                        }
                      </td>

                      <td>
                        {order.grandTotalCents === null ? "No informado" : money(order.grandTotalCents, order.currency)}
                      </td>

                      <td>
                        {order.paymentStatus ===
                          "PAID" &&
                          order.fulfillmentStatus ===
                            "UNFULFILLED" && (
                            <button
                              type="button"
                              className="admin-button"
                              disabled={
                                working ===
                                order.id
                              }
                              onClick={() =>
                                void transition(
                                  "startPreparation",
                                  order.id,
                                )
                              }
                            >
                              Iniciar preparación
                            </button>
                          )}

                        {order.fulfillmentStatus ===
                          "PREPARING" && (
                          <button
                            type="button"
                            className="admin-button"
                            disabled={
                              working ===
                              order.id
                            }
                            onClick={() =>
                              void transition(
                                "markReady",
                                order.id,
                              )
                            }
                          >
                            Marcar listo
                          </button>
                        )}

                        {order.fulfillmentStatus ===
                          "READY" && (
                          <button
                            type="button"
                            className="admin-button"
                            disabled={
                              working ===
                              order.id
                            }
                            onClick={() =>
                              void transition(
                                "dispatchOrder",
                                order.id,
                              )
                            }
                          >
                            Despachar
                          </button>
                        )}

                        {order.fulfillmentStatus ===
                          "DISPATCHED" && (
                          <button
                            type="button"
                            className="admin-button"
                            disabled={
                              working ===
                              order.id
                            }
                            onClick={() =>
                              void transition(
                                "markDelivered",
                                order.id,
                              )
                            }
                          >
                            Marcar entregado
                          </button>
                        )}

                        {order.paymentStatus !==
                          "PAID" && (
                          <span>
                            Esperando pago verificado
                          </span>
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
