import { useStoreConfigStore } from "../../store/storeConfigStore";
export const money = (value: number) =>
  new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: useStoreConfigStore.getState().config.commerce.currency || "USD",
    maximumFractionDigits: 2,
  }).format(value);
export const number = (value: number) =>
  new Intl.NumberFormat("es-EC", { maximumFractionDigits: 1 }).format(value);
