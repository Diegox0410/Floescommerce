import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  Product,
  ProductInput,
} from "../types/product";

import { demoProducts } from "../data/products";

import {
  normalizeProduct,
  record,
  strings,
} from "../utils/normalization";

interface ProductStore {
  products: Product[];
  appliedInventoryBatches: string[];

  remoteLoading: boolean;
  remoteReady: boolean;
  remoteError: string | null;
  remoteMode: "local" | "catalog" | "admin";

  addProduct: (input: ProductInput) => Product;

  updateProduct: (
    id: string,
    input: Partial<ProductInput>,
  ) => void;

  deleteProduct: (id: string) => void;

  adjustStock: (
    id: string,
    newStock: number,
  ) => void;

  setStockBatch: (
    stocks: {
      id: string;
      stock: number;
    }[],
    batchId?: string,
  ) => void;

  setProductActive: (
    id: string,
    active: boolean,
  ) => void;

  clearDemoProducts: () => number;

  beginRemoteLoad: (
    mode: "catalog" | "admin",
  ) => void;

  setRemoteProducts: (
    products: Product[],
    mode: "catalog" | "admin",
  ) => void;

  upsertRemoteProduct: (
    product: Product,
  ) => void;

  removeRemoteProduct: (
    productId: string,
  ) => void;

  setRemoteError: (
    error: string,
    mode: "catalog" | "admin",
  ) => void;
}

/*
 * El dominio de pedidos registra aquí su
 * restricción de eliminación.
 *
 * Se mantiene fuera del store para evitar
 * dependencias circulares.
 */
let canDeleteProduct: (id: string) => boolean =
  () => true;

export const registerProductDeletionGuard = (
  guard: (id: string) => boolean,
) => {
  canDeleteProduct = guard;
};

const validateInput = (
  input: Partial<ProductInput>,
) => {
  for (const key of [
    "price",
    "oldPrice",
    "productCost",
    "importCost",
    "otherCost",
    "stock",
    "minimumStock",
    "weight",
  ] as const) {
    const value = input[key];

    if (
      value !== undefined &&
      (
        !Number.isFinite(value) ||
        value < 0 ||
        (
          ["stock", "minimumStock"].includes(key) &&
          !Number.isInteger(value)
        )
      )
    ) {
      throw new Error(
        "Precios, costos y stock inválidos.",
      );
    }
  }
};

const validateProduct = (
  product: Product,
  products: Product[],
) => {
  if (
    !product.name.trim() ||
    !product.sku.trim()
  ) {
    throw new Error(
      "Nombre y SKU son obligatorios.",
    );
  }

  if (
    products.some(
      (current) =>
        current.id !== product.id &&
        current.sku
          .trim()
          .toLowerCase() ===
          product.sku
            .trim()
            .toLowerCase(),
    )
  ) {
    throw new Error(
      "El SKU ya existe.",
    );
  }

  if (
    product.slug &&
    products.some(
      (current) =>
        current.id !== product.id &&
        current.slug === product.slug,
    )
  ) {
    throw new Error(
      "El slug ya existe.",
    );
  }
};

const hydrate = (value: unknown) => {
  const stored = record(value);

  return {
    products: Array.isArray(
      stored.products,
    )
      ? stored.products
          .map(normalizeProduct)
          .filter(
            (
              product,
              index,
              all,
            ) =>
              all.findIndex(
                (current) =>
                  current.id ===
                  product.id,
              ) === index,
          )
      : demoProducts,

    appliedInventoryBatches: strings(
      stored.appliedInventoryBatches,
    ),
  };
};

