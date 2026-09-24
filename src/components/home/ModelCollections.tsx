import { Link } from "react-router-dom";
import { ProductCard } from "../products/ProductCard";
import { useProductStore } from "../../store/productStore";

const useActiveProducts = () => {
  const products = useProductStore((state) => state.products);
  return products.filter((product) => product.active);
};

function CollectionSection({ eyebrow, title, products, id, tone = 0 }: {
  eyebrow: string;
  title: string;
  products: ReturnType<typeof useActiveProducts>;
  id?: string;
  tone?: number;
}) {
  if (!products.length) return null;
  return <section className={`model-collection-section collection-${tone % 3}`} id={id}>
    <div className="container">
      <header className="model-collection-heading">
        <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>
        <Link to="/catalogo">Ver modelos</Link>
      </header>
      <div className="model-collection-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
    </div>
  </section>;
}

export function NewModels() {
  const products = useActiveProducts();
  const recent = [...products].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 4);
  return <CollectionSection id="nuevos-modelos" eyebrow="NUEVOS MODELOS" title="Conoce lo más reciente de FLOES." products={recent} />;
}

export function AudienceCollections() {
  const products = useActiveProducts();
  const groups = [
    { audience: "mujer", eyebrow: "MUJER", title: "Siluetas pensadas para ella." },
    { audience: "hombre", eyebrow: "HOMBRE", title: "Modelos pensados para él." },
    { audience: "unisex", eyebrow: "UNISEX", title: "Diseños para cada jornada." },
  ] as const;
  return <>{groups.map((group, index) => <CollectionSection key={group.audience} eyebrow={group.eyebrow} title={group.title} products={products.filter((product) => product.audience === group.audience).slice(0, 4)} tone={index + 1} />)}</>;
}

export function MaterialsSection() {
  const products = useActiveProducts();
  const materials = [...new Set(products.flatMap((product) => [product.fabric, product.material]).filter((value): value is string => Boolean(value?.trim())))];
  if (!materials.length) return null;
  return <section className="materials-section"><div className="container materials-layout">
    <div><span className="eyebrow">NUESTRAS TELAS</span><h2>Materiales registrados para cada modelo.</h2></div>
    <div className="materials-list">{materials.map((material, index) => <span key={material}><small>0{index + 1}</small>{material}</span>)}</div>
  </div></section>;
}

export function ModelCollections() {
  return <><NewModels /><AudienceCollections /><MaterialsSection /></>;
}
