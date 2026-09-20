import {
  useEffect,
  type ReactNode,
} from "react";

import {
  useBusinessSettingsStore,
} from "../../store/businessSettingsStore";

interface AdminBusinessSettingsBootstrapProps {
  children: ReactNode;
}

export function AdminBusinessSettingsBootstrap({
  children,
}: AdminBusinessSettingsBootstrapProps) {
  const remoteLoading =
    useBusinessSettingsStore(
      (state) =>
        state.remoteLoading,
    );

  const remoteReady =
    useBusinessSettingsStore(
      (state) =>
        state.remoteReady,
    );

  const remoteError =
    useBusinessSettingsStore(
      (state) =>
        state.remoteError,
    );

  const loadRemoteSettings =
    useBusinessSettingsStore(
      (state) =>
        state.loadRemoteSettings,
    );

  useEffect(() => {
    void loadRemoteSettings().catch(
      () => {
        /*
         * El error queda almacenado
         * en el store.
         */
      },
    );
  }, [loadRemoteSettings]);

  if (remoteError) {
    return (
      <div className="admin-bootstrap-state">
        <div className="admin-bootstrap-card">
          <span className="admin-eyebrow">
            DGNG ADMIN
          </span>

          <h2>
            No se pudo cargar la configuración
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
            Cargando configuración
          </h2>

          <p>
            Sincronizando inteligencia comercial desde Firebase.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}