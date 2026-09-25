import { useState } from "react";
import {
  FileSpreadsheet,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useProductStore } from "../../store/productStore";

import {
  deleteRemoteProduct,
  saveRemoteProduct,
  updateProductEntity,
} from "../../services/firebase/productRepository";

import {
  getInventoryValue,
  getProductMargin,
  getProductProfit,
  getProductRealCost,
  getStockStatus,
} from "../../utils/productMetrics";

import { AdminDialog } from "../components/AdminDialog";
import { AdminSectionHeader } from "../components/AdminSectionHeader";
import { ProductImporter } from "../components/ProductImporter";
import { money, number } from "../components/format";
import { errorText } from "../components/operationFormat";

import {
  DataTable,
  EmptyState,
  ErrorMessage,
  Field,
  OperationStats,
  Status,
} from "../components/OperationsUI";

export function AdminProducts() {
  const products = useProductStore(
    (state) => state.products,
  );

  const upsertRemoteProduct = useProductStore(
    (state) => state.upsertRemoteProduct,
  );

  const removeRemoteProduct = useProductStore(
    (state) => state.removeRemoteProduct,
  );

  const [error, setError] = useState("");
  const [showImporter, setShowImporter] =
    useState(false);

  const [query, setQuery] = useState("");
  const [category, setCategory] =
    useState("");
  const [state, setState] =
    useState("");

  const [deleting, setDeleting] =
    useState<string | null>(null);

  const [busyId, setBusyId] =
    useState<string | null>(null);

  const visible = products.filter(
    (product) =>
      `${product.name} ${product.sku} ${product.brand}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (
        !category ||
        product.category === category
      ) &&
      (
        !state ||
        product.active ===
          (state === "active")
      ),
  );

  const toggleActive = async (
    productId: string,
  ) => {
    const product =
      useProductStore
        .getState()
        .products.find(
          (current) =>
            current.id === productId,
        );

    if (!product) {
      setError(
        "Modelo no encontrado.",
      );
      return;
    }

    setBusyId(productId);
    setError("");

    try {
      const updated =
        updateProductEntity(
          product,
          {
            active:
              !product.active,
          },
        );

      await saveRemoteProduct(
        updated,
      );

      upsertRemoteProduct(
        updated,
      );
    } catch (err) {
      setError(
        errorText(err),
      );
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete =
    async () => {
      if (!deleting) {
        return;
      }

      const product =
        useProductStore
          .getState()
          .products.find(
            (current) =>
              current.id ===
              deleting,
          );

      if (!product) {
        setDeleting(null);
        setError(
          "Modelo no encontrado.",
        );
        return;
      }

      setBusyId(
        product.id,
      );
      setError("");

      try {
        /*
         * Conservamos la restricción
         * del dominio local de pedidos.
         *
         * deleteProduct valida si el
         * producto puede eliminarse.
         *
         * Si Firebase falla,
         * restauramos el producto
         * en Zustand.
         */
        useProductStore
          .getState()
          .deleteProduct(
            product.id,
          );

        try {
          await deleteRemoteProduct(
            product.id,
          );
        } catch (remoteError) {
          upsertRemoteProduct(
            product,
          );

          throw remoteError;
        }

        removeRemoteProduct(
          product.id,
        );

        setDeleting(null);
      } catch (err) {
        setError(
          errorText(err),
        );
      } finally {
        setBusyId(null);
      }
    };

  return (
    <>
      <AdminSectionHeader
        eyebrow="ADMIN / CATÁLOGO"
        title="Modelos"
        description="Gestiona catálogo, precios, costos, stock y rentabilidad de cada modelo."
        action={
          <div className="admin-row-actions">
            <button
              className="admin-button"
              type="button"
              onClick={() =>
                setShowImporter(
                  (value) =>
                    !value,
                )
              }
            >
              <FileSpreadsheet
                size={16}
              />
              Importar modelos
            </button>

            <Link
              className="admin-button admin-button-primary"
              to="/admin/productos/nuevo"
            >
              <Plus size={16} />
              Nuevo modelo
            </Link>
          </div>
        }
      />

      {showImporter && (
        <ProductImporter
          onClose={() =>
            setShowImporter(
              false,
            )
          }
        />
      )}

      <ErrorMessage
        message={error}
      />

      <OperationStats
        items={[
          {
            label:
              "Modelos totales",
            value: String(
              products.length,
            ),
          },
          {
            label: "Activos",
            value: String(
              products.filter(
                (product) =>
                  product.active,
              ).length,
            ),
          },
          {
            label: "Stock bajo",
            value: String(
              products.filter(
                (product) =>
                  getStockStatus(
                    product,
                  ) === "Bajo",
              ).length,
            ),
          },
          {
            label:
              "Valor inventario",
            value: money(
              products.reduce(
                (
                  sum,
                  product,
                ) =>
                  sum +
                  getInventoryValue(
                    product,
                  ),
                0,
              ),
            ),
          },
        ]}
      />

      <section className="admin-card">
        <div className="admin-toolbar">
          <Field label="Buscar modelos">
            <input
              type="search"
              placeholder="Nombre, SKU o marca"
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target
                    .value,
                )
              }
            />
          </Field>

          <Field label="Categoría">
            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target
                    .value,
                )
              }
            >
              <option value="">
                Todas las categorías
              </option>

              {[
                ...new Set(
                  products.map(
                    (product) =>
                      product.category,
                  ),
                ),
              ].map((item) => (
                <option
                  key={item}
                >
                  {item}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Estado">
            <select
              value={state}
              onChange={(event) =>
                setState(
                  event.target
                    .value,
                )
              }
            >
              <option value="">
                Todos
              </option>

              <option value="active">
                Activos
              </option>

              <option value="inactive">
                Inactivos
              </option>
            </select>
          </Field>
        </div>

        <DataTable
          columns={[
            "Modelo",
            "SKU",
            "Categoría",
            "Stock",
            "Costo real",
            "Precio",
            "Utilidad",
            "Margen",
            "Estado",
            "Acciones",
          ]}
        >
          {visible.map(
            (product) => (
              <tr
                key={product.id}
              >
                <th scope="row">
                  <Link
                    to={`/admin/productos/${product.id}`}
                  >
                    {product.name}
                  </Link>
                </th>

                <td>
                  {product.sku}
                </td>

                <td>
                  {product.category}
                </td>

                <td>
                  {product.stock}
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
                    product.price,
                  )}
                </td>

                <td>
                  {money(
                    getProductProfit(
                      product,
                    ),
                  )}
                </td>

                <td>
                  {number(
                    getProductMargin(
                      product,
                    ),
                  )}
                  %
                </td>

                <td>
                  <Status>
                    {product.active
                      ? "Activo"
                      : "Inactivo"}
                  </Status>
                </td>

                <td>
                  <div className="admin-row-actions">
                    <Link
                      to={`/admin/productos/${product.id}`}
                    >
                      Editar
                    </Link>

                    <button
                      type="button"
                      disabled={
                        busyId ===
                        product.id
                      }
                      onClick={() => {
                        void toggleActive(
                          product.id,
                        );
                      }}
                    >
                      {busyId ===
                      product.id
                        ? "Guardando..."
                        : product.active
                          ? "Desactivar"
                          : "Activar"}
                    </button>

                    <button
                      type="button"
                      className="admin-danger-link"
                      disabled={
                        busyId ===
                        product.id
                      }
                      onClick={() =>
                        setDeleting(
                          product.id,
                        )
                      }
                    >
                      Eliminar
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

      {deleting && (
        <AdminDialog
          title="Eliminar modelo"
          onClose={() => {
            if (!busyId) {
              setDeleting(null);
            }
          }}
        >
          <p>
            ¿Eliminar{" "}
            {
              products.find(
                (product) =>
                  product.id ===
                  deleting,
              )?.name
            }
            ? Esta acción eliminará
            también su publicación
            del catálogo.
          </p>

          <div className="admin-form-actions">
            <button
              className="admin-button"
              type="button"
              disabled={
                Boolean(busyId)
              }
              onClick={() =>
                setDeleting(null)
              }
            >
              Conservar modelo
            </button>

            <button
              className="admin-button admin-button-danger"
              type="button"
              disabled={
                Boolean(busyId)
              }
              onClick={() => {
                void confirmDelete();
              }}
            >
              {busyId
                ? "Eliminando..."
                : "Eliminar modelo"}
            </button>
          </div>
        </AdminDialog>
      )}
    </>
  );
}
