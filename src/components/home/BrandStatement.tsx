import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useStoreConfigStore } from "../../store/storeConfigStore";

export function BrandStatement() {
  const story = useStoreConfigStore((state) => state.config.home.brandStory);
  const brandCampaignImage = "/images/editorial/campana-modelo-negro-retrato.webp";
  return (
    <section className="brand-statement-section" id="confeccion-floes" aria-labelledby="brand-story-title">
      <div className="container brand-statement-grid">

        <div className="brand-statement-copy" data-scroll-item="copy">
          <span className="brand-story-index" aria-hidden="true">FLOES <span>— 01</span></span>
          <span className="eyebrow">
            {story.eyebrow}
          </span>

          <h2>
            <span id="brand-story-title">{story.title}</span>
          </h2>

          <p>
            {story.description}
          </p>

          <Link
            to={story.buttonHref || "/catalogo"}
            className="brand-statement-link"
          >
            {story.buttonLabel || "Explorar el catálogo"}
            <ArrowUpRight size={18} />
          </Link>
        </div>

        <div className="brand-statement-visual" data-scroll-item="visual">

          <div className="statement-card statement-card-main">
            <img
              src={brandCampaignImage}
              alt="Modelo con uniforme negro en fotografía editorial de FLOES"
              className="statement-card-image"
              loading="lazy"
              decoding="async"
            />

            <div className="statement-card-shade" />

            <div className="statement-card-content">
              <span>Hecho para tu día a día</span>

              <strong>
                Confección con identidad propia.
              </strong>
            </div>
          </div>

          <div className="statement-tags" aria-label="Colecciones destacadas">
            <Link
              to="/catalogo?filter=nuevos"
              className="statement-tag"
            >
              Novedades
            </Link>

            <Link
              to="/catalogo?filter=favoritos"
              className="statement-tag"
            >
              Favoritos
            </Link>

            <Link
              to="/catalogo?filter=ofertas"
              className="statement-tag"
            >
              Ofertas
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
