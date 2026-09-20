export type MovementType = "in" | "out" | "adjustment";
export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: string;
  batchId: string;
}
export interface MovementInput {
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  createdAt?: string;
}
