import type { LucideIcon } from "lucide-react";
interface Props {
  label: string;
  value: string;
  trend?: string;
  helper: string;
  icon: LucideIcon;
}
export function AdminStatCard({
  label,
  value,
  trend,
  helper,
  icon: Icon,
}: Props) {
  return (
    <article
      className={`admin-stat admin-card ${trend ? "" : "admin-stat-secondary"}`}
    >
      <div className="admin-stat-label">
        {label}
        <Icon size={18} aria-hidden="true" />
      </div>
      <strong>{value}</strong>
      <div className="admin-stat-helper">
        {trend && <span className="admin-trend">{trend}</span>}
        <span>{helper}</span>
      </div>
    </article>
  );
}
