import {
  useEffect,
  type ReactNode,
} from "react";

import {
  useOrderStore,
} from "../../store/orderStore";

interface AdminOrderBootstrapProps {
  children: ReactNode;
}

export function AdminOrderBootstrap({
  children,
}: AdminOrderBootstrapProps) {
  const remoteLoading =
    useOrderStore(
      (state) =>
        state.remoteLoading,
    );

  const remoteReady =
    useOrderStore(
      (state) =>
        state.remoteReady,
    );

  const remoteError =
    useOrderStore(
      (state) =>
        state.remoteError,
    );

  const loadRemoteOrders =
    useOrderStore(
      (state) =>
        state.loadRemoteOrders,
    );

  useEffect(() => {
    void loadRemoteOrders().catch(
      () => {
        /*
         * El error ya queda
         * almacenado en el store.
         */
      },
    );
  }, [loadRemoteOrders]);

  if (remoteError) {
    return (
      <div className="admin-bootstrap-state">
        <div className="admin-bootstrap-card">
          <span className="admin-eyebrow">
            DGNG ADMIN
          </span>

          <h2>
            No se pudieron cargar los pedidos
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

  if (
    remoteLoading ||
    !remoteReady
  ) {
    return (
      <div className="admin-bootstrap-state">
        <div className="admin-bootstrap-card">
          <span className="admin-eyebrow">
            DGNG ADMIN
          </span>

          <h2>
            Cargando pedidos
          </h2>

          <p>
            Sincronizando pedidos y rentabilidad desde Firebase.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}