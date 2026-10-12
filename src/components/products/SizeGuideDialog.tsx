import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { Product } from "../../types/product";
import { useStoreConfigStore } from "../../store/storeConfigStore";
import { whatsappUrl } from "../../utils/storefront";

type Garment = "blusa" | "pantalon";

function MeasurementSketch({ garment }: { garment: Garment }) {
  return <svg className="size-guide-sketch" viewBox="0 0 220 150" role="img" aria-label={garment === "blusa" ? "Ilustración: medir ancho de pecho y largo de blusa extendida" : "Ilustración: medir cintura, cadera y largo de pantalón extendido"}>
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      {garment === "blusa" ? <>
        <path d="M77 28 52 38 30 64l22 15 12-13v51h92V66l12 13 22-15-22-26-25-10-20 15H97L77 28Z" />
        <path d="M68 74h84M110 74v39M63 127h94" strokeDasharray="4 5" />
        <path d="m68 70-5 4 5 4m84-8 5 4-5 4M106 113l4 5 4-5m-51 8 4 4-4 4m98-8-4 4 4 4" />
      </> : <>
        <path d="M68 24h84l-6 46-7 58h-31l2-52-5-1-5 53H69l-7-58-6-46h12Z" />
        <path d="M65 41h90M65 56h90M74 73h72M61 130h47m6 0h37" strokeDasharray="4 5" />
        <path d="m61 37 4 4 4-4m77 0 4 4 4-4M70 68l4 5 4-5m60 0 4 5 4-5m-73 58 4 4-4 4m32-8 4 4-4 4m13-4 4-4 4 4m26-4-4 4 4 4" />
      </>}
    </g>
    <text x="110" y="145" textAnchor="middle">MIDE DE LADO A LADO</text>
  </svg>;
}

export function SizeGuideDialog({ product, color, size, onClose }: { product: Product; color: string; size: string; onClose: () => void }) {
  const [garment, setGarment] = useState<Garment>("blusa");
  const whatsapp = useStoreConfigStore((state) => state.config.contact.whatsapp);
  const guide = product.sizeGuide;
  const groups = useMemo(() => ({
    blusa: guide?.rows.filter((row) => /blusa|camisa|top/i.test(row.label)) ?? [],
    pantalon: guide?.rows.filter((row) => /pantal[oó]n|pants|jogger/i.test(row.label)) ?? [],
  }), [guide]);
  const rows = groups[garment];
  const helpMessage = `Hola, necesito ayuda para elegir mi talla del ${product.name}${color ? ` color ${color}` : ""}${size ? ` talla ${size}` : ""}.`;
  const helpUrl = whatsappUrl(whatsapp, helpMessage);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return <div className="size-guide-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="size-guide-dialog" role="dialog" aria-modal="true" aria-labelledby="size-guide-dialog-title">
      <header className="size-guide-dialog-header"><div><span className="eyebrow">GUÍA DE TALLAS · FLOES</span><h2 id="size-guide-dialog-title">Encuentra tu talla</h2><p>{product.name}{color ? ` · ${color}` : ""}</p></div><button type="button" aria-label="Cerrar guía de tallas" onClick={onClose}><X size={19} /></button></header>
      <div className="size-guide-explainer"><div className="size-guide-tabs" role="tablist" aria-label="Tipo de prenda">{(["blusa", "pantalon"] as const).map((value) => <button type="button" role="tab" aria-selected={garment === value} className={garment === value ? "active" : ""} key={value} onClick={() => setGarment(value)}>{value === "blusa" ? "Blusa" : "Pantalón"}</button>)}</div>
        <div className="size-guide-measure"><MeasurementSketch garment={garment} /><div><strong>Medida plana de la prenda</strong><p>Extiende una prenda que te quede bien y mide de lado a lado. Compara ese ancho con FLOES. No son contornos corporales: no multipliques la medida por dos.</p></div></div>
      </div>
      {guide && rows.length > 0 ? <div className="size-guide-table-wrap"><table className="size-guide-table"><caption>{garment === "blusa" ? "Medidas de blusa" : "Medidas de pantalón"} · cm</caption><thead><tr><th scope="col">Medida</th>{guide.columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label.replace(/^.*?·\s*/, "")}</th>{guide.columns.map((column, index) => <td key={`${row.label}-${column}`}>{row.values[index] || "—"}</td>)}</tr>)}</tbody></table></div> : <p className="size-guide-missing">FLOES aún no ha publicado una tabla confirmada para esta prenda. Escríbenos y te ayudamos.</p>}
      <p className="size-guide-fit-note">Si estás entre dos tallas, elige según prefieras un ajuste más cercano o más holgado. La guía orienta la elección; el ajuste puede variar.</p>
      <footer className="size-guide-dialog-footer">{helpUrl && <a href={helpUrl} target="_blank" rel="noreferrer">Ayúdame a elegir mi talla</a>}<button type="button" className="size-guide-close" onClick={onClose}>Volver al modelo</button></footer>
    </section>
  </div>;
}
