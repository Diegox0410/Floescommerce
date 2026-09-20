export type PeriodKey = "today" | "7d" | "30d" | "month" | "all" | "custom";
export interface PeriodRange {
  start: Date | null;
  end: Date;
  label: string;
}
export interface FinanceMetrics {
  grossRevenue: number;
  netRevenue: number;
  discounts: number;
  costOfGoodsSold: number;
  grossProfit: number;
  grossMargin: number;
  averageOrderValue: number;
  totalOrders: number;
  validOrders: number;
  cancelledOrders: number;
  excludedOrders: number;
  unitsSold: number;
  averageProductMargin: number;
  customerLifetimeRevenue: number;
  inventoryCostValue: number;
  inventoryRetailValue: number;
  inventoryPotentialProfit: number;
}
export interface ProfitRow {
  id: string;
  name: string;
  category: string;
  units: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}
export type RankKey = "revenue" | "profit" | "margin" | "units";
export interface DailyPoint {
  date: string;
  label: string;
  sales: number;
  profit: number;
  orders: number;
}
export type GoalStatus = "achieved" | "onTrack" | "attention" | "atRisk";
export interface ProjectionInput {
  monthlyGoal: number;
  currentRevenue: number;
  daysElapsed: number;
  daysRemaining: number;
  averageTicket: number;
  averageMargin: number;
  hasData?: boolean;
}
export interface ProjectionResult {
  goalProgress: number;
  remainingRevenue: number;
  requiredDailyRevenue: number | null;
  requiredOrders: number | null;
  averageDailyRevenue: number | null;
  projectedEndRevenue: number | null;
  projectedProfit: number | null;
  goalGap: number | null;
  status: GoalStatus | null;
}
export interface ScenarioInput {
  name: string;
  volumeVariation: number;
  averageTicket: number;
  margin: number;
}
export interface ScenarioResult extends ScenarioInput {
  revenue: number | null;
  orders: number | null;
  profit: number | null;
}
