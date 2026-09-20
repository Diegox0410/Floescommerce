import { safeNumber } from "../utils/productMetrics";
import type {
  ProjectionInput,
  ProjectionResult,
  GoalStatus,
  ScenarioInput,
  ScenarioResult,
} from "./analyticsTypes";
export const signedNumber = (v: unknown, fallback = 0) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;
export const goalStatusLabels: Record<GoalStatus, string> = {
  achieved: "Meta alcanzada",
  onTrack: "En camino",
  attention: "Requiere atención",
  atRisk: "Meta en riesgo",
};
export function projectionEngine(input: ProjectionInput): ProjectionResult {
  const goal = safeNumber(input.monthlyGoal),
    revenue = safeNumber(input.currentRevenue),
    elapsed = Math.floor(safeNumber(input.daysElapsed)),
    remaining = Math.floor(safeNumber(input.daysRemaining)),
    ticket = safeNumber(input.averageTicket),
    margin = signedNumber(input.averageMargin);
  const missing = Math.max(0, goal - revenue);
  const hasData = (input.hasData ?? revenue > 0) && revenue > 0 && elapsed > 0;
  const daily = hasData ? revenue / elapsed : null,
    projected = daily === null ? null : daily * (elapsed + remaining);
  const status: GoalStatus | null =
    goal === 0
      ? null
      : missing === 0
        ? "achieved"
        : remaining === 0
          ? "atRisk"
          : projected === null
            ? "attention"
            : projected >= goal
              ? "onTrack"
              : projected >= goal * 0.8
                ? "attention"
                : "atRisk";
  return {
    goalProgress: goal > 0 ? (revenue / goal) * 100 : 0,
    remainingRevenue: missing,
    requiredDailyRevenue:
      missing === 0 ? 0 : remaining > 0 ? missing / remaining : null,
    requiredOrders:
      missing === 0 ? 0 : ticket > 0 ? Math.ceil(missing / ticket) : null,
    averageDailyRevenue: daily,
    projectedEndRevenue: projected,
    projectedProfit: projected === null ? null : (projected * margin) / 100,
    goalGap: projected === null ? null : Math.max(0, goal - projected),
    status,
  };
}
export function scenarioProjection(
  input: ProjectionInput,
  scenario: ScenarioInput,
): ScenarioResult {
  const elapsed = safeNumber(input.daysElapsed),
    remaining = safeNumber(input.daysRemaining),
    observedTicket = safeNumber(input.averageTicket),
    revenue = safeNumber(input.currentRevenue);
  const known =
    elapsed > 0 && observedTicket > 0 && (input.hasData ?? revenue > 0);
  const ticket = safeNumber(scenario.averageTicket),
    margin = signedNumber(scenario.margin),
    variation = Math.max(-100, signedNumber(scenario.volumeVariation));
  const futureOrders = known
    ? (revenue / observedTicket / elapsed) * remaining * (1 + variation / 100)
    : null;
  const totalRevenue =
    futureOrders === null ? null : revenue + futureOrders * ticket;
  return {
    ...scenario,
    averageTicket: ticket,
    margin,
    volumeVariation: variation,
    revenue: totalRevenue,
    orders:
      futureOrders === null ? null : revenue / observedTicket + futureOrders,
    profit:
      futureOrders === null
        ? null
        : (revenue * signedNumber(input.averageMargin)) / 100 +
          (futureOrders * ticket * margin) / 100,
  };
}
export function breakEvenRevenue(
  fixedCosts: number,
  contributionMargin: number,
): number | null {
  const margin = signedNumber(contributionMargin);
  return margin > 0 && margin <= 100
    ? safeNumber(fixedCosts) / (margin / 100)
    : null;
}
