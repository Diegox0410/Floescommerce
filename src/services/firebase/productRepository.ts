import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";

import type {
  Product,
  ProductInput,
} from "../../types/product";

import {
  normalizeProduct,
  slugify,
} from "../../utils/normalization";

import { db } from "./firebase";

const productsCollection = collection(
  db,
  "products",
);

const catalogCollection = collection(
  db,
  "catalog",
);

export const removeUndefined = (
  value: Record<string, unknown>,
) =>
  Object.fromEntries(
    Object.entries(value).filter(
      ([, fieldValue]) =>
        fieldValue !== undefined,
    ),
  );

export const privateProductData = (
  product: Product,
) =>
  removeUndefined({
    ...product,
  });

export const publicProductData = (
  product: Product,
) =>
  removeUndefined({
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    category: product.category,
    brand: product.brand,
    description: product.description,
    shortDescription:
      product.shortDescription,
    price: product.price,
    oldPrice: product.oldPrice,
    inStock: product.stock > 0,
    image: product.image,
    images: product.images,
    badge: product.badge,
    weight: product.weight,
    sizeVolume: product.sizeVolume,
    productType: product.productType,
    collection: product.collection,
    audience: product.audience,
    fabric: product.fabric,
    material: product.material,
    colors: product.colors,
    sizes: product.sizes,
    variants: product.variants.map((variant) => removeUndefined({ id: variant.id, sku: variant.sku, size: variant.size, color: variant.color, measurement: variant.measurement, material: variant.material, price: variant.price, stock: variant.stock > 0 ? 1 : 0, minimumStock: 0, active: variant.active })),
    sizeGuide: product.sizeGuide,
    featured: product.featured,
    bestSeller: product.bestSeller,
    active: product.active,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  });

export const createProductEntity = (
  input: ProductInput,
): Product => {
  const now =
    new Date().toISOString();

  return normalizeProduct({
    ...input,
    id: crypto.randomUUID(),
    slug:
      input.slug?.trim() ||
      slugify(input.name),
    createdAt: now,
    updatedAt: now,
  });
};

export const updateProductEntity = (
  current: Product,
  input: Partial<ProductInput>,
): Product => {
  return normalizeProduct({
    ...current,
    ...input,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt:
      new Date().toISOString(),
  });
};

export const getRemoteProducts =
  async (): Promise<Product[]> => {
    const snapshot =
      await getDocs(
        productsCollection,
      );

    return snapshot.docs.map(
      (snapshotDocument) =>
        normalizeProduct({
          ...snapshotDocument.data(),
          id: snapshotDocument.id,
        }),
    );
  };

export const getPublicCatalog =
  async (): Promise<Product[]> => {
    const catalogQuery =
      query(
        catalogCollection,
        where(
          "active",
          "==",
          true,
        ),
      );

    const snapshot =
      await getDocs(
        catalogQuery,
      );

    return snapshot.docs.map(
      (snapshotDocument) =>
        normalizeProduct({
          ...snapshotDocument.data(),
          id: snapshotDocument.id,

          /*
           * El catálogo público solo recibe
           * disponibilidad, nunca stock real.
           *
           * stock se reconstruye únicamente como
           * un valor operativo interno para que
           * el carrito legado no bloquee compras.
           */
          productCost: 0,
          importCost: 0,
          otherCost: 0,
          minimumStock: 0,
          stock:
            snapshotDocument.data().inStock === true
              ? Number.MAX_SAFE_INTEGER
              : 0,
          inStock:
            snapshotDocument.data().inStock === true,
        }),
    );
  };

export const saveRemoteProduct =
  async (
    product: Product,
  ) => {
    const batch =
      writeBatch(db);

    batch.set(
      doc(
        db,
        "products",
        product.id,
      ),
      privateProductData(
        product,
      ),
    );

    if (product.active) {
      batch.set(
        doc(
          db,
          "catalog",
          product.id,
        ),
        publicProductData(
          product,
        ),
      );
    } else {
      batch.delete(
        doc(
          db,
          "catalog",
          product.id,
        ),
      );
    }

    await batch.commit();
  };

export const saveRemoteProducts =
  async (
    products: Product[],
  ) => {
    if (!products.length) {
      return;
    }

    /*
     * Cada producto genera como
     * máximo dos operaciones:
     *
     * products + catalog
     *
     * 200 productos =
     * máximo 400 operaciones.
     */
    const chunkSize = 200;

    for (
      let start = 0;
      start < products.length;
      start += chunkSize
    ) {
      const batch =
        writeBatch(db);

      const chunk =
        products.slice(
          start,
          start + chunkSize,
        );

      chunk.forEach(
        (product) => {
          batch.set(
            doc(
              db,
              "products",
              product.id,
            ),
            privateProductData(
              product,
            ),
          );

          if (product.active) {
            batch.set(
              doc(
                db,
                "catalog",
                product.id,
              ),
              publicProductData(
                product,
              ),
            );
          } else {
            batch.delete(
              doc(
                db,
                "catalog",
                product.id,
              ),
            );
          }
        },
      );

      await batch.commit();
    }
  };

export const deleteRemoteProduct =
  async (
    productId: string,
  ) => {
    const batch =
      writeBatch(db);

    batch.delete(
      doc(
        db,
        "products",
        productId,
      ),
    );

    batch.delete(
      doc(
        db,
        "catalog",
        productId,
      ),
    );

    await batch.commit();
  };

export const deleteRemoteProducts =
  async (
    productIds: string[],
  ) => {
    if (!productIds.length) {
      return;
    }

    const chunkSize = 200;

    for (
      let start = 0;
      start < productIds.length;
      start += chunkSize
    ) {
      const batch =
        writeBatch(db);

      productIds
        .slice(
          start,
          start + chunkSize,
        )
        .forEach(
          (productId) => {
            batch.delete(
              doc(
                db,
                "products",
                productId,
              ),
            );

            batch.delete(
              doc(
                db,
                "catalog",
                productId,
              ),
            );
          },
        );

      await batch.commit();
    }
  };
