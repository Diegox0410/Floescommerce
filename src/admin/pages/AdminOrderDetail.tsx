import {
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import type {
  OrderStatus,
  PaymentStatus,
} from "../../types/order";

import {
  useOrderStore,
} from "../../store/orderStore";

import {
  orderStatusLabels,
  paymentStatusLabels,
} from "../../utils/orderMetrics";

import {
  AdminSectionHeader,
} from "../components/AdminSectionHeader";

import {
  Field,
  DataTable,
  EmptyState,
  DetailBack,
  ErrorMessage,
} from "../components/OperationsUI";

import {
  errorText,
  dateTime,
} from "../components/operationFormat";

import {
  InternalNotes,
} from "../components/InternalNotes";

import {
  AdminDialog,
} from "../components/AdminDialog";

import {
  money,
} from "../components/format";

export function AdminOrderDetail() {
  const { id } =
    useParams();

  const order =
    useOrderStore(
      (state) =>
        state.orders.find(
          (current) =>
            current.id === id,
        ),
    );

  const updateStatus =
    useOrderStore(
      (state) =>
        state.updateOrderStatus,
    );

  const updatePayment =
    useOrderStore(
      (state) =>
        state.updatePaymentStatus,
    );

  const addNote =
    useOrderStore(
      (state) =>
        state.addOrderNote,
    );

  const [error, setError] =
    useState("");

  const [
    cancelling,
    setCancelling,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  if (!order) {
    return (
      <EmptyState
        title="Pedido no encontrado"
        description="Vuelve a Pedidos para seleccionar otro registro."
      />
    );
  }

  const changeStatus =
    async (
      status: OrderStatus,
    ) => {
      if (saving) {
        return false;
      }

      setSaving(true);
      setError("");

      try {
        await updateStatus(
          order.id,
          status,
        );

        return true;
      } catch (err) {
        setError(
          errorText(err),
        );

        return false;
      } finally {
        setSaving(false);
      }
    };

  const changePayment =
    async (
      status: PaymentStatus,
    ) => {
      if (saving) {
        return;
      }

      setSaving(true);
      setError("");

      try {
        await updatePayment(
          order.id,
          status,
        );
      } catch (err) {
        setError(
          errorText(err),
        );
      } finally {
        setSaving(false);
      }
    };

  const saveNote =
    async (
      value: string,
    ) => {
      if (saving) {
        return;
      }

      setSaving(true);
      setError("");

      try {
        await addNote(
          order.id,
          value,
        );
      } catch (err) {
        setError(
          errorText(err),
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <>
      <DetailBack
        to="/admin/pedidos"
        label="Pedidos"
      />

      <AdminSectionHeader
        eyebrow="ADMIN / PEDIDOS"
        title={order.id}
        description={`Registrado ${dateTime(order.createdAt)}`}
      />

      <div className="admin-detail-grid">
        <section className="admin-card admin-form-section">
          <h2>Cliente</h2>

          <p>
            {order.customer.firstName}{" "}
            {order.customer.lastName}
          </p>

          <p>
            {order.customer.phone}
          </p>

          <p>
            {order.customer.email}
          </p>

          {order.customerId && (
            <Link
              className="admin-text-link"
              to={`/admin/clientes/${order.customerId}`}
            >
              Abrir perfil del cliente →
            </Link>
          )}
        </section>

        <section className="admin-card admin-form-section">
          <h2>Entrega</h2>

          <p>
            {order.shipping.province}
            {" · "}
            {order.shipping.city}
          </p>

          <p>
            {order.shipping.address}
          </p>

          <p>
            {order.shipping.reference ||
              "Sin referencia adicional"}
          </p>
        </section>

        <section className="admin-card admin-form-section">
          <h2>
            Estado del pedido
          </h2>

          <Field label="Estado pedido">
            <select
              value={
                order.orderStatus
              }
              disabled={
                saving ||
                order.orderStatus ===
                  "cancelled"
              }
              onChange={(
                event,
              ) => {
                const status =
                  event.target
                    .value as OrderStatus;

                if (
                  status ===
                  "cancelled"
                ) {
                  setCancelling(
                    true,
                  );
                  return;
                }

                void changeStatus(
                  status,
                );
              }}
            >
              {Object.entries(
                orderStatusLabels,
              ).map(
                ([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                ),
              )}
            </select>
          </Field>

          <p className="admin-footnote">
            {saving
              ? "Guardando cambios..."
              : order.inventoryCommitted
                ? "Stock descontado. La cancelación lo repondrá una sola vez."
                : "Stock sin comprometer. Se descuenta al confirmar."}
          </p>

          <ErrorMessage
            message={error}
          />
        </section>

        <section className="admin-card admin-form-section">
          <h2>Pago</h2>

          <p>
            {order.paymentMethod ===
            "transfer"
              ? "Transferencia"
              : order.paymentMethod ===
                  "cash"
                ? "Efectivo"
                : "Coordinación por WhatsApp (histórico)"}
          </p>

          <Field label="Estado pago">
            <select
              value={
                order.paymentStatus
              }
              disabled={saving}
              onChange={(
                event,
              ) => {
                void changePayment(
                  event.target
                    .value as PaymentStatus,
                );
              }}
            >
              {Object.entries(
                paymentStatusLabels,
              ).map(
                ([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                ),
              )}
            </select>
          </Field>
        </section>
      </div>

      <section className="admin-card admin-history">
        <div className="admin-card-heading">
          <div>
            <h2>
              Productos del pedido
            </h2>

            <p>
              El precio corresponde al pedido y el costo administrativo se obtiene de los productos privados.
            </p>
          </div>
        </div>

        <DataTable
          columns={[
            "Producto",
            "SKU",
            "Cantidad",
            "Precio unitario",
            "Costo unitario",
            "Total",
          ]}
        >
          {order.items.map(
            (item, index) => (
              <tr
                key={`${item.productId}:${index}`}
              >
                <th scope="row">
                  {item.name}
                </th>

                <td>
                  {item.sku ||
                    "Sin SKU histórico"}
                </td>

                <td>
                  {item.quantity}
                </td>

                <td>
                  {money(
                    item.price,
                  )}
                </td>

                <td>
                  {money(
                    item.cost,
                  )}
                </td>

                <td>
                  {money(
                    item.price *
                      item.quantity,
                  )}
                </td>
              </tr>
            ),
          )}
        </DataTable>

        <dl className="admin-order-totals">
          {[
            [
              "Subtotal",
              money(
                order.subtotal,
              ),
            ],
            [
              "Envío",
              order.shippingCost ===
              null
                ? "Por confirmar"
                : money(
                    order.shippingCost,
                  ),
            ],
            [
              "Descuento",
              money(
                order.discount,
              ),
            ],
            [
              "Total provisional",
              money(order.total),
            ],
            [
              "Costo estimado",
              money(
                order.estimatedCost,
              ),
            ],
            [
              "Utilidad estimada",
              money(
                order.estimatedProfit,
              ),
            ],
          ].map(
            ([label, value]) => (
              <div key={label}>
                <dt>
                  {label}
                </dt>

                <dd>
                  {value}
                </dd>
              </div>
            ),
          )}
        </dl>
      </section>

      <InternalNotes
        notes={order.notes}
        onAdd={(value) => {
          void saveNote(value);
        }}
      />

      {cancelling && (
        <AdminDialog
          title="Cancelar pedido"
          onClose={() => {
            if (!saving) {
              setCancelling(
                false,
              );
            }
          }}
        >
          <p>
            ¿Cancelar{" "}
            {order.id}?{" "}
            {order.inventoryCommitted
              ? "El stock será repuesto una sola vez."
              : "No hay stock descontado que reponer."}{" "}
            Esta operación cierra el pedido.
          </p>

          <div className="admin-form-actions">
            <button
              type="button"
              className="admin-button"
              disabled={saving}
              onClick={() =>
                setCancelling(
                  false,
                )
              }
            >
              Conservar pedido
            </button>

            <button
              type="button"
              className="admin-button admin-button-danger"
              disabled={saving}
              onClick={async () => {
                const success =
                  await changeStatus(
                    "cancelled",
                  );

                if (success) {
                  setCancelling(
                    false,
                  );
                }
              }}
            >
              {saving
                ? "Cancelando..."
                : "Cancelar pedido"}
            </button>
          </div>
        </AdminDialog>
      )}
    </>
  );
}
