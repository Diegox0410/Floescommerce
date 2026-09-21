import {
  Banknote,
  TrendingUp,
  ShoppingBag,
  Users,
  Receipt,
  Percent,
  Package,
  PackageMinus,
} from "lucide-react";
import type {
  AdminUser,
  AdminKpi,
  SalesPoint,
  AdminAlert,
  AdminTopProduct,
  ProjectionSummary,
} from "../types/admin";
export const adminUser: AdminUser = {
  id: "owner",
  name: "Administrador FLOES",
  role: "OWNER",
};
export const dashboardKpis: AdminKpi[] = [
  {
    label: "Ventas del mes",
    value: 3240,
    format: "currency",
    trend: "+12.8%",
    helper: "Respecto al mes anterior",
    icon: Banknote,
  },
  {
    label: "Utilidad estimada",
    value: 1285,
    format: "currency",
    trend: "+8.4%",
    helper: "Estimación sobre ventas demo",
    icon: TrendingUp,
  },
  {
    label: "Pedidos",
    value: 87,
    format: "number",
    trend: "+14.5%",
    helper: "Pedidos del periodo demo",
    icon: ShoppingBag,
  },
  {
    label: "Clientes nuevos",
    value: 26,
    format: "number",
    trend: "+18.2%",
    helper: "Respecto al mes anterior",
    icon: Users,
  },
  {
    label: "Ticket promedio",
    value: 37.24,
    format: "currency",
    helper: "Por pedido",
    icon: Receipt,
  },
  {
    label: "Margen promedio",
    value: 39.7,
    format: "percent",
    helper: "Utilidad sobre ventas",
    icon: Percent,
  },
  {
    label: "Inventario valorizado",
    value: 6480,
    format: "currency",
    helper: "Valor estimado disponible",
    icon: Package,
  },
  {
    label: "Stock crítico",
    value: 5,
    format: "number",
    helper: "Productos por revisar",
    icon: PackageMinus,
  },
];
export const salesData: SalesPoint[] = [
  { label: "Lun", sales: 310, profit: 120 },
  { label: "Mar", sales: 420, profit: 162 },
  { label: "Mié", sales: 365, profit: 142 },
  { label: "Jue", sales: 580, profit: 230 },
  { label: "Vie", sales: 490, profit: 195 },
  { label: "Sáb", sales: 640, profit: 256 },
  { label: "Dom", sales: 435, profit: 180 },
];
export const alerts: AdminAlert[] = [
  {
    id: "stock",
    type: "Inventario",
    title: "3 productos con stock bajo",
    description: "Revisa los niveles mínimos para preparar la reposición.",
    priority: "warning",
    href: "/admin/inventario",
  },
  {
    id: "orders",
    type: "Pedidos",
    title: "4 pedidos pendientes",
    description: "Hay pedidos a la espera de preparación y despacho.",
    priority: "warning",
    href: "/admin/pedidos",
  },
  {
    id: "payment",
    type: "Finanzas",
    title: "1 pago por confirmar",
    description: "Comprueba el pago antes de continuar con el pedido.",
    priority: "critical",
    href: "/admin/finanzas",
  },
  {
    id: "movement",
    type: "Catálogo",
    title: "2 productos sin movimiento reciente",
    description: "Una oportunidad para revisar su visibilidad y estrategia.",
    priority: "info",
    href: "/admin/productos",
  },
];
export const topProducts: AdminTopProduct[] = [
  {
    name: "Perfume Demo",
    category: "Fragancias",
    units: 34,
    revenue: 1530,
    profit: 630,
  },
  {
    name: "Hair Growth",
    category: "Cuidado capilar",
    units: 28,
    revenue: 560,
    profit: 252,
  },
  {
    name: "Serum Facial",
    category: "Cuidado facial",
    units: 22,
    revenue: 374,
    profit: 176,
  },
  {
    name: "Vitamin Complex",
    category: "Suplementos",
    units: 18,
    revenue: 504,
    profit: 198,
  },
];
// Fixed demo scenario, independent of the actual calendar month.
export const projectionData: ProjectionSummary = {
  monthlyGoal: 5000,
  currentSales: 3240,
  remainingDays: 12,
  monthDays: 30,
};
