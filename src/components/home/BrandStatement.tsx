import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export function BrandStatement() {
  return (
    <section className="brand-statement-section">
      <div className="container brand-statement-grid">

        <div className="brand-statement-copy">
          <span className="eyebrow">
            TODO EN UN SOLO LUGAR
          </span>

          <h2>
            Una tienda.
            <span> Nuevos favoritos por descubrir.</span>
          </h2>

          <p>
            Productos seleccionados, novedades y marcas importadas para
            encontrar eso que buscas en un solo lugar.
          </p>

          <Link
            to="/catalogo"
            className="brand-statement-link"
          >
            Descubrir categorías
            <ArrowUpRight size={18} />
          </Link>
        </div>

        <div className="brand-statement-visual">

          <div className="statement-card statement-card-main">
            <img
              src="/images/brand/Section-especial.png"
              alt="Selección especial de productos DGNG Store"
              className="statement-card-image"
            />

            <div className="statement-card-shade" />

            <img
              src="/images/brand/dgng-logo.png"
              alt="DGNG Store"
              className="statement-card-logo"
            />

            <div className="statement-card-content">
              <span>Selección especial</span>

              <strong>
                Importados que se adaptan a ti.
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