import type { Product, ProductAudience, ProductColor, ProductVariant, SizeGuide } from "../types/product";
import type {
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
} from "../types/order";
import type { Customer } from "../types/customer";
import { safeNumber } from "./productMetrics";
import {
  getOrderSubtotal,
  getOrderEstimatedCost,
  getOrderEstimatedProfit,
  orderStatusLabels,
  paymentStatusLabels,
} from "./orderMetrics";
export const record = (v: unknown): Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
export const text = (v: unknown, fallback = "") =>
  typeof v === "string" ? v : fallback;
export const strings = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : typeof v === "string" && v
      ? [v]
      : [];
const flag = (v: unknown, fallback = false) =>
  typeof v === "boolean" ? v : fallback;
export const slugify = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const normalizeColors = (value: unknown): ProductColor[] =>
  (Array.isArray(value) ? value : []).map((entry): ProductColor => {
    if (typeof entry === "string") return { name: entry };
    const item = record(entry);
    return {
      name: text(item.name),
      hex: text(item.hex) || undefined,
      images: strings(item.images),
    };
  }).filter((color) => color.name);
const normalizeVariants = (value: unknown): ProductVariant[] =>
  (Array.isArray(value) ? value : []).map((entry): ProductVariant => {
    const item = record(entry);
    return {
      id: text(item.id, crypto.randomUUID()), sku: text(item.sku),
      size: text(item.size) || undefined, color: text(item.color) || undefined,
      measurement: text(item.measurement) || undefined, material: text(item.material) || undefined,
      price: typeof item.price === "number" ? safeNumber(item.price) : undefined,
      productCost: typeof item.productCost === "number" ? safeNumber(item.productCost) : undefined,
      stock: Math.floor(safeNumber(item.stock)), minimumStock: Math.floor(safeNumber(item.minimumStock)),
      active: flag(item.active, true),
      pricingStatus: item.pricingStatus === "PENDING" ? "PENDING" : item.pricingStatus === "READY" ? "READY" : undefined,
      availabilityStatus: ["AVAILABLE", "OUT_OF_STOCK", "NOT_CONFIGURED"].includes(text(item.availabilityStatus)) ? text(item.availabilityStatus) as ProductVariant["availabilityStatus"] : undefined,
      available: typeof item.available === "boolean" ? item.available : undefined,
      availableQuantity: item.availableQuantity === null ? null : typeof item.availableQuantity === "number" ? Math.floor(safeNumber(item.availableQuantity)) : undefined,
      fulfillmentMode: ["STOCK", "MADE_TO_ORDER", "SERVICE", "DIGITAL", "HYBRID"].includes(text(item.fulfillmentMode)) ? text(item.fulfillmentMode) as ProductVariant["fulfillmentMode"] : undefined,
    };
  }).filter((variant) => variant.id && variant.sku);
