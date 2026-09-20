import { useMemo, useState } from "react";

import {
  useSearchParams,
} from "react-router-dom";

import { PageHeader } from "../components/common/PageHeader";

import { CategoryFilter } from "../components/catalog/CategoryFilter";
import { CatalogToolbar } from "../components/catalog/CatalogToolbar";
import { CatalogGrid } from "../components/catalog/CatalogGrid";

import { useProductStore } from "../store/productStore";
import { slugify } from "../utils/normalization";

export function Catalog() {
  const products = useProductStore(state => state.products);
  const [searchParams] =
    useSearchParams();

  const categoryParam =
    searchParams.get("categoria");

  const filterParam =
    searchParams.get("filter");

  const searchParam =
    searchParams.get("buscar");

  const [categoryState, setCategoryState] = useState(() => ({ param: categoryParam, value: categoryParam || "all" }));
  const [searchState, setSearchState] = useState(() => ({ param: searchParam, value: searchParam || "" }));
  if (categoryState.param !== categoryParam) setCategoryState({ param: categoryParam, value: categoryParam || "all" });
  if (searchState.param !== searchParam) setSearchState({ param: searchParam, value: searchParam || "" });
  const selectedCategory = categoryState.value, search = searchState.value;
  const setSelectedCategory = (value: string) => setCategoryState({ param: categoryParam, value });
  const setSearch = (value: string) => setSearchState({ param: searchParam, value });

  const [sort, setSort] =
    useState("featured");

  const filteredProducts =
    useMemo(() => {
      let result = [
        ...products.filter(p => p.active),
      ];

      /* =====================================================
         CATEGORY FILTER
      ===================================================== */

      if (
        selectedCategory !==
        "all"
      ) {
        result =
          result.filter(
            (product) =>
              slugify(
                product.category,
              ) ===
              selectedCategory,
          );
      }

      /* =====================================================
         SPECIAL FILTERS
      ===================================================== */

      if (
        filterParam ===
        "ofertas"
      ) {
        result =
          result.filter(
            (product) =>
              typeof product.oldPrice ===
                "number" &&
              product.oldPrice >
                product.price
          );
      }

      if (
        filterParam ===
        "nuevos"
      ) {
        result =
          result.filter(
            (product) =>
              product.badge
                ?.trim()
                .toLowerCase() ===
              "nuevo"
          );
      }

      if (
        filterParam ===
        "destacados"
      ) {
        result =
          result.filter(
            (product) =>
              Boolean(
                product.featured
              )
          );
      }

      if (
        filterParam ===
        "favoritos"
      ) {
        result =
          result.filter(
            (product) =>
              Boolean(
                product.bestSeller
              )
          );
      }

      /* =====================================================
         SEARCH
      ===================================================== */

      if (
        search.trim()
      ) {
        const query =
          search
            .trim()
            .toLowerCase();

        result =
          result.filter(
            (product) => {
              const productName =
                product.name
                  .toLowerCase();

              const productCategory =
                product.category
                  .toLowerCase();

              const productBadge =
                product.badge
                  ?.toLowerCase() ||
                "";

              return (
                productName.includes(
                  query
                ) ||
                productCategory.includes(
                  query
                ) ||
                productBadge.includes(
                  query
                )
              );
            }
          );
      }

      /* =====================================================
         SORT
      ===================================================== */

      switch (sort) {
        case "price-low":
          result.sort(
            (a, b) =>
              a.price -
              b.price
          );
          break;

        case "price-high":
          result.sort(
            (a, b) =>
              b.price -
              a.price
          );
          break;

        case "name":
          result.sort(
            (a, b) =>
              a.name.localeCompare(
                b.name
              )
          );
          break;

        case "featured":
        default:
          result.sort(
            (a, b) =>
              Number(
                Boolean(
                  b.featured
                )
              ) -
              Number(
                Boolean(
                  a.featured
                )
              )
          );
          break;
      }

      return result;
    }, [
      products,
      selectedCategory,
      filterParam,
      search,
      sort,
    ]);

  /* =======================================================
     PAGE COPY
  ======================================================= */

  let eyebrow =
    "NUESTRA TIENDA";

  let title =
    "Encuentra algo";

  let accent =
    " para ti.";

  let description =
    "Explora nuestra selección de productos importados, cuidado personal, bienestar y mucho más.";

  if (
    filterParam ===
    "ofertas"
  ) {
    eyebrow =
      "PROMOCIONES";

    title =
      "Encuentra tus";

    accent =
      " ofertas.";

    description =
      "Explora productos seleccionados con precios especiales.";
  }

  if (
    filterParam ===
    "nuevos"
  ) {
    eyebrow =
      "NOVEDADES";

    title =
      "Descubre lo";

    accent =
      " más nuevo.";

    description =
      "Conoce los productos más recientes de nuestra tienda.";
  }

  if (
    filterParam ===
    "destacados"
  ) {
    eyebrow =
      "DESTACADOS";

    title =
      "Nuestra selección";

    accent =
      " especial.";

    description =
      "Productos seleccionados para destacar dentro de nuestra tienda.";
  }

  if (
    filterParam ===
    "favoritos"
  ) {
    eyebrow =
      "FAVORITOS";

    title =
      "Los productos";

    accent =
      " más elegidos.";

    description =
      "Descubre algunos de los favoritos de nuestra selección.";
  }

  if (
    categoryParam ===
    "bienestar"
  ) {
    eyebrow =
      "BIENESTAR";

    title =
      "Productos para";

    accent =
      " sentirte bien.";

    description =
      "Explora nuestra selección actual de productos de bienestar.";
  }

  if (
    categoryParam ===
    "cuidado-personal"
  ) {
    eyebrow =
      "CUIDADO PERSONAL";

    title =
      "Encuentra tu";

    accent =
      " rutina.";

    description =
      "Explora productos para cuidado facial, capilar y personal.";
  }

  return (
    <main>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        accent={accent}
        description={
          description
        }
      />

      <section className="catalog-section">
        <div className="container">

          <CatalogToolbar
            search={search}
            onSearchChange={
              setSearch
            }
            sort={sort}
            onSortChange={
              setSort
            }
            totalProducts={
              filteredProducts.length
            }
          />

          <div className="catalog-layout">

            <CategoryFilter
              selectedCategory={
                selectedCategory
              }
              onSelectCategory={
                setSelectedCategory
              }
            />

            <CatalogGrid
              products={
                filteredProducts
              }
            />

          </div>

        </div>
      </section>
    </main>
  );
}
