import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AdminStatCard } from "./AdminStatCard";
import { Package } from "lucide-react";
export function OperationStats({
  items,
}: {
  items: { label: string; value: string; helper?: string }[];
}) {
  return (
    <div className="admin-kpi-grid">
      {items.map((i) => (
        <AdminStatCard
          key={i.label}
          label={i.label}
          value={i.value}
          helper={i.helper ?? "Datos locales"}
          icon={Package}
        />
      ))}
    </div>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Status({ children }: { children: ReactNode }) {
  return <span className="admin-chip admin-operation-status">{children}</span>;
}
export function EmptyState({
  title = "No hay resultados",
  description = "Prueba otros filtros o registra información para empezar.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="admin-empty">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
export function DetailBack({ to, label }: { to: string; label: string }) {
  return (
    <Link className="admin-text-link admin-detail-back" to={to}>
      ← {label}
    </Link>
  );
}
export function DataTable({
  columns,
  children,
}: {
  columns: string[];
  children: ReactNode;
}) {
  return (
    <div className="admin-table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
export function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <p role="alert" className="admin-error">
      {message}
    </p>
  ) : null;
}
