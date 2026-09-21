import {
  create,
} from "zustand";

import type {
  Order,
  OrderStatus,
  PaymentStatus,
} from "../types/order";

import {
  enrichRemoteOrderCosts,
  getRemoteOrders,
  saveRemoteOrder,
} from "../services/firebase/orderRepository";

import {
  normalizeOrder,
} from "../utils/normalization";

import {
  useInventoryStore,
} from "./inventoryStore";

import {
  useCustomerStore,
} from "./customerStore";

import {
  registerProductDeletionGuard,
} from "./productStore";

interface OrderStore {
  orders: Order[];

  remoteLoading: boolean;
  remoteReady: boolean;
  remoteError: string | null;

  loadRemoteOrders:
    () => Promise<void>;

  upsertRemoteOrder: (
    order: Order,
  ) => void;

  updateOrderStatus: (
    id: string,
    status: OrderStatus,
  ) => Promise<void>;

  updatePaymentStatus: (
    id: string,
    status: PaymentStatus,
  ) => Promise<void>;

  updateOrder: (
    id: string,
    input: Partial<
      Pick<
        Order,
        | "shipping"
        | "shippingCost"
        | "discount"
        | "notes"
      >
    >,
  ) => Promise<void>;

  addOrderNote: (
    id: string,
    note: string,
  ) => Promise<void>;

  cancelOrder: (
    id: string,
  ) => Promise<void>;

  clearRemoteError:
    () => void;
}

const sortOrders = (
  orders: Order[],
) =>
  [...orders].sort(
    (a, b) =>
      Date.parse(
        b.createdAt,
      ) -
      Date.parse(
        a.createdAt,
      ),
  );

const replaceOrder = (
  orders: Order[],
  order: Order,
) =>
  sortOrders([
    order,
    ...orders.filter(
      (current) =>
        current.id !== order.id,
    ),
  ]);

