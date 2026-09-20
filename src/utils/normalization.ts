import type { Product } from "../types/product";
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
export function normalizeProduct(value: unknown): Product {
  const p = record(value);
  const now = new Date().toISOString();
  return {
    id: text(p.id, crypto.randomUUID()),
    sku: text(p.sku, `DGNG-${text(p.id, "LEGACY")}`),
    slug: text(p.slug, slugify(text(p.name))),
    name: text(p.name, "Producto demo"),
    category: text(p.category, "Sin categoría"),
    brand: text(p.brand, "DGNG Demo"),
    description: text(
      p.description,
      "Producto seleccionado para complementar tu rutina de cuidado y bienestar.",
    ),
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
    image: text(p.image) || undefined,
    images: strings(p.images),
    badge: text(p.badge) || undefined,
    barcode: text(p.barcode) || undefined,
    weight: typeof p.weight === "number" ? safeNumber(p.weight) : undefined,
    sizeVolume: text(p.sizeVolume) || undefined,
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
    id: text(o.id, `DGNG-${crypto.randomUUID()}`),
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
