import { useMemo } from "react";
import { useCartStore } from "./cartStore";
import { useProductStore } from "./productStore";
import { useMarketingStore } from "./marketingStore";
import { promotionalPrice } from "../utils/storefront";
// Preserve old cart entries but render current catalog data whenever available.
export function useCartItems() {
  const items = useCartStore((s) => s.items),
    products = useProductStore((s) => s.products),
    promotions = useMarketingStore((s) => s.promotions);
  return useMemo(
    () =>
      items.map((i) => ({
        ...i,
        product: (() => { const product = products.find((p) => p.id === i.product.id) ?? i.product; return { ...product, price: promotionalPrice(product, promotions) }; })(),
      })),
    [items, products, promotions],
  );
}
