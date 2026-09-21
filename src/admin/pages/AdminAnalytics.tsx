import { useState } from "react";
import type { PeriodKey, RankKey } from "../../analytics/analyticsTypes";
import { useBusinessMetrics } from "../../analytics/useBusinessMetrics";
import { rankProducts } from "../../analytics/salesMetrics";
import { AdminSectionHeader } from "../components/AdminSectionHeader";
import { OperationStats } from "../components/OperationsUI";
import {
  BusinessSection,
  PeriodSelector,
  SalesPolicyNote,
  ProfitabilityTable,
} from "../components/BusinessUI";
import { BusinessChart } from "../components/BusinessChart";
import { money, number } from "../components/format";
export function AdminAnalytics() {
  const [period, setPeriod] = useState<PeriodKey>("month");
  const m = useBusinessMetrics(period),
    f = m.finance,
    c = m.customers;
  const rankings: { key: RankKey; label: string }[] = [
    { key: "revenue", label: "Top por ventas" },
    { key: "profit", label: "Top por utilidad" },
    { key: "units", label: "Top por unidades" },
    { key: "margin", label: "Mayor margen" },
  ];
  return (
    <>
      <AdminSectionHeader
        eyebrow="ADMIN / INTELIGENCIA COMERCIAL"
        title="Analítica"
        description="Observa cómo evoluciona FLOES y dónde se genera el resultado."
      />
      <PeriodSelector value={period} onChange={setPeriod} analyticsOnly />
      <SalesPolicyNote />
      <OperationStats
        items={[
          { label: "Ventas netas", value: money(f.netRevenue) },
          { label: "Utilidad bruta", value: money(f.grossProfit) },
          { label: "Pedidos válidos", value: number(f.validOrders) },
          { label: "Ticket promedio", value: money(f.averageOrderValue) },
        ]}
      />
      <BusinessChart data={m.chart} period={m.range.label} />
      <BusinessSection
        title="Comparación de periodos"
        description="Periodo anterior equivalente, con igual número de días y hora de corte."
      >
        <div className="admin-business-comparison">
          {[
            { label: "Ventas", value: m.comparison.sales },
            { label: "Utilidad", value: m.comparison.profit },
            { label: "Pedidos", value: m.comparison.orders },
          ].map((x) => (
            <div key={x.label}>
              <span>{x.label}</span>
              <strong>
                {x.value === null
                  ? "Sin datos suficientes"
                  : `${x.value > 0 ? "+" : ""}${number(x.value)}%`}
              </strong>
            </div>
          ))}
        </div>
      </BusinessSection>
      <div className="admin-business-rankings">
        {rankings.map((r) => {
          const top = rankProducts(m.profitability, r.key)[0];
          return (
            <BusinessSection key={r.key} title={r.label}>
              {top ? (
                <>
                  <strong className="admin-business-leader">{top.name}</strong>
                  <p>
                    {r.key === "margin"
                      ? `${number(top.margin)}%`
                      : r.key === "units"
                        ? `${number(top.units)} unidades`
                        : money(top[r.key])}
                  </p>
                </>
              ) : (
                <p className="admin-footnote">Sin productos vendidos.</p>
              )}
            </BusinessSection>
          );
        })}
      </div>
      <ProfitabilityTable rows={m.profitability} />
      <ProfitabilityTable
        rows={m.categories}
        title="Rentabilidad por categoría"
      />
      <BusinessSection
        title="Clientes y recurrencia"
        description="Cliente recurrente: más de un pedido válido acumulado hasta el fin del periodo."
      >
        <OperationStats
          items={[
            {
              label: "Clientes únicos compradores",
              value: number(c.uniqueCustomers),
            },
            {
              label: "Clientes nuevos compradores",
              value: number(c.newCustomers),
              helper: "Primera compra válida en el periodo",
            },
            {
              label: "Clientes recurrentes",
              value: number(c.recurringCustomers),
            },
            {
              label: "Ingresos de primeras compras",
              value: money(c.newRevenue),
            },
            {
              label: "Ingresos de compras recurrentes",
              value: money(c.recurringRevenue),
            },
            { label: "Ticket promedio", value: money(c.averageTicket) },
          ]}
        />
        <p className="admin-footnote">
          Ingresos atribuidos a la primera compra válida o a compras
          posteriores, sin duplicarlos. Pedidos sin identidad de cliente:{" "}
          {c.unidentifiedOrders}; se excluyen de segmentación y del ingreso
          histórico medio. Un cliente nuevo puede volverse recurrente dentro del
          periodo. Categorías según catálogo actual, sin snapshot histórico.
        </p>
      </BusinessSection>
    </>
  );
}
