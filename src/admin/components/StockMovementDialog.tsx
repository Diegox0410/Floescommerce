import {
  useState,
  type FormEvent,
} from "react";

import type {
  Product,
  ProductVariant,
} from "../../types/product";

import type {
  MovementType,
} from "../../types/inventory";

import {
  useInventoryStore,
} from "../../store/inventoryStore";

import {
  AdminDialog,
} from "./AdminDialog";

import {
  ErrorMessage,
  Field,
} from "./OperationsUI";

import {
  errorText,
} from "./operationFormat";

export function StockMovementDialog({
  product,
  variant,
  type,
  onClose,
}: {
  product: Product;
  variant?: ProductVariant;
  type: MovementType;
  onClose: () => void;
}) {
  const [
    movementType,
    setMovementType,
  ] = useState<MovementType>(
    type,
  );

  const [
    quantity,
    setQuantity,
  ] = useState(
    type === "adjustment"
      ? String(variant?.stock ?? product.stock)
      : "1",
  );

  const [
    reason,
    setReason,
  ] = useState("");

  const [
    date,
    setDate,
  ] = useState(() => {
    const now =
      new Date();

    return new Date(
      now.getTime() -
        now.getTimezoneOffset() *
          60000,
    )
      .toISOString()
      .slice(0, 16);
  });

  const [
    error,
    setError,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const submit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");
    setSaving(true);

    try {
      const numericQuantity =
        Number(quantity);

      if (
        !Number.isInteger(
          numericQuantity,
        ) ||
        numericQuantity < 0 ||
        (
          movementType !==
            "adjustment" &&
          numericQuantity === 0
        )
      ) {
        throw new Error(
          "Ingresa una cantidad entera válida.",
        );
      }

      if (!reason.trim()) {
        throw new Error(
          "El motivo es obligatorio.",
        );
      }

      const parsedDate =
        new Date(date);

      if (
        !Number.isFinite(
          parsedDate.getTime(),
        )
      ) {
        throw new Error(
          "Fecha inválida.",
        );
      }

      await useInventoryStore
        .getState()
        .createMovement({
          productId:
            product.id,
          variantId: variant?.id,
          type:
            movementType,
          quantity:
            numericQuantity,
          reason:
            reason.trim(),
          createdAt:
            parsedDate.toISOString(),
        });

      /*
       * El diálogo únicamente se
       * cierra después de que Firebase
       * haya confirmado la transacción.
       */
      onClose();
    } catch (err) {
      setError(
        errorText(err),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminDialog
      title="Movimiento de inventario"
      onClose={
        saving
          ? () => {}
          : onClose
      }
    >
      <p>
        {product.name} ·{" "}
        {variant ? `${[variant.color, variant.size].filter(Boolean).join(" · ")} · ${variant.sku}` : product.sku} ·{" "}
        Stock actual:{" "}
        {variant?.stock ?? product.stock}
      </p>

      <form
        onSubmit={submit}
        className="admin-form-stack"
      >
        <Field label="Tipo de movimiento">
          <select
            value={
              movementType
            }
            disabled={saving}
            onChange={(
              event,
            ) => {
              const nextType =
                event.target
                  .value as MovementType;

              setMovementType(
                nextType,
              );

              if (
                nextType ===
                "adjustment"
              ) {
                setQuantity(
                  String(
                    variant?.stock ?? product.stock,
                  ),
                );
              } else {
                setQuantity(
                  "1",
                );
              }
            }}
          >
            <option value="in">
              Entrada
            </option>

            <option value="out">
              Salida
            </option>

            <option value="adjustment">
              Ajuste manual
            </option>
          </select>
        </Field>

        <Field
          label={
            movementType ===
            "adjustment"
              ? "Nuevo stock"
              : "Cantidad"
          }
        >
          <input
            autoFocus
            type="number"
            min={
              movementType ===
              "adjustment"
                ? 0
                : 1
            }
            step="1"
            required
            disabled={saving}
            value={quantity}
            onChange={(
              event,
            ) =>
              setQuantity(
                event.target
                  .value,
              )
            }
          />
        </Field>

        <Field label="Motivo">
          <input
            required
            disabled={saving}
            value={reason}
            placeholder="Ej. Prueba controlada de inventario"
            onChange={(
              event,
            ) =>
              setReason(
                event.target
                  .value,
              )
            }
          />
        </Field>

        <Field label="Fecha">
          <input
            type="datetime-local"
            required
            disabled={saving}
            value={date}
            onChange={(
              event,
            ) =>
              setDate(
                event.target
                  .value,
              )
            }
          />
        </Field>

        <ErrorMessage
          message={error}
        />

        <button
          className="admin-button admin-button-primary"
          type="submit"
          disabled={saving}
        >
          {saving
            ? "Registrando..."
            : "Registrar movimiento"}
        </button>
      </form>
    </AdminDialog>
  );
}
