import { useMemo } from "react";
import { useCartStore } from "./cartStore";
import { useProductStore } from "./productStore";
import { canPurchase, variantSizes } from "../services/chopify/catalog";
// Preserve old cart entries but render current catalog data whenever available.
export function useCartItems() {
  const items = useCartStore((s) => s.items),
    products = useProductStore((s) => s.products),
    remoteReady = useProductStore((s) => s.remoteReady);
  return useMemo(
    () =>
      items.flatMap((i) => {
        const current = products.find((p) => p.id === i.product.id);
        if (remoteReady && !current) return [];
        const product = current ?? i.product;
        const variant = i.variant ? product.variants.find((entry) => entry.id === i.variant?.id) : undefined;
        if (remoteReady && (!canPurchase(product, variant, i.size) || (i.variant && !variant) || (variant && variantSizes(variant).length && !variantSizes(variant).includes(i.size ?? variant.size ?? "")))) return [];
        return [{
        ...i,
        product,
        variant,
      }]; }),
    [items, products, remoteReady],
  );
}
