import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FileSpreadsheet,
  Upload,
  X,
} from "lucide-react";

import {
  createProductEntity,
  saveRemoteProducts,
  updateProductEntity,
} from "../../services/firebase/productRepository";

import type {
  ProductInput,
} from "../../types/product";

import { useProductStore } from "../../store/productStore";

import {
  slugify,
} from "../../utils/normalization";

type ImportPreviewProduct =
  ProductInput & {
    rowNumber: number;
  };

type ValidationIssue = {
  rowNumber: number;
  message: string;
};

type RawRow =
  Record<string, unknown>;

interface ProductImporterProps {
  onClose: () => void;
}

const HEADER_ALIASES: Record<
  string,
  string
> = {
  sku: "sku",
  nombre: "name",
  name: "name",
  categoria: "category",
  category: "category",
  marca: "brand",
  brand: "brand",
  descripcion_corta:
    "shortDescription",
  short_description:
    "shortDescription",
  shortdescription:
    "shortDescription",
  descripcion: "description",
  description: "description",
  precio: "price",
  price: "price",
  precio_anterior: "oldPrice",
  old_price: "oldPrice",
  oldprice: "oldPrice",
  costo_producto: "productCost",
  product_cost: "productCost",
  productcost: "productCost",
  costo_importacion: "importCost",
  import_cost: "importCost",
  importcost: "importCost",
  otros_costos: "otherCost",
  other_cost: "otherCost",
  othercost: "otherCost",
  stock: "stock",
  stock_minimo: "minimumStock",
  minimum_stock: "minimumStock",
  minimumstock: "minimumStock",
  imagen: "image",
  image: "image",
  imagenes: "images",
  images: "images",
  badge: "badge",
  destacado: "featured",
  featured: "featured",
  mas_vendido: "bestSeller",
  best_seller: "bestSeller",
  bestseller: "bestSeller",
  activo: "active",
  active: "active",
  codigo_barras: "barcode",
  barcode: "barcode",
  peso: "weight",
  weight: "weight",
  tamano_volumen: "sizeVolume",
  size_volume: "sizeVolume",
  sizevolume: "sizeVolume",
  slug: "slug",
};

const normalizeHeader = (
  value: unknown,
) =>
  String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const cellText = (
  value: unknown,
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
};

const parseNumber = (
  value: unknown,
  fallback = 0,
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  if (
    typeof value === "number"
  ) {
    return Number.isFinite(value)
      ? value
      : fallback;
  }

  let text =
    String(value)
      .trim()
      .replace(/\s/g, "")
      .replace(/[$€£]/g, "");

  if (!text) {
    return fallback;
  }

  const comma =
    text.lastIndexOf(",");

  const dot =
    text.lastIndexOf(".");

  if (
    comma !== -1 &&
    dot !== -1
  ) {
    if (comma > dot) {
      text = text
        .replace(/\./g, "")
        .replace(",", ".");
    } else {
      text =
        text.replace(
          /,/g,
          "",
        );
    }
  } else if (
    comma !== -1
  ) {
    const decimalLength =
      text.length -
      comma -
      1;

    if (
      decimalLength === 1 ||
      decimalLength === 2
    ) {
      text =
        text.replace(
          ",",
          ".",
        );
    } else {
      text =
        text.replace(
          /,/g,
          "",
        );
    }
  }

  const parsed =
    Number(text);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
};

const parseOptionalNumber = (
  value: unknown,
) => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return undefined;
  }

  const parsed =
    parseNumber(
      value,
      Number.NaN,
    );

  return Number.isFinite(parsed)
    ? parsed
    : undefined;
};

const parseBoolean = (
  value: unknown,
  fallback = false,
) => {
  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    typeof value === "number"
  ) {
    return value !== 0;
  }

  const normalized =
    String(value ?? "")
      .trim()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .toLowerCase();

  if (
    [
      "true",
      "si",
      "yes",
      "y",
      "1",
      "x",
      "verdadero",
      "activo",
    ].includes(normalized)
  ) {
    return true;
  }

  if (
    [
      "false",
      "no",
      "n",
      "0",
      "falso",
      "inactivo",
    ].includes(normalized)
  ) {
    return false;
  }

  return fallback;
};

