import {
  useState,
  useMemo,
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
import { TextileProductEditor } from "../components/TextileProductEditor";
import { ProductImagesEditor } from "../components/ProductImagesEditor";
import { activeCategories, useCategoryStore } from "../../store/categoryStore";

export function AdminProductEditor() {
  const { id } = useParams();

  const product = useProductStore(
    (state) =>
      state.products.find(
        (current) =>
          current.id === id,
      ),
  );

  /*
   * El editor nuevo no debe construir un producto distinto cada vez que
   * el componente padre se renderiza. Además de evitar UUIDs efímeros,
   * esto mantiene estable el valor inicial que recibe ProductEditorForm.
   */
  const newProduct = useMemo(
    () => normalizeProduct({ active: true }),
    [],
  );

  if (id && !product) {
    return (
      <EmptyState
        title="Modelo no encontrado"
        description="Vuelve a Modelos para seleccionar otro registro."
      />
    );
  }

  return (
    <ProductEditorForm
      key={id ?? "new"}
      id={id}
      initial={
        product ?? newProduct
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

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const navigate =
    useNavigate();

  /*
   * activeCategories() filtra y ordena, por lo que siempre devuelve un
   * arreglo nuevo. Usarlo dentro del selector de Zustand hacía que
   * useSyncExternalStore recibiera un snapshot nuevo en cada lectura y
   * React reintentara el render indefinidamente en /productos/nuevo.
   */
  const categoryItems = useCategoryStore((state) => state.categories);
  const categories = useMemo(
    () => activeCategories(categoryItems),
    [categoryItems],
  );

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

        images: (form.images ?? []).map((value) => value.trim()).filter(Boolean),
        colors: (form.colors ?? []).filter((color) => color.name.trim()).map((color) => ({ ...color, name: color.name.trim(), hex: color.hex?.trim() || undefined, images: (color.images ?? []).map((image) => image.trim()).filter(Boolean) })),
        sizes: (form.sizes ?? []).map((size) => size.trim()).filter(Boolean),
        variants: form.variants ?? [],
        sizeGuide: form.sizeGuide,
      };

      const hasVariants = input.variants.length > 0;

      if (hasVariants) {
        input.stock = input.variants.reduce(
          (total, variant) => total + variant.stock,
          0,
        );
        input.minimumStock = input.variants.reduce(
          (total, variant) => total + variant.minimumStock,
          0,
        );
      }

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
            "Modelo no encontrado.",
          );
        }

        const updated =
          updateProductEntity(
            previous,
            {
              ...input,
              stock:
                hasVariants
                  ? input.stock
                  : previous.stock,
              minimumStock:
                hasVariants
                  ? input.minimumStock
                  : previous.minimumStock,
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
        label="Modelos"
      />

      <AdminSectionHeader
        eyebrow="ADMIN / CATÁLOGO"
        title={
          id
            ? "Editar modelo"
            : "Nuevo modelo"
        }
        description="Define cada detalle del modelo y revisa su rentabilidad al instante."
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
              Información general
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

              <Field label="Categoría">
                <select required value={form.category} onChange={(event) => updateField("category", event.target.value)}>
                  <option value="">Selecciona una categoría</option>
                  {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
                  {form.category && !categories.some((category) => category.name === form.category) && <option value={form.category}>{form.category}</option>}
                </select>
              </Field>

              {textField(
                "shortDescription",
                "Descripción corta",
              )}

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

            <details className="admin-legacy-details">
              <summary>Datos adicionales</summary>
              <div className="admin-form-grid">
                {textField("brand", "Marca")}
                {textField("barcode", "Código de barras (opcional)")}
                {textField("sizeVolume", "Tamaño / volumen (opcional)")}
                <Field label="Peso (opcional)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.weight ?? ""}
                    onChange={(event) =>
                      updateField(
                        "weight",
                        event.target.value === ""
                          ? undefined
                          : Math.max(0, Number(event.target.value) || 0),
                      )
                    }
                  />
                </Field>
              </div>
            </details>
          </section>

          <section className="admin-card admin-form-section">
            <h2>Confección</h2>
            <div className="admin-form-grid">
              <Field label="Tipo de producto"><input value={form.productType ?? ""} onChange={(event) => updateField("productType", event.target.value)} /></Field>
              <Field label="Colección"><input value={form.collection ?? ""} onChange={(event) => updateField("collection", event.target.value)} /></Field>
              <Field label="Audiencia"><select value={form.audience ?? ""} onChange={(event) => updateField("audience", (event.target.value || undefined) as ProductInput["audience"])}><option value="">Sin definir</option><option value="mujer">Mujer</option><option value="hombre">Hombre</option><option value="unisex">Unisex</option><option value="infantil">Infantil</option><option value="otro">Otro</option></select></Field>
              <Field label="Tela"><input value={form.fabric ?? ""} onChange={(event) => updateField("fabric", event.target.value)} /></Field>
              <Field label="Material"><input value={form.material ?? ""} onChange={(event) => updateField("material", event.target.value)} /></Field>
            </div>
          </section>

          <TextileProductEditor sku={form.sku} colors={form.colors ?? []} sizes={form.sizes ?? []} variants={form.variants ?? []} sizeGuide={form.sizeGuide} onColorsChange={(value) => updateField("colors", value)} onSizesChange={(value) => updateField("sizes", value)} onVariantsChange={(value) => updateField("variants", value)} onSizeGuideChange={(value) => updateField("sizeGuide", value)} />

          <section className="admin-card admin-form-section">
            <h2>
              Precio y costos
            </h2>

            <div className="admin-form-grid">
              {numeric(
                "productCost",
                "Costo del modelo",
              )}

              {numeric(
                "importCost",
                "Costos adicionales",
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

            {(form.variants?.length ?? 0) > 0 ? (
              <p className="admin-footnote">
                Este modelo utiliza inventario por variante. El total se deriva de
                sus combinaciones; ajusta existencias y mínimos en Variantes o
                desde Inventario.
              </p>
            ) : (
              <div className="admin-form-grid">
                {numeric("stock", "Stock")}
                {numeric("minimumStock", "Stock mínimo")}
              </div>
            )}

            {id && !(form.variants?.length ?? 0) && (
              <p className="admin-footnote">
                El stock de un modelo existente se gestiona desde Inventario. Esta
                edición no modificará sus existencias.
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
                        "Más vendido",
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

          <ProductImagesEditor name={form.name} primary={form.image} gallery={form.images ?? []} onPrimaryChange={(value) => updateField("image", value || undefined)} onGalleryChange={(value) => updateField("images", value)} />
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
              : "Guardar modelo"}
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
