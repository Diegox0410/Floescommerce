import { useState } from "react";
import type { PeriodKey } from "../../analytics/analyticsTypes";
import { useBusinessMetrics } from "../../analytics/useBusinessMetrics";
import { AdminSectionHeader } from "../components/AdminSectionHeader";
import { OperationStats } from "../components/OperationsUI";
import {
  PeriodSelector,
  SalesPolicyNote,
  ProfitabilityTable,
  InventoryCapital,
  BreakEvenTool,
} from "../components/BusinessUI";
import { money, number } from "../components/format";
export function AdminFinance() {
  const [period, setPeriod] = useState<PeriodKey>("month"),
    [start, setStart] = useState(""),
    [end, setEnd] = useState("");
  const m = useBusinessMetrics(period, start, end),
    f = m.finance;
  return (
    <>
      <AdminSectionHeader
        eyebrow="ADMIN / INTELIGENCIA COMERCIAL"
        title="Finanzas"
        description="Entiende cuánto vende FLOES, cuánto cuesta operar y cuánto realmente genera."
      />
      <PeriodSelector
        value={period}
        onChange={setPeriod}
        start={start}
        end={end}
        onStart={setStart}
        onEnd={setEnd}
      />
      <SalesPolicyNote />
      {period === "custom" && (!start || !end || start > end) && (
        <p role="status" className="admin-error">
          Selecciona un rango completo, con inicio anterior o igual al fin.
        </p>
      )}
      <OperationStats
        items={[
          {
            label: "Ventas netas",
            value: money(f.netRevenue),
            helper: m.range.label,
          },
          {
            label: "Costo de mercancía vendida",
            value: money(f.costOfGoodsSold),
          },
          { label: "Utilidad bruta", value: money(f.grossProfit) },
          { label: "Margen bruto", value: `${number(f.grossMargin)}%` },
          { label: "Ticket promedio", value: money(f.averageOrderValue) },
          { label: "Pedidos válidos", value: number(f.validOrders) },
          { label: "Unidades vendidas", value: number(f.unitsSold) },
          { label: "Ventas brutas", value: money(f.grossRevenue) },
          { label: "Descuentos", value: money(f.discounts) },
          {
            label: "Margen medio por producto vendido",
            value: `${number(f.averageProductMargin)}%`,
          },
          {
            label: "Ingreso histórico medio por cliente",
            value: money(f.customerLifetimeRevenue),
            helper: "Todos los pedidos válidos hasta el fin del periodo",
          },
        ]}
      />
      <p className="admin-footnote admin-metrics-note">
        Pedidos registrados: {f.totalOrders} · Cancelados: {f.cancelledOrders} ·
        Excluidos: {f.excludedOrders}. Utilidad bruta antes de costos fijos y
        otros gastos. Categorías según catálogo actual; los pedidos no guardan
        categoría histórica.
      </p>
      <ProfitabilityTable rows={m.profitability} />
      <ProfitabilityTable
        rows={m.categories}
        title="Rentabilidad por categoría"
      />
      <InventoryCapital inventory={m.inventory} />
      <BreakEvenTool result={m.breakEven} />
    </>
  );
}
