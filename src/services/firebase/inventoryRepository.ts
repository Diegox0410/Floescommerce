import {
  collection,
  doc,
  getDocs,
  runTransaction,
} from "firebase/firestore";

import type {
  InventoryMovement,
  MovementInput,
} from "../../types/inventory";

import type {
  Product,
} from "../../types/product";

import {
  normalizeProduct,
} from "../../utils/normalization";

import {
  db,
} from "./firebase";

import {
  privateProductData,
  publicProductData,
} from "./productRepository";

export interface RemoteInventoryBatchResult {
  batchId: string;
  movements: InventoryMovement[];
  products: Product[];
  alreadyCommitted: boolean;
}

const inventoryMovementsCollection =
  collection(
    db,
    "inventoryMovements",
  );

const validateInput = (
  input: MovementInput,
) => {
  if (
    !Number.isInteger(
      input.quantity,
    ) ||
    input.quantity < 0 ||
    (
      input.type !==
        "adjustment" &&
      input.quantity === 0
    )
  ) {
    throw new Error(
      "Ingresa una cantidad entera válida.",
    );
  }

  if (!input.reason.trim()) {
    throw new Error(
      "El motivo es obligatorio.",
    );
  }

  if (input.createdAt) {
    if (
      !Number.isFinite(
        Date.parse(
          input.createdAt,
        ),
      )
    ) {
      throw new Error(
        "Fecha inválida.",
      );
    }
  }
};

const calculateNewStock = (
  previousStock: number,
  input: MovementInput,
) => {
  if (input.type === "in") {
    return (
      previousStock +
      input.quantity
    );
  }

  if (input.type === "out") {
    return (
      previousStock -
      input.quantity
    );
  }

  return input.quantity;
};

export const getRemoteInventoryMovements =
  async (): Promise<
    InventoryMovement[]
  > => {
    const snapshot =
      await getDocs(
        inventoryMovementsCollection,
      );

    return snapshot.docs
      .map((snapshotDocument) => {
        const data =
          snapshotDocument.data();

        return {
          id:
            snapshotDocument.id,
          batchId:
            String(
              data.batchId ?? "",
            ),
          productId:
            String(
              data.productId ?? "",
            ),
          productName:
            String(
              data.productName ?? "",
            ),
          type:
            data.type as
              InventoryMovement["type"],
          quantity:
            Number(
              data.quantity ?? 0,
            ),
          previousStock:
            Number(
              data.previousStock ?? 0,
            ),
          newStock:
            Number(
              data.newStock ?? 0,
            ),
          reason:
            String(
              data.reason ?? "",
            ),
          createdAt:
            String(
              data.createdAt ?? "",
            ),
        };
      })
      .filter(
        (movement) =>
          movement.id &&
          movement.batchId &&
          movement.productId &&
          [
            "in",
            "out",
            "adjustment",
          ].includes(
            movement.type,
          ) &&
          Number.isInteger(
            movement.quantity,
          ) &&
          Number.isInteger(
            movement.previousStock,
          ) &&
          Number.isInteger(
            movement.newStock,
          ),
      )
      .sort(
        (a, b) =>
          Date.parse(
            b.createdAt,
          ) -
          Date.parse(
            a.createdAt,
          ),
      );
  };

