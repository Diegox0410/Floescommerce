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
}

export function CatalogToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  totalProducts,
}: CatalogToolbarProps) {
  return (
    <div className="catalog-toolbar">

      <div className="catalog-result-count">
        <span>{totalProducts}</span>
        productos
      </div>

      <div className="catalog-toolbar-actions">

        <label className="catalog-search">
          <Search size={17} />

          <input
            type="search"
            value={search}
            placeholder="Buscar productos"
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
          />
        </label>

        <label className="catalog-sort">
          <SlidersHorizontal size={17} />

          <select
            value={sort}
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