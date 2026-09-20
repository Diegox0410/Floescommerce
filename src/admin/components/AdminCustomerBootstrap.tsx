import {
  useEffect,
  type ReactNode,
} from "react";

import {
  useCustomerStore,
} from "../../store/customerStore";

interface AdminCustomerBootstrapProps {
  children: ReactNode;
}

export function AdminCustomerBootstrap({
  children,
}: AdminCustomerBootstrapProps) {
  const remoteLoading =
    useCustomerStore(
      (state) =>
        state.remoteLoading,
    );

  const remoteReady =
    useCustomerStore(
      (state) =>
        state.remoteReady,
    );

  const remoteError =
    useCustomerStore(
      (state) =>
        state.remoteError,
    );

  const loadRemoteCustomers =
    useCustomerStore(
      (state) =>
        state.loadRemoteCustomers,
    );

  useEffect(() => {
    void loadRemoteCustomers().catch(
      () => {
        /*
         * El error queda
         * almacenado en el store.
         */
      },
    );
  }, [loadRemoteCustomers]);

  if (remoteError) {
    return (
      <div className="admin-bootstrap-state">
        <div className="admin-bootstrap-card">
          <span className="admin-eyebrow">
            DGNG ADMIN
          </span>

          <h2>
            No se pudieron cargar los clientes
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
            Cargando clientes
          </h2>

          <p>
            Sincronizando CRM desde Firebase.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}