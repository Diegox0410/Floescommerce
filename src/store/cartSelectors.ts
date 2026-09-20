import type { CartItem } from "./cartStore";

export function getCartQuantity(
  items: CartItem[]
) {
  return items.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );
}

export function getCartSubtotal(
  items: CartItem[]
) {
  return items.reduce(
    (total, item) =>
      total +
      item.product.price *
        item.quantity,
    0
  );
}