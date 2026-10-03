import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Order } from "../types/order";

import { createChopifyOrder } from "../services/chopify/orders";

import {
  record,
  text,
} from "../utils/normalization";

interface CheckoutStore {
  lastOrderId: string | null;
  lastOrder: Order | null;
  saving: boolean;
  saveError: string | null;

  saveOrder: (
    order: Order,
  ) => Promise<Order>;

  clearLastOrder: () => void;
  clearSaveError: () => void;
}

const hydrate = (
  value: unknown,
) => {
  const state =
    record(value);

  /*
   * Compatibilidad con la versión
   * antigua del storage.
   *
   * Ya NO reconstruimos pedidos
   * dentro de hydrate porque la
   * persistencia autoritativa vive
   * en Chopify.
   */
  const legacyOrder =
    record(state.lastOrder);

  const legacyOrderId =
    text(legacyOrder.id);

  return {
    lastOrderId:
      text(
        state.lastOrderId,
      ) ||
      legacyOrderId ||
      null,
    lastOrder:
      Object.keys(legacyOrder).length
        ? legacyOrder as unknown as Order
        : null,
  };
};

export const useCheckoutStore =
  create<CheckoutStore>()(
    persist(
      (set) => ({
        lastOrderId: null,
        lastOrder: null,
        saving: false,
        saveError: null,

        saveOrder: async (
          order,
        ) => {
          set({
            saving: true,
            saveError: null,
          });

          try {
            const saved =
              await createChopifyOrder(
                order,
              );

            set({
              lastOrderId:
                saved.id,
              lastOrder: saved,
              saving: false,
              saveError: null,
            });

            return saved;
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "No se pudo registrar el pedido.";

            set({
              saving: false,
              saveError: message,
            });

            throw error;
          }
        },

        clearLastOrder: () =>
          set({
            lastOrderId: null,
            lastOrder: null,
          }),

        clearSaveError: () =>
          set({
            saveError: null,
          }),
      }),
      {
        name:
          "floes-last-order",
        version: 2,

        partialize: (
          state,
        ) => ({
          lastOrderId:
            state.lastOrderId,
          lastOrder:
            state.lastOrder,
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
