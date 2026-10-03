import type { Product, ProductVariant } from "../../types/product";
import { record, text } from "../../utils/normalization";

const moneyAmount = (value: unknown) => {
  const entry = record(value);
  return typeof entry.amount === "number" && Number.isFinite(entry.amount) && entry.amount > 0
    ? entry.amount
    : undefined;
};

const imageUrls = (value: unknown) =>
  (Array.isArray(value) ? value : [])
    .map((entry) => text(record(entry).url))
    .filter(Boolean);

const fulfillmentMode = (value: unknown): Product["fulfillmentMode"] =>
  ["STOCK", "MADE_TO_ORDER", "SERVICE", "DIGITAL", "HYBRID"].includes(text(value))
    ? (text(value) as Product["fulfillmentMode"])
    : undefined;

const mapVariant = (value: unknown): ProductVariant | null => {
  const variant = record(value);
  const id = text(variant.variantId);
  const sku = text(variant.sku);
  if (!id || !sku) return null;
  const price = moneyAmount(variant.price);
  const priceReady = text(variant.pricingStatus) === "READY" && price !== undefined;
  const quantity = typeof variant.availableQuantity === "number"
    ? Math.max(0, Math.floor(variant.availableQuantity))
    : null;

  return {
    id,
    sku,
    color: text(variant.color) || text(variant.name) || undefined,
    price,
    stock: quantity ?? 0,
    minimumStock: 0,
    active: variant.available !== false,
    pricingStatus: priceReady ? "READY" : "PENDING",
    availabilityStatus: ["AVAILABLE", "OUT_OF_STOCK", "NOT_CONFIGURED"].includes(text(variant.availabilityStatus))
      ? (text(variant.availabilityStatus) as ProductVariant["availabilityStatus"])
      : undefined,
    available: variant.available === true,
    availableQuantity: quantity,
    fulfillmentMode: fulfillmentMode(variant.fulfillmentMode),
  };
};

export function mapChopifyCatalog(value: unknown): Product[] {
  if (!Array.isArray(value)) throw new Error("Chopify devolvió un catálogo inválido.");
  const now = new Date().toISOString();

  return value.map((entry): Product | null => {
    const item = record(entry);
    const id = text(item.productId);
    const name = text(item.name);
    if (!id || !name) return null;
    const price = moneyAmount(item.price);
    const priceReady = text(item.pricingStatus) === "READY" && price !== undefined;
    const images = imageUrls(item.images);
    const variants = (Array.isArray(item.variants) ? item.variants : [])
      .map(mapVariant)
      .filter((variant): variant is ProductVariant => Boolean(variant));
    const colors = variants
      .map((variant) => variant.color)
      .filter((color, index, all): color is string => Boolean(color) && all.indexOf(color) === index)
      .map((color) => ({ name: color }));

    return {
      id,
      sku: text(item.sku, id),
      slug: text(item.slug, id),
      name,
      category: text(item.category, "Sin categoría"),
      brand: "FLOES",
      description: text(item.description),
      shortDescription: text(item.commercialSummary),
      price: price ?? 0,
      productCost: 0,
      importCost: 0,
      otherCost: 0,
      stock: 0,
      minimumStock: 0,
      inStock: item.available === true,
      pricingStatus: priceReady ? "READY" : "PENDING",
      availabilityStatus: ["AVAILABLE_BY_MODE", "AVAILABLE", "OUT_OF_STOCK", "NOT_CONFIGURED"].includes(text(item.availabilityStatus))
        ? (text(item.availabilityStatus) as Product["availabilityStatus"])
        : undefined,
      fulfillmentMode: fulfillmentMode(item.fulfillmentMode),
      image: text(item.imageUrl) || images[0] || undefined,
      images,
      colors,
      sizes: [],
      variants,
      featured: false,
      bestSeller: false,
      active: text(item.status) === "ACTIVE" && text(item.visibility) === "VISIBLE",
      createdAt: now,
      updatedAt: now,
    };
  }).filter((product): product is Product => Boolean(product));
}

export const hasKnownPrice = (product: Product, variant?: ProductVariant) =>
  variant
    ? variant.pricingStatus !== "PENDING" && typeof variant.price === "number" && variant.price > 0
    : product.pricingStatus !== "PENDING" && product.price > 0;

export const canPurchase = (product: Product, variant?: ProductVariant) => {
  const targetAvailable = variant ? variant.available !== false : product.inStock !== false;
  return hasKnownPrice(product, variant) && targetAvailable;
};

export async function fetchChopifyCatalog(): Promise<Product[]> {
  const response = await fetch("/api/catalog", { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("No se pudo cargar el catálogo de FLOES.");
  return mapChopifyCatalog(await response.json());
}
