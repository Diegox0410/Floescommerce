import type { Product } from "../../types/product";
import { ProductCard } from "../products/ProductCard";

interface CatalogGridProps {
  products: Product[];
}

export function CatalogGrid({
  products,
}: CatalogGridProps) {
  if (products.length === 0) {
    return (
      <div className="catalog-empty" role="status">
        <span>No encontramos productos.</span>

        <p>
          Prueba con otra categoría o búsqueda.
        </p>
      </div>
    );
  }

  return (
    <div className="catalog-products-grid" role="region" aria-label="Productos del catálogo">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
        />
      ))}
    </div>
  );
}