export const useProductStore =
  create<ProductStore>()(
    persist(
      (set, get) => ({
        products: demoProducts,

        appliedInventoryBatches: [],

        remoteLoading: false,
        remoteReady: false,
        remoteError: null,
        remoteMode: "local",

        addProduct: (input) => {
          validateInput(input);

          const product =
            normalizeProduct({
              ...input,
              id: crypto.randomUUID(),
            });

          validateProduct(
            product,
            get().products,
          );

          set((state) => ({
            products: [
              ...state.products,
              product,
            ],
          }));

          return product;
        },

        updateProduct: (
          id,
          input,
        ) => {
          validateInput(input);

          const old =
            get().products.find(
              (product) =>
                product.id === id,
            );

          if (!old) {
            throw new Error(
              "Producto no encontrado.",
            );
          }

          const product =
            normalizeProduct({
              ...old,
              ...input,
              updatedAt:
                new Date().toISOString(),
            });

          validateProduct(
            product,
            get().products,
          );

          set((state) => ({
            products:
              state.products.map(
                (current) =>
                  current.id === id
                    ? product
                    : current,
              ),
          }));
        },

        deleteProduct: (id) => {
          if (
            !canDeleteProduct(id)
          ) {
            throw new Error(
              "Este producto tiene pedidos vigentes. Desactívalo o cancela los pedidos antes de eliminarlo.",
            );
          }

          set((state) => ({
            products:
              state.products.filter(
                (product) =>
                  product.id !== id,
              ),
          }));
        },

        adjustStock: (
          id,
          stock,
        ) =>
          get().setStockBatch([
            {
              id,
              stock,
            },
          ]),

        setStockBatch: (
          stocks,
          batchId,
        ) => {
          if (
            batchId &&
            get().appliedInventoryBatches.includes(
              batchId,
            )
          ) {
            return;
          }

          if (
            stocks.some(
              (stock) =>
                !Number.isInteger(
                  stock.stock,
                ) ||
                stock.stock < 0 ||
                !get().products.some(
                  (product) =>
                    product.id ===
                    stock.id,
                ),
            )
          ) {
            throw new Error(
              "Stock inválido o producto inexistente.",
            );
          }

          const stockMap =
            new Map(
              stocks.map(
                (stock) => [
                  stock.id,
                  stock.stock,
                ],
              ),
            );

          set((state) => ({
            products:
              state.products.map(
                (product) =>
                  stockMap.has(
                    product.id,
                  )
                    ? {
                        ...product,
                        stock:
                          stockMap.get(
                            product.id,
                          )!,
                        updatedAt:
                          new Date().toISOString(),
                      }
                    : product,
              ),

            appliedInventoryBatches:
              batchId
                ? [
                    ...state.appliedInventoryBatches,
                    batchId,
                  ]
                : state.appliedInventoryBatches,
          }));
        },

        setProductActive: (
          id,
          active,
        ) =>
          get().updateProduct(
            id,
            {
              active,
            },
          ),

        clearDemoProducts: () => {
          const ids =
            new Set(
              demoProducts.map(
                (product) =>
                  product.id,
              ),
            );

          const removable =
            get().products.filter(
              (product) =>
                ids.has(
                  product.id,
                ) &&
                canDeleteProduct(
                  product.id,
                ),
            );

          const removableIds =
            new Set(
              removable.map(
                (product) =>
                  product.id,
              ),
            );

          set((state) => ({
            products:
              state.products.filter(
                (product) =>
                  !removableIds.has(
                    product.id,
                  ),
              ),
          }));

          return removable.length;
        },

        beginRemoteLoad: (
          mode,
        ) => {
          set({
            remoteLoading: true,
            remoteReady: false,
            remoteError: null,
            remoteMode: mode,
          });
        },

        setRemoteProducts: (
          products,
          mode,
        ) => {
          const normalized =
            products
              .map(
                normalizeProduct,
              )
              .filter(
                (
                  product,
                  index,
                  all,
                ) =>
                  all.findIndex(
                    (current) =>
                      current.id ===
                      product.id,
                  ) === index,
              );

          set({
            products: normalized,
            remoteLoading: false,
            remoteReady: true,
            remoteError: null,
            remoteMode: mode,
          });
        },

        upsertRemoteProduct: (
          product,
        ) => {
          const normalized =
            normalizeProduct(
              product,
            );

          /*
           * Esta operación se utiliza
           * después de que Firebase haya
           * confirmado la escritura.
           *
           * Si ya existe el producto,
           * reemplaza su versión local.
           *
           * Si es nuevo, lo agrega.
           */
          set((state) => {
            const exists =
              state.products.some(
                (current) =>
                  current.id ===
                  normalized.id,
              );

            return {
              products: exists
                ? state.products.map(
                    (current) =>
                      current.id ===
                      normalized.id
                        ? normalized
                        : current,
                  )
                : [
                    ...state.products,
                    normalized,
                  ],
            };
          });
        },

        removeRemoteProduct: (
          productId,
        ) => {
          /*
           * Igual que upsertRemoteProduct,
           * esta operación debe ejecutarse
           * después de que Firebase confirme
           * la eliminación.
           */
          set((state) => ({
            products:
              state.products.filter(
                (product) =>
                  product.id !==
                  productId,
              ),
          }));
        },

        setRemoteError: (
          error,
          mode,
        ) => {
          set({
            remoteLoading: false,
            remoteReady: false,
            remoteError: error,
            remoteMode: mode,
          });
        },
      }),

      {
        name: "dgng-products",

        version: 2,

        partialize: (
          state,
        ) => ({
          products:
            state.products,

          appliedInventoryBatches:
            state.appliedInventoryBatches,
        }),

        migrate: hydrate,

        merge: (
          persisted,
          current,
        ) => ({
          ...current,
          ...hydrate(
            persisted,
          ),
        }),
      },
    ),
  );