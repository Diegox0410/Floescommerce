import { useState } from "react";
import type { ReactNode } from "react";
import type {
  PeriodKey,
  ProfitRow,
  RankKey,
} from "../../analytics/analyticsTypes";
import { rankProducts } from "../../analytics/salesMetrics";
import { Field, DataTable, EmptyState, OperationStats } from "./OperationsUI";
import { money, number } from "./format";
import { useBusinessSettingsStore } from "../../store/businessSettingsStore";
import type { inventoryMetrics } from "../../analytics/inventoryMetrics";
export function BusinessSection({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="admin-card admin-business-section">
      <div className="admin-card-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function PeriodSelector({
  value,
  onChange,
  start,
  end,
  onStart,
  onEnd,
  analyticsOnly = false,
}: {
  value: PeriodKey;
  onChange: (p: PeriodKey) => void;
  start?: string;
  end?: string;
  onStart?: (v: string) => void;
  onEnd?: (v: string) => void;
  analyticsOnly?: boolean;
}) {
  return (
    <div className="admin-business-period">
      <Field label="Periodo">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as PeriodKey)}
        >
          {!analyticsOnly && <option value="today">Hoy</option>}
          <option value="7d">7 días</option>
          <option value="30d">30 días</option>
          <option value="month">Mes actual</option>
          {!analyticsOnly && (
            <>
              <option value="all">Todo</option>
              <option value="custom">Personalizado</option>
            </>
          )}
        </select>
      </Field>
      {value === "custom" && (
        <>
          <Field label="Desde">
            <input
              type="date"
              value={start}
              onChange={(e) => onStart?.(e.target.value)}
            />
          </Field>
          <Field label="Hasta">
            <input
              type="date"
              value={end}
              onChange={(e) => onEnd?.(e.target.value)}
            />
          </Field>
        </>
      )}
    </div>
  );
}
export function SalesPolicyNote() {
  return (
    <p className="admin-footnote admin-metrics-note">
      Ventas comerciales estimadas: excluyen cancelados, pagos rechazados y
      reembolsados. Incluyen pendientes. Ventas netas descuentan descuentos y
      excluyen envío; utilidad usa costos históricos del pedido.
    </p>
  );
}
export function ProfitabilityTable({
  rows,
  title = "Rentabilidad por producto",
  limit,
}: {
  rows: ProfitRow[];
  title?: string;
  limit?: number;
}) {
  const [sort, setSort] = useState<RankKey>("revenue");
  const ranked = rankProducts(rows, sort).slice(0, limit);
  return (
    <BusinessSection
      title={title}
      description="Ventas netas y utilidad son rankings diferentes."
      action={
        <Field label={`Ordenar ${title.toLowerCase()}`}>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as RankKey)}
          >
            <option value="revenue">Ventas</option>
            <option value="profit">Utilidad</option>
            <option value="margin">Margen</option>
            <option value="units">Unidades</option>
          </select>
        </Field>
      }
    >
      {ranked.length ? (
        <DataTable
          columns={[
            "Producto / Categoría",
            "Unidades",
            "Ventas",
            "Costo",
            "Utilidad",
            "Margen",
          ]}
        >
          {ranked.map((r) => (
            <tr key={r.id}>
              <th scope="row">
                {r.name}
                <small>{r.category !== r.name ? r.category : ""}</small>
              </th>
              <td>{number(r.units)}</td>
              <td>{money(r.revenue)}</td>
              <td>{money(r.cost)}</td>
              <td>{money(r.profit)}</td>
              <td>{number(r.margin)}%</td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState
          title="Sin ventas en este periodo"
          description="Registra pedidos válidos para comparar rentabilidad."
        />
      )}
    </BusinessSection>
  );
}
export function InventoryCapital({
  inventory,
}: {
  inventory: ReturnType<typeof inventoryMetrics>;
}) {
  return (
    <BusinessSection
      title="Capital en inventario"
      description="Existencias actuales, incluidos productos inactivos. No depende del periodo de ventas."
    >
      <OperationStats
        items={[
          { label: "Costo invertido", value: money(inventory.costValue) },
          {
            label: "Valor potencial de venta",
            value: money(inventory.retailValue),
          },
          {
            label: "Utilidad potencial",
            value: money(inventory.potentialProfit),
          },
          { label: "Stock total", value: number(inventory.totalStock) },
          { label: "Productos agotados", value: number(inventory.out) },
          { label: "Productos bajo mínimo", value: number(inventory.low) },
        ]}
      />
      <p className="admin-footnote">
        Normal: {inventory.normal} · Bajo: {inventory.low} (stock positivo ≤
        mínimo) · Agotado: {inventory.out}. El potencial no representa ventas
        garantizadas ni rotación histórica.
      </p>
    </BusinessSection>
  );
}
export function BreakEvenTool({ result }: { result: number | null }) {
  const settings = useBusinessSettingsStore();
  const [fixed, setFixed] = useState(settings.fixedCosts),
    [margin, setMargin] = useState(
      settings.contributionMargin?.toString() ?? "",
    );
  const [saved, setSaved] = useState(false);
  return (
    <BusinessSection
      title="Punto de equilibrio"
      description="Estimación simple a partir de tus costos fijos mensuales y margen de contribución."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          settings.updateSettings({
            fixedCosts: fixed,
            contributionMargin: margin ? Number(margin) : null,
          });
          setSaved(true);
        }}
      >
        <div className="admin-form-grid">
          <Field label="Costos fijos mensuales (USD)">
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={fixed}
              onChange={(e) => {
                setFixed(Number(e.target.value));
                setSaved(false);
              }}
            />
          </Field>
          <Field label="Margen de contribución (%)">
            <input
              type="number"
              min="0.01"
              max="100"
              step="0.01"
              required
              value={margin}
              onChange={(e) => {
                setMargin(e.target.value);
                setSaved(false);
              }}
            />
          </Field>
        </div>
        <button className="admin-button admin-button-primary" type="submit">
          Guardar punto de equilibrio
        </button>
        {saved && (
          <span className="admin-footnote" role="status">
            {" "}
            Configuración guardada.
          </span>
        )}
      </form>
      <div className="admin-business-result">
        <span>Venta mensual de equilibrio</span>
        <strong>
          {result === null ? "Configura un margen positivo" : money(result)}
        </strong>
      </div>
      <p className="admin-footnote">
        Costos fijos ÷ (margen de contribución / 100). Introduce el margen
        después de todos los costos variables; el margen bruto de mercancía no
        contempla automáticamente comisiones, logística ni otros gastos.
      </p>
    </BusinessSection>
  );
}