const normalizeSizeGuide = (value: unknown): SizeGuide | undefined => {
  const guide = record(value), columns = strings(guide.columns);
  const rows = (Array.isArray(guide.rows) ? guide.rows : []).map((entry) => {
    const row = record(entry); return { label: text(row.label), values: strings(row.values) };
  }).filter((row) => row.label);
  return columns.length || rows.length ? { title: text(guide.title) || undefined, columns, rows, note: text(guide.note) || undefined } : undefined;
};
export function normalizeProduct(value: unknown): Product {
  const p = record(value);
  const now = new Date().toISOString();
  return {
    id: text(p.id, crypto.randomUUID()),
    sku: text(p.sku, `FLO-${text(p.id, "LEGACY")}`),
    slug: text(p.slug, slugify(text(p.name))),
    name: text(p.name, "Producto demo"),
    category: text(p.category, "Sin categoría"),
    brand: text(p.brand, "FLOES"),
    description: text(p.description, "Modelo confeccionado para profesionales de salud, belleza y bienestar."),
    shortDescription: text(p.shortDescription),
    price: safeNumber(p.price),
    oldPrice:
      typeof p.oldPrice === "number" ? safeNumber(p.oldPrice) : undefined,
    productCost: safeNumber(p.productCost),
    importCost: safeNumber(p.importCost),
    otherCost: safeNumber(p.otherCost),
    stock: Math.floor(safeNumber(p.stock)),
    minimumStock: Math.floor(safeNumber(p.minimumStock)),
    inStock:
      typeof p.inStock === "boolean"
        ? p.inStock
        : Math.floor(safeNumber(p.stock)) > 0,
    pricingStatus: p.pricingStatus === "PENDING" ? "PENDING" : p.pricingStatus === "READY" ? "READY" : undefined,
    availabilityStatus: ["AVAILABLE_BY_MODE", "AVAILABLE", "OUT_OF_STOCK", "NOT_CONFIGURED"].includes(text(p.availabilityStatus)) ? text(p.availabilityStatus) as Product["availabilityStatus"] : undefined,
    fulfillmentMode: ["STOCK", "MADE_TO_ORDER", "SERVICE", "DIGITAL", "HYBRID"].includes(text(p.fulfillmentMode)) ? text(p.fulfillmentMode) as Product["fulfillmentMode"] : undefined,
    image: text(p.image) || undefined,
    images: strings(p.images),
    badge: text(p.badge) || undefined,
    barcode: text(p.barcode) || undefined,
    weight: typeof p.weight === "number" ? safeNumber(p.weight) : undefined,
    sizeVolume: text(p.sizeVolume) || undefined,
    productType: text(p.productType) || undefined,
    collection: text(p.collection) || undefined,
    audience: (["mujer", "hombre", "unisex", "infantil", "otro"].includes(text(p.audience)) ? text(p.audience) : undefined) as ProductAudience | undefined,
    fabric: text(p.fabric) || undefined,
    material: text(p.material) || undefined,
    colors: normalizeColors(p.colors),
    sizes: strings(p.sizes),
    variants: normalizeVariants(p.variants),
    sizeGuide: normalizeSizeGuide(p.sizeGuide),
    featured: flag(p.featured),
    bestSeller: flag(p.bestSeller),
    active: flag(p.active, true),
    createdAt: text(p.createdAt, now),
    updatedAt: text(p.updatedAt, now),
  };
}
export function normalizeOrder(value: unknown): Order {
  const o = record(value),
    c = record(o.customer),
    s = record(o.shipping);
  const now = new Date().toISOString();
  const items: OrderItem[] = (Array.isArray(o.items) ? o.items : [])
    .map((v) => {
      const i = record(v),
        legacy = record(i.product);
      return {
        productId: text(i.productId, text(legacy.id)),
        name: text(i.name, text(legacy.name, "Producto histórico")),
        sku: text(i.sku, text(legacy.sku)),
        price: safeNumber(i.price, safeNumber(legacy.price)),
        cost: safeNumber(i.cost),
        quantity: Math.floor(safeNumber(i.quantity)),
        variantId: text(i.variantId) || undefined,
        variantSku: text(i.variantSku) || undefined,
        variantLabel: text(i.variantLabel) || undefined,
        size: text(i.size) || undefined,
        color: text(i.color) || undefined,
        measurement: text(i.measurement) || undefined,
        material: text(i.material) || undefined,
      };
    })
    .filter((i) => i.productId && i.quantity > 0);
  const subtotal = getOrderSubtotal(items),
    discount = safeNumber(o.discount),
    shippingCost =
      o.shippingCost === null || o.shippingCost === undefined
        ? null
        : safeNumber(o.shippingCost);
  const order: Order = {
    id: text(o.id, `FLOES-${crypto.randomUUID()}`),
    createdAt: text(o.createdAt, now),
    updatedAt: text(o.updatedAt, now),
    customerId: text(o.customerId) || undefined,
    customer: {
      firstName: text(c.firstName),
      lastName: text(c.lastName),
      phone: text(c.phone),
      email: text(c.email),
    },
    shipping: {
      province: text(s.province),
      city: text(s.city),
      address: text(s.address),
      reference: text(s.reference),
    },
    items,
    paymentMethod:
      o.paymentMethod === "cash"
        ? "cash"
        : o.paymentMethod === "whatsapp"
          ? "whatsapp"
          : "transfer",
    paymentStatus:
      typeof o.paymentStatus === "string" &&
      o.paymentStatus in paymentStatusLabels
        ? (o.paymentStatus as PaymentStatus)
        : "pending",
    orderStatus:
      typeof o.orderStatus === "string" && o.orderStatus in orderStatusLabels
        ? (o.orderStatus as OrderStatus)
        : "new",
    subtotal,
    shippingCost,
    discount,
    total: Math.max(0, subtotal + (shippingCost ?? 0) - discount),
    estimatedCost: 0,
    estimatedProfit: 0,
    notes: strings(o.notes),
    inventoryCommitted: flag(o.inventoryCommitted),
  };
  order.estimatedCost = getOrderEstimatedCost(order);
  order.estimatedProfit = getOrderEstimatedProfit(order);
  return order;
}
export function normalizeCustomer(value: unknown): Customer {
  const c = record(value),
    now = new Date().toISOString();
  return {
    id: text(c.id, crypto.randomUUID()),
    firstName: text(c.firstName),
    lastName: text(c.lastName),
    phone: text(c.phone),
    email: text(c.email),
    province: text(c.province),
    city: text(c.city),
    address: text(c.address),
    tags: strings(c.tags),
    notes: strings(c.notes),
    createdAt: text(c.createdAt, now),
    updatedAt: text(c.updatedAt, now),
  };
}
