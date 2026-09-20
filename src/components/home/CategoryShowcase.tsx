import { Link } from "react-router-dom";
import { activeCategories, useCategoryStore } from "../../store/categoryStore";
export function CategoryShowcase() {
  const categories = useCategoryStore((s) => s.categories);
  const featuredCategories = activeCategories(categories).filter(
    (category) => category.featured,
  );
  return <section className="categories-section" id="categorias"><div className="container"><header className="section-heading"><span className="eyebrow">EXPLORA</span><h2>Categorías</h2><Link to="/catalogo">Ver todo</Link></header><div className="categories-grid">{featuredCategories.map((category) => <Link key={category.id} to={`/catalogo?categoria=${category.slug}`} className="category-card">{category.image && <img src={category.image} alt="" loading="lazy" />}<div><h3>{category.name}</h3><p>{category.description}</p></div></Link>)}</div></div></section>;
}