export const commitRemoteInventoryBatch =
  async (
    inputs: MovementInput[],
    batchId: string,
  ): Promise<
    RemoteInventoryBatchResult
  > => {
    if (!batchId.trim()) {
      throw new Error(
        "El batch de inventario es obligatorio.",
      );
    }

    if (!inputs.length) {
      throw new Error(
        "El movimiento está vacío.",
      );
    }

    inputs.forEach(
      validateInput,
    );

    const uniqueProductIds = [
      ...new Set(
        inputs.map(
          (input) =>
            input.productId,
        ),
      ),
    ];

    const batchRef = doc(
      db,
      "inventoryBatches",
      batchId,
    );

    return runTransaction(
      db,
      async (transaction) => {
        /*
         * Todas las lecturas deben
         * realizarse antes de comenzar
         * las escrituras.
         */
        const batchSnapshot =
          await transaction.get(
            batchRef,
          );

        if (
          batchSnapshot.exists()
        ) {
          const remoteMovements =
            await Promise.all(
              inputs.map(
                (_, index) =>
                  transaction.get(
                    doc(
                      db,
                      "inventoryMovements",
                      `${batchId}:${index}`,
                    ),
                  ),
              ),
            );

          const movements =
            remoteMovements
              .filter(
                (snapshot) =>
                  snapshot.exists(),
              )
              .map(
                (snapshot) => {
                  const data =
                    snapshot.data();

                  return {
                    id:
                      snapshot.id,
                    batchId:
                      String(
                        data.batchId ??
                          batchId,
                      ),
                    productId:
                      String(
                        data.productId ??
                          "",
                      ),
                    productName:
                      String(
                        data.productName ??
                          "",
                      ),
                    type:
                      data.type as
                        InventoryMovement["type"],
                    quantity:
                      Number(
                        data.quantity ??
                          0,
                      ),
                    previousStock:
                      Number(
                        data.previousStock ??
                          0,
                      ),
                    newStock:
                      Number(
                        data.newStock ??
                          0,
                      ),
                    reason:
                      String(
                        data.reason ??
                          "",
                      ),
                    createdAt:
                      String(
                        data.createdAt ??
                          "",
                      ),
                  };
                },
              );

          return {
            batchId,
            movements,
            products: [],
            alreadyCommitted: true,
          };
        }

        const productSnapshots =
          await Promise.all(
            uniqueProductIds.map(
              (productId) =>
                transaction.get(
                  doc(
                    db,
                    "products",
                    productId,
                  ),
                ),
            ),
          );

        const products =
          new Map<
            string,
            Product
          >();

        productSnapshots.forEach(
          (snapshot) => {
            if (
              !snapshot.exists()
            ) {
              throw new Error(
                "El producto ya no existe.",
              );
            }

            products.set(
              snapshot.id,
              normalizeProduct({
                ...snapshot.data(),
                id: snapshot.id,
              }),
            );
          },
        );

        const stocks =
          new Map(
            [...products.values()].map(
              (product) => [
                product.id,
                product.stock,
              ],
            ),
          );

        const now =
          new Date().toISOString();

        const movements =
          inputs.map(
            (
              input,
              index,
            ): InventoryMovement => {
              const product =
                products.get(
                  input.productId,
                );

              if (!product) {
                throw new Error(
                  "El producto ya no existe.",
                );
              }

              const previousStock =
                stocks.get(
                  product.id,
                );

              if (
                previousStock ===
                undefined
              ) {
                throw new Error(
                  "No se pudo determinar el stock actual.",
                );
              }

              const newStock =
                calculateNewStock(
                  previousStock,
                  input,
                );

              if (
                newStock < 0
              ) {
                throw new Error(
                  `Stock insuficiente para ${product.name}. Disponible: ${previousStock}.`,
                );
              }

              stocks.set(
                product.id,
                newStock,
              );

              return {
                id:
                  `${batchId}:${index}`,
                batchId,
                productId:
                  product.id,
                productName:
                  product.name,
                type:
                  input.type,
                quantity:
                  input.quantity,
                previousStock,
                newStock,
                reason:
                  input.reason.trim(),
                createdAt:
                  input.createdAt ??
                  now,
              };
            },
          );

        const updatedProducts =
          [...products.values()].map(
            (product) => {
              const stock =
                stocks.get(
                  product.id,
                );

              return normalizeProduct({
                ...product,
                stock:
                  stock ??
                  product.stock,
                updatedAt: now,
              });
            },
          );

        /*
         * A partir de aquí comienzan
         * las escrituras de la
         * transacción.
         */
        updatedProducts.forEach(
          (product) => {
            transaction.set(
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
              transaction.set(
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
              transaction.delete(
                doc(
                  db,
                  "catalog",
                  product.id,
                ),
              );
            }
          },
        );

        movements.forEach(
          (movement) => {
            transaction.set(
              doc(
                db,
                "inventoryMovements",
                movement.id,
              ),
              movement,
            );
          },
        );

        transaction.set(
          batchRef,
          {
            batchId,
            movementIds:
              movements.map(
                (movement) =>
                  movement.id,
              ),
            createdAt: now,
          },
        );

        return {
          batchId,
          movements,
          products:
            updatedProducts,
          alreadyCommitted: false,
        };
      },
    );
  };