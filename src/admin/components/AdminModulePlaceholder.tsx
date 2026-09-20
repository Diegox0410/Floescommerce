import { Check, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { adminNavigation } from "../data/adminNavigation";
import { AdminSectionHeader } from "./AdminSectionHeader";
export function AdminModulePlaceholder({ path }: { path: string }) {
  const module = adminNavigation.find((n) => n.path === path)!;
  const Icon = module.icon;
  return (
    <>
      <AdminSectionHeader
        eyebrow={`ADMIN / ${module.title}`}
        title={module.title}
        description={module.description ?? ""}
      />
      <section className="admin-card admin-module">
        <span className="admin-module-icon">
          <Icon size={32} />
        </span>
        <span className="admin-status">
          <Check size={14} />
          Módulo preparado
        </span>
        <h2>El siguiente paso para tu negocio</h2>
        <p>
          Este espacio está listo para incorporar las herramientas de{" "}
          {module.title.toLowerCase()} en el próximo hito.
        </p>
        <div className="admin-module-features">
          {module.features?.map((f, i) => (
            <div key={f}>
              <span>0{i + 1}</span>
              <strong>{f}</strong>
              <p>Disponible en una próxima etapa.</p>
            </div>
          ))}
        </div>
        <p className="admin-footnote">
          Base visual y navegación listas. La conexión de datos y las
          operaciones se incorporarán en etapas posteriores.
        </p>
        <Link className="admin-button" to="/admin">
          <ArrowLeft size={16} />
          Volver al dashboard
        </Link>
      </section>
    </>
  );
}
