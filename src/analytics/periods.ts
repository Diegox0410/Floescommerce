import type { PeriodKey, PeriodRange } from "./analyticsTypes";
export const dayStart = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());
export const addDays = (date: Date, count: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + count);
export const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const parseInput = (value: string) => {
  const d = new Date(`${value}T00:00:00`);
  return Number.isFinite(d.getTime()) ? d : null;
};
export function getPeriod(
  key: PeriodKey,
  now = new Date(),
  customStart = "",
  customEnd = "",
): PeriodRange {
  const today = dayStart(now);
  const end = now;
  if (key === "all") return { start: null, end, label: "Todo" };
  if (key === "today") return { start: today, end, label: "Hoy" };
  if (key === "month")
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end,
      label: "Mes actual",
    };
  if (key === "custom") {
    const start = parseInput(customStart),
      last = parseInput(customEnd);
    return {
      start: start ?? today,
      end: last
        ? new Date(Math.min(addDays(last, 1).getTime() - 1, now.getTime()))
        : end,
      label: "Rango personalizado",
    };
  }
  const days = key === "7d" ? 7 : 30;
  return { start: addDays(today, 1 - days), end, label: `${days} días` };
}
export function inPeriod(value: string, range: PeriodRange) {
  const time = Date.parse(value);
  return (
    Number.isFinite(time) &&
    time <= range.end.getTime() &&
    (!range.start || time >= range.start.getTime())
  );
}
export function previousPeriod(range: PeriodRange): PeriodRange | null {
  if (!range.start || range.start > range.end) return null;
  // Compare identical calendar dates and the same elapsed time on the final day.
  const days =
    Math.round(
      (Date.UTC(
        range.end.getFullYear(),
        range.end.getMonth(),
        range.end.getDate(),
      ) -
        Date.UTC(
          range.start.getFullYear(),
          range.start.getMonth(),
          range.start.getDate(),
        )) /
        86400000,
    ) + 1;
  const start = addDays(range.start, -days);
  const end = addDays(range.end, -days);
  end.setHours(
    range.end.getHours(),
    range.end.getMinutes(),
    range.end.getSeconds(),
    range.end.getMilliseconds(),
  );
  return { start, end, label: "Periodo anterior equivalente" };
}
export const percentChange = (
  current: number,
  previous: number,
): number | null =>
  previous > 0 && Number.isFinite(current) && Number.isFinite(previous)
    ? ((current - previous) / previous) * 100
    : null;
