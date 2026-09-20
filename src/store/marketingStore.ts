import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Coupon, Promotion } from "../types/marketing";
interface MarketingState { promotions: Promotion[]; coupons: Coupon[]; savePromotion: (p: Promotion) => void; setPromotionActive: (id: string, active: boolean) => void; saveCoupon: (c: Coupon) => void }
export const useMarketingStore = create<MarketingState>()(persist((set) => ({ promotions: [], coupons: [], savePromotion: (p) => set((s) => ({ promotions: s.promotions.some((x) => x.id === p.id) ? s.promotions.map((x) => x.id === p.id ? p : x) : [...s.promotions, p] })), setPromotionActive: (id, active) => set((s) => ({ promotions: s.promotions.map((p) => p.id === id ? { ...p, active } : p) })), saveCoupon: (c) => set((s) => ({ coupons: s.coupons.some((x) => x.id === c.id) ? s.coupons.map((x) => x.id === c.id ? c : x) : [...s.coupons, c] })) }), { name: "dgng-marketing", version: 1 }));
