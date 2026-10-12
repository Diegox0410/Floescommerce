const campaignFrames = [
  {
    src: "/images/editorial/campana-scrub-azul-marino.webp",
    alt: "Fotografía editorial FLOES con uniforme azul marino",
    className: "floes-campaign-frame-tall",
  },
  {
    src: "/images/editorial/campana-scrub-arena.webp",
    alt: "Fotografía editorial FLOES con uniforme en tono arena",
    className: "floes-campaign-frame-wide",
  },
  {
    src: "/images/editorial/campana-scrub-vino.webp",
    alt: "Fotografía editorial FLOES con uniforme color vino",
    className: "floes-campaign-frame-tall",
  },
  {
    src: "/images/editorial/campana-scrub-azul-profundo.webp",
    alt: "Fotografía editorial FLOES con uniforme azul profundo",
    className: "floes-campaign-frame-tall",
  },
] as const;

export function EditorialCampaign() {
  return (
    <section className="floes-campaign-section" aria-labelledby="floes-campaign-title">
      <div className="container">
        <header className="floes-campaign-heading" data-scroll-item="campaign-heading">
          <div>
            <span className="eyebrow">EDITORIAL FLOES</span>
            <h2 id="floes-campaign-title">Una mirada a nuestra campaña.</h2>
          </div>
          <p>Fotografías de campaña que dan forma al universo visual de FLOES.</p>
        </header>

        <div className="floes-campaign-grid">
          {campaignFrames.map((frame, index) => (
            <figure className={`floes-campaign-frame ${frame.className}`} key={frame.src} data-scroll-item="campaign-frame">
              <img src={frame.src} alt={frame.alt} loading="lazy" decoding="async" width={index === 1 ? 1448 : 1024} height={index === 1 ? 1086 : 1536} />
            </figure>
          ))}
        </div>

        <figure className="floes-campaign-details" data-scroll-item="campaign-details" data-scroll-parallax>
          <img
            src="/images/editorial/campana-detalles-editorial.webp"
            alt="Composición editorial con varias fotografías de campaña y detalles de un uniforme negro FLOES"
            loading="lazy"
            decoding="async"
            width={1600}
            height={900}
          />
          <figcaption><span>ESTUDIO FLOES</span><strong>El lenguaje visual de una prenda, en cada detalle.</strong></figcaption>
        </figure>
      </div>
    </section>
  );
}
