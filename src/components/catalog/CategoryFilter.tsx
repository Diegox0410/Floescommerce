import { activeCategories, useCategoryStore } from "../../store/categoryStore";

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryFilter({
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  const storedCategories = useCategoryStore((s) => s.categories);
  const categories = activeCategories(storedCategories);
  return (
    <aside className="catalog-sidebar">

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
        >
          {category.name}
        </button>
      ))}
    </aside>
  );
}
