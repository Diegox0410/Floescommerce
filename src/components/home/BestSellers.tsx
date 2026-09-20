import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { useProductStore } from "../../store/productStore";
import { useStoreConfigStore } from "../../store/storeConfigStore";
import { ProductCard } from "../products/ProductCard";

export function BestSellers() {
  const section = useStoreConfigStore((s) =>
    s.config.home.sections.find((x) => x.type === "best-sellers")
  );

  const products = useProductStore((state) => state.products);

  const bestSellers = products.filter(
    (product) => product.bestSeller && product.active
  );

  const displayProducts = bestSellers.slice(0, section?.limit ?? 4);

  if (!displayProducts.length) return null;

  return (
    <section className="best-sellers-section">
      <div className="container">
        <div className="best-sellers-heading">
          <div>
            <span className="eyebrow">LOS MÁS ELEGIDOS</span>

            <h2>{section?.title || "Favoritos que vuelven siempre."}</h2>
          </div>

          <div className="best-sellers-copy">
            <p>
              {section?.description ||
                "Descubre los productos preferidos de nuestra comunidad."}
            </p>

            <Link to="/catalogo">
              Explorar todos
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>

        <div className="best-sellers-grid">
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}