import { ChopifyMetricsPanel } from "../components/ChopifyMetricsPanel";
import { AdminSectionHeader } from "../components/AdminSectionHeader";
export function AdminAnalytics() {
  return <><AdminSectionHeader eyebrow="OWNER / CHOPIFY" title="Analítica" description="Indicadores derivados de los registros comerciales de FLOES en Chopify." /><ChopifyMetricsPanel /></>;
}
