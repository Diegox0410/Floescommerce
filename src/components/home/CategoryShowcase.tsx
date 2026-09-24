import { Link } from "react-router-dom";
import { activeCategories, useCategoryStore } from "../../store/categoryStore";
export function CategoryShowcase() {
  const categories = useCategoryStore((s) => s.categories);
  const featuredCategories = activeCategories(categories).filter(
    (category) => category.featured,
  );
  if (!featuredCategories.length) return null;
  return <section className="categories-section" id="categorias"><div className="container"><header className="section-heading"><div><span className="eyebrow">UNIVERSO FLOES</span><h2>Categorías para cada profesión.</h2></div><Link to="/catalogo">Ver catálogo</Link></header><div className="categories-grid">{featuredCategories.map((category, index) => <Link key={category.id} to={`/catalogo?categoria=${category.slug}`} className={`category-card category-card-${index + 1}`}>{category.image && <img src={category.image} alt={category.name} loading="lazy" />}<div><span>0{index + 1}</span><h3>{category.name}</h3><p>{category.description}</p><strong>Explorar</strong></div></Link>)}</div></div></section>;
}
