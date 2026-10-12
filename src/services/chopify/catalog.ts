import type { Product, ProductVariant, SizeGuide } from "../../types/product";
import { record, text, strings, slugify } from "../../utils/normalization";

const moneyAmount = (value: unknown) => {
  const entry = record(value);
  return typeof entry.amount === "number" && Number.isFinite(entry.amount) && entry.amount > 0
    ? entry.amount
    : undefined;
};

const imageUrls = (value: unknown) =>
  (Array.isArray(value) ? value : [])
    .map((entry) => typeof entry === "string" ? entry : text(record(entry).url))
    .filter((url) => /^https:\/\//i.test(url) || /^\/(?!\/)/.test(url));

const sizeGuide = (value: unknown): SizeGuide | undefined => {
  const guide = record(value);
  if (Array.isArray(guide.columns) && Array.isArray(guide.rows)) return {
    title: text(guide.title) || "Guía de tallas",
    columns: strings(guide.columns),
    rows: guide.rows.map((entry) => ({ label: text(record(entry).label), values: strings(record(entry).values) })),
    note: text(guide.note) || text(guide.instructions),
    measurement: guide.measurement === "FLAT_GARMENT_CM" ? "FLAT_GARMENT_CM" : undefined,
  };
  if (guide.measurement !== "FLAT_GARMENT_CM") return undefined;
  const garments = [["Blusa", guide.blouse], ["Pantalón", guide.trousers]] as const;
  const entries: Array<Record<string, unknown> & { garment: string }> = garments.flatMap(([garment, rows]) => (Array.isArray(rows) ? rows : []).map((row) => ({ garment, ...record(row) })));
  const columns = [...new Set(entries.map((row) => text(row.size)).filter(Boolean))];
  const labels = [...new Set(entries.flatMap((row) => Object.keys(record(row.measurementsCm)).map((measurement) => `${row.garment} · ${measurement}`)))];
  if (!columns.length || !labels.length) return undefined;
  return {
    title: "Guía FLOES · medida plana de prenda",
    measurement: "FLAT_GARMENT_CM",
    note: text(guide.instructions),
    columns,
    rows: labels.map((label) => {
      const [garment, measurement] = label.split(" · ");
      return { label, values: columns.map((size) => {
        const row = entries.find((entry) => entry.garment === garment && entry.size === size);
        const value = record(row?.measurementsCm)[measurement];
        return typeof value === "number" && Number.isFinite(value) ? `${value} cm` : "—";
      }) };
    }),
  };
};

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
  const sizeAvailability = (Array.isArray(variant.sizeAvailability) ? variant.sizeAvailability : []).map((entry) => {
    const item = record(entry);
    const size = text(item.size).trim().toUpperCase();
    const availableQuantity = typeof item.availableQuantity === "number" ? Math.max(0, Math.floor(item.availableQuantity)) : null;
    const availabilityStatus = availableQuantity === null ? "NOT_CONFIGURED" : availableQuantity > 0 ? "AVAILABLE" : "OUT_OF_STOCK";
    return { size, availableQuantity, available: availableQuantity !== null && availableQuantity > 0, availabilityStatus } as const;
  }).filter((entry) => entry.size);

  return {
    id,
    sku,
    color: text(variant.color) || text(variant.name) || undefined,
    size: text(variant.size) || undefined,
    sizes: strings(variant.sizes),
    material: text(variant.material) || undefined,
    images: [...new Set([...imageUrls(variant.images), ...imageUrls([variant.imageUrl])])],
    price,
    promotionalPrice: moneyAmount(variant.promotionalPrice),
    stock: quantity ?? 0,
    minimumStock: 0,
    active: variant.active !== false && variant.status !== "ARCHIVED" && variant.status !== "INACTIVE",
    pricingStatus: priceReady ? "READY" : "PENDING",
    availabilityStatus: ["AVAILABLE", "OUT_OF_STOCK", "NOT_CONFIGURED"].includes(text(variant.availabilityStatus))
      ? (text(variant.availabilityStatus) as ProductVariant["availabilityStatus"])
      : undefined,
    available: variant.available === true,
    availableQuantity: quantity,
    sizeAvailability,
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
    const colors = variants.filter((variant) => variant.active)
      .map((variant) => variant.color)
      .filter((color, index, all): color is string => Boolean(color) && all.findIndex((entry) => entry && slugify(entry) === slugify(color!)) === index)
      .map((color) => ({ name: color, images: variants.find((variant) => variant.color === color)?.images }));
    const exchange = record(item.exchangePolicy);

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
      promotionalPrice: moneyAmount(item.promotionalPrice),
      currency: text(record(item.price).currency) || "USD",
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
      material: text(item.material) || undefined,
      collection: text(item.collection) || undefined,
      audience: ["mujer", "hombre", "unisex", "infantil", "otro"].includes(text(item.gender).toLowerCase()) ? text(item.gender).toLowerCase() as Product["audience"] : undefined,
      characteristics: strings(item.characteristics),
      sizeGuide: sizeGuide(item.sizeGuide),
      sizeRecommendation: text(item.sizeRecommendation) || undefined,
      preparationTime: text(item.preparationTime) || undefined,
      deliveryType: text(item.deliveryType) || undefined,
      exchangePolicy: Object.keys(exchange).length ? { allowed: typeof exchange.allowed === "boolean" ? exchange.allowed : null, conditions: text(exchange.conditions) } : undefined,
      colors,
      sizes: [...new Set(variants.flatMap((variant) => [variant.size, ...(variant.sizes ?? [])]).filter((size): size is string => Boolean(size)))],
      variants,
      featured: item.featured === true,
      bestSeller: item.bestSeller === true,
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

export const sizeAvailabilityFor = (variant: ProductVariant, size: string) => variant.sizeAvailability?.find(entry => entry.size === size.trim().toUpperCase());
export const availableQuantityForSize = (variant: ProductVariant, size?: string) => {
  if (variant.sizeAvailability?.length) {
    if (size) return sizeAvailabilityFor(variant, size)?.availableQuantity ?? null;
    const quantities=variant.sizeAvailability.map(entry=>entry.availableQuantity).filter((quantity):quantity is number=>quantity!==null);
    return quantities.length?quantities.reduce((total,quantity)=>total+quantity,0):null;
  }
  return variant.availableQuantity ?? null;
};
export const canPurchase = (product: Product, variant?: ProductVariant, size?: string) => {
  const mode=variant?.fulfillmentMode??product.fulfillmentMode;
  const sizeInventoryConfigured=variant?.sizeAvailability?.length;
  const targetAvailable = variant
    ? variant.active && (mode==='STOCK'&&sizeInventoryConfigured
      ? size ? (sizeAvailabilityFor(variant,size)?.availableQuantity??0)>0 : variant.sizeAvailability!.some(entry=>entry.availableQuantity!==null&&entry.availableQuantity>0)
      : variant.available === true)
    : product.inStock === true;
  return product.active && hasKnownPrice(product, variant) && targetAvailable;
};

export const catalogPrice = (product: Product, variant?: ProductVariant) => {
  const price = variant?.price ?? product.price;
  const promotion = variant ? variant.promotionalPrice : product.promotionalPrice;
  return typeof promotion === "number" && promotion > 0 && promotion < price ? promotion : price;
};

export const variantSizes = (variant: ProductVariant) => [...new Set([variant.size, ...(variant.sizes ?? [])].filter((size): size is string => Boolean(size)).map(size=>size.trim().toUpperCase()))];

export const resolveVariant = (product: Product, color: string, size: string) => product.variants.find((variant) =>
  variant.active && (!color || slugify(variant.color ?? "") === slugify(color)) &&
  (!variantSizes(variant).length || variantSizes(variant).includes(size.trim().toUpperCase())),
);

export async function fetchChopifyCatalog(): Promise<Product[]> {
  const response = await fetch("/api/catalog", {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  }).catch((error: unknown) => {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("Chopify no respondió a /api/catalog en 12 segundos.");
    }
    throw error;
  });
  if (!response.ok) {
    const payload = record(await response.json().catch(() => ({})));
    const upstreamError = text(payload.error);
    throw new Error(upstreamError
      ? `Catálogo FLOES: HTTP ${response.status} — ${upstreamError}`
      : `Catálogo FLOES: HTTP ${response.status}.`);
  }
  return mapChopifyCatalog(await response.json());
}
