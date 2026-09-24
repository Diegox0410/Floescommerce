import { Plus, Trash2 } from "lucide-react";

interface ProductImagesEditorProps {
  name: string;
  primary?: string;
  gallery: string[];
  onPrimaryChange: (value: string) => void;
  onGalleryChange: (value: string[]) => void;
}

export function ProductImagesEditor({ name, primary, gallery, onPrimaryChange, onGalleryChange }: ProductImagesEditorProps) {
  const updateGallery = (index: number, value: string) => onGalleryChange(gallery.map((item, itemIndex) => itemIndex === index ? value : item));

  return <section className="admin-card admin-form-section product-images-editor">
    <div className="textile-editor-heading">
      <div><h2>Imágenes</h2><p>Define la portada y todas las vistas disponibles del modelo.</p></div>
      <button type="button" className="admin-inline-action" onClick={() => onGalleryChange([...gallery, ""])}><Plus size={16} /> Agregar imagen</button>
    </div>
    <label className="admin-field">
      <span>Imagen principal</span>
      <input type="text" value={primary ?? ""} placeholder="/images/products/modelo.jpeg" onChange={(event) => onPrimaryChange(event.target.value)} />
    </label>
    <div className="product-images-grid">
      <figure className="product-image-control is-primary">
        {primary ? <img src={primary} alt={`Portada de ${name || "producto"}`} /> : <div>Vista principal</div>}
        <figcaption>Portada del modelo</figcaption>
      </figure>
      {gallery.map((url, index) => <div className="product-image-control" key={index}>
        {url ? <img src={url} alt={`Vista ${index + 1} de ${name || "producto"}`} /> : <div>Vista {index + 1}</div>}
        <label><span>URL o ruta pública</span><input value={url} onChange={(event) => updateGallery(index, event.target.value)} /></label>
        <button type="button" aria-label={`Eliminar imagen ${index + 1}`} onClick={() => onGalleryChange(gallery.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={16} /></button>
      </div>)}
    </div>
    <p className="admin-footnote">Admite URLs externas y rutas públicas. La primera imagen es la portada; las demás forman la galería editorial.</p>
  </section>;
}
