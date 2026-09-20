import { useEffect, useMemo, useState } from "react";
import { useProductStore } from "../store/productStore";
import { useOrderStore } from "../store/orderStore";
import { useBusinessSettingsStore } from "../store/businessSettingsStore";
import type { PeriodKey } from "./analyticsTypes";
import { getPeriod } from "./periods";
import { businessMetrics } from "./businessMetrics";
export function useBusinessMetrics(
  period: PeriodKey = "month",
  customStart = "",
  customEnd = "",
) {
  const products = useProductStore((s) => s.products),
    orders = useOrderStore((s) => s.orders),
    settings = useBusinessSettingsStore();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const range = useMemo(
    () => getPeriod(period, now, customStart, customEnd),
    [period, now, customStart, customEnd],
  );
  return useMemo(
    () => ({
      ...businessMetrics(products, orders, range, settings, now),
      range,
      now,
    }),
    [products, orders, range, settings, now],
  );
}
