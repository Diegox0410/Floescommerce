import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category } from "../types/category";
import { slugify } from "../utils/normalization";

const categoryNames = [
  "Fragancias y brumas",
  "Cuidado labial",
  "Kits corporales",
  "Exfoliación corporal",
  "Hidratación y cuidado corporal",
  "Baño e higiene",
  "Cuidado capilar",
  "Brillo corporal",
  "Línea infantil",
];

export const defaultCategories: Category[] = categoryNames.map(
  (name, sortOrder) => ({
    id: slugify(name),
    name,
    slug: slugify(name),
    description: `Explora nuestra selección de ${name.toLowerCase()}.`,
    image: `/images/categories/${slugify(name)}.jpg`,
    active: true,
    featured: true,
    sortOrder,
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
      name: "dgng-categories",
      version: 2,

      /*
       * V1 contenía las cuatro categorías demo.
       * La migración V2 instala la taxonomía
       * real del catálogo DGNG.
       */
      migrate: () => ({
        categories:
          defaultCategories,
      }),
    },
  ),
);
