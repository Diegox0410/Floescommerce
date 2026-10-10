import type { StoreConfig } from "../../types/storeConfig";
import { record, text } from "../../utils/normalization";

export function applyPublicStoreConfig(config: StoreConfig, value: unknown): StoreConfig {
  const source = record(value);
  if (source.tenantId !== "tenant-floes") throw new Error("La configuración no corresponde a FLOES.");
  const number = text(record(source.contact).whatsapp);
  const valid = /^[1-9]\d{7,14}$/.test(number);
  return {
    ...config,
    contact: { ...config.contact, whatsapp: valid ? number : "" },
    commerce: {
      ...config.commerce,
      whatsappPurchaseEnabled: valid && record(source.commerce).whatsappPurchaseEnabled === true,
    },
  };
}

export async function fetchPublicStoreConfig(): Promise<unknown> {
  const response = await fetch("/api/store-config", { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo cargar el contacto de FLOES.");
  return response.json();
}
