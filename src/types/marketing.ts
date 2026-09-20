export type DiscountType = "percentage" | "fixed";
export interface Promotion { id: string; name: string; type: DiscountType | "informational"; value: number; startAt: string; endAt: string; active: boolean; scope: "all" | "category" | "product"; targetIds: string[]; headline: string; description: string }
export interface Coupon { id: string; code: string; type: DiscountType; value: number; minimumOrder: number; active: boolean; startAt: string; endAt: string }
