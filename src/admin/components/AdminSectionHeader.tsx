import type { ReactNode } from "react";
interface Props {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}
export function AdminSectionHeader({
  eyebrow,
  title,
  description,
  action,
}: Props) {
  return (
    <header className="admin-section-header">
      <div>
        <span className="admin-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}
