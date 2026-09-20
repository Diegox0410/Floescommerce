import { useId } from "react";
import type { DailyPoint } from "../../analytics/analyticsTypes";
import { money, number } from "./format";
import { BusinessSection } from "./BusinessUI";
import { DataTable } from "./OperationsUI";
export function BusinessChart({
  data,
  period,
}: {
  data: DailyPoint[];
  period: string;
}) {
  const id = useId();
  const min = Math.min(0, ...data.map((p) => p.profit));
  const max = Math.max(
    1,
    ...data.map((p) => p.sales),
    ...data.map((p) => p.profit),
  );
  const range = max - min;
  const x = (i: number) => 65 + (i * 590) / Math.max(1, data.length - 1),
    y = (v: number) => 195 - ((v - min) / range) * 155;
  const line = (key: "sales" | "profit") =>
    data.map((p, i) => `${x(i)},${y(p[key])}`).join(" ");
  const maxOrders = Math.max(1, ...data.map((p) => p.orders));
  const stride = Math.max(1, Math.ceil(data.length / 6));
  return (
    <BusinessSection
      title="Evolución comercial"
      description={`${period} · ventas netas, utilidad bruta y pedidos válidos por día`}
    >
      <div className="admin-chart-legend">
        <span>
          <i />
          Ventas
        </span>
        <span>
          <i />
          Utilidad
        </span>
        <span className="admin-business-orders-legend">
          Pedidos (escala inferior)
        </span>
      </div>
      <svg
        className="admin-business-chart"
        viewBox="0 0 700 315"
        role="img"
        aria-labelledby={`${id}-title ${id}-desc`}
      >
        <title id={`${id}-title`}>Evolución comercial: {period}</title>
        <desc id={`${id}-desc`}>
          {data
            .map(
              (p) =>
                `${p.label}: ventas ${money(p.sales)}, utilidad ${money(p.profit)}, pedidos ${p.orders}`,
            )
            .join("; ")}
        </desc>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line
              x1="65"
              x2="655"
              y1={y(min + (range * i) / 4)}
              y2={y(min + (range * i) / 4)}
              stroke="#eee9ef"
              strokeDasharray="4 5"
            />
            <text x="55" y={y(min + (range * i) / 4) + 4} textAnchor="end">
              {number(min + (range * i) / 4)}
            </text>
          </g>
        ))}
        <text x="65" y="20">
          USD
        </text>
        <polyline
          points={line("sales")}
          fill="none"
          stroke="#61106c"
          strokeWidth="3"
        />
        <polyline
          points={line("profit")}
          fill="none"
          stroke="#c69a46"
          strokeWidth="2.5"
        />
        {data.map((p, i) => (
          <g key={p.date}>
            <circle cx={x(i)} cy={y(p.sales)} r="3" fill="#61106c">
              <title>
                {p.label}: {money(p.sales)} · utilidad {money(p.profit)}
              </title>
            </circle>
            <rect
              x={x(i) - Math.min(8, 230 / data.length)}
              y={280 - (p.orders / maxOrders) * 50}
              width={Math.min(16, 460 / data.length)}
              height={(p.orders / maxOrders) * 50}
              rx="2"
              fill="#bea0c4"
            >
              <title>
                {p.label}: {p.orders} pedidos
              </title>
            </rect>
            {(i % stride === 0 || i === data.length - 1) && (
              <text x={x(i)} y="302" textAnchor="middle">
                {p.label}
              </text>
            )}
          </g>
        ))}
        <text x="55" y="250" textAnchor="end">
          {maxOrders}
        </text>
        <text x="55" y="281" textAnchor="end">
          0
        </text>
        <text x="65" y="224">
          Pedidos
        </text>
      </svg>
      {!data.some((p) => p.orders > 0) && (
        <p className="admin-footnote">
          Sin pedidos válidos en el periodo; la serie muestra cero.
        </p>
      )}
      <details className="admin-business-daily">
        <summary>Ver datos diarios</summary>
        <DataTable columns={["Día", "Ventas", "Utilidad", "Pedidos"]}>
          {data.map((p) => (
            <tr key={p.date}>
              <th scope="row">{p.label}</th>
              <td>{money(p.sales)}</td>
              <td>{money(p.profit)}</td>
              <td>{p.orders}</td>
            </tr>
          ))}
        </DataTable>
      </details>
    </BusinessSection>
  );
}
