import { useProductStore } from "../../store/productStore";
import { slugify } from "../../utils/normalization";

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryFilter({
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  const products = useProductStore((s) => s.products);
  const categories = [...new Set(products.filter((p) => p.active).map((p) => p.category))].map((name) => ({ id: slugify(name), slug: slugify(name), name }));
  return (
    <aside className="catalog-sidebar" aria-label="Filtrar por categoría">

      <span className="catalog-filter-title">
        Categorías
      </span>

      <button
        className={
          selectedCategory === "all"
            ? "catalog-filter active"
            : "catalog-filter"
        }
        onClick={() => onSelectCategory("all")}
        aria-pressed={selectedCategory === "all"}
      >
        Todos
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          className={
            selectedCategory === category.slug
              ? "catalog-filter active"
              : "catalog-filter"
          }
          onClick={() =>
            onSelectCategory(category.slug)
          }
        aria-pressed={selectedCategory === category.slug}
        >
          {category.name}
        </button>
      ))}
    </aside>
  );
}
