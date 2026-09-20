import type { CustomerData } from "./order";
export interface Customer extends CustomerData {
  id: string;
  province: string;
  city: string;
  address: string;
  tags: string[];
  notes: string[];
  createdAt: string;
  updatedAt: string;
}
export interface CustomerMetrics {
  totalOrders: number;
  totalSpent: number;
  averageTicket: number;
  lastOrderAt: string | null;
}
