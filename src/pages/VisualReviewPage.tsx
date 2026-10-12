import { useState } from "react";

const campaignImages = [
  { src: "/images/editorial/campana-scrub-azul-marino.webp", label: "Composición editorial A" },
  { src: "/images/editorial/campana-scrub-arena.webp", label: "Composición editorial B" },
  { src: "/images/editorial/campana-scrub-vino.webp", label: "Composición editorial C" },
];

const visualOptions = ["Azul marino", "Arena", "Vino"];
const visualSizes = ["XS", "S", "M", "L", "XL"];

/** Local-only, presentation-only shell. It intentionally imports no commerce, API, cart, or Firebase modules. */
export function VisualReviewPage() {
  const [view, setView] = useState("Catálogo");
  const [color, setColor] = useState(visualOptions[0]);
  const [size, setSize] = useState("M");
  const [imageIndex, setImageIndex] = useState(0);

  return (
    <main className="visual-review" aria-labelledby="visual-review-title">
      <div className="visual-review-banner">DEMO VISUAL · LOCAL · SIN CONEXIÓN COMERCIAL</div>
      <header className="visual-review-header">
        <a className="visual-review-logo" href="/">FLOES<span>.ec</span></a>
        <nav aria-label="Vistas de demostración">
          {["Catálogo", "Producto", "Carrito y checkout"].map((item) => (
            <button key={item} type="button" className={view === item ? "is-active" : ""} onClick={() => setView(item)} aria-pressed={view === item}>{item}</button>
          ))}
        </nav>
        <span className="visual-review-bag" aria-label="Vista de carrito, demostración">Bolsa <b>1</b></span>
      </header>

      <section className="visual-review-intro">
        <span className="eyebrow">REVISIÓN DE INTERFAZ</span>
        <h1 id="visual-review-title">Una experiencia<br /><em>hecha para avanzar.</em></h1>
        <p>Componentes de presentación aislados para revisar proporciones, fotografía, filtros, variantes y estados de compra.</p>
      </section>

      <div className="visual-review-content">
        <aside className="visual-review-note" role="note">
          <strong>Datos de muestra, no productos publicados.</strong>
          <span>Las fotografías son material de composición editorial y no identifican una variante, SKU, precio ni disponibilidad.</span>
        </aside>

        {view === "Catálogo" && (
          <section className="visual-review-catalog" aria-label="Demostración visual de catálogo">
            <header className="visual-review-section-heading"><div><span className="eyebrow">COLECCIÓN · DEMO VISUAL</span><h2>Explora la silueta.</h2></div><span>Tarjetas de muestra · sin catálogo conectado</span></header>
            <div className="visual-review-catalog-layout">
              <aside className="visual-review-filters"><span>Refinar vista</span><label>Buscar<input type="search" placeholder="Buscar en la demo" /></label><label>Ordenar<select defaultValue="editorial"><option value="editorial">Orden editorial</option><option value="recent">Más reciente</option></select></label><fieldset><legend>Color de muestra</legend>{visualOptions.map((option) => <button key={option} className={color === option ? "is-selected" : ""} type="button" onClick={() => setColor(option)}>{option}</button>)}</fieldset></aside>
              <div className="visual-review-cards">
                {campaignImages.map((item, index) => <article className="visual-review-card" key={item.src}>
                  <div className="visual-review-card-image"><img src={item.src} alt={`${item.label}; fotografía de campaña usada solo como composición`} loading={index ? "lazy" : "eager"} /><span>DEMO VISUAL</span><button type="button" aria-label={`Abrir vista de demostración ${index + 1}`} onClick={() => { setImageIndex(index); setView("Producto"); }}>↗</button></div>
                  <div className="visual-review-card-copy"><div><span>{item.label}</span><h3>Presentación de tarjeta</h3></div><span className="visual-review-no-price">Sin precio</span></div>
                  <p>Espacio para datos reales de Chopify cuando estén disponibles.</p>
                </article>)}
              </div>
            </div>
          </section>
        )}

        {view === "Producto" && (
          <section className="visual-review-product" aria-label="Demostración visual de ficha de producto">
            <div className="visual-review-gallery">
              <div className="visual-review-gallery-main"><img src={campaignImages[imageIndex].src} alt="Fotografía de campaña; imagen ilustrativa no asociada a una variante de producto" /><span>IMAGEN EDITORIAL · NO ES UNA FOTO DE SKU</span></div>
              <div className="visual-review-thumbs">{campaignImages.map((item, index) => <button type="button" key={item.src} aria-label={`Mostrar ${item.label}`} aria-pressed={imageIndex === index} className={imageIndex === index ? "is-selected" : ""} onClick={() => setImageIndex(index)}><img src={item.src} alt="" /></button>)}</div>
            </div>
            <div className="visual-review-product-info"><span className="eyebrow">FICHA · DEMO VISUAL</span><h2>Presentación de producto</h2><p>Los datos y controles de esta pantalla son únicamente una muestra de interfaz. No representan un modelo, una variante o una oferta real.</p><div className="visual-review-price">Precio comercial pendiente</div>
              <fieldset><legend>Color visual de muestra</legend><div className="visual-review-options">{visualOptions.map((option) => <button key={option} type="button" className={color === option ? "is-selected" : ""} onClick={() => setColor(option)}>{option}</button>)}</div></fieldset>
              <fieldset><legend>Talla visual de muestra</legend><div className="visual-review-sizes">{visualSizes.map((option) => <button key={option} type="button" className={size === option ? "is-selected" : ""} onClick={() => setSize(option)} aria-pressed={size === option}>{option}</button>)}</div></fieldset>
              <button className="visual-review-disabled-cta" type="button" disabled>Compra deshabilitada en la demo</button>
              <small>Selección local temporal: {color} · {size}. No se guarda ni se envía.</small>
            </div>
          </section>
        )}

        {view === "Carrito y checkout" && (
          <section className="visual-review-checkout" aria-label="Demostración visual de carrito y checkout">
            <div><span className="eyebrow">BOLSA · DEMO VISUAL</span><h2>Tu selección.</h2><article className="visual-review-line"><img src={campaignImages[imageIndex].src} alt="Material visual de campaña" /><div><strong>Artículo visual de muestra</strong><span>{color} · Talla {size}</span><small>Datos no comerciales</small></div><b>—</b></article><div className="visual-review-total"><span>Total de muestra</span><strong>—</strong></div><button type="button" disabled className="visual-review-disabled-cta">Continuar deshabilitado</button></div>
            <div className="visual-review-form"><span className="eyebrow">DATOS · SOLO PRESENTACIÓN</span><h2>Una compra clara.</h2><label>Nombre<input placeholder="Nombre" disabled /></label><label>Correo electrónico<input type="email" placeholder="correo@ejemplo.com" disabled /></label><label>Dirección<textarea placeholder="Dirección de entrega" disabled /></label><p>No se envía ningún formulario y no se crea ningún pedido.</p><button type="button" disabled className="visual-review-disabled-cta">Finalizar deshabilitado</button></div>
          </section>
        )}
      </div>
      <footer className="visual-review-footer"><span>FLOES · Vista local de revisión visual</span><a href="/">Volver a la tienda real</a></footer>
    </main>
  );
}
