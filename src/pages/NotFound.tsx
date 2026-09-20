import {
  ArrowLeft,
  Search,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

export function NotFound() {
  return (
    <main className="not-found-page">
      <div className="container not-found-inner">

        <span className="not-found-code">
          404
        </span>

        <span className="eyebrow">
          PÁGINA NO ENCONTRADA
        </span>

        <h1>
          Parece que esto
          <span>
            {" "}
            no está aquí.
          </span>
        </h1>

        <p>
          La página que buscas no
          existe o fue movida.
          Puedes regresar al inicio
          o continuar explorando
          nuestros productos.
        </p>

        <div className="not-found-actions">

          <Link
            to="/"
            className="not-found-primary"
          >
            <ArrowLeft
              size={17}
            />

            Volver al inicio
          </Link>

          <Link
            to="/catalogo"
            className="not-found-secondary"
          >
            <Search
              size={17}
            />

            Explorar catálogo
          </Link>

        </div>

      </div>
    </main>
  );
}