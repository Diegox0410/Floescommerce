import {
  useEffect,
  type ReactNode,
} from "react";

import { useProductStore } from "../../store/productStore";

import { getPublicCatalog } from "../../services/firebase/productRepository";

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
          await getPublicCatalog();

        if (!active) return;

        useProductStore
          .getState()
          .setRemoteProducts(
            products,
            "catalog",
          );
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

        console.error(
          "FLOES catalog bootstrap:",
          error,
        );
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  return <>{children}</>;
}