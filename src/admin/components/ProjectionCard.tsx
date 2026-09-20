import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type {
  ProjectionInput,
  ProjectionResult,
} from "../../analytics/analyticsTypes";
import { goalStatusLabels } from "../../analytics/projectionEngine";
import { money, number } from "./format";
export function ProjectionCard({
  input,
  result,
}: {
  input: ProjectionInput;
  result: ProjectionResult;
}) {
  if (input.monthlyGoal <= 0)
    return (
      <section className="admin-card admin-projection">
        <div className="admin-card-heading">
          <div>
            <h2>Tu próxima meta</h2>
            <p>Define el objetivo de ventas del mes.</p>
          </div>
          <ArrowUpRight size={20} />
        </div>
        <p className="admin-footnote">Todavía no hay una meta configurada.</p>
        <Link
          className="admin-button admin-button-primary"
          to="/admin/proyeccion"
        >
          Configurar meta <ArrowUpRight size={14} />
        </Link>
      </section>
    );
  return (
    <section className="admin-card admin-projection">
      <div className="admin-card-heading">
        <div>
          <h2>Tu próxima meta</h2>
          <p>Meta mensual local · {input.daysRemaining} días restantes</p>
        </div>
        <ArrowUpRight size={20} />
      </div>
      <div className="admin-goal">
        <strong>
          {number(result.goalProgress)}
          <small>%</small>
        </strong>
        <span>de la meta mensual</span>
      </div>
      <div
        className="admin-progress"
        role="progressbar"
        aria-label="Avance de la meta mensual"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, result.goalProgress)}
      >
        <span style={{ width: `${Math.min(100, result.goalProgress)}%` }} />
      </div>
      <dl>
        {[
          ["Meta mensual", money(input.monthlyGoal)],
          ["Actual", money(input.currentRevenue)],
          ["Faltante", money(result.remainingRevenue)],
          [
            "Necesario por día",
            result.requiredDailyRevenue === null
              ? "Periodo cerrado"
              : money(result.requiredDailyRevenue),
          ],
          [
            "Proyección fin de mes",
            result.projectedEndRevenue === null
              ? "Sin datos suficientes"
              : money(result.projectedEndRevenue),
          ],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="admin-projection-footer">
        <span
          className={`admin-status ${result.status === "atRisk" || result.status === "attention" ? "admin-status-warning" : ""}`}
        >
          {result.status ? goalStatusLabels[result.status] : "Sin meta"}
        </span>
        <Link to="/admin/proyeccion">
          Ver proyección <ArrowUpRight size={14} />
        </Link>
      </div>
      <p className="admin-footnote">
        Escenario lineal del ritmo observado, no predicción de demanda.
      </p>
    </section>
  );
}