const normalizeImagePath = (
  value: unknown,
) => {
  const raw =
    cellText(value);

  if (!raw) {
    return "";
  }

  const normalized =
    raw.replace(
      /\\/g,
      "/",
    );

  if (
    /^https?:\/\//i.test(
      normalized,
    ) ||
    normalized.startsWith(
      "data:",
    )
  ) {
    return normalized;
  }

  const publicIndex =
    normalized
      .toLowerCase()
      .lastIndexOf(
        "/public/",
      );

  if (
    publicIndex !== -1
  ) {
    return (
      "/" +
      normalized.slice(
        publicIndex +
          "/public/".length,
      )
    );
  }

  if (
    normalized
      .toLowerCase()
      .startsWith(
        "public/",
      )
  ) {
    return (
      "/" +
      normalized.slice(
        "public/".length,
      )
    );
  }

  if (
    normalized.startsWith("/")
  ) {
    return normalized;
  }

  if (
    normalized
      .toLowerCase()
      .startsWith(
        "images/",
      )
  ) {
    return `/${normalized}`;
  }

  return normalized;
};

const parseImages = (
  value: unknown,
) =>
  cellText(value)
    .split("|")
    .map(
      (image) =>
        normalizeImagePath(
          image,
        ),
    )
    .filter(Boolean);

const mapRawRow = (
  raw: RawRow,
  rowNumber: number,
): ImportPreviewProduct => {
  const mapped:
    Record<string, unknown> = {};

  Object.entries(raw).forEach(
    ([header, value]) => {
      const normalized =
        normalizeHeader(
          header,
        );

      const key =
        HEADER_ALIASES[
          normalized
        ];

      if (key) {
        mapped[key] =
          value;
      }
    },
  );

  const name =
    cellText(
      mapped.name,
    );

  const image =
    normalizeImagePath(
      mapped.image,
    );

  const images =
    parseImages(
      mapped.images,
    );

  if (
    image &&
    !images.includes(image)
  ) {
    images.unshift(image);
  }

  const stock =
    Math.max(
      0,
      Math.floor(
        parseNumber(
          mapped.stock,
        ),
      ),
    );

  const minimumStock =
    Math.max(
      0,
      Math.floor(
        parseNumber(
          mapped.minimumStock,
        ),
      ),
    );

  return {
    rowNumber,

    sku:
      cellText(
        mapped.sku,
      ),

    name,

    slug:
      cellText(
        mapped.slug,
      ) ||
      slugify(name),

    category:
      cellText(
        mapped.category,
      ) ||
      "Sin categoría",

    brand:
      cellText(
        mapped.brand,
      ) ||
      "FLOES.ec",

    description:
      cellText(
        mapped.description,
      ),

    shortDescription:
      cellText(
        mapped.shortDescription,
      ),

    price:
      Math.max(
        0,
        parseNumber(
          mapped.price,
        ),
      ),

    oldPrice:
      parseOptionalNumber(
        mapped.oldPrice,
      ),

    productCost:
      Math.max(
        0,
        parseNumber(
          mapped.productCost,
        ),
      ),

    importCost:
      Math.max(
        0,
        parseNumber(
          mapped.importCost,
        ),
      ),

    otherCost:
      Math.max(
        0,
        parseNumber(
          mapped.otherCost,
        ),
      ),

    stock,

    minimumStock,

    image:
      image ||
      undefined,

    images,

    badge:
      cellText(
        mapped.badge,
      ) ||
      undefined,

    barcode:
      cellText(
        mapped.barcode,
      ) ||
      undefined,

    weight:
      parseOptionalNumber(
        mapped.weight,
      ),

    sizeVolume:
      cellText(
        mapped.sizeVolume,
      ) ||
      undefined,

    featured:
      parseBoolean(
        mapped.featured,
      ),

    bestSeller:
      parseBoolean(
        mapped.bestSeller,
      ),

    active:
      parseBoolean(
        mapped.active,
        true,
      ),
  };
};

