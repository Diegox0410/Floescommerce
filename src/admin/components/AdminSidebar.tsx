import { NavLink, Link } from "react-router-dom";
import { ExternalLink, PanelLeftClose } from "lucide-react";
import { adminNavigation } from "../data/adminNavigation";
import { adminUser } from "../data/adminDemoData";
export function AdminSidebar({
  onNavigate,
  onToggle,
  collapsed,
}: {
  onNavigate: () => void;
  onToggle: () => void;
  collapsed: boolean;
}) {
  return (
    <>
      <div className="admin-sidebar-brand">
        <Link to="/admin" onClick={onNavigate} aria-label="FLOES Admin">
          <strong>FLOES</strong>
          <span>ADMIN</span>
        </Link>
        <button
          className="admin-icon-button"
          onClick={onToggle}
          aria-label={
            collapsed ? "Expandir navegación" : "Cerrar o contraer navegación"
          }
        >
          <PanelLeftClose size={18} />
        </button>
      </div>
      <nav aria-label="Administración">
        {Array.from(new Set(adminNavigation.map((item) => item.group))).map((group) => <div className="admin-nav-group" key={group}>
          <span className="admin-sidebar-eyebrow">{group}</span>
          {adminNavigation.filter((item) => item.group === group).map(({ path, title, icon: Icon }) => (
            <NavLink key={path} end={path === ""} to={`/admin${path ? "/" + path : ""}`} title={title} onClick={onNavigate} className={({ isActive }) => `admin-nav-link ${isActive ? "is-active" : ""} ${path === "configuracion" ? "admin-nav-settings" : ""}`}>
              <Icon size={19} /><span>{path === "productos" ? "Modelos" : title}</span>
            </NavLink>
          ))}
        </div>)}
        <div className="admin-production-note" aria-label="Módulo de producción próximo">
          <strong>Producción</strong>
          <span>Próximamente: por confeccionar, en confección y terminados.</span>
        </div>
      </nav>
      <div className="admin-sidebar-bottom">
        <div className="admin-owner">
          <span className="admin-avatar">D</span>
          <div>
            <strong>{adminUser.role}</strong>
            <span>Administrador</span>
          </div>
        </div>
        <Link
          className="admin-store-link"
          to="/"
          onClick={onNavigate}
          title="Ver tienda"
        >
          <ExternalLink size={17} />
          <span>Ver tienda</span>
        </Link>
      </div>
    </>
  );
}
