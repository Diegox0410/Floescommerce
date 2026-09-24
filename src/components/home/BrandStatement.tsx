import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useStoreConfigStore } from "../../store/storeConfigStore";

export function BrandStatement() {
  const story = useStoreConfigStore((state) => state.config.home.brandStory);
  return (
    <section className="brand-statement-section" id="confeccion-floes">
      <div className="container brand-statement-grid">

        <div className="brand-statement-copy">
          <span className="eyebrow">
            {story.eyebrow}
          </span>

          <h2>
            {story.title}
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

        <div className="brand-statement-visual">

          <div className="statement-card statement-card-main">
            <img
              src={story.image || "/images/floes/editorial/confeccion-posterior.jpeg"}
              alt={story.imageAlt}
              className="statement-card-image"
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
