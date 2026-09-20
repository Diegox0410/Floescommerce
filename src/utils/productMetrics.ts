import type { Product } from "../types/product";
export const safeNumber = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : fallback;
export const getProductRealCost = (p: Partial<Product>) =>
  safeNumber(p.productCost) +
  safeNumber(p.importCost) +
  safeNumber(p.otherCost);
export const getProductProfit = (p: Partial<Product>) =>
  safeNumber(p.price) - getProductRealCost(p);
export const getProductMargin = (p: Partial<Product>) =>
  safeNumber(p.price) > 0
    ? (getProductProfit(p) / safeNumber(p.price)) * 100
    : 0;
export const getInventoryValue = (p: Partial<Product>) =>
  getProductRealCost(p) * safeNumber(p.stock);
export const getPotentialRevenue = (p: Partial<Product>) =>
  safeNumber(p.price) * safeNumber(p.stock);
export const getPotentialProfit = (p: Partial<Product>) =>
  getProductProfit(p) * safeNumber(p.stock);
export const getStockStatus = (
  p: Partial<Product>,
): "Normal" | "Bajo" | "Agotado" =>
  safeNumber(p.stock) === 0
    ? "Agotado"
    : safeNumber(p.stock) <= safeNumber(p.minimumStock)
      ? "Bajo"
      : "Normal";
