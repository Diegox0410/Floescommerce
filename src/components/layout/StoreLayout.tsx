import {
  useEffect,
  useState,
} from "react";

import {
  Outlet,
} from "react-router-dom";

import { useStoreConfigStore } from "../../store/storeConfigStore";

import {
  ProductCatalogBootstrap,
} from "../products/ProductCatalogBootstrap";

import {
  AnnouncementBar,
} from "./AnnouncementBar";

import {
  Header,
} from "./Header";

import {
  Footer,
} from "./Footer";

import {
  CartDrawer,
} from "../cart/CartDrawer";

import {
  SearchOverlay,
} from "../search/SearchOverlay";

export function StoreLayout() {
  const config =
    useStoreConfigStore(
      (state) => state.config,
    );

  const seo = config.seo;

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);

  useEffect(() => {
    document.title =
      seo.siteTitle;

    const meta =
      document.querySelector<HTMLMetaElement>(
        'meta[name="description"]',
      );

    if (meta) {
      meta.content =
        seo.siteDescription;
    }
  }, [seo]);

  useEffect(() => {
    const root =
      document.documentElement;

    const colors =
      config.identity.colors;

    root.style.setProperty(
      "--dgng-primary",
      colors.primary,
    );

    root.style.setProperty(
      "--dgng-secondary",
      colors.secondary,
    );

    root.style.setProperty(
      "--dgng-accent",
      colors.accent,
    );

    root.style.setProperty(
      "--dgng-background",
      colors.background,
    );
  }, [config.identity.colors]);

  return (
    <ProductCatalogBootstrap>
      <AnnouncementBar />

      <Header
        onOpenSearch={() =>
          setSearchOpen(true)
        }
      />

      <Outlet />

      <Footer />

      <CartDrawer />

      <SearchOverlay
        open={searchOpen}
        onClose={() =>
          setSearchOpen(false)
        }
      />
    </ProductCatalogBootstrap>
  );
}