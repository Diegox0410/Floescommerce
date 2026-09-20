import {
  ArrowRight,
  Search,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import { useProductStore } from "../../store/productStore";
import { useStoreConfigStore } from "../../store/storeConfigStore";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({
  open,
  onClose,
}: SearchOverlayProps) {
  const collection = useProductStore(state => state.products);
  const shortName = useStoreConfigStore((s) => s.config.identity.shortName);
  const [query, setQuery] =
    useState("");

  const inputRef =
    useRef<HTMLInputElement>(
      null
    );

  useEffect(() => {
    if (!open) {
      document.body.style.overflow =
        "";

      return;
    }

    document.body.style.overflow =
      "hidden";

    const timeout =
      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 120);

    return () => {
      window.clearTimeout(
        timeout
      );

      document.body.style.overflow =
        "";
    };
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "Escape" &&
        open
      ) {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open, onClose]);

  const close = () => {
    setQuery("");
    onClose();
  };

  const results =
    useMemo(() => {
      const products = collection.filter(p => p.active);
      const normalizedQuery =
        query
          .trim()
          .toLowerCase();

      if (!normalizedQuery) {
        return products.slice(
          0,
          4
        );
      }

      return products
        .filter((product) => {
          return (
            product.name
              .toLowerCase()
              .includes(
                normalizedQuery
              ) ||
            product.category
              .toLowerCase()
              .includes(
                normalizedQuery
              )
          );
        })
        .slice(0, 6);
    }, [query, collection]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="search-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Buscar productos"
    >
      <div
        className="search-overlay-backdrop"
        onClick={close}
      />

      <div className="search-panel">
        <div className="search-panel-top">
          <div className="search-brand">
            <span>
              {shortName}
            </span>

            <small>
              BUSCAR EN LA TIENDA
            </small>
          </div>

          <button
            type="button"
            className="search-close"
            onClick={close}
            aria-label="Cerrar búsqueda"
          >
            <X size={21} />
          </button>
        </div>

        <div className="search-input-wrapper">
          <Search size={25} />

          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(
              event
            ) =>
              setQuery(
                event.target.value
              )
            }
            placeholder="¿Qué estás buscando?"
            aria-label="Buscar productos"
          />
        </div>

        <div className="search-content">
          <div className="search-results-header">
            <span>
              {query
                ? "RESULTADOS"
                : "DESCUBRE"}
            </span>

            <strong>
              {results.length}
            </strong>
          </div>

          {results.length >
          0 ? (
            <div className="search-results">
              {results.map(
                (product) => {
                  const initials =
                    product.name
                      .split(" ")
                      .map(
                        (word) =>
                          word.charAt(
                            0
                          )
                      )
                      .slice(
                        0,
                        2
                      )
                      .join("");

                  return (
                    <Link
                      key={
                        product.id
                      }
                      to={`/producto/${product.id}`}
                      className="search-result"
                      onClick={close}
                    >
                      <div className="search-result-media">
                        <span>
                          {
                            initials
                          }
                        </span>
                      </div>

                      <div className="search-result-info">
                        <small>
                          {
                            product.category
                          }
                        </small>

                        <h3>
                          {
                            product.name
                          }
                        </h3>
                      </div>

                      <div className="search-result-price">
                        $
                        {product.price.toFixed(
                          2
                        )}
                      </div>

                      <ArrowRight
                        size={17}
                      />
                    </Link>
                  );
                }
              )}
            </div>
          ) : (
            <div className="search-empty">
              <h3>
                No encontramos resultados.
              </h3>

              <p>
                Intenta con otro nombre,
                categoría o palabra.
              </p>
            </div>
          )}

          <Link
            className="search-all-link"
            to={
              query
                ? `/catalogo?buscar=${encodeURIComponent(
                    query
                  )}`
                : "/catalogo"
            }
            onClick={close}
          >
            Ver catálogo completo

            <ArrowRight
              size={17}
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
