export function isCanonicalOwnerSnapshot(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const snapshot = value as Record<string, unknown>;
  return snapshot.schemaVersion === 2 && snapshot.canonical === true && snapshot.tenantId === "tenant-floes" &&
    typeof snapshot.capturedAt === "string" && !Number.isNaN(Date.parse(snapshot.capturedAt)) &&
    (typeof snapshot.stateVersion === "string" && !!snapshot.stateVersion || typeof snapshot.stateVersion === "number" && Number.isFinite(snapshot.stateVersion)) &&
    Array.isArray(snapshot.products) && Array.isArray(snapshot.inventory) && snapshot.products.every((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
      const product = entry as Record<string, unknown>;
      return typeof product.id === "string" && !!product.id && product.tenantId === "tenant-floes" && Array.isArray(product.variants);
    });
}
