import {
  useEffect,
  useState,
} from "react";

import type {
  MovementType,
} from "../../types/inventory";

import {
  useProductStore,
} from "../../store/productStore";

import {
  useInventoryStore,
} from "../../store/inventoryStore";

import {
  getInventoryValue,
  getProductRealCost,
  getStockStatus,
} from "../../utils/productMetrics";

import {
  AdminSectionHeader,
} from "../components/AdminSectionHeader";

import {
  DataTable,
  EmptyState,
  ErrorMessage,
  Field,
  OperationStats,
  Status,
} from "../components/OperationsUI";

import {
  dateTime,
} from "../components/operationFormat";

import {
  StockMovementDialog,
} from "../components/StockMovementDialog";

import {
  money,
} from "../components/format";

const movementNames: Record<
  MovementType,
  string
> = {
  in: "Entrada",
  out: "Salida",
  adjustment: "Ajuste",
};

export function AdminInventory() {
  const products =
    useProductStore(
      (state) =>
        state.products,
    );

  const movements =
    useInventoryStore(
      (state) =>
        state.movements,
    );

  const remoteLoading =
    useInventoryStore(
      (state) =>
        state.remoteLoading,
    );

  const remoteReady =
    useInventoryStore(
      (state) =>
        state.remoteReady,
    );

  const remoteError =
    useInventoryStore(
      (state) =>
        state.remoteError,
    );

  const loadRemoteMovements =
    useInventoryStore(
      (state) =>
        state.loadRemoteMovements,
    );

  const [
    query,
    setQuery,
  ] = useState("");

  const [
    stockState,
    setStockState,
  ] = useState("");

  const [
    selected,
    setSelected,
  ] = useState<{
    id: string;
    type: MovementType;
  } | null>(null);

  useEffect(() => {
    /*
     * AdminInventory está dentro de:
     *
     * AdminAuthGuard
     *   ↓
     * AdminProductBootstrap
     *
     * Por tanto, cuando esta página
     * se monta el OWNER ya está
     * autenticado y los productos
     * privados ya están disponibles.
     */
    void loadRemoteMovements().catch(
      () => {
        /*
         * El error ya queda almacenado
         * en inventoryStore.
         */
      },
    );
  }, [loadRemoteMovements]);

  const visible =
    products.filter(
      (product) =>
        `${product.name} ${product.sku}`
          .toLowerCase()
          .includes(
            query.toLowerCase(),
          ) &&
        (
          !stockState ||
          getStockStatus(
            product,
          ) === stockState
        ),
    );

  const selectedProduct =
    products.find(
      (product) =>
        product.id ===
        selected?.id,
    );

  return (
    <>
      <AdminSectionHeader
        eyebrow="ADMIN / OPERACIONES"
        title="Inventario"
        description="Controla entradas, salidas, stock mínimo y valorización."
      />

      <ErrorMessage
        message={
          remoteError ?? ""
        }
      />

      <OperationStats
        items={[
          {
            label:
              "Unidades totales",
            value: String(
              products.reduce(
                (
                  total,
                  product,
                ) =>
                  total +
                  product.stock,
                0,
              ),
            ),
          },
          {
            label:
              "Valor inventario",
            value: money(
              products.reduce(
                (
                  total,
                  product,
                ) =>
                  total +
                  getInventoryValue(
                    product,
                  ),
                0,
              ),
            ),
          },
          {
            label:
              "Stock crítico",
            value: String(
              products.filter(
                (product) =>
                  getStockStatus(
                    product,
                  ) !== "Normal",
              ).length,
            ),
          },
          {
            label:
              "Agotados",
            value: String(
              products.filter(
                (product) =>
                  product.stock ===
                  0,
              ).length,
            ),
          },
        ]}
      />

      <section className="admin-card">
        <div className="admin-toolbar">
          <Field label="Buscar inventario">
            <input
              type="search"
              placeholder="Producto o SKU"
              value={query}
              onChange={(
                event,
              ) =>
                setQuery(
                  event.target
                    .value,
                )
              }
            />
          </Field>

          <Field label="Estado de stock">
            <select
              value={
                stockState
              }
              onChange={(
                event,
              ) =>
                setStockState(
                  event.target
                    .value,
                )
              }
            >
              <option value="">
                Todos
              </option>

              {[
                "Normal",
                "Bajo",
                "Agotado",
              ].map(
                (status) => (
                  <option
                    key={
                      status
                    }
                  >
                    {status}
                  </option>
                ),
              )}
            </select>
          </Field>
        </div>

        <DataTable
          columns={[
            "Producto",
            "SKU",
            "Stock",
            "Stock mínimo",
            "Costo unitario",
            "Valor inventario",
            "Estado",
            "Movimientos",
          ]}
        >
          {visible.map(
            (product) => (
              <tr
                key={
                  product.id
                }
              >
                <th scope="row">
                  {
                    product.name
                  }
                </th>

                <td>
                  {
                    product.sku
                  }
                </td>

                <td>
                  {
                    product.stock
                  }
                </td>

                <td>
                  {
                    product.minimumStock
                  }
                </td>

                <td>
                  {money(
                    getProductRealCost(
                      product,
                    ),
                  )}
                </td>

                <td>
                  {money(
                    getInventoryValue(
                      product,
                    ),
                  )}
                </td>

                <td>
                  <Status>
                    {getStockStatus(
                      product,
                    )}
                  </Status>
                </td>

                <td>
                  <div className="admin-row-actions">
                    <button
                      type="button"
                      disabled={
                        remoteLoading
                      }
                      onClick={() =>
                        setSelected(
                          {
                            id:
                              product.id,
                            type:
                              "in",
                          },
                        )
                      }
                    >
                      + Entrada
                    </button>

                    <button
                      type="button"
                      disabled={
                        remoteLoading
                      }
                      onClick={() =>
                        setSelected(
                          {
                            id:
                              product.id,
                            type:
                              "out",
                          },
                        )
                      }
                    >
                      − Salida
                    </button>

                    <button
                      type="button"
                      disabled={
                        remoteLoading
                      }
                      onClick={() =>
                        setSelected(
                          {
                            id:
                              product.id,
                            type:
                              "adjustment",
                          },
                        )
                      }
                    >
                      Ajuste manual
                    </button>
                  </div>
                </td>
              </tr>
            ),
          )}
        </DataTable>

        {!visible.length && (
          <EmptyState />
        )}
      </section>

      <section className="admin-card admin-history">
        <div className="admin-card-heading">
          <div>
            <h2>
              Historial de movimientos
            </h2>

            <p>
              Cada cambio de stock,
              con su motivo.
            </p>
          </div>

          <div>
            {remoteLoading
              ? "Sincronizando..."
              : remoteReady
                ? "Firebase"
                : "Sin sincronizar"}
          </div>
        </div>

        <DataTable
          columns={[
            "Fecha",
            "Producto",
            "Tipo",
            "Cantidad",
            "Stock anterior",
            "Stock nuevo",
            "Motivo",
          ]}
        >
          {movements.map(
            (movement) => (
              <tr
                key={
                  movement.id
                }
              >
                <td>
                  {dateTime(
                    movement.createdAt,
                  )}
                </td>

                <th scope="row">
                  {
                    movement.productName
                  }
                </th>

                <td>
                  {
                    movementNames[
                      movement.type
                    ]
                  }
                </td>

                <td>
                  {
                    movement.quantity
                  }
                </td>

                <td>
                  {
                    movement.previousStock
                  }
                </td>

                <td>
                  {
                    movement.newStock
                  }
                </td>

                <td>
                  {
                    movement.reason
                  }
                </td>
              </tr>
            ),
          )}
        </DataTable>

        {!remoteLoading &&
          !movements.length && (
            <EmptyState
              title="Aún no hay movimientos"
              description="Las entradas, salidas y confirmaciones de pedidos aparecerán aquí."
            />
          )}
      </section>

      {selected &&
        selectedProduct && (
          <StockMovementDialog
            product={
              selectedProduct
            }
            type={
              selected.type
            }
            onClose={() =>
              setSelected(
                null,
              )
            }
          />
        )}
    </>
  );
}