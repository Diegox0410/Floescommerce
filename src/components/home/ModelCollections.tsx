import { Link } from "react-router-dom";
import { ProductCard } from "../products/ProductCard";
import { useProductStore } from "../../store/productStore";

export function ModelCollections() {
  const products = useProductStore((state) => state.products.filter((product) => product.active));
  const groups = [
    { id: "new", eyebrow: "NUEVOS MODELOS", title: "Diseños recién incorporados.", items: [...products].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 4) },
    { id: "women", eyebrow: "UNIFORMES MUJER", title: "Siluetas para mujer.", items: products.filter((product) => product.category === "Uniformes" && product.audience === "mujer").slice(0, 4) },
    { id: "men", eyebrow: "UNIFORMES HOMBRE", title: "Modelos para hombre.", items: products.filter((product) => product.category === "Uniformes" && product.audience === "hombre").slice(0, 4) },
  ].filter((group) => group.items.length);
  const materials = [...new Set(products.flatMap((product) => [product.fabric, product.material]).filter(Boolean))] as string[];
  if (!groups.length && !materials.length) return null;
  return <>{groups.map((group) => <section className="model-collection-section" key={group.id}><div className="container"><header className="model-collection-heading"><div><span className="eyebrow">{group.eyebrow}</span><h2>{group.title}</h2></div><Link to="/catalogo">Ver catálogo</Link></header><div className="model-collection-grid">{group.items.map((product) => <ProductCard key={product.id} product={product} />)}</div></div></section>)}
    {materials.length > 0 && <section className="materials-section"><div className="container"><span className="eyebrow">NUESTRAS TELAS</span><h2>Materiales definidos para cada modelo.</h2><div className="materials-list">{materials.map((material) => <span key={material}>{material}</span>)}</div></div></section>}
  </>;
}
