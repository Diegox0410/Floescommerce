import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";

import { useProductStore } from "../../store/productStore";

import { fetchChopifyCatalog } from "../../services/chopify/catalog";
import { canPurchase } from "../../services/chopify/catalog";
import { useCartStore } from "../../store/cartStore";
import { useStoreConfigStore } from "../../store/storeConfigStore";
import { applyPublicStoreConfig, fetchPublicStoreConfig } from "../../services/chopify/storeConfig";

interface ProductCatalogBootstrapProps {
  children: ReactNode;
}

export function ProductCatalogBootstrap({
  children,
}: ProductCatalogBootstrapProps) {
  const { pathname } = useLocation();
  const [publicConfigError, setPublicConfigError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;

    const load = async () => {
      useProductStore.getState().beginRemoteLoad("catalog");

      const catalogRequest = fetchChopifyCatalog().then((products) => {
        if (!active) return;

        useProductStore.getState().setRemoteProducts(products, "catalog");

        const catalog = new Map(products.map((product) => [product.id, product]));
        const cart = useCartStore.getState();
        cart.items.forEach((item) => {
          const product = catalog.get(item.product.id);
          const variant = item.variant ? product?.variants.find((entry) => entry.id === item.variant?.id) : undefined;
          if (!product || !canPurchase(product, variant, item.size)) cart.removeItem(item.lineId);
        });
      }).catch((error: unknown) => {
        if (!active) return;
        useProductStore.getState().setRemoteError(
          error instanceof Error ? error.message : "No se pudo cargar el catálogo.",
          "catalog",
        );
      });

      const configRequest = fetchPublicStoreConfig().then((publicConfig) => {
        if (!active) return;
        const configStore = useStoreConfigStore.getState();
        configStore.setConfig(applyPublicStoreConfig(configStore.config, publicConfig));
        setPublicConfigError(null);
      }).catch((error: unknown) => {
        if (!active) return;
        setPublicConfigError(error instanceof Error ? error.message : "No se pudo cargar la configuración pública de FLOES.");
      });

      await Promise.allSettled([catalogRequest, configRequest]);
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const state = useProductStore();
  const isEditorialHome = pathname === "/";
  const isCatalogListing = pathname === "/catalogo";

  if (!isEditorialHome && !isCatalogListing && (state.remoteLoading || (!state.remoteReady && !state.remoteError))) {
    return <main className="product-not-found catalog-bootstrap-state" role="status" aria-live="polite"><div className="container"><span className="eyebrow">CATÁLOGO</span><h1>Cargando catálogo…</h1><p>Estamos consultando los modelos y su disponibilidad.</p><span className="catalog-loading-indicator" aria-hidden="true" /></div></main>;
  }
  if (!isEditorialHome && !isCatalogListing && state.remoteError) {
    return <main className="product-not-found catalog-bootstrap-state is-error"><div className="container"><span className="eyebrow">CATÁLOGO</span><h1>El catálogo no está disponible.</h1><p>{state.remoteError}</p><button type="button" onClick={() => window.location.reload()}>Reintentar</button></div></main>;
  }
  return <>
    {publicConfigError && <div className="public-config-error" role="alert"><div className="container"><strong>Algunas opciones de contacto podrían no estar disponibles.</strong><span>{publicConfigError}</span></div></div>}
    {children}
  </>;
}
