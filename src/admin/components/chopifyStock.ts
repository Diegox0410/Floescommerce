/** Owner labels distinguish aggregate inventory from verified size balances. */
export function ownerAvailability(variant: Record<string, unknown>): string {
  if (["ARCHIVED", "DRAFT", "INACTIVE"].includes(String(variant.status)) || variant.visibility === "HIDDEN") return "No publicado";
  const rows = Array.isArray(variant.sizeAvailability) ? variant.sizeAvailability : [];
  const quantities = rows.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const quantity = (entry as Record<string, unknown>).availableQuantity;
    return typeof quantity === "number" && Number.isInteger(quantity) && quantity >= 0 ? [quantity] : [];
  });
  if (quantities.some((amount) => amount > 0)) return "Disponible en las tallas confirmadas";
  if (rows.length > 0 && quantities.length === rows.length && quantities.every((amount) => amount === 0)) return "Sin stock en las tallas confirmadas";
  return "Disponibilidad por talla pendiente de confirmar";
}
