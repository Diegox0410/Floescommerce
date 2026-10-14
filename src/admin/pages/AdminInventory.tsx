import { ChopifyInventoryPanel } from "../components/ChopifyInventoryPanel";
import { AdminSectionHeader } from "../components/AdminSectionHeader";
export function AdminInventory() {
  return <><AdminSectionHeader eyebrow="OWNER / CHOPIFY" title="Inventario FLOES" description="Existencias y disponibilidad recibidas de Chopify. La cantidad agrupada por color no confirma disponibilidad por talla." /><ChopifyInventoryPanel /></>;
}
