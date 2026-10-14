import { ChopifyCustomersPanel } from "../components/ChopifyCustomersPanel";
import { AdminSectionHeader } from "../components/AdminSectionHeader";
export function AdminCustomers() {
  return <><AdminSectionHeader eyebrow="OWNER / CHOPIFY" title="Clientes" description="Clientes e historial del tenant FLOES persistidos en Chopify." /><ChopifyCustomersPanel /></>;
}
