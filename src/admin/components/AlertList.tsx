import { AlertCircle, ArrowUpRight, Info } from "lucide-react";
import { Link } from "react-router-dom";
import type { AdminAlert } from "../types/admin";
const priorities = {
  info: "Informativa",
  warning: "Atención",
  critical: "Prioritaria",
};
export function AlertList({ alerts }: { alerts: AdminAlert[] }) {
  return (
    <section className="admin-card">
      <div className="admin-card-heading">
        <div>
          <h2>Requieren tu atención</h2>
          <p>Prioridades operativas · datos locales</p>
        </div>
        <span className="admin-chip">{alerts.length}</span>
      </div>
      {!alerts.length && (
        <p className="admin-empty">No hay alertas pendientes.</p>
      )}
      <ul className="admin-alerts">
        {alerts.map((a) => (
          <li key={a.id}>
            <Link to={a.href}>
              <span className={`admin-alert-icon admin-alert-${a.priority}`}>
                {a.priority === "info" ? (
                  <Info size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
              </span>
              <div>
                <span className="admin-alert-type">
                  {a.type} · {priorities[a.priority]}
                </span>
                <h3>{a.title}</h3>
                <p>{a.description}</p>
              </div>
              <ArrowUpRight size={16} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
