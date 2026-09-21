import {
  useEffect,
  type ReactNode,
} from "react";

import {
  getRemoteProducts,
} from "../../services/firebase/productRepository";

import {
  useProductStore,
} from "../../store/productStore";

interface AdminProductBootstrapProps {
  children: ReactNode;
}

export function AdminProductBootstrap({
  children,
}: AdminProductBootstrapProps) {
  const remoteLoading =
    useProductStore(
      (state) =>
        state.remoteLoading,
    );

  const remoteReady =
    useProductStore(
      (state) =>
        state.remoteReady,
    );

  const remoteMode =
    useProductStore(
      (state) =>
        state.remoteMode,
    );

  const remoteError =
    useProductStore(
      (state) =>
        state.remoteError,
    );

  useEffect(() => {
    let active = true;

    const load = async () => {
      useProductStore
        .getState()
        .beginRemoteLoad(
          "admin",
        );

      try {
        const products =
          await getRemoteProducts();

        if (!active) {
          return;
        }

        useProductStore
          .getState()
          .setRemoteProducts(
            products,
            "admin",
          );
      } catch (error) {
        if (!active) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los productos privados.";

        useProductStore
          .getState()
          .setRemoteError(
            message,
            "admin",
          );
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  if (remoteError) {
    return (
      <div className="admin-bootstrap-state">
        <div className="admin-bootstrap-card">
          <span className="admin-eyebrow">
            FLOES ADMIN
          </span>

          <h2>
            No se pudieron cargar los productos
          </h2>

          <p>
            {remoteError}
          </p>

          <button
            type="button"
            className="admin-button admin-button-primary"
            onClick={() => {
              window.location.reload();
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  /*
   * El área administrativa nunca
   * debe renderizar utilizando
   * remoteMode "catalog".
   *
   * La colección pública catalog
   * deliberadamente no contiene
   * costos privados.
   */
  if (
    remoteLoading ||
    !remoteReady ||
    remoteMode !== "admin"
  ) {
    return (
      <div className="admin-bootstrap-state">
        <div className="admin-bootstrap-card">
          <span className="admin-eyebrow">
            FLOES ADMIN
          </span>

          <h2>
            Cargando datos privados
          </h2>

          <p>
            Sincronizando productos,
            costos y datos administrativos
            desde Firebase.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}