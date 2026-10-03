import { useCallback, useEffect, useState } from "react";
import { Banknote, PackageCheck, Receipt, Truck } from "lucide-react";

import { ownerOperation } from "../../services/chopify/owner";
import { record, text } from "../../utils/normalization";
import { AdminSectionHeader } from "./AdminSectionHeader";
import { AdminStatCard } from "./AdminStatCard";

interface OwnerDashboard {
  orders: number;
  paymentsToVerify: number;
  ordersToPrepare: number;
  readyToDispatch: number;
  managedRevenueBaseCents: number;
  managementFeesCents: number | null;
}

interface OwnerOrder {
  id: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  grandTotalCents: number;
  currency: string;
  customerName: string;
}

interface PaymentReview {
  proofId: string;
  paymentId: string;
  orderId: string;
}

const numeric = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value)
    ? value
    : 0;

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
    orders: numeric(item.orders),
    paymentsToVerify:
      numeric(item.paymentsToVerify),
    ordersToPrepare:
      numeric(item.ordersToPrepare),
    readyToDispatch:
      numeric(item.readyToDispatch),
    managedRevenueBaseCents:
      numeric(item.managedRevenueBaseCents),
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
          numeric(item.grandTotalCents),
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
      };
    })
    .filter(
      (review) =>
        review.proofId &&
        review.paymentId &&
        review.orderId,
    );

export function ChopifyOperationsPanel() {
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
                value={String(
                  dashboard.orders,
                )}
                icon={Receipt}
                helper="Pedidos persistidos en Chopify"
              />

              <AdminStatCard
                label="Pagos por revisar"
                value={String(
                  dashboard.paymentsToVerify,
                )}
                icon={Banknote}
                helper="Requieren verificación humana"
              />

              <AdminStatCard
                label="Por preparar"
                value={String(
                  dashboard.ordersToPrepare,
                )}
                icon={PackageCheck}
                helper="Pago aprobado y sin preparar"
              />

              <AdminStatCard
                label="Listos para despacho"
                value={String(
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
                  {money(
                    dashboard.managedRevenueBaseCents,
                  )}
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

        {!reviews.length ? (
          <p>
            No hay comprobantes pendientes de revisión.
          </p>
        ) : (
          reviews.map(
            (review) => (
              <div
                key={
                  review.proofId
                }
                className="admin-toolbar"
              >
                <strong>
                  {
                    review.orderId
                  }
                </strong>

                <span>
                  Comprobante{" "}
                  {
                    review.proofId
                  }
                </span>

                <button
                  type="button"
                  className="admin-button"
                  disabled={
                    working ===
                    review.orderId
                  }
                  onClick={() =>
                    void reviewPayment(
                      review,
                      true,
                    )
                  }
                >
                  Aprobar pago verificado
                </button>

                <button
                  type="button"
                  className="admin-button"
                  disabled={
                    working ===
                    review.orderId
                  }
                  onClick={() =>
                    void reviewPayment(
                      review,
                      false,
                    )
                  }
                >
                  Rechazar comprobante
                </button>
              </div>
            ),
          )
        )}
      </section>

      <section className="admin-card admin-module">
        <h2>
          Cola operativa
        </h2>

        {!orders.length &&
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
                {orders.map(
                  (order) => (
                    <tr
                      key={
                        order.id
                      }
                    >
                      <th scope="row">
                        {
                          order.id
                        }
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
                        {money(
                          order.grandTotalCents,
                          order.currency,
                        )}
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
