import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category } from "../types/category";
import { slugify } from "../utils/normalization";

const categoryDefaults = [
  { name: "Uniformes", description: "Modelos profesionales y prendas confeccionadas para distintas áreas de trabajo.", image: "/images/floes/categories/uniformes.jpeg" },
  { name: "Sábanas", description: "Textiles confeccionados para espacios de cuidado y bienestar.", image: "/images/floes/categories/sabanas.jpeg" },
  { name: "Cintillos", description: "Complementos textiles para rutinas profesionales y de cuidado.", image: "/images/floes/categories/cintillos.jpeg" },
  { name: "Accesorios", description: "Piezas que complementan el trabajo cotidiano.", image: "/images/floes/categories/accesorios.jpeg" },
  { name: "Otros confeccionados", description: "Confecciones FLOES para necesidades específicas.", image: "/images/floes/categories/otros-confeccionados.jpeg" },
];

export const defaultCategories: Category[] = categoryDefaults.map(
  ({ name, description, image }, sortOrder) => ({
    id: slugify(name), name, slug: slugify(name), description, image,
    active: true, featured: true, sortOrder,
  }),
);

interface CategoryState {
  categories: Category[];
  save: (category: Category) => void;
  remove: (id: string, used: boolean) => void;
  move: (id: string, direction: -1 | 1) => void;
}

export const activeCategories = (items: Category[]) =>
  items
    .filter((category) => category.active)
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        a.name.localeCompare(b.name),
    );

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set) => ({
      categories: defaultCategories,

      save: (category) =>
        set((state) => {
          const clean = {
            ...category,
            slug: slugify(
              category.slug || category.name,
            ),
          };

          return {
            categories: state.categories.some(
              (current) =>
                current.id === clean.id,
            )
              ? state.categories.map(
                  (current) =>
                    current.id === clean.id
                      ? clean
                      : current,
                )
              : [
                  ...state.categories,
                  clean,
                ],
          };
        }),

      remove: (id, used) => {
        if (used) {
          throw new Error(
            "La categoría está utilizada por productos. Desactívala antes de eliminarla.",
          );
        }

        set((state) => ({
          categories:
            state.categories.filter(
              (category) =>
                category.id !== id,
            ),
        }));
      },

      move: (id, direction) =>
        set((state) => {
          const sorted = [
            ...state.categories,
          ].sort(
            (a, b) =>
              a.sortOrder -
              b.sortOrder,
          );

          const index =
            sorted.findIndex(
              (category) =>
                category.id === id,
            );

          const swap =
            index + direction;

          if (
            index < 0 ||
            swap < 0 ||
            swap >= sorted.length
          ) {
            return state;
          }

          [
            sorted[index],
            sorted[swap],
          ] = [
            sorted[swap],
            sorted[index],
          ];

          return {
            categories:
              sorted.map(
                (
                  category,
                  sortOrder,
                ) => ({
                  ...category,
                  sortOrder,
                }),
              ),
          };
        }),
    }),
    {
      name: "floes-categories",
      version: 3,

      /*
       * V1 contenía las cuatro categorías demo.
       * La migración V2 instala la taxonomía
       * real del catálogo FLOES.
       */
      migrate: (persisted) => {
        const stored = persisted as { categories?: Category[] } | undefined;
        if (!Array.isArray(stored?.categories)) return { categories: defaultCategories };
        return {
          categories: stored.categories.map((category) => {
            const fallback = defaultCategories.find((item) => item.slug === category.slug);
            return { ...category, image: category.image || fallback?.image || "" };
          }),
        };
      },
    },
  ),
);
