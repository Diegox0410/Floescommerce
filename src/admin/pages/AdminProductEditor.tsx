import {
  useState,
  type FormEvent,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import type {
  ProductInput,
} from "../../types/product";

import { useProductStore } from "../../store/productStore";

import {
  createProductEntity,
  saveRemoteProduct,
  updateProductEntity,
} from "../../services/firebase/productRepository";

import {
  normalizeProduct,
  slugify,
} from "../../utils/normalization";

import {
  getProductRealCost,
  getProductProfit,
  getProductMargin,
  getInventoryValue,
  getPotentialRevenue,
  getPotentialProfit,
} from "../../utils/productMetrics";

import {
  AdminSectionHeader,
} from "../components/AdminSectionHeader";

import {
  Field,
  DetailBack,
  EmptyState,
  ErrorMessage,
} from "../components/OperationsUI";

import {
  errorText,
} from "../components/operationFormat";

import {
  money,
  number,
} from "../components/format";

export function AdminProductEditor() {
  const { id } = useParams();

  const product = useProductStore(
    (state) =>
      state.products.find(
        (current) =>
          current.id === id,
      ),
  );

  if (id && !product) {
    return (
      <EmptyState
        title="Producto no encontrado"
        description="Vuelve a Productos para seleccionar otro registro."
      />
    );
  }

  return (
    <ProductEditorForm
      key={id ?? "new"}
      id={id}
      initial={
        product ??
        normalizeProduct({
          active: true,
        })
      }
    />
  );
}

function ProductEditorForm({
  id,
  initial,
}: {
  id?: string;
  initial: ProductInput;
}) {
  const [form, setForm] =
    useState<ProductInput>({
      ...initial,

      name:
        id
          ? initial.name
          : "",

      sku:
        id
          ? initial.sku
          : "",

      brand:
        id
          ? initial.brand
          : "",

      category:
        id
          ? initial.category
          : "",

      description:
        id
          ? initial.description
          : "",
    });

  const [
    extraImages,
    setExtraImages,
  ] = useState(
    initial.images.join("\n"),
  );

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const navigate =
    useNavigate();

  const upsertRemoteProduct =
    useProductStore(
      (state) =>
        state.upsertRemoteProduct,
    );

  const updateField = <
    K extends keyof ProductInput,
  >(
    key: K,
    value: ProductInput[K],
  ) =>
    setForm((state) => ({
      ...state,
      [key]: value,
    }));

  const submit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");
    setSaving(true);

    try {
      const input: ProductInput = {
        ...form,

        name:
          form.name.trim(),

        sku:
          form.sku.trim(),

        category:
          form.category.trim() ||
          "Sin categoría",

        slug:
          form.slug.trim() ||
          slugify(
            form.name,
          ),

        images:
          extraImages
            .split(/\n|,/)
            .map(
              (value) =>
                value.trim(),
            )
            .filter(Boolean),
      };

      if (
        !input.name ||
        !input.sku
      ) {
        throw new Error(
          "Nombre y SKU son obligatorios.",
        );
      }

      for (const key of [
        "price",
        "productCost",
        "importCost",
        "otherCost",
        "stock",
        "minimumStock",
      ] as const) {
        if (
          !Number.isFinite(
            input[key],
          ) ||
          input[key] < 0
        ) {
          throw new Error(
            "Precios, costos y stock deben ser positivos o cero.",
          );
        }
      }

      if (
        !Number.isInteger(
          input.stock,
        ) ||
        !Number.isInteger(
          input.minimumStock,
        )
      ) {
        throw new Error(
          "El stock debe ser un número entero.",
        );
      }

      const currentProducts =
        useProductStore
          .getState()
          .products;

      const duplicateSku =
        currentProducts.some(
          (product) =>
            product.id !== id &&
            product.sku
              .trim()
              .toLowerCase() ===
              input.sku
                .trim()
                .toLowerCase(),
        );

      if (duplicateSku) {
        throw new Error(
          "El SKU ya existe.",
        );
      }

      const duplicateSlug =
        currentProducts.some(
          (product) =>
            product.id !== id &&
            product.slug ===
              input.slug,
        );

      if (duplicateSlug) {
        throw new Error(
          "El slug ya existe.",
        );
      }

      if (id) {
        const previous =
          currentProducts.find(
            (product) =>
              product.id === id,
          );

        if (!previous) {
          throw new Error(
            "Producto no encontrado.",
          );
        }

        /*
         * IMPORTANTE:
         *
         * Inventario todavía se migra
         * en el siguiente bloque.
         *
         * Por eso una edición general
         * no puede modificar stock
         * todavía.
         */
        const updated =
          updateProductEntity(
            previous,
            {
              ...input,
              stock:
                previous.stock,
            },
          );

        await saveRemoteProduct(
          updated,
        );

        upsertRemoteProduct(
          updated,
        );
      } else {
        const created =
          createProductEntity(
            input,
          );

        await saveRemoteProduct(
          created,
        );

        upsertRemoteProduct(
          created,
        );
      }

      navigate(
        "/admin/productos",
      );
    } catch (err) {
      setError(
        errorText(err),
      );
    } finally {
      setSaving(false);
    }
  };

  const numeric = (
    key:
      | "price"
      | "oldPrice"
      | "productCost"
      | "importCost"
      | "otherCost"
      | "stock"
      | "minimumStock",
    label: string,
  ) => (
    <Field label={label}>
      <input
        type="number"
        min="0"
        step={
          key === "stock" ||
          key ===
            "minimumStock"
            ? "1"
            : "0.01"
        }
        required={
          key !== "oldPrice"
        }
        value={
          form[key] ?? ""
        }
        onChange={(event) =>
          updateField(
            key,
            event.target.value ===
                "" &&
              key ===
                "oldPrice"
              ? undefined
              : Number(
                  event.target
                    .value,
                ),
          )
        }
      />
    </Field>
  );

  const textField = (
    key:
      | "name"
      | "sku"
      | "slug"
      | "brand"
      | "category"
      | "shortDescription"
      | "badge"
      | "image"
      | "barcode"
      | "sizeVolume",
    label: string,
  ) => (
    <Field label={label}>
      <input
        required={
          key === "name" ||
          key === "sku"
        }
        type={
          key === "image"
            ? "text"
            : "text"
        }
        value={
          form[key] ?? ""
        }
        onChange={(event) =>
          updateField(
            key,
            event.target.value,
          )
        }
      />
    </Field>
  );

  return (
    <>
      <DetailBack
        to="/admin/productos"
        label="Productos"
      />

      <AdminSectionHeader
        eyebrow="ADMIN / PRODUCTOS"
        title={
          id
            ? "Editar producto"
            : "Nuevo producto"
        }
        description="Cada detalle del catálogo, con su rentabilidad a la vista."
      />

      <form
        onSubmit={(event) => {
          void submit(event);
        }}
        className="admin-editor-layout"
      >
        <div className="admin-form-stack">
          <section className="admin-card admin-form-section">
            <h2>
              Información
            </h2>

            <div className="admin-form-grid">
              {textField(
                "name",
                "Nombre",
              )}

              {textField(
                "sku",
                "SKU",
              )}

              {textField(
                "slug",
                "Slug",
              )}

              {textField(
                "brand",
                "Marca",
              )}

              {textField(
                "category",
                "Categoría",
              )}

              {textField(
                "shortDescription",
                "Descripción corta",
              )}

              {textField(
                "barcode",
                "Código de barras (opcional)",
              )}

              {textField(
                "sizeVolume",
                "Tamaño / volumen (opcional)",
              )}

              <Field label="Peso (opcional)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.weight ??
                    ""
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "weight",
                      event.target
                        .value ===
                        ""
                        ? undefined
                        : Math.max(
                            0,
                            Number(
                              event
                                .target
                                .value,
                            ) ||
                              0,
                          ),
                    )
                  }
                />
              </Field>

              <Field label="Descripción">
                <textarea
                  rows={4}
                  value={
                    form.description
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "description",
                      event.target
                        .value,
                    )
                  }
                />
              </Field>
            </div>
          </section>

          <section className="admin-card admin-form-section">
            <h2>
              Precio y costos
            </h2>

            <div className="admin-form-grid">
              {numeric(
                "productCost",
                "Costo producto",
              )}

              {numeric(
                "importCost",
                "Importación",
              )}

              {numeric(
                "otherCost",
                "Otros costos",
              )}

              {numeric(
                "price",
                "Precio venta",
              )}

              {numeric(
                "oldPrice",
                "Precio anterior (opcional)",
              )}
            </div>
          </section>

          <section className="admin-card admin-form-section">
            <h2>
              Inventario
            </h2>

            <div className="admin-form-grid">
              {numeric(
                "stock",
                "Stock",
              )}

              {numeric(
                "minimumStock",
                "Stock mínimo",
              )}
            </div>

            {id && (
              <p className="admin-footnote">
                El stock de un
                producto existente se
                gestiona desde
                Inventario. Esta
                edición no modificará
                sus existencias.
              </p>
            )}
          </section>

          <section className="admin-card admin-form-section">
            <h2>
              Visibilidad
            </h2>

            <div className="admin-checkboxes">
              {(
                [
                  "active",
                  "featured",
                  "bestSeller",
                ] as const
              ).map(
                (key, index) => (
                  <label
                    key={key}
                  >
                    <input
                      type="checkbox"
                      checked={
                        form[key]
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          key,
                          event
                            .target
                            .checked,
                        )
                      }
                    />

                    {
                      [
                        "Activo",
                        "Destacado",
                        "Best seller",
                      ][index]
                    }
                  </label>
                ),
              )}
            </div>

            {textField(
              "badge",
              "Badge",
            )}
          </section>

          <section className="admin-card admin-form-section">
            <h2>
              Imágenes
            </h2>

            {textField(
              "image",
              "URL principal",
            )}

            <div
              className="admin-product-image-preview"
              aria-live="polite"
            >
              {form.image ? (
                <img
                  src={
                    form.image
                  }
                  alt={`Vista previa de ${
                    form.name ||
                    "producto"
                  }`}
                />
              ) : (
                <span>
                  La vista previa
                  aparecerá cuando
                  ingreses una URL.
                </span>
              )}
            </div>

            <Field label="URLs adicionales (una por línea)">
              <textarea
                rows={3}
                value={
                  extraImages
                }
                onChange={(
                  event,
                ) =>
                  setExtraImages(
                    event.target
                      .value,
                  )
                }
              />
            </Field>

            <p className="admin-footnote">
              Puedes usar una URL
              externa o una ruta
              pública como
              /images/products/producto.jpeg.
            </p>
          </section>
        </div>

        <aside className="admin-card admin-calculation">
          <h2>
            Rentabilidad en vivo
          </h2>

          <p>
            El precio de venta
            actual define la
            utilidad.
          </p>

          <dl>
            {[
              [
                "Costo real",
                money(
                  getProductRealCost(
                    form,
                  ),
                ),
              ],
              [
                "Utilidad unitaria",
                money(
                  getProductProfit(
                    form,
                  ),
                ),
              ],
              [
                "Margen",
                `${number(
                  getProductMargin(
                    form,
                  ),
                )}%`,
              ],
              [
                "Valor inventario",
                money(
                  getInventoryValue(
                    form,
                  ),
                ),
              ],
              [
                "Venta potencial",
                money(
                  getPotentialRevenue(
                    form,
                  ),
                ),
              ],
              [
                "Utilidad potencial",
                money(
                  getPotentialProfit(
                    form,
                  ),
                ),
              ],
            ].map(
              ([
                label,
                value,
              ]) => (
                <div
                  key={label}
                >
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

          {getProductProfit(
            form,
          ) < 0 && (
            <p className="admin-error">
              El precio está por
              debajo del costo real.
            </p>
          )}

          <ErrorMessage
            message={error}
          />

          <button
            type="submit"
            disabled={saving}
            className="admin-button admin-button-primary"
          >
            {saving
              ? "Guardando..."
              : "Guardar producto"}
          </button>

          <button
            type="button"
            className="admin-button"
            disabled={saving}
            onClick={() =>
              navigate(
                "/admin/productos",
              )
            }
          >
            Cancelar
          </button>
        </aside>
      </form>
    </>
  );
}