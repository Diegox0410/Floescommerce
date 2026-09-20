import { normalizeProduct, record } from "../utils/normalization";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Product } from "../types/product";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;

  addItem: (
    product: Product,
    quantity?: number
  ) => void;

  removeItem: (
    productId: string
  ) => void;

  increaseQuantity: (
    productId: string
  ) => void;

  decreaseQuantity: (
    productId: string
  ) => void;

  setQuantity: (
    productId: string,
    quantity: number
  ) => void;

  clearCart: () => void;

  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      addItem: (
        product,
        quantity = 1
      ) =>
        set((state) => {
          const existingItem =
            state.items.find(
              (item) =>
                item.product.id ===
                product.id
            );

          if (existingItem) {
            return {
              items: state.items.map(
                (item) =>
                  item.product.id ===
                  product.id
                    ? {
                        ...item,
                        quantity:
                          item.quantity +
                          quantity,
                      }
                    : item
              ),
              isOpen: true,
            };
          }

          return {
            items: [
              ...state.items,
              {
                product,
                quantity,
              },
            ],
            isOpen: true,
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter(
            (item) =>
              item.product.id !==
              productId
          ),
        })),

      increaseQuantity: (productId) =>
        set((state) => ({
          items: state.items.map(
            (item) =>
              item.product.id ===
              productId
                ? {
                    ...item,
                    quantity:
                      item.quantity + 1,
                  }
                : item
          ),
        })),

      decreaseQuantity: (productId) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.product.id ===
              productId
                ? {
                    ...item,
                    quantity:
                      item.quantity - 1,
                  }
                : item
            )
            .filter(
              (item) =>
                item.quantity > 0
            ),
        })),

      setQuantity: (
        productId,
        quantity
      ) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.product.id ===
              productId
                ? {
                    ...item,
                    quantity,
                  }
                : item
            )
            .filter(
              (item) =>
                item.quantity > 0
            ),
        })),

      clearCart: () =>
        set({
          items: [],
        }),

      openCart: () =>
        set({
          isOpen: true,
        }),

      closeCart: () =>
        set({
          isOpen: false,
        }),

      toggleCart: () =>
        set((state) => ({
          isOpen: !state.isOpen,
        })),
    }),
    {
      name: "commerce-builder-cart",
      merge: (persisted, current) => {
        const state=record(persisted);
        const entries=Array.isArray(state.items)?state.items:[];
        const items=entries.map(value => {const entry=record(value);return {product:normalizeProduct(entry.product),quantity:typeof entry.quantity==='number'?entry.quantity:0};}).filter(i=>Number.isInteger(i.quantity)&&i.quantity>0);
        return {...current,items};
      },

      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);