import { Link } from "react-router-dom";
import { activeCategories, useCategoryStore } from "../../store/categoryStore";
import { useProductStore } from "../../store/productStore";
import { slugify } from "../../utils/normalization";
export function CategoryShowcase() {
  const categories = useCategoryStore((s) => s.categories);
  const products = useProductStore((s) => s.products).filter((product) => product.active);
  const featuredCategories = [...new Set(products.map((product) => product.category))].map((name) => {
    const slug = slugify(name);
    const configured = activeCategories(categories).find((category) => category.slug === slug);
    return { id: slug, slug, name, description: configured?.description || "", image: configured?.image || products.find((product) => product.category === name)?.image };
  });
  if (!featuredCategories.length) return null;
  return <section className="categories-section" id="categorias"><div className="container"><header className="section-heading"><div><span className="eyebrow">UNIVERSO FLOES</span><h2>Categorías para cada profesión.</h2></div><Link to="/catalogo">Ver catálogo</Link></header><div className="categories-grid">{featuredCategories.map((category, index) => <Link key={category.id} to={`/catalogo?categoria=${category.slug}`} className={`category-card category-card-${index + 1}`}>{category.image && <img src={category.image} alt={category.name} loading="lazy" />}<div><span>0{index + 1}</span><h3>{category.name}</h3><p>{category.description}</p><strong>Explorar</strong></div></Link>)}</div></div></section>;
}
