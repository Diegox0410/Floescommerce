import type { Product } from "../types/product";
import type { Promotion } from "../types/marketing";
export type PromotionStatus = "Programada" | "Activa" | "Finalizada" | "Inactiva";
export const promotionStatus = (p: Promotion, now = new Date()): PromotionStatus => !p.active ? "Inactiva" : p.startAt && new Date(p.startAt) > now ? "Programada" : p.endAt && new Date(p.endAt) < now ? "Finalizada" : "Activa";
export const promotionApplies = (p: Promotion, product: Product, now = new Date()) => promotionStatus(p, now) === "Activa" && p.type !== "informational" && (p.scope === "all" || (p.scope === "product" && p.targetIds.includes(product.id)) || (p.scope === "category" && p.targetIds.some((id) => id === product.category)));
export const promotionalPrice = (product: Product, promotions: Promotion[], now = new Date()) => promotions.filter((p) => promotionApplies(p, product, now)).reduce((price, p) => { const value = Number.isFinite(p.value) ? Math.max(0, p.value) : 0; return Math.max(0, p.type === "percentage" ? price * (1 - value / 100) : price - value); }, Number.isFinite(product.price) ? Math.max(0, product.price) : 0);
export const whatsappUrl = (phone: string, message: string) => { const digits = phone.replace(/\D/g, "").replace(/^0/, "593"); return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : ""; };
export const safeExternalUrl = (value: string) => { try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:" ? url.href : ""; } catch { return ""; } };
