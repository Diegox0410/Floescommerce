import type { CartItem } from "./cartStore";
import { catalogPrice } from "../services/chopify/catalog";

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
      catalogPrice(item.product, item.variant) *
        item.quantity,
    0
  );
}
