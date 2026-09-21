import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StoreConfig } from "../types/storeConfig";

export const defaultStoreConfig: StoreConfig = {
  identity: { name: "FLOES.ec", shortName: "FLOES", tagline: "Confección para salud, belleza y bienestar", logo: "/images/brand/dgng-logo.png", colors: { primary: "#173f35", secondary: "#f2eee6", accent: "#bd8b4b", background: "#fffdf9" } },
  contact: { whatsapp: "", whatsappMessage: "🛍️✨ ¡Hola, FLOES.ec! Visité su tienda online y me gustaría recibir más información sobre sus productos. 💜 ¿Me pueden ayudar, por favor? 😊", email: "", city: "Guayaquil", country: "Ecuador" },
  social: { instagram: { enabled: false, url: "" }, facebook: { enabled: false, url: "" }, tiktok: { enabled: false, url: "" } },
  commerce: { currency: "USD", country: "Ecuador", shippingEnabled: true, shippingText: "Envíos nacionales por Servientrega", shippingMode: "pending", shippingCost: 0, whatsappPurchaseEnabled: true, webCheckoutEnabled: true, paymentMethods: { transfer: true, cash: true } },
  seo: { siteTitle: "FLOES.ec - Confección para salud, belleza y bienestar", siteDescription: "Uniformes, textiles y productos confeccionados para salud, belleza y bienestar en Ecuador.", keywords: "FLOES, uniformes, confeccion, textiles, salud, belleza, Ecuador" },
  announcement: { enabled: true, text: "CONFECCIÓN HECHA EN ECUADOR 🇺🇸", linkText: "Ver catálogo", href: "/catalogo" },
  navigation: [
    { id: "home", label: "Inicio", href: "/", enabled: true, sortOrder: 0 },
    { id: "catalog", label: "Catálogo", href: "/catalogo", enabled: true, sortOrder: 1 },
    { id: "offers", label: "Ofertas", href: "/catalogo?filter=ofertas", enabled: true, sortOrder: 2 },
  ],
  home: {
    sections: [
      { id: "hero", type: "hero", enabled: true, sortOrder: 0 },
      { id: "categories", type: "categories", enabled: true, sortOrder: 1 },
      { id: "featured-products", type: "featured-products", enabled: true, sortOrder: 2, title: "Productos para sentirte bien.", description: "Explora una selección de productos confeccionados para ti.", limit: 4 },
      { id: "brand-statement", type: "brand-statement", enabled: true, sortOrder: 3 },
      { id: "campaign", type: "campaign", enabled: true, sortOrder: 4 },
      { id: "best-sellers", type: "best-sellers", enabled: true, sortOrder: 5, title: "Favoritos que vuelven siempre.", description: "Descubre los productos preferidos de nuestra comunidad.", limit: 4 },
      { id: "benefits", type: "benefits", enabled: true, sortOrder: 6 },
      { id: "social", type: "social", enabled: true, sortOrder: 7 },
    ],
    hero: { enabled: true, eyebrow: "CONFECCIÓN ECUATORIANA", title: "Descubre algo nuevo.", description: "Diseños confeccionados para profesionales de salud, belleza y bienestar, con opciones pensadas para cada necesidad.", primaryButtonLabel: "Ver catálogo", primaryButtonHref: "/catalogo", secondaryButtonLabel: "Explorar categorías", secondaryButtonHref: "#categorias", image: "/images/brand/dgng-cover.jpg" },
    campaign: { enabled: true, eyebrow: "SELECCIÓN FLOES", title: "Productos para descubrir.", description: "Explora novedades y precios especiales seleccionados para ti.", image: "", buttonLabel: "Ver ofertas", buttonHref: "/catalogo?filter=ofertas" },
    benefits: [
      { id: "shipping", title: "Envíos a todo Ecuador", description: "Coordinamos tu entrega de forma clara.", iconKey: "truck", enabled: true },
      { id: "selected", title: "Productos seleccionados", description: "Una selección cuidada de diseños y productos.", iconKey: "sparkles", enabled: true },
      { id: "support", title: "Atención personalizada", description: "Te ayudamos antes y después de comprar.", iconKey: "message", enabled: true },
      { id: "easy", title: "Compra fácil", description: "Elige cómo completar tu pedido.", iconKey: "bag", enabled: true },
    ],
  },
};
const object = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
export const normalizeStoreConfig = (value: unknown): StoreConfig => {
  const source = object(value), home = object(source.home);
  return {
    ...defaultStoreConfig,
    ...source,
    identity: { ...defaultStoreConfig.identity, ...object(source.identity), colors: { ...defaultStoreConfig.identity.colors, ...object(object(source.identity).colors) } },
    contact: { ...defaultStoreConfig.contact, ...object(source.contact) },
    social: { instagram: { ...defaultStoreConfig.social.instagram, ...object(object(source.social).instagram) }, facebook: { ...defaultStoreConfig.social.facebook, ...object(object(source.social).facebook) }, tiktok: { ...defaultStoreConfig.social.tiktok, ...object(object(source.social).tiktok) } },
    commerce: {
      ...defaultStoreConfig.commerce,
      ...object(source.commerce),
      paymentMethods: {
        transfer:
          object(object(source.commerce).paymentMethods).transfer !== false,
        cash:
          object(object(source.commerce).paymentMethods).cash !== false,
      },
    },
    seo: { ...defaultStoreConfig.seo, ...object(source.seo) },
    announcement: { ...defaultStoreConfig.announcement, ...object(source.announcement) },
    navigation: Array.isArray(source.navigation) ? source.navigation as StoreConfig["navigation"] : defaultStoreConfig.navigation,
    home: { ...defaultStoreConfig.home, ...home, hero: { ...defaultStoreConfig.home.hero, ...object(home.hero) }, campaign: { ...defaultStoreConfig.home.campaign, ...object(home.campaign) }, sections: Array.isArray(home.sections) ? home.sections as StoreConfig["home"]["sections"] : defaultStoreConfig.home.sections, benefits: Array.isArray(home.benefits) ? home.benefits as StoreConfig["home"]["benefits"] : defaultStoreConfig.home.benefits },
  } as StoreConfig;
};
interface StoreConfigState { config: StoreConfig; setConfig: (config: StoreConfig) => void; reset: () => void }
export const useStoreConfigStore = create<StoreConfigState>()(
  persist(
    (set) => ({
      config: defaultStoreConfig,
      setConfig: (config) =>
        set({
          config:
            normalizeStoreConfig(
              config,
            ),
        }),
      reset: () =>
        set({
          config:
            defaultStoreConfig,
        }),
    }),
    {
      name: "floes-store-config",
      version: 2,
      partialize: (state) => ({
        config: state.config,
      }),
      migrate: (persisted) => {
        const migrated =
          normalizeStoreConfig(
            object(persisted).config ??
              persisted,
          );

        return {
          config: {
            ...migrated,
            contact: {
              ...migrated.contact,
              whatsapp:
                defaultStoreConfig
                  .contact.whatsapp,
              whatsappMessage:
                defaultStoreConfig
                  .contact
                  .whatsappMessage,
            },
            commerce: {
              ...migrated.commerce,
              shippingText:
                defaultStoreConfig
                  .commerce
                  .shippingText,
              shippingMode:
                "pending",
              paymentMethods: {
                transfer: true,
                cash: true,
              },
            },
          },
        };
      },
      merge: (
        persisted,
        current,
      ) => ({
        ...current,
        config:
          normalizeStoreConfig(
            object(persisted)
              .config ??
              persisted,
          ),
      }),
    },
  ),
);
