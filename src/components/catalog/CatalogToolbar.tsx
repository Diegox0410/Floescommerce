import {
  Search,
  SlidersHorizontal,
} from "lucide-react";

interface CatalogToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
  totalProducts: number;
  resultsState?: "loading" | "error" | "ready";
}

export function CatalogToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  totalProducts,
  resultsState = "ready",
}: CatalogToolbarProps) {
  return (
    <div className="catalog-toolbar">

      <div className="catalog-result-count" aria-live="polite" aria-atomic="true">
        <span aria-label={resultsState === "ready" ? `${totalProducts} modelos` : "Conteo de modelos no disponible"}>
          {resultsState === "loading" ? "…" : resultsState === "error" ? "—" : totalProducts}
        </span>
        modelos
      </div>

      <div className="catalog-toolbar-actions">

        <label className="catalog-search">
          <Search size={17} />

          <input
            type="search"
            value={search}
            placeholder="Buscar modelo o color"
            aria-label="Buscar modelo o color"
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
          />
        </label>

        <label className="catalog-sort">
          <SlidersHorizontal size={17} />

          <select
            value={sort}
            aria-label="Ordenar productos"
            onChange={(event) =>
              onSortChange(event.target.value)
            }
          >
            <option value="featured">
              Destacados
            </option>

            <option value="price-low">
              Precio: menor a mayor
            </option>

            <option value="price-high">
              Precio: mayor a menor
            </option>

            <option value="name">
              Nombre
            </option>
          </select>
        </label>

      </div>

    </div>
  );
}
