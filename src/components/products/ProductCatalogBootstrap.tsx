import {
  useEffect,
  type ReactNode,
} from "react";

import { useProductStore } from "../../store/productStore";

import { fetchChopifyCatalog } from "../../services/chopify/catalog";
import { canPurchase } from "../../services/chopify/catalog";
import { useCartStore } from "../../store/cartStore";

interface ProductCatalogBootstrapProps {
  children: ReactNode;
}

export function ProductCatalogBootstrap({
  children,
}: ProductCatalogBootstrapProps) {
  useEffect(() => {
    let active = true;

    const load = async () => {
      const store =
        useProductStore.getState();

      store.beginRemoteLoad("catalog");

      try {
        const products =
          await fetchChopifyCatalog();

        if (!active) return;

        useProductStore
          .getState()
          .setRemoteProducts(
            products,
            "catalog",
          );

        const catalog = new Map(products.map((product) => [product.id, product]));
        const cart = useCartStore.getState();
        cart.items.forEach((item) => {
          const product = catalog.get(item.product.id);
          const variant = item.variant ? product?.variants.find((entry) => entry.id === item.variant?.id) : undefined;
          if (!product || !canPurchase(product, variant)) cart.removeItem(item.lineId);
        });
      } catch (error) {
        if (!active) return;

        useProductStore
          .getState()
          .setRemoteError(
            error instanceof Error
              ? error.message
              : "No se pudo cargar el catálogo.",
            "catalog",
          );

      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const state = useProductStore();
  if (state.remoteLoading || (!state.remoteReady && !state.remoteError)) {
    return <main className="product-not-found"><div className="container"><h1>Cargando catálogo…</h1></div></main>;
  }
  if (state.remoteError) {
    return <main className="product-not-found"><div className="container"><h1>El catálogo no está disponible.</h1><p>{state.remoteError}</p><button type="button" onClick={() => window.location.reload()}>Reintentar</button></div></main>;
  }
  return <>{children}</>;
}
