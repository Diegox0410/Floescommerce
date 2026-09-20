import { useId } from "react";
import type { SalesPoint } from "../types/admin";
import { money } from "./format";
export function SalesChart({ data }: { data: SalesPoint[] }) {
  const id = useId();
  const max = Math.max(
    1,
    ...data.map((p) => p.sales),
    ...data.map((p) => p.profit),
  );
  const ceiling = Math.ceil(max / 200) * 200;
  const floor =
    Math.floor(Math.min(0, ...data.map((p) => p.profit)) / 200) * 200;
  const range = ceiling - floor;
  const x = (i: number) => 58 + (i * 602) / Math.max(1, data.length - 1);
  const y = (v: number) => 220 - ((v - floor) / range) * 180;
  const line = (key: "sales" | "profit") =>
    data.map((p, i) => `${x(i)},${y(p[key])}`).join(" ");
  return (
    <section className="admin-card admin-chart">
      <div className="admin-card-heading">
        <div>
          <h2>Ventas y utilidad</h2>
          <p>Últimos 7 días · datos locales</p>
        </div>
        <span className="admin-chip">USD</span>
      </div>
      <div className="admin-chart-legend">
        <span>
          <i />
          Ventas
        </span>
        <span>
          <i />
          Utilidad
        </span>
      </div>
      <svg
        viewBox="0 0 700 260"
        role="img"
        aria-labelledby={`${id}-title ${id}-desc`}
      >
        <title id={`${id}-title`}>
          Ventas y utilidad de los últimos 7 días
        </title>
        <desc id={`${id}-desc`}>
          {data
            .map(
              (p) =>
                `${p.label}: ventas ${money(p.sales)}, utilidad ${money(p.profit)}`,
            )
            .join("; ")}
        </desc>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#61106c" stopOpacity=".12" />
            <stop offset="100%" stopColor="#61106c" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line
              x1="58"
              x2="660"
              y1={y(floor + (range * i) / 4)}
              y2={y(floor + (range * i) / 4)}
              stroke="#eee9ef"
              strokeDasharray="4 5"
            />
            <text x="45" y={y(floor + (range * i) / 4) + 4} textAnchor="end">
              {floor + (range * i) / 4}
            </text>
          </g>
        ))}
        {data.length > 0 && (
          <polygon
            points={`58,${y(0)} ${line("sales")} ${x(data.length - 1)},${y(0)}`}
            fill={`url(#${id})`}
          />
        )}
        <polyline
          points={line("sales")}
          fill="none"
          stroke="#61106c"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <polyline
          points={line("profit")}
          fill="none"
          stroke="#c69a46"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {data.map((p, i) => (
          <g key={p.label}>
            <circle
              cx={x(i)}
              cy={y(p.sales)}
              r="4"
              fill="#fff"
              stroke="#61106c"
              strokeWidth="2"
            >
              <title>
                {p.label}: {money(p.sales)}
              </title>
            </circle>
            <text x={x(i)} y="248" textAnchor="middle">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </section>
  );
}
