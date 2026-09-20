import type { LucideIcon } from "lucide-react";
export interface AdminUser {
  id: string;
  name: string;
  role: "OWNER";
}
export interface AdminKpi {
  label: string;
  value: number;
  format: "currency" | "number" | "percent";
  trend?: string;
  helper: string;
  icon: LucideIcon;
}
export interface SalesPoint {
  label: string;
  sales: number;
  profit: number;
}
export interface AdminAlert {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: "info" | "warning" | "critical";
  href: string;
}
export interface AdminTopProduct {
  name: string;
  category: string;
  units: number;
  revenue: number;
  profit: number;
}
export interface ProjectionSummary {
  monthlyGoal: number;
  currentSales: number;
  remainingDays: number;
  monthDays: number;
}
