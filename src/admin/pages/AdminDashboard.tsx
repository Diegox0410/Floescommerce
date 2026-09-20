import {
  CalendarDays,
  Banknote,
  TrendingUp,
  ShoppingBag,
  Users,
  Receipt,
  Percent,
  Package,
  PackageMinus,
} from "lucide-react";
import { useBusinessMetrics } from "../../analytics/useBusinessMetrics";
import { AdminSectionHeader } from "../components/AdminSectionHeader";
import { AdminStatCard } from "../components/AdminStatCard";
import { BusinessChart } from "../components/BusinessChart";
import { ProjectionCard } from "../components/ProjectionCard";
import { ProfitabilityTable, SalesPolicyNote } from "../components/BusinessUI";
import { AlertList } from "../components/AlertList";
import { money, number } from "../components/format";
export function AdminDashboard() {
  const m = useBusinessMetrics(),
    f = m.finance;
  const period = new Intl.DateTimeFormat("es-EC", {
    month: "long",
    year: "numeric",
  }).format(m.now);
  const kpis = [
    {
      label: "Ventas del mes",
      value: money(f.netRevenue),
      icon: Banknote,
      helper: "Ventas netas comerciales estimadas",
    },
    {
      label: "Utilidad bruta",
      value: money(f.grossProfit),
      icon: TrendingUp,
      helper: "Costos históricos y descuentos",
    },
    {
      label: "Pedidos válidos",
      value: number(f.validOrders),
      icon: ShoppingBag,
      helper: "Pedidos válidos este mes",
    },
    {
      label: "Clientes compradores",
      value: number(m.customers.uniqueCustomers),
      icon: Users,
      helper: `${m.customers.newCustomers} nuevos compradores`,
    },
    {
      label: "Ticket promedio",
      value: money(f.averageOrderValue),
      icon: Receipt,
      helper: "Ventas netas por pedido válido",
    },
    {
      label: "Margen bruto",
      value: `${number(f.grossMargin)}%`,
      icon: Percent,
      helper: "Utilidad sobre ventas netas",
    },
    {
      label: "Inventario valorizado",
      value: money(f.inventoryCostValue),
      icon: Package,
      helper: "Costo actual de existencias",
    },
    {
      label: "Stock crítico",
      value: number(m.inventory.low + m.inventory.out),
      icon: PackageMinus,
      helper: "Stock bajo y agotados",
    },
  ];
  return (
    <>
      <AdminSectionHeader
        eyebrow="RESUMEN EJECUTIVO / DATOS LOCALES"
        title="Buenos días"
        description="Así va DGNG hoy."
        action={
          <span className="admin-period">
            <CalendarDays size={17} />
            {period}
          </span>
        }
      />
      <div className="admin-kpi-grid">
        {kpis.map((k) => (
          <AdminStatCard key={k.label} {...k} />
        ))}
      </div>
      <SalesPolicyNote />
      <div className="admin-dashboard-row">
        <BusinessChart data={m.chart} period="Mes actual" />
        <ProjectionCard input={m.projectionInput} result={m.projection} />
      </div>
      <div className="admin-dashboard-bottom">
        <ProfitabilityTable
          rows={m.profitability}
          title="Productos del periodo"
          limit={4}
        />
        <AlertList alerts={m.alerts} />
      </div>
    </>
  );
}
