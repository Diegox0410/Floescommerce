import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StoreConfig } from "../types/storeConfig";

export const defaultStoreConfig: StoreConfig = {
  identity: { name: "FLOES.ec", shortName: "FLOES", tagline: "Confección para salud, belleza y bienestar", logo: "", colors: { primary: "#173d36", secondary: "#eee7dc", accent: "#9a5c3f", background: "#f8f5ef" } },
  contact: { whatsapp: "", whatsappMessage: "🛍️✨ ¡Hola, FLOES.ec! Visité su tienda online y me gustaría recibir más información sobre sus productos. 💜 ¿Me pueden ayudar, por favor? 😊", email: "", city: "Guayaquil", country: "Ecuador" },
  social: { instagram: { enabled: true, url: "https://www.instagram.com/floes.ec/", handle: "@floes.ec" }, facebook: { enabled: false, url: "" }, tiktok: { enabled: false, url: "" } },
  commerce: { currency: "USD", country: "Ecuador", shippingEnabled: false, shippingText: "", shippingMode: "pending", shippingCost: 0, whatsappPurchaseEnabled: false, webCheckoutEnabled: true, paymentMethods: { transfer: false, cash: false } },
  seo: { siteTitle: "FLOES.ec - Confección para salud, belleza y bienestar", siteDescription: "Uniformes, textiles y productos confeccionados para salud, belleza y bienestar en Ecuador.", keywords: "FLOES, uniformes, confeccion, textiles, salud, belleza, Ecuador" },
  announcement: { enabled: true, text: "CONFECCIÓN HECHA EN ECUADOR", linkText: "Ver catálogo", href: "/catalogo" },
  navigation: [
    { id: "home", label: "Inicio", href: "/", enabled: true, sortOrder: 0 },
    { id: "catalog", label: "Catálogo", href: "/catalogo", enabled: true, sortOrder: 1 },
    { id: "offers", label: "Ofertas", href: "/catalogo?filter=ofertas", enabled: true, sortOrder: 2 },
  ],
  home: {
    sections: [
      { id: "hero", type: "hero", enabled: true, sortOrder: 0 },
      { id: "categories", type: "categories", enabled: true, sortOrder: 1 },
      { id: "featured-products", type: "featured-products", enabled: false, sortOrder: 2, title: "Modelos destacados", description: "Una selección de modelos FLOES.", limit: 4 },
      { id: "brand-statement", type: "brand-statement", enabled: true, sortOrder: 3 },
      { id: "campaign", type: "campaign", enabled: false, sortOrder: 4 },
      { id: "best-sellers", type: "best-sellers", enabled: true, sortOrder: 5, title: "Favoritos que vuelven siempre.", description: "Descubre los productos preferidos de nuestra comunidad.", limit: 4 },
      { id: "benefits", type: "benefits", enabled: false, sortOrder: 6 },
      { id: "social", type: "social", enabled: true, sortOrder: 7 },
    ],
    hero: { enabled: true, eyebrow: "CONFECCIÓN ECUATORIANA", title: "FLOES.ec", description: "Confección que viste tu profesión.", primaryButtonLabel: "Ver catálogo", primaryButtonHref: "/catalogo", secondaryButtonLabel: "Conocer FLOES", secondaryButtonHref: "#confeccion-floes", image: "/images/floes/hero/confeccion-floes.jpeg" },
    brandStory: { eyebrow: "CONFECCIÓN FLOES", title: "Diseños para trabajar. Modelos para sentirte tú.", description: "Uniformes, textiles y confeccionados presentados con claridad para que encuentres el modelo, la tela, el color y la talla que necesitas.", image: "/images/floes/editorial/confeccion-posterior.jpeg", imageAlt: "Vista posterior de una confección FLOES", buttonLabel: "Explorar el catálogo", buttonHref: "/catalogo" },
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
          typeof object(object(source.commerce).paymentMethods).transfer === "boolean"
            ? object(object(source.commerce).paymentMethods).transfer as boolean
            : defaultStoreConfig.commerce.paymentMethods.transfer,
        cash:
          typeof object(object(source.commerce).paymentMethods).cash === "boolean"
            ? object(object(source.commerce).paymentMethods).cash as boolean
            : defaultStoreConfig.commerce.paymentMethods.cash,
      },
    },
    seo: { ...defaultStoreConfig.seo, ...object(source.seo) },
    announcement: { ...defaultStoreConfig.announcement, ...object(source.announcement) },
    navigation: Array.isArray(source.navigation) ? source.navigation as StoreConfig["navigation"] : defaultStoreConfig.navigation,
    home: { ...defaultStoreConfig.home, ...home, hero: { ...defaultStoreConfig.home.hero, ...object(home.hero) }, brandStory: { ...defaultStoreConfig.home.brandStory, ...object(home.brandStory) }, campaign: { ...defaultStoreConfig.home.campaign, ...object(home.campaign) }, sections: Array.isArray(home.sections) ? home.sections as StoreConfig["home"]["sections"] : defaultStoreConfig.home.sections, benefits: Array.isArray(home.benefits) ? home.benefits as StoreConfig["home"]["benefits"] : defaultStoreConfig.home.benefits },
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
      version: 3,
      partialize: (state) => ({
        config: state.config,
      }),
      migrate: (persisted) => {
        const migrated =
          normalizeStoreConfig(
            object(persisted).config ??
              persisted,
          );

        const legacyLogo = migrated.identity.logo.includes("dgng-");
        const legacyHero = migrated.home.hero.image.includes("dgng-");
        const legacyCommerce = legacyLogo || legacyHero;
        const instagram = migrated.social.instagram.url
          ? migrated.social.instagram
          : defaultStoreConfig.social.instagram;

        return {
          config: {
            ...migrated,
            identity: {
              ...migrated.identity,
              logo: legacyLogo ? "" : migrated.identity.logo,
            },
            social: { ...migrated.social, instagram },
            home: {
              ...migrated.home,
              hero: {
                ...migrated.home.hero,
                image: legacyHero ? defaultStoreConfig.home.hero.image : migrated.home.hero.image,
              },
              brandStory: migrated.home.brandStory,
            },
            commerce: {
              ...migrated.commerce,
              ...(legacyCommerce ? {
                shippingEnabled: false,
                shippingText: "",
                whatsappPurchaseEnabled: false,
                paymentMethods: { transfer: false, cash: false },
              } : {}),
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
