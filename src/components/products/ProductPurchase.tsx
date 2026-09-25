import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import type { Product } from "../../types/product";
import { useCartStore } from "../../store/cartStore";
import { WhatsAppCTA } from "../common/WhatsAppCTA";

export function ProductPurchase({ product, color: controlledColor, onColorChange }: { product: Product; color?: string; onColorChange?: (color: string) => void }) {
  const variants = useMemo(() => product.variants.filter((variant) => variant.active), [product.variants]);
  const sizes = [...new Set(variants.map((variant) => variant.size).filter(Boolean))] as string[];
  const colors = [...new Set(variants.map((variant) => variant.color).filter(Boolean))] as string[];
  const [size, setSize] = useState(sizes.length === 1 ? sizes[0] : "");
  const [uncontrolledColor, setUncontrolledColor] = useState(colors.length === 1 ? colors[0] : "");
  const color = controlledColor ?? uncontrolledColor;
  const selectColor = (value: string) => {
    setUncontrolledColor(value);
    onColorChange?.(value);
  };
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const selected = variants.find((variant) => (!sizes.length || variant.size === size) && (!colors.length || variant.color === color));
  const missing = variants.length > 0 && !selected;
  const colorEnabled = (value: string) => variants.some((variant) => variant.color === value && (!size || variant.size === size));
  const sizeEnabled = (value: string) => variants.some((variant) => variant.size === value && (!color || variant.color === color));
  const colorData = (value: string) => product.colors.find((entry) => entry.name === value);
  // Regla actual centralizada: hasta definir la política de confección bajo pedido,
  // una variante con stock exactamente cero conserva el bloqueo existente.
  const selectedVariantIsPurchasable = selected?.stock !== 0;

  return <div className="product-purchase">
    {colors.length > 0 && <fieldset className="variant-selector color-selector"><legend>Color {color && <strong>{color}</strong>}</legend><div className="variant-options">{colors.map((value) => { const data = colorData(value); return <button type="button" key={value} disabled={!colorEnabled(value)} className={`${color === value ? "active" : ""}${data?.hex ? " has-swatch" : ""}`} onClick={() => selectColor(value)} aria-label={`Color ${value}`} title={value}>{data?.hex && <span className="color-swatch" style={{ backgroundColor: data.hex }} aria-hidden="true" />}<span>{value}</span></button>; })}</div></fieldset>}
    {sizes.length > 0 && <fieldset className="variant-selector"><legend>Talla</legend><div className="variant-options">{sizes.map((value) => <button type="button" key={value} disabled={!sizeEnabled(value)} className={size === value ? "active" : ""} onClick={() => setSize(value)}>{value}</button>)}</div></fieldset>}
    <div className="product-quantity"><span>Cantidad</span><div className="product-quantity-control"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Disminuir cantidad" disabled={quantity <= 1}><Minus size={16} /></button><strong>{quantity}</strong><button type="button" onClick={() => setQuantity((value) => value + 1)} aria-label="Aumentar cantidad"><Plus size={16} /></button></div></div>
    <div className="product-purchase-actions"><button className="product-main-add" type="button" disabled={missing || !selectedVariantIsPurchasable} onClick={() => addItem(product, quantity, selected)}><ShoppingBag size={18} />{missing ? "Selecciona talla y color" : "Agregar al carrito"}</button></div>
    <p className="product-purchase-note">{selected ? `${selected.sku} · ${[selected.color, selected.size].filter(Boolean).join(" / ")}` : variants.length ? "Elige una combinación disponible." : `Estás seleccionando ${quantity} unidad${quantity !== 1 ? "es" : ""} de ${product.name}.`}</p>
    <WhatsAppCTA productName={product.name} className="product-whatsapp" />
  </div>;
}
