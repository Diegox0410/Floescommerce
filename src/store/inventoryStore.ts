import {
  create,
} from "zustand";

import type {
  InventoryMovement,
  MovementInput,
} from "../types/inventory";

import {
  commitRemoteInventoryBatch,
  getRemoteInventoryMovements,
} from "../services/firebase/inventoryRepository";

import {
  useProductStore,
} from "./productStore";

interface InventoryStore {
  movements: InventoryMovement[];

  remoteLoading: boolean;
  remoteReady: boolean;
  remoteError: string | null;

  loadRemoteMovements:
    () => Promise<void>;

  createMovement: (
    input: MovementInput,
  ) => Promise<void>;

  commitBatch: (
    inputs: MovementInput[],
    batchId: string,
  ) => Promise<void>;

  clearRemoteError: () => void;
}

const mergeMovements = (
  current: InventoryMovement[],
  incoming: InventoryMovement[],
) => {
  const movements =
    new Map<
      string,
      InventoryMovement
    >();

  current.forEach(
    (movement) => {
      movements.set(
        movement.id,
        movement,
      );
    },
  );

  incoming.forEach(
    (movement) => {
      movements.set(
        movement.id,
        movement,
      );
    },
  );

  return [
    ...movements.values(),
  ].sort(
    (a, b) =>
      Date.parse(
        b.createdAt,
      ) -
      Date.parse(
        a.createdAt,
      ),
  );
};

export const useInventoryStore =
  create<InventoryStore>()(
    (set, get) => ({
      movements: [],

      remoteLoading: false,
      remoteReady: false,
      remoteError: null,

      clearRemoteError: () => {
        set({
          remoteError: null,
        });
      },

      loadRemoteMovements:
        async () => {
          set({
            remoteLoading: true,
            remoteError: null,
          });

          try {
            const movements =
              await getRemoteInventoryMovements();

            set({
              movements,
              remoteLoading: false,
              remoteReady: true,
              remoteError: null,
            });
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "No se pudieron cargar los movimientos de inventario.";

            set({
              remoteLoading: false,
              remoteReady: false,
              remoteError:
                message,
            });

            throw error;
          }
        },

      createMovement:
        async (input) => {
          await get().commitBatch(
            [input],
            crypto.randomUUID(),
          );
        },

      commitBatch:
        async (
          inputs,
          batchId,
        ) => {
          if (
            get().movements.some(
              (movement) =>
                movement.batchId ===
                batchId,
            )
          ) {
            return;
          }

          set({
            remoteLoading: true,
            remoteError: null,
          });

          try {
            const result =
              await commitRemoteInventoryBatch(
                inputs,
                batchId,
              );

            /*
             * Si fue un batch nuevo,
             * Firestore devuelve los
             * productos con el stock
             * definitivo.
             */
            result.products.forEach(
              (product) => {
                useProductStore
                  .getState()
                  .upsertRemoteProduct(
                    product,
                  );
              },
            );

            /*
             * En un retry ya confirmado
             * los movimientos se recuperan
             * sin volver a aplicar stock.
             */
            set((state) => ({
              movements:
                mergeMovements(
                  state.movements,
                  result.movements,
                ),
              remoteLoading:
                false,
              remoteReady: true,
              remoteError: null,
            }));
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "No se pudo guardar el movimiento de inventario.";

            set({
              remoteLoading: false,
              remoteError:
                message,
            });

            throw error;
          }
        },
    }),
  );