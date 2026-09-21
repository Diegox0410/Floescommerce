import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Order } from "../types/order";

import {
  createRemoteOrder,
} from "../services/firebase/orderRepository";

import {
  record,
  text,
} from "../utils/normalization";

import {
  useOrderStore,
} from "./orderStore";

interface CheckoutStore {
  lastOrderId: string | null;
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
   * en Firestore.
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
  };
};

export const useCheckoutStore =
  create<CheckoutStore>()(
    persist(
      (set) => ({
        lastOrderId: null,
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
              await createRemoteOrder(
                order,
              );

            /*
             * Mantener el pedido recién
             * creado disponible en esta
             * sesión sin convertirlo en
             * persistencia local.
             */
            useOrderStore
              .getState()
              .upsertRemoteOrder(
                saved,
              );

            set({
              lastOrderId:
                saved.id,
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