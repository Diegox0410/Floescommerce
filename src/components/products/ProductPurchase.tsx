import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import type { Product } from "../../types/product";
import { useCartStore } from "../../store/cartStore";
import { WhatsAppCTA } from "../common/WhatsAppCTA";
import { availableQuantityForSize, canPurchase, hasKnownPrice, resolveVariant, sizeAvailabilityFor, variantSizes, FLOES_PANTS_TYPES } from "../../services/chopify/catalog";
import { slugify } from "../../utils/normalization";

export function ProductPurchase({ product, color, size, pantsType, onColorChange, onSizeChange, onPantsTypeChange, onOpenSizeGuide }: {
  product: Product; color: string; size: string; pantsType: string;
  onColorChange: (color: string) => void; onSizeChange: (size: string) => void; onPantsTypeChange: (pantsType: string) => void;
  onOpenSizeGuide: () => void;
}) {
  const variants = product.variants.filter((variant) => variant.active);
  const colors = [...new Set(variants.map((variant) => variant.color).filter((value): value is string => Boolean(value)))];
  const sizes = [...new Set(variants.filter((variant) => !color || slugify(variant.color ?? "") === slugify(color)).flatMap(variantSizes))];
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const selected = resolveVariant(product, color, size, pantsType);
  const missing = variants.length > 0 && (!color || !pantsType || !size || !selected);
  const purchasable = !missing && canPurchase(product, selected, size);
  const priceKnown = hasKnownPrice(product, selected);
  const fulfillmentMode = selected?.fulfillmentMode ?? product.fulfillmentMode;
  const maximum = selected?.inventoryVerified && fulfillmentMode === "STOCK" ? availableQuantityForSize(selected, size) : null;
  const safeQuantity = maximum !== null && maximum !== undefined ? Math.min(quantity, Math.max(1, maximum)) : quantity;
  const selectedSizeAvailability = selected && size ? sizeAvailabilityFor(selected, size) : undefined;
  const inventoryUnconfirmed = fulfillmentMode === "STOCK" && (!selected?.inventoryVerified || selectedSizeAvailability?.availabilityStatus === "NOT_CONFIGURED" || (!selectedSizeAvailability && selected?.availabilityStatus === "NOT_CONFIGURED"));
  const selectColor = (value: string) => {
    onColorChange(value);
    if (size && !variants.some((variant) => variant.color === value && variantSizes(variant).includes(size))) onSizeChange("");
    setAdded(false);
  };

  return <div className="product-purchase">
    {colors.length > 0 && <fieldset className="variant-selector color-selector">
      <legend>Color <strong>{color || "Elige tu color"}</strong></legend>
      <div className="variant-options">{colors.map((value) => {
        const data = product.colors.find((entry) => slugify(entry.name) === slugify(value));
        const colorVariants = variants.filter((variant) => slugify(variant.color ?? "") === slugify(value));
        const available = colorVariants.some((variant) => canPurchase(product, variant));
      const unconfirmed = colorVariants.some((variant) => variant.inventoryVerified !== true || variant.availabilityStatus === "NOT_CONFIGURED");
        const statusLabel = available ? "" : unconfirmed ? ", inventario por confirmar" : ", no disponible";
        return <button type="button" key={value} className={`${color === value ? "active" : ""}${!available ? " unavailable" : ""}`} onClick={() => selectColor(value)} aria-pressed={color === value} aria-label={`${value}${statusLabel}`} title={`${value}${statusLabel}`}>
          {data?.hex && <span className="color-swatch" style={{ backgroundColor: data.hex }} aria-hidden="true" />}
          <span>{value}</span>
        </button>;
      })}</div>
    </fieldset>}
    <fieldset className="variant-selector pants-selector">
      <legend>Tipo de pantalón <strong>{pantsType || "Elige una opción"}</strong></legend>
      <div className="variant-options">{FLOES_PANTS_TYPES.map((value) => <button type="button" key={value} className={pantsType === value ? "active" : ""} onClick={() => { onPantsTypeChange(value); setAdded(false); }} aria-pressed={pantsType === value}>{value}</button>)}</div>
    </fieldset>
    {sizes.length > 0 && <fieldset className="variant-selector size-selector"><legend>Talla <button className="size-guide-inline-link" type="button" onClick={onOpenSizeGuide}>Guía de tallas</button></legend><div className="variant-options">{sizes.map((value) => {
      const matching = variants.filter((variant) => (!color || slugify(variant.color ?? "") === slugify(color)) && variantSizes(variant).includes(value));
      const available = matching.some((variant) => canPurchase(product, variant, value));
      const unconfirmed = matching.some((variant) => variant.inventoryVerified !== true || sizeAvailabilityFor(variant, value)?.availabilityStatus === "NOT_CONFIGURED" || (!variant.sizeAvailability?.length && variant.availabilityStatus === "NOT_CONFIGURED"));
      const statusLabel = available ? "" : unconfirmed ? ", inventario por confirmar" : ", no disponible";
      return <button type="button" key={value} className={`${size === value ? "active" : ""}${!available ? " unavailable" : ""}`} aria-pressed={size === value} aria-label={`${value}${statusLabel}`} onClick={() => { onSizeChange(value); setAdded(false); }}>{value}</button>;
    })}</div></fieldset>}
    <button className="size-guide-cta" type="button" onClick={onOpenSizeGuide}><span aria-hidden="true">📏</span> Encuentra tu talla</button>
    <div className="product-quantity"><span>Cantidad</span><div className="product-quantity-control">
      <button type="button" onClick={() => setQuantity(Math.max(1, safeQuantity - 1))} aria-label="Disminuir cantidad" disabled={safeQuantity <= 1}><Minus size={16} /></button>
      <strong>{safeQuantity}</strong><button type="button" onClick={() => setQuantity(safeQuantity + 1)} disabled={maximum !== null && maximum !== undefined && safeQuantity >= maximum} aria-label="Aumentar cantidad"><Plus size={16} /></button>
    </div></div>
    <div className="product-purchase-actions"><button className="product-main-add" type="button" disabled={!purchasable} onClick={() => { addItem(product, safeQuantity, selected, size); setAdded(true); }}>
      {added ? <Check size={18} /> : <ShoppingBag size={18} />}{added ? "Agregado al pedido" : missing ? "Completa modelo, color, pantalón y talla" : !priceKnown ? "Consultar precio" : inventoryUnconfirmed ? "Disponibilidad por confirmar" : !purchasable ? "No disponible" : "Agregar al pedido"}
    </button></div>
    {selected && size && selected.inventoryVerified && fulfillmentMode === "STOCK" && maximum !== null && maximum !== undefined && <p className="product-purchase-note" aria-live="polite">{selected.color} · {size}: {maximum} {maximum === 1 ? "unidad disponible" : "unidades disponibles"}.</p>}
    <p className="product-purchase-note" aria-live="polite">{missing ? "Selecciona las opciones de tu modelo para continuar." : !priceKnown ? "Consulta con FLOES el precio de esta selección." : inventoryUnconfirmed || !selected?.inventoryVerified ? "Disponibilidad por talla pendiente de confirmación." : !purchasable ? "Esta selección no está disponible para pedido." : selected ? [selected.color, size || selected.size, selected.fulfillmentMode === "MADE_TO_ORDER" ? "Confección bajo pedido" : "Selección lista para añadir"].filter(Boolean).join(" · ") : "Selecciona una variante para continuar."}</p>
    <WhatsAppCTA productName={product.name} color={color} size={size} className="product-whatsapp" />
  </div>;
}
