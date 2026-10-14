import { ChopifyMetricsPanel } from "../components/ChopifyMetricsPanel";
import { AdminSectionHeader } from "../components/AdminSectionHeader";
export function AdminFinance() {
  return <><AdminSectionHeader eyebrow="OWNER / CHOPIFY" title="Finanzas" description="Importes y estados registrados en Chopify. La aprobación de comprobantes se realiza en Pedidos." /><ChopifyMetricsPanel /></>;
}