const parseCsvLine = (
  line: string,
  delimiter: string,
) => {
  const cells: string[] = [];

  let current = "";
  let quoted = false;

  for (
    let index = 0;
    index < line.length;
    index += 1
  ) {
    const character =
      line[index];

    if (
      character === '"'
    ) {
      if (
        quoted &&
        line[index + 1] ===
          '"'
      ) {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }

      continue;
    }

    if (
      character ===
        delimiter &&
      !quoted
    ) {
      cells.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  cells.push(current);

  return cells;
};

const detectDelimiter = (
  header: string,
) => {
  const delimiters = [
    ",",
    ";",
    "\t",
  ];

  return delimiters.reduce(
    (best, current) => {
      const bestCount =
        header.split(
          best,
        ).length;

      const currentCount =
        header.split(
          current,
        ).length;

      return currentCount >
        bestCount
        ? current
        : best;
    },
    ",",
  );
};

const parseCsv = async (
  file: File,
): Promise<RawRow[]> => {
  const text =
    await file.text();

  const lines =
    text
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter(
        (line) =>
          line.trim() !== "",
      );

  if (!lines.length) {
    return [];
  }

  const delimiter =
    detectDelimiter(
      lines[0],
    );

  const headers =
    parseCsvLine(
      lines[0],
      delimiter,
    );

  return lines
    .slice(1)
    .map((line) => {
      const cells =
        parseCsvLine(
          line,
          delimiter,
        );

      return headers.reduce<
        RawRow
      >(
        (
          row,
          header,
          index,
        ) => {
          row[header] =
            cells[index] ??
            "";

          return row;
        },
        {},
      );
    });
};

const parseExcel = async (
  file: File,
): Promise<RawRow[]> => {
  /*
   * XLSX se carga solamente
   * cuando realmente se selecciona
   * un archivo Excel.
   */
  const XLSX =
    await import("xlsx");

  const buffer =
    await file.arrayBuffer();

  const workbook =
    XLSX.read(buffer, {
      type: "array",
    });

  const sheetName =
    workbook.SheetNames[0];

  if (!sheetName) {
    return [];
  }

  const worksheet =
    workbook.Sheets[
      sheetName
    ];

  return XLSX.utils.sheet_to_json<
    RawRow
  >(worksheet, {
    defval: "",
    raw: true,
  });
};

const validateProducts = (
  products: ImportPreviewProduct[],
) => {
  const issues: ValidationIssue[] = [];

  const seenSkus = new Set<string>();
  const seenSlugs = new Set<string>();

  products.forEach((product) => {
    if (!product.name.trim()) {
      issues.push({
        rowNumber: product.rowNumber,
        message: "Nombre obligatorio.",
      });
    }

    if (!product.sku.trim()) {
      issues.push({
        rowNumber: product.rowNumber,
        message: "SKU obligatorio.",
      });
    }

    const sku = product.sku
      .trim()
      .toLowerCase();

    if (sku) {
      if (seenSkus.has(sku)) {
        issues.push({
          rowNumber: product.rowNumber,
          message: `SKU duplicado dentro del archivo: ${product.sku}.`,
        });
      }

      seenSkus.add(sku);
    }

    const slug = product.slug.trim();

    if (slug) {
      if (seenSlugs.has(slug)) {
        issues.push({
          rowNumber: product.rowNumber,
          message: `Slug duplicado dentro del archivo: ${slug}.`,
        });
      }

      seenSlugs.add(slug);
    }

    for (const [label, value] of [
      ["precio", product.price],
      ["costo producto", product.productCost],
      ["costo importación", product.importCost],
      ["otros costos", product.otherCost],
      ["stock", product.stock],
      ["stock mínimo", product.minimumStock],
    ] as const) {
      if (!Number.isFinite(value) || value < 0) {
        issues.push({
          rowNumber: product.rowNumber,
          message: `${label} inválido.`,
        });
      }
    }

    if (
      !Number.isInteger(product.stock) ||
      !Number.isInteger(product.minimumStock)
    ) {
      issues.push({
        rowNumber: product.rowNumber,
        message: "Stock y stock mínimo deben ser enteros.",
      });
    }

    if (
      product.oldPrice !== undefined &&
      (!Number.isFinite(product.oldPrice) ||
        product.oldPrice < 0)
    ) {
      issues.push({
        rowNumber: product.rowNumber,
        message: "Precio anterior inválido.",
      });
    }

    if (
      product.weight !== undefined &&
      (!Number.isFinite(product.weight) ||
        product.weight < 0)
    ) {
      issues.push({
        rowNumber: product.rowNumber,
        message: "Peso inválido.",
      });
    }
  });

  return issues;
};

export function ProductImporter({
  onClose,
}: ProductImporterProps) {
  const inputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const setRemoteProducts =
    useProductStore(
      (state) =>
        state.setRemoteProducts,
    );

  const [
    products,
    setProducts,
  ] = useState<
    ImportPreviewProduct[]
  >([]);

  const [
    fileName,
    setFileName,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [importing, setImporting] =
    useState(false);

  const validation =
    useMemo(
      () =>
        validateProducts(
          products,
        ),
      [products],
    );

  const handleFile = async (
    file?: File,
  ) => {
    if (!file) {
      return;
    }

    setError("");
    setResult("");
    setProducts([]);
    setFileName(
      file.name,
    );
    setLoading(true);

    try {
      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase();

      let rows:
        RawRow[] = [];

      if (
        extension ===
          "xlsx" ||
        extension === "xls"
      ) {
        rows =
          await parseExcel(
            file,
          );
      } else if (
        extension === "csv"
      ) {
        rows =
          await parseCsv(
            file,
          );
      } else {
        throw new Error(
          "Formato no compatible. Usa XLSX, XLS o CSV.",
        );
      }

      if (!rows.length) {
        throw new Error(
          "El archivo no contiene productos.",
        );
      }

      const mapped =
        rows
          .map(
            (
              row,
              index,
            ) =>
              mapRawRow(
                row,
                index + 2,
              ),
          )
          .filter(
            (product) =>
              product.name ||
              product.sku,
          );

      if (
        !mapped.length
      ) {
        throw new Error(
          "No se encontraron filas de productos válidas.",
        );
      }

      setProducts(
        mapped,
      );
    } catch (err) {
      setProducts([]);

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo leer el archivo.",
      );
    } finally {
      setLoading(false);
    }
  };

  const importProducts =
    async () => {
      if (
        !products.length ||
        validation.length ||
        importing
      ) {
        return;
      }

      setError("");
      setResult("");
      setImporting(true);

      try {
        const currentProducts =
          useProductStore
            .getState()
            .products;

        const existingBySku =
          new Map(
            currentProducts.map(
              (product) => [
                product.sku
                  .trim()
                  .toLowerCase(),
                product,
              ],
            ),
          );

        let createdCount = 0;
        let updatedCount = 0;

        const entities =
          products.map(
            (previewProduct) => {
              const input: ProductInput = {
                sku: previewProduct.sku,
                slug: previewProduct.slug,
                name: previewProduct.name,
                category: previewProduct.category,
                brand: previewProduct.brand,
                description: previewProduct.description,
                shortDescription:
                  previewProduct.shortDescription,
                price: previewProduct.price,
                oldPrice: previewProduct.oldPrice,
                productCost:
                  previewProduct.productCost,
                importCost:
                  previewProduct.importCost,
                otherCost:
                  previewProduct.otherCost,
                stock: previewProduct.stock,
                minimumStock:
                  previewProduct.minimumStock,
                image: previewProduct.image,
                images: previewProduct.images,
                badge: previewProduct.badge,
                barcode: previewProduct.barcode,
                weight: previewProduct.weight,
                sizeVolume:
                  previewProduct.sizeVolume,
                featured:
                  previewProduct.featured,
                bestSeller:
                  previewProduct.bestSeller,
                active: previewProduct.active,
              };

              const normalizedSku =
                input.sku
                  .trim()
                  .toLowerCase();

              const existing =
                existingBySku.get(
                  normalizedSku,
                );

              if (existing) {
                updatedCount += 1;

                return updateProductEntity(
                  existing,
                  input,
                );
              }

              createdCount += 1;

              return createProductEntity(
                input,
              );
            },
          );

        await saveRemoteProducts(
          entities,
        );

        const importedSkus =
          new Set(
            entities.map(
              (product) =>
                product.sku
                  .trim()
                  .toLowerCase(),
            ),
          );

        const untouchedProducts =
          currentProducts.filter(
            (product) =>
              !importedSkus.has(
                product.sku
                  .trim()
                  .toLowerCase(),
              ),
          );

        setRemoteProducts(
          [
            ...untouchedProducts,
            ...entities,
          ],
          "admin",
        );

        setResult(
          `${entities.length} productos procesados correctamente: ` +
            `${createdCount} creados y ${updatedCount} actualizados en Firebase.`,
        );

        setProducts([]);
        setFileName("");

        if (inputRef.current) {
          inputRef.current.value = "";
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Error durante la importación.",
        );
      } finally {
        setImporting(false);
      }
    };

  return (
    <section className="admin-card admin-importer">
      <div className="admin-importer-header">
        <div>
          <span className="admin-eyebrow">
            IMPORTACIÓN MASIVA
          </span>

          <h2>
            Importar productos
          </h2>

          <p>
            Carga un archivo XLSX,
            XLS o CSV. Primero se
            validarán todas las filas
            antes de escribir en
            Firebase.
          </p>
        </div>

        <button
          type="button"
          className="admin-icon-button"
          onClick={onClose}
          aria-label="Cerrar importador"
        >
          <X size={18} />
        </button>
      </div>

      <div className="admin-importer-upload">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          hidden
          onChange={(
            event,
          ) => {
            void handleFile(
              event.target
                .files?.[0],
            );
          }}
        />

        <button
          type="button"
          className="admin-button"
          disabled={
            loading ||
            importing
          }
          onClick={() =>
            inputRef.current?.click()
          }
        >
          <Upload size={16} />

          {loading
            ? "Leyendo archivo..."
            : "Seleccionar archivo"}
        </button>

        {fileName && (
          <span className="admin-importer-file">
            <FileSpreadsheet
              size={16}
            />
            {fileName}
          </span>
        )}
      </div>

      {error && (
        <p className="admin-error">
          {error}
        </p>
      )}

      {result && (
        <p className="admin-success">
          {result}
        </p>
      )}

      {products.length >
        0 && (
        <>
          <div className="admin-importer-summary">
            <strong>
              {
                products.length
              }{" "}
              producto
              {products.length ===
              1
                ? ""
                : "s"}
            </strong>

            <span>
              {validation.length
                ? `${validation.length} problema${
                    validation.length ===
                    1
                      ? ""
                      : "s"
                  } por corregir`
                : "Archivo listo para importar"}
            </span>
          </div>

          {validation.length >
            0 && (
            <div className="admin-importer-errors">
              <strong>
                Validación
              </strong>

              <ul>
                {validation.map(
                  (
                    issue,
                    index,
                  ) => (
                    <li
                      key={`${issue.rowNumber}-${index}`}
                    >
                      Fila{" "}
                      {
                        issue.rowNumber
                      }
                      :{" "}
                      {
                        issue.message
                      }
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>
                    Producto
                  </th>
                  <th>SKU</th>
                  <th>
                    Categoría
                  </th>
                  <th>
                    Precio
                  </th>
                  <th>Stock</th>
                  <th>
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody>
                {products
                  .slice(
                    0,
                    20,
                  )
                  .map(
                    (
                      product,
                    ) => (
                      <tr
                        key={`${product.rowNumber}-${product.sku}`}
                      >
                        <td>
                          {
                            product.rowNumber
                          }
                        </td>

                        <td>
                          {
                            product.name
                          }
                        </td>

                        <td>
                          {
                            product.sku
                          }
                        </td>

                        <td>
                          {
                            product.category
                          }
                        </td>

                        <td>
                          $
                          {product.price.toFixed(
                            2,
                          )}
                        </td>

                        <td>
                          {
                            product.stock
                          }
                        </td>

                        <td>
                          {product.active
                            ? "Activo"
                            : "Inactivo"}
                        </td>
                      </tr>
                    ),
                  )}
              </tbody>
            </table>
          </div>

          {products.length >
            20 && (
            <p className="admin-footnote">
              Mostrando las primeras
              20 filas de{" "}
              {
                products.length
              }
              .
            </p>
          )}

          <div className="admin-form-actions">
            <button
              type="button"
              className="admin-button"
              disabled={
                importing
              }
              onClick={() => {
                setProducts([]);
                setFileName("");
                setError("");
                setResult("");

                if (
                  inputRef.current
                ) {
                  inputRef.current.value =
                    "";
                }
              }}
            >
              Limpiar
            </button>

            <button
              type="button"
              className="admin-button admin-button-primary"
              disabled={
                Boolean(
                  validation.length,
                ) ||
                !products.length ||
                importing
              }
              onClick={() => {
                void importProducts();
              }}
            >
              {importing
                ? "Importando a Firebase..."
                : `Importar ${products.length} producto${
                    products.length ===
                    1
                      ? ""
                      : "s"
                  }`}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
