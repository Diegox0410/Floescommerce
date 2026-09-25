import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { ProductColor, ProductVariant, SizeGuide } from "../../types/product";

interface Props {
  sku: string;
  colors: ProductColor[];
  sizes: string[];
  variants: ProductVariant[];
  sizeGuide?: SizeGuide;
  onColorsChange: (value: ProductColor[]) => void;
  onSizesChange: (value: string[]) => void;
  onVariantsChange: (value: ProductVariant[]) => void;
  onSizeGuideChange: (value?: SizeGuide) => void;
}

const cleanSkuPart = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");

export function TextileProductEditor({ sku, colors, sizes, variants, sizeGuide, onColorsChange, onSizesChange, onVariantsChange, onSizeGuideChange }: Props) {
  const guide = sizeGuide ?? { columns: sizes, rows: [] };
  const updateVariant = (id: string, patch: Partial<ProductVariant>) => onVariantsChange(variants.map((variant) => variant.id === id ? { ...variant, ...patch } : variant));
  const renameColor = (index: number, name: string) => {
    const previous = colors[index]?.name;
    onColorsChange(colors.map((item, itemIndex) => itemIndex === index ? { ...item, name } : item));
    if (previous) onVariantsChange(variants.map((variant) => variant.color === previous ? { ...variant, color: name } : variant));
  };
  const renameSize = (index: number, size: string) => {
    const previous = sizes[index];
    onSizesChange(sizes.map((item, itemIndex) => itemIndex === index ? size : item));
    if (previous) onVariantsChange(variants.map((variant) => variant.size === previous ? { ...variant, size } : variant));
    if (guide.columns[index] === previous) onSizeGuideChange({ ...guide, columns: guide.columns.map((column, columnIndex) => columnIndex === index ? size : column) });
  };
  const generateVariants = () => {
    const existing = new Map(variants.map((variant) => [`${variant.color ?? ""}::${variant.size ?? ""}`, variant]));
    const generated = (colors.length ? colors.map((color) => color.name) : [undefined]).flatMap((color) => (sizes.length ? sizes : [undefined]).map((size) => {
      const current = existing.get(`${color ?? ""}::${size ?? ""}`);
      return current ?? { id: crypto.randomUUID(), sku: [sku || "FLO", color, size].filter(Boolean).map((part) => cleanSkuPart(String(part))).join("-"), color, size, stock: 0, minimumStock: 0, active: true };
    }));
    const generatedKeys = new Set(generated.map((variant) => `${variant.color ?? ""}::${variant.size ?? ""}`));
    const unmatched = variants
      .filter((variant) => !generatedKeys.has(`${variant.color ?? ""}::${variant.size ?? ""}`))
      .map((variant) => ({ ...variant, active: false }));
    onVariantsChange([...generated, ...unmatched]);
  };
  const removeVariant = (variant: ProductVariant) => {
    if (variant.stock > 0) {
      onVariantsChange(variants.map((item) => item.id === variant.id ? { ...item, active: false } : item));
      return;
    }
    onVariantsChange(variants.filter((item) => item.id !== variant.id));
  };
  const moveSize = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= sizes.length) return;
    const next = [...sizes];
    [next[index], next[destination]] = [next[destination], next[index]];
    onSizesChange(next);
  };
  const syncGuideColumns = () => onSizeGuideChange({ ...guide, columns: sizes, rows: guide.rows.map((row) => ({ ...row, values: sizes.map((_, index) => row.values[index] ?? "") })) });

  return <>
    <section className="admin-card admin-form-section textile-editor-section">
      <div className="textile-editor-heading"><div><h2>Colores</h2><p>Nombre visible y color hexadecimal opcional.</p></div><button type="button" className="admin-inline-action" onClick={() => onColorsChange([...colors, { name: "" }])}><Plus size={16} /> Agregar color</button></div>
      <div className="textile-color-list">{colors.map((color, index) => <div className="textile-color-row" key={index}>
        <span className="textile-color-preview" style={color.hex ? { backgroundColor: color.hex } : undefined} aria-hidden="true" />
        <input aria-label={`Nombre del color ${index + 1}`} placeholder="Nombre" value={color.name} onChange={(event) => renameColor(index, event.target.value)} />
        <input aria-label={`HEX del color ${index + 1}`} placeholder="#111111" value={color.hex ?? ""} onChange={(event) => onColorsChange(colors.map((item, itemIndex) => itemIndex === index ? { ...item, hex: event.target.value || undefined } : item))} />
        <button type="button" aria-label={`Eliminar color ${color.name || index + 1}`} onClick={() => onColorsChange(colors.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={16} /></button>
      </div>)}{!colors.length && <p className="textile-empty">Aún no hay colores definidos.</p>}</div>
    </section>

    <section className="admin-card admin-form-section textile-editor-section">
      <div className="textile-editor-heading"><div><h2>Tallas</h2><p>Agrega las tallas disponibles para este modelo.</p></div><button type="button" className="admin-inline-action" onClick={() => onSizesChange([...sizes, ""])}><Plus size={16} /> Agregar talla</button></div>
      <div className="textile-size-list">{sizes.map((size, index) => <label key={index}><input aria-label={`Talla ${index + 1}`} value={size} placeholder="Talla" onChange={(event) => renameSize(index, event.target.value)} /><span className="textile-size-actions"><button type="button" aria-label={`Subir talla ${size || index + 1}`} disabled={!index} onClick={() => moveSize(index, -1)}><ArrowUp size={13} /></button><button type="button" aria-label={`Bajar talla ${size || index + 1}`} disabled={index === sizes.length - 1} onClick={() => moveSize(index, 1)}><ArrowDown size={13} /></button><button type="button" aria-label={`Eliminar talla ${size || index + 1}`} onClick={() => onSizesChange(sizes.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={14} /></button></span></label>)}</div>
    </section>

    <section className="admin-card admin-form-section textile-editor-section">
      <div className="textile-editor-heading"><div><h2>Variantes</h2><p>Regenerar conserva los datos existentes. Combinaciones retiradas quedan inactivas para proteger su inventario.</p></div><button type="button" className="admin-inline-action" onClick={generateVariants}>Generar talla × color</button></div>
      <div className="admin-table-scroll textile-table-scroll"><table className="admin-table textile-variants-table"><thead><tr><th>Color</th><th>Talla</th><th>SKU</th><th>Precio</th><th>Costo</th><th>Stock</th><th>Mínimo</th><th>Activa</th><th /></tr></thead><tbody>{variants.map((variant) => <tr key={variant.id} className={!variant.active ? "is-inactive" : undefined}><td>{variant.color || "—"}</td><td>{variant.size || "—"}</td><td><input value={variant.sku} onChange={(event) => updateVariant(variant.id, { sku: event.target.value })} /></td><td><input type="number" min="0" step="0.01" value={variant.price ?? ""} onChange={(event) => updateVariant(variant.id, { price: event.target.value === "" ? undefined : Number(event.target.value) })} /></td><td><input type="number" min="0" step="0.01" value={variant.productCost ?? ""} onChange={(event) => updateVariant(variant.id, { productCost: event.target.value === "" ? undefined : Number(event.target.value) })} /></td><td><input type="number" min="0" step="1" value={variant.stock} onChange={(event) => updateVariant(variant.id, { stock: Number(event.target.value) })} /></td><td><input type="number" min="0" step="1" value={variant.minimumStock} onChange={(event) => updateVariant(variant.id, { minimumStock: Number(event.target.value) })} /></td><td><input type="checkbox" checked={variant.active} onChange={(event) => updateVariant(variant.id, { active: event.target.checked })} /></td><td><button type="button" aria-label={`Eliminar variante ${variant.sku}`} onClick={() => removeVariant(variant)}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>
      {!variants.length && <p className="textile-empty">Genera combinaciones después de definir colores y tallas.</p>}
    </section>

    <section className="admin-card admin-form-section textile-editor-section">
      <div className="textile-editor-heading"><div><h2>Guía de tallas</h2><p>Las columnas pueden sincronizarse con las tallas del modelo.</p></div><div className="textile-heading-actions"><button type="button" className="admin-inline-action" onClick={syncGuideColumns}>Usar tallas del modelo</button><button type="button" className="admin-inline-action" onClick={() => onSizeGuideChange({ ...guide, rows: [...guide.rows, { label: "", values: guide.columns.map(() => "") }] })}><Plus size={16} /> Agregar medida</button></div></div>
      <div className="admin-table-scroll textile-table-scroll"><table className="admin-table size-guide-editor"><thead><tr><th>Medida</th>{guide.columns.map((column, index) => <th key={index}><input aria-label={`Columna de talla ${index + 1}`} value={column} onChange={(event) => onSizeGuideChange({ ...guide, columns: guide.columns.map((item, itemIndex) => itemIndex === index ? event.target.value : item) })} /></th>)}<th /></tr></thead><tbody>{guide.rows.map((row, rowIndex) => <tr key={rowIndex}><th><input aria-label={`Nombre de medida ${rowIndex + 1}`} value={row.label} onChange={(event) => onSizeGuideChange({ ...guide, rows: guide.rows.map((item, itemIndex) => itemIndex === rowIndex ? { ...item, label: event.target.value } : item) })} /></th>{guide.columns.map((_, columnIndex) => <td key={columnIndex}><input aria-label={`${row.label || "Medida"}, valor ${columnIndex + 1}`} value={row.values[columnIndex] ?? ""} onChange={(event) => onSizeGuideChange({ ...guide, rows: guide.rows.map((item, itemIndex) => itemIndex === rowIndex ? { ...item, values: guide.columns.map((__, valueIndex) => valueIndex === columnIndex ? event.target.value : item.values[valueIndex] ?? "") } : item) })} /></td>)}<td><button type="button" aria-label={`Eliminar medida ${row.label || rowIndex + 1}`} onClick={() => onSizeGuideChange({ ...guide, rows: guide.rows.filter((_, itemIndex) => itemIndex !== rowIndex) })}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>
    </section>
  </>;
}
