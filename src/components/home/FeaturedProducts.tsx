import { ArrowRight } from "lucide-react";

import { useProductStore } from "../../store/productStore";
import { useStoreConfigStore } from "../../store/storeConfigStore";
import { ProductCard } from "../products/ProductCard";

export function FeaturedProducts() {
  const section = useStoreConfigStore((s) => s.config.home.sections.find((x) => x.type === "featured-products"));
  const products = useProductStore(state => state.products);
  const featuredProducts = products.filter(
    (product) => product.featured && product.active
  ).slice(0, section?.limit ?? 4);

  return (
    <section className="featured-products-section">

      <div className="container">

        <div className="featured-products-heading">

          <div>
            <span className="eyebrow">
              NUESTRA SELECCIÓN
            </span>

            <h2>{section?.title || "Productos destacados"}</h2>
          </div>

          <div className="featured-products-intro">

            <p>{section?.description || "Explora nuestra selección."}</p>

            <a href="/catalogo">
              Ver catálogo completo
              <ArrowRight size={17} />
            </a>

          </div>

        </div>

        <div className="products-grid">

          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}

        </div>

      </div>

    </section>
  );
}