export const useOrderStore =
  create<OrderStore>()(
    (set, get) => ({
      orders: [],

      remoteLoading: false,
      remoteReady: false,
      remoteError: null,

      loadRemoteOrders:
        async () => {
          set({
            remoteLoading: true,
            remoteError: null,
          });

          try {
            const remoteOrders =
              await getRemoteOrders();

            const enrichedOrders =
              await Promise.all(
                remoteOrders.map(
                  async (
                    order,
                  ) => {
                    const needsCosts =
                      order.items.some(
                        (item) =>
                          item.cost ===
                          0,
                      );

                    if (
                      !needsCosts
                    ) {
                      return order;
                    }

                    return enrichRemoteOrderCosts(
                      order.id,
                    );
                  },
                ),
              );

            /*
             * AdminCustomerBootstrap se
             * ejecuta antes que este
             * bootstrap.
             *
             * Por tanto aquí ya tenemos
             * disponibles los clientes
             * remotos existentes.
             *
             * Cada pedido se vincula con
             * su cliente y customerId se
             * persiste también en
             * /orders.
             */
            const linkedOrders:
              Order[] = [];

            for (
              const order of
              enrichedOrders
            ) {
              try {
                const customerId =
                  await useCustomerStore
                    .getState()
                    .upsertCustomerFromOrder(
                      order,
                    );

                if (
                  order.customerId !==
                  customerId
                ) {
                  const linkedOrder =
                    normalizeOrder({
                      ...order,

                      customerId,

                      updatedAt:
                        new Date()
                          .toISOString(),
                    });

                  await saveRemoteOrder(
                    linkedOrder,
                  );

                  linkedOrders.push(
                    linkedOrder,
                  );
                } else {
                  linkedOrders.push(
                    order,
                  );
                }
              } catch {
                /*
                 * Un problema aislado del
                 * CRM no debe impedir que
                 * el OWNER vea sus pedidos.
                 */
                linkedOrders.push(
                  order,
                );
              }
            }

            set({
              orders:
                sortOrders(
                  linkedOrders,
                ),

              remoteLoading:
                false,

              remoteReady:
                true,

              remoteError:
                null,
            });
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "No se pudieron cargar los pedidos.";

            set({
              remoteLoading:
                false,

              remoteReady:
                false,

              remoteError:
                message,
            });

            throw error;
          }
        },

      upsertRemoteOrder:
        (order) =>
          set(
            (state) => ({
              orders:
                replaceOrder(
                  state.orders,
                  normalizeOrder(
                    order,
                  ),
                ),
            }),
          ),

      updateOrderStatus:
        async (
          id,
          status,
        ) => {
          const order =
            get().orders.find(
              (current) =>
                current.id === id,
            );

          if (!order) {
            throw new Error(
              "Pedido no encontrado.",
            );
          }

          if (
            order.orderStatus ===
            status
          ) {
            return;
          }

          if (
            order.orderStatus ===
            "cancelled"
          ) {
            throw new Error(
              "Un pedido cancelado no se puede reabrir.",
            );
          }

          let committed =
            order.inventoryCommitted;

          if (
            status ===
              "confirmed" &&
            !committed
          ) {
            await useInventoryStore
              .getState()
              .commitBatch(
                order.items.map(
                  (item) => ({
                    productId:
                      item.productId,

                    variantId:
                      item.variantId,

                    type:
                      "out",

                    quantity:
                      item.quantity,

                    reason:
                      `Confirmación ${order.id}`,
                  }),
                ),

                `order:${id}:commit`,
              );

            committed = true;
          }

          if (
            [
              "preparing",
              "shipped",
              "delivered",
            ].includes(
              status,
            ) &&
            !committed
          ) {
            throw new Error(
              "Confirma el pedido antes de prepararlo o enviarlo.",
            );
          }

          if (
            status === "new" &&
            committed
          ) {
            throw new Error(
              "Un pedido confirmado no puede volver a nuevo. Cancélalo para reponer stock.",
            );
          }

          if (
            status ===
              "cancelled" &&
            committed
          ) {
            await useInventoryStore
              .getState()
              .commitBatch(
                order.items.map(
                  (item) => ({
                    productId:
                      item.productId,

                    variantId:
                      item.variantId,

                    type:
                      "in",

                    quantity:
                      item.quantity,

                    reason:
                      `Cancelación ${order.id}`,
                  }),
                ),

                `order:${id}:restore`,
              );

            committed = false;
          }

          const updated =
            normalizeOrder({
              ...order,

              orderStatus:
                status,

              inventoryCommitted:
                committed,

              updatedAt:
                new Date()
                  .toISOString(),
            });

          await saveRemoteOrder(
            updated,
          );

          set(
            (state) => ({
              orders:
                replaceOrder(
                  state.orders,
                  updated,
                ),
            }),
          );
        },

      updatePaymentStatus:
        async (
          id,
          paymentStatus,
        ) => {
          const order =
            get().orders.find(
              (current) =>
                current.id === id,
            );

          if (!order) {
            throw new Error(
              "Pedido no encontrado.",
            );
          }

          const updated =
            normalizeOrder({
              ...order,

              paymentStatus,

              updatedAt:
                new Date()
                  .toISOString(),
            });

          await saveRemoteOrder(
            updated,
          );

          set(
            (state) => ({
              orders:
                replaceOrder(
                  state.orders,
                  updated,
                ),
            }),
          );
        },

      updateOrder:
        async (
          id,
          input,
        ) => {
          const order =
            get().orders.find(
              (current) =>
                current.id === id,
            );

          if (!order) {
            throw new Error(
              "Pedido no encontrado.",
            );
          }

          const updated =
            normalizeOrder({
              ...order,
              ...input,

              updatedAt:
                new Date()
                  .toISOString(),
            });

          await saveRemoteOrder(
            updated,
          );

          set(
            (state) => ({
              orders:
                replaceOrder(
                  state.orders,
                  updated,
                ),
            }),
          );
        },

      addOrderNote:
        async (
          id,
          note,
        ) => {
          const clean =
            note.trim();

          if (!clean) {
            return;
          }

          const order =
            get().orders.find(
              (current) =>
                current.id === id,
            );

          if (!order) {
            throw new Error(
              "Pedido no encontrado.",
            );
          }

          await get().updateOrder(
            id,
            {
              notes: [
                ...order.notes,
                clean,
              ],
            },
          );
        },

      cancelOrder:
        async (
          id,
        ) => {
          await get()
            .updateOrderStatus(
              id,
              "cancelled",
            );
        },

      clearRemoteError:
        () =>
          set({
            remoteError: null,
          }),
    }),
  );

registerProductDeletionGuard(
  (id) =>
    !useOrderStore
      .getState()
      .orders.some(
        (order) =>
          order.orderStatus !==
            "cancelled" &&
          order.items.some(
            (item) =>
              item.productId ===
              id,
          ),
      ),
);
