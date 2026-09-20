import {
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  useCustomerStore,
} from "../../store/customerStore";

import {
  useOrderStore,
} from "../../store/orderStore";

import {
  getCustomerOrders,
  getCustomerMetrics,
  orderStatusLabels,
} from "../../utils/orderMetrics";

import {
  AdminSectionHeader,
} from "../components/AdminSectionHeader";

import {
  OperationStats,
  Field,
  DataTable,
  EmptyState,
  DetailBack,
  Status,
  ErrorMessage,
} from "../components/OperationsUI";

import {
  dateTime,
  errorText,
} from "../components/operationFormat";

import {
  InternalNotes,
} from "../components/InternalNotes";

import {
  money,
} from "../components/format";

export function AdminCustomerDetail() {
  const { id } =
    useParams();

  const customer =
    useCustomerStore(
      (state) =>
        state.customers.find(
          (current) =>
            current.id === id,
        ),
    );

  const orders =
    useOrderStore(
      (state) =>
        state.orders,
    );

  const addTag =
    useCustomerStore(
      (state) =>
        state.addTag,
    );

  const removeTag =
    useCustomerStore(
      (state) =>
        state.removeTag,
    );

  const addNote =
    useCustomerStore(
      (state) =>
        state.addCustomerNote,
    );

  const [
    tag,
    setTag,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  if (!customer) {
    return (
      <EmptyState
        title="Cliente no encontrado"
        description="Vuelve a Clientes para seleccionar otro perfil."
      />
    );
  }

  const metrics =
    getCustomerMetrics(
      customer.id,
      orders,
    );

  const history =
    getCustomerOrders(
      customer.id,
      orders,
    );

  const saveTag =
    async () => {
      const clean =
        tag.trim();

      if (
        !clean ||
        saving
      ) {
        return;
      }

      setSaving(true);
      setError("");

      try {
        await addTag(
          customer.id,
          clean,
        );

        setTag("");
      } catch (err) {
        setError(
          errorText(err),
        );
      } finally {
        setSaving(false);
      }
    };

  const deleteTag =
    async (
      value: string,
    ) => {
      if (saving) {
        return;
      }

      setSaving(true);
      setError("");

      try {
        await removeTag(
          customer.id,
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
          customer.id,
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
        to="/admin/clientes"
        label="Clientes"
      />

      <AdminSectionHeader
        eyebrow="ADMIN / CLIENTES"
        title={`${customer.firstName} ${customer.lastName}`}
        description={`Cliente desde ${dateTime(customer.createdAt)}`}
      />

      <OperationStats
        items={[
          {
            label:
              "Pedidos",
            value:
              String(
                metrics.totalOrders,
              ),
          },
          {
            label:
              "Gasto total",
            value:
              money(
                metrics.totalSpent,
              ),
          },
          {
            label:
              "Ticket promedio",
            value:
              money(
                metrics.averageTicket,
              ),
          },
          {
            label:
              "Última compra",
            value:
              dateTime(
                metrics.lastOrderAt,
              ),
          },
        ]}
      />

      <div className="admin-detail-grid">
        <section className="admin-card admin-form-section">
          <h2>
            Contacto y ubicación
          </h2>

          <p>
            {customer.phone}
          </p>

          <p>
            {customer.email}
          </p>

          <p>
            {customer.province}
            {" · "}
            {customer.city}
          </p>

          <p>
            {customer.address}
          </p>
        </section>

        <section className="admin-card admin-form-section">
          <h2>
            Etiquetas
          </h2>

          <div className="admin-tags">
            {customer.tags.map(
              (currentTag) => (
                <span
                  key={
                    currentTag
                  }
                  className="admin-chip"
                >
                  {currentTag}

                  <button
                    type="button"
                    disabled={
                      saving
                    }
                    aria-label={`Quitar etiqueta ${currentTag}`}
                    onClick={() => {
                      void deleteTag(
                        currentTag,
                      );
                    }}
                  >
                    ×
                  </button>
                </span>
              ),
            )}
          </div>

          <form
            onSubmit={(
              event,
            ) => {
              event.preventDefault();

              void saveTag();
            }}
          >
            <Field label="Nueva etiqueta">
              <input
                required
                disabled={
                  saving
                }
                value={tag}
                onChange={(
                  event,
                ) =>
                  setTag(
                    event.target
                      .value,
                  )
                }
                placeholder="VIP, Frecuente, Seguimiento…"
              />
            </Field>

            <button
              type="submit"
              className="admin-button"
              disabled={
                saving
              }
            >
              {saving
                ? "Guardando..."
                : "Añadir etiqueta"}
            </button>
          </form>

          <ErrorMessage
            message={error}
          />
        </section>
      </div>

      <section className="admin-card admin-history">
        <div className="admin-card-heading">
          <div>
            <h2>
              Historial de pedidos
            </h2>

            <p>
              Incluye pedidos cancelados; las métricas los excluyen.
            </p>
          </div>
        </div>

        <DataTable
          columns={[
            "Pedido",
            "Fecha",
            "Estado",
            "Total",
            "Acciones",
          ]}
        >
          {history.map(
            (order) => (
              <tr
                key={
                  order.id
                }
              >
                <th scope="row">
                  {order.id}
                </th>

                <td>
                  {dateTime(
                    order.createdAt,
                  )}
                </td>

                <td>
                  <Status>
                    {
                      orderStatusLabels[
                        order
                          .orderStatus
                      ]
                    }
                  </Status>
                </td>

                <td>
                  {money(
                    order.total,
                  )}
                </td>

                <td>
                  <Link
                    className="admin-text-link"
                    to={`/admin/pedidos/${order.id}`}
                  >
                    Ver pedido →
                  </Link>
                </td>
              </tr>
            ),
          )}
        </DataTable>

        {!history.length && (
          <EmptyState />
        )}
      </section>

      <InternalNotes
        notes={
          customer.notes
        }
        onAdd={(
          value,
        ) => {
          void saveNote(
            value,
          );
        }}
      />
    </>
  );
}