import {
  create,
} from "zustand";

import type {
  Customer,
} from "../types/customer";

import type {
  Order,
} from "../types/order";

import {
  getRemoteCustomers,
  saveRemoteCustomer,
} from "../services/firebase/customerRepository";

import {
  normalizeCustomer,
} from "../utils/normalization";

interface CustomerStore {
  customers: Customer[];

  remoteLoading: boolean;
  remoteReady: boolean;
  remoteError: string | null;

  loadRemoteCustomers:
    () => Promise<void>;

  upsertCustomerFromOrder: (
    order: Order,
  ) => Promise<string>;

  updateCustomer: (
    id: string,
    input: Partial<
      Omit<
        Customer,
        "id" | "createdAt"
      >
    >,
  ) => Promise<void>;

  addCustomerNote: (
    id: string,
    note: string,
  ) => Promise<void>;

  addTag: (
    id: string,
    tag: string,
  ) => Promise<void>;

  removeTag: (
    id: string,
    tag: string,
  ) => Promise<void>;

  clearRemoteError:
    () => void;
}

const normalizePhone = (
  value: string,
) =>
  value.replace(
    /\D/g,
    "",
  );

const replaceCustomer = (
  customers: Customer[],
  customer: Customer,
) => [
  customer,
  ...customers.filter(
    (current) =>
      current.id !== customer.id,
  ),
];

export const useCustomerStore =
  create<CustomerStore>()(
    (set, get) => ({
      customers: [],

      remoteLoading: false,
      remoteReady: false,
      remoteError: null,

      loadRemoteCustomers:
        async () => {
          set({
            remoteLoading: true,
            remoteError: null,
          });

          try {
            const customers =
              await getRemoteCustomers();

            set({
              customers,
              remoteLoading: false,
              remoteReady: true,
              remoteError: null,
            });
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "No se pudieron cargar los clientes.";

            set({
              remoteLoading: false,
              remoteReady: false,
              remoteError:
                message,
            });

            throw error;
          }
        },

      upsertCustomerFromOrder:
        async (
          order,
        ) => {
          const email =
            order.customer.email
              .trim()
              .toLowerCase();

          const phone =
            normalizePhone(
              order.customer.phone,
            );

          /*
           * Si el pedido ya está
           * vinculado a un cliente,
           * ese vínculo es la autoridad.
           *
           * Esto evita generar otro
           * customerId al volver a
           * procesar el mismo pedido.
           */
          const linkedCustomer =
            order.customerId
              ? get().customers.find(
                  (customer) =>
                    customer.id ===
                    order.customerId,
                )
              : undefined;

          /*
           * Para pedidos todavía sin
           * customerId buscamos una
           * coincidencia existente por
           * email o teléfono.
           */
          const matchingCustomer =
            get().customers.find(
              (customer) =>
                (
                  email &&
                  customer.email
                    .trim()
                    .toLowerCase() ===
                    email
                ) ||
                (
                  phone &&
                  normalizePhone(
                    customer.phone,
                  ) === phone
                ),
            );

          const existing =
            linkedCustomer ??
            matchingCustomer;

          /*
           * Si el pedido ya contiene
           * customerId, conservamos
           * exactamente ese ID incluso
           * si el documento aún no
           * estuviera cargado.
           */
          const customerId =
            order.customerId ??
            existing?.id ??
            crypto.randomUUID();

          const now =
            new Date()
              .toISOString();

          const customer =
            normalizeCustomer({
              ...existing,

              id:
                customerId,

              ...order.customer,

              email,

              province:
                order.shipping.province,

              city:
                order.shipping.city,

              address:
                order.shipping.address,

              tags:
                existing?.tags ??
                ["Nuevo"],

              notes:
                existing?.notes ??
                [],

              createdAt:
                existing?.createdAt ??
                order.createdAt,

              updatedAt:
                now,
            });

          await saveRemoteCustomer(
            customer,
          );

          set(
            (state) => ({
              customers:
                replaceCustomer(
                  state.customers,
                  customer,
                ),
            }),
          );

          return customer.id;
        },

      updateCustomer:
        async (
          id,
          input,
        ) => {
          const customer =
            get().customers.find(
              (current) =>
                current.id === id,
            );

          if (!customer) {
            throw new Error(
              "Cliente no encontrado.",
            );
          }

          const updated =
            normalizeCustomer({
              ...customer,
              ...input,

              id:
                customer.id,

              createdAt:
                customer.createdAt,

              updatedAt:
                new Date()
                  .toISOString(),
            });

          await saveRemoteCustomer(
            updated,
          );

          set(
            (state) => ({
              customers:
                replaceCustomer(
                  state.customers,
                  updated,
                ),
            }),
          );
        },

      addCustomerNote:
        async (
          id,
          note,
        ) => {
          const clean =
            note.trim();

          if (!clean) {
            return;
          }

          const customer =
            get().customers.find(
              (current) =>
                current.id === id,
            );

          if (!customer) {
            throw new Error(
              "Cliente no encontrado.",
            );
          }

          await get().updateCustomer(
            id,
            {
              notes: [
                ...customer.notes,
                clean,
              ],
            },
          );
        },

      addTag:
        async (
          id,
          tag,
        ) => {
          const clean =
            tag.trim();

          if (!clean) {
            return;
          }

          const customer =
            get().customers.find(
              (current) =>
                current.id === id,
            );

          if (!customer) {
            throw new Error(
              "Cliente no encontrado.",
            );
          }

          const exists =
            customer.tags.some(
              (current) =>
                current
                  .toLowerCase() ===
                clean.toLowerCase(),
            );

          if (exists) {
            return;
          }

          await get().updateCustomer(
            id,
            {
              tags: [
                ...customer.tags,
                clean,
              ],
            },
          );
        },

      removeTag:
        async (
          id,
          tag,
        ) => {
          const customer =
            get().customers.find(
              (current) =>
                current.id === id,
            );

          if (!customer) {
            throw new Error(
              "Cliente no encontrado.",
            );
          }

          await get().updateCustomer(
            id,
            {
              tags:
                customer.tags.filter(
                  (current) =>
                    current !== tag,
                ),
            },
          );
        },

      clearRemoteError:
        () =>
          set({
            remoteError: null,
          }),
    }),
  );