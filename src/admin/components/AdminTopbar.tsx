import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { adminUser } from "../data/adminDemoData";
import { adminNavigation } from "../data/adminNavigation";
import { useStoreConfigStore } from "../../store/storeConfigStore";
export function AdminTopbar({
  onToggle,
  expanded,
}: {
  onToggle: () => void;
  expanded: boolean;
}) {
  const { pathname } = useLocation();
  const storeName = useStoreConfigStore((s) => s.config.identity.name);
  const current =
    adminNavigation.find(
      (n) =>
        pathname === `/admin${n.path ? "/" + n.path : ""}` ||
        (n.path && pathname.startsWith(`/admin/${n.path}/`)),
    )?.title ?? "Administración";
  return (
    <header className="admin-topbar">
      <div>
        <button
          className="admin-icon-button"
          onClick={onToggle}
          aria-label="Alternar navegación"
          aria-expanded={expanded}
          aria-controls="admin-navigation"
        >
          <Menu size={20} />
        </button>
        <span className="admin-topbar-brand">
          {storeName} <span>/</span>
        </span>
        <strong>{current}</strong>
      </div>
      <div>
        <span className="admin-demo-badge">Datos locales</span>
        <div className="admin-topbar-user">
          <strong>{adminUser.name}</strong>
          <span>{adminUser.role}</span>
        </div>
        <span className="admin-avatar">D</span>
      </div>
    </header>
  );
}
