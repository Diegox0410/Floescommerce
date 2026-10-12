import { Link } from "react-router-dom";
import { activeCategories, useCategoryStore } from "../../store/categoryStore";

const categoryArtwork: Record<string, string> = {
  accesorios: "/images/floes/categories/accesorios.jpeg",
  cintillos: "/images/floes/categories/cintillos.jpeg",
  "otros-confeccionados": "/images/floes/categories/otros-confeccionados.jpeg",
  sabanas: "/images/floes/categories/sabanas.jpeg",
  uniformes: "/images/floes/categories/uniformes.jpeg",
};

export function CategoryShowcase() {
  const categories = useCategoryStore((s) => s.categories);
  const featuredCategories = activeCategories(categories)
    .filter((category) => category.featured)
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      image: category.image || categoryArtwork[category.slug],
    }));
  if (!featuredCategories.length) return null;
  return (
    <section className="categories-section" id="categorias" aria-labelledby="categories-title">
      <div className="container">
        <header className="section-heading" data-scroll-item="heading">
          <div><span className="eyebrow">UNIVERSO FLOES</span><h2 id="categories-title">Categorías para cada profesión.</h2></div>
          <Link to="/catalogo">Ver catálogo</Link>
        </header>
        <div className="categories-grid">
          {featuredCategories.map((category, index) => (
            <Link
              key={category.id}
              to={`/catalogo?categoria=${category.slug}`}
              className={`category-card category-card-${index + 1}`}
              data-scroll-item="category"
            >
              {category.image && <img src={category.image} alt="" loading="lazy" decoding="async" />}
              <div>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{category.name}</h3>
                {category.description && <p>{category.description}</p>}
                <strong>Explorar categoría <span aria-hidden="true">↗</span></strong>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
