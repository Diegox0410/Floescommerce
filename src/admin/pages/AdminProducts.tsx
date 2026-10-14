import { ChopifyCatalogPanel } from "../components/ChopifyCatalogPanel";
import { AdminSectionHeader } from "../components/AdminSectionHeader";
export function AdminProducts({ restricted = false }: { restricted?: boolean }) {
  return <><AdminSectionHeader eyebrow="OWNER / CHOPIFY" title="Modelos FLOES" description="Catálogo, precios registrados, variantes y galerías desde Chopify. Los registros históricos se conservan aparte." />{restricted && <p role="status" className="admin-card admin-module">Cambios comerciales requieren sincronización autorizada. Esta ruta conserva acceso al catálogo de Chopify en modo de lectura; no escribe un catálogo paralelo en Firebase.</p>}<ChopifyCatalogPanel /></>;
}
