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
      <div className="catalog-empty">
        <span>No encontramos productos.</span>

        <p>
          Prueba con otra categoría o búsqueda.
        </p>
      </div>
    );
  }

  return (
    <div className="catalog-products-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
        />
      ))}
    </div>
  );
}