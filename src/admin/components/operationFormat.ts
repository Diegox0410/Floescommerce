export const dateTime = (date: string | null | undefined) =>
  date && Number.isFinite(Date.parse(date))
    ? new Intl.DateTimeFormat("es-EC", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(date))
    : "Sin compras";
export const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "No se pudo completar la operación.";
