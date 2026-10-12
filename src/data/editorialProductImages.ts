import { slugify } from "../utils/normalization";

/**
 * Storefront-only photography, keyed by the stable Chopify product slug.
 * Add a color-specific entry only after the photo has been checked against
 * that real garment/color and approved for FLOES use. Technical catalog media
 * stays in Chopify unchanged and is not used as a storefront hero image.
 */
type EditorialImageSet = {
  default?: string[];
  colors?: Readonly<Record<string, string[]>>;
};

export const FLOES_EDITORIAL_PRODUCT_IMAGES: Readonly<Record<string, EditorialImageSet>> = {
  bruni: { default: [1, 2, 3].map((order) => `/images/editorial/modelos/bruni-${String(order).padStart(2, "0")}.webp`) },
  daniela: { default: [1, 2, 3].map((order) => `/images/editorial/modelos/daniela-${String(order).padStart(2, "0")}.webp`) },
  elite: { default: [1, 2, 3].map((order) => `/images/editorial/modelos/elite-${String(order).padStart(2, "0")}.webp`) },
  esencial: { default: [1, 2, 3].map((order) => `/images/editorial/modelos/esencial-${String(order).padStart(2, "0")}.webp`) },
  esperanza: { default: [1, 2, 3].map((order) => `/images/editorial/modelos/esperanza-${String(order).padStart(2, "0")}.webp`) },
  florma: { default: [1, 2, 3].map((order) => `/images/editorial/modelos/florma-${String(order).padStart(2, "0")}.webp`) },
  girasol: { default: [1, 2, 3, 4, 5, 6].map((order) => `/images/editorial/modelos/girasol-${String(order).padStart(2, "0")}.webp`) },
  klit: { default: [1, 2, 3].map((order) => `/images/editorial/modelos/klit-${String(order).padStart(2, "0")}.webp`) },
  laly: { default: [1, 2, 3].map((order) => `/images/editorial/modelos/laly-${String(order).padStart(2, "0")}.webp`) },
  mabe: { default: [1, 2, 3].map((order) => `/images/editorial/modelos/mabe-${String(order).padStart(2, "0")}.webp`) },
  maemi: { default: [1, 2, 3].map((order) => `/images/editorial/modelos/maemi-${String(order).padStart(2, "0")}.webp`) },
  "maria-jose": { default: [1, 2, 3].map((order) => `/images/editorial/modelos/maria-jose-${String(order).padStart(2, "0")}.webp`) },
};

const isApprovedEditorialPath = (value: string) =>
  value.startsWith("/images/editorial/") &&
  !value.split("/").includes("..") &&
  /\.(avif|jpe?g|png|webp)$/i.test(value);

/** Returns approved store photography only; absent mappings intentionally use a neutral placeholder. */
export function editorialImagesForProduct(productSlug: string, color?: string): string[] {
  const mapping = FLOES_EDITORIAL_PRODUCT_IMAGES[productSlug];
  if (!mapping) return [];

  const selected = color
    ? mapping.colors?.[slugify(color)] ?? mapping.default
    : mapping.default;

  return [...new Set((selected ?? []).filter(isApprovedEditorialPath))];
}

/** True only for a verified color-specific mapping, never for a model-level reference gallery. */
export function hasEditorialImagesForColor(productSlug: string, color?: string): boolean {
  if (!color) return false;
  return Boolean(FLOES_EDITORIAL_PRODUCT_IMAGES[productSlug]?.colors?.[slugify(color)]?.some(isApprovedEditorialPath));
}
