import { normalizeProduct, record } from "../utils/normalization";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Product, ProductVariant } from "../types/product";
import { availableQuantityForSize, canPurchase, variantSizes } from "../services/chopify/catalog";

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: ProductVariant;
  size?: string;
  lineId: string;
}

export const cartLineId = (productId: string, variantId?: string, size?: string) =>
  [productId, variantId, size].filter(Boolean).join("::");

interface CartStore {
  items: CartItem[];
  isOpen: boolean;

  addItem: (
    product: Product,
    quantity?: number,
    variant?: ProductVariant,
    size?: string,
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
        quantity = 1,
        variant,
        size,
      ) =>
        set((state) => {
          const selectedSize = (size || variant?.size)?.trim().toUpperCase();
          if (!canPurchase(product, variant, selectedSize) || !Number.isInteger(quantity) || quantity < 1) return state;
          if (product.variants.length && !variant) return state;
          if (variant && variantSizes(variant).length && !variantSizes(variant).includes(selectedSize ?? "")) return state;
          const maximum = variant?.fulfillmentMode === "STOCK" ? availableQuantityForSize(variant, selectedSize) : null;
          if (maximum !== null && maximum !== undefined && quantity > maximum) return state;
          const lineId = cartLineId(product.id, variant?.id, selectedSize);
          const existingItem =
            state.items.find(
              (item) => item.lineId === lineId
            );

          if (existingItem) {
            if (maximum !== null && maximum !== undefined && existingItem.quantity + quantity > maximum) return state;
            return {
              items: state.items.map(
                (item) =>
                  item.lineId === lineId
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
                variant,
                size: selectedSize,
                lineId,
              },
            ],
            isOpen: true,
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter(
            (item) =>
              item.lineId !== productId
          ),
        })),

      increaseQuantity: (productId) =>
        set((state) => ({items:state.items.map(item=>{
          if(item.lineId!==productId)return item;
          const maximum=item.variant?.fulfillmentMode==='STOCK'?availableQuantityForSize(item.variant,item.size):null;
          return maximum!==null&&maximum!==undefined&&item.quantity>=maximum?item:{...item,quantity:item.quantity+1};
        })})),

      decreaseQuantity: (productId) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.lineId === productId
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
              item.lineId === productId
                ? {
                    ...item,
                    quantity: item.variant?.fulfillmentMode==='STOCK'
                      ? Math.min(Math.max(0,Math.floor(quantity)),availableQuantityForSize(item.variant,item.size)??0)
                      : Math.max(0,Math.floor(quantity)),
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
      name: "floes-cart",
      merge: (persisted, current) => {
        const state=record(persisted);
        const entries=Array.isArray(state.items)?state.items:[];
        const items=entries.map(value => {const entry=record(value);const product=normalizeProduct(entry.product);const variantId=typeof record(entry.variant).id==='string'?String(record(entry.variant).id):undefined;const variant=product.variants.find(v=>v.id===variantId);const size=typeof entry.size==='string'?entry.size:variant?.size;return {product,variant,size,lineId:cartLineId(product.id,variant?.id,size),quantity:typeof entry.quantity==='number'?entry.quantity:0};}).filter(i=>Number.isInteger(i.quantity)&&i.quantity>0);
        return {...current,items};
      },

      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);
