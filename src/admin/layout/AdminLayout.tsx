import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  AdminSidebar,
} from "../components/AdminSidebar";

import {
  AdminTopbar,
} from "../components/AdminTopbar";

import {
  AdminAuthGuard,
} from "../components/AdminAuthGuard";

import {
  AdminProductBootstrap,
} from "../components/AdminProductBootstrap";

import {
  AdminCustomerBootstrap,
} from "../components/AdminCustomerBootstrap";

import {
  AdminOrderBootstrap,
} from "../components/AdminOrderBootstrap";

import {
  AdminBusinessSettingsBootstrap,
} from "../components/AdminBusinessSettingsBootstrap";

import "../../styles/admin.css";

const mobileQuery =
  "(max-width: 760px)";

const subscribeToViewport = (
  onChange: () => void,
) => {
  const media =
    window.matchMedia(
      mobileQuery,
    );

  media.addEventListener(
    "change",
    onChange,
  );

  return () => {
    media.removeEventListener(
      "change",
      onChange,
    );
  };
};

const getMobileSnapshot = () =>
  window.matchMedia(
    mobileQuery,
  ).matches;

export function AdminLayout() {
  const isMobile =
    useSyncExternalStore(
      subscribeToViewport,
      getMobileSnapshot,
      () => false,
    );

  const [
    collapsed,
    setCollapsed,
  ] = useState(false);

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const sidebar =
    useRef<HTMLElement>(
      null,
    );

  const { pathname } =
    useLocation();

  const toggle = () => {
    if (
      window.matchMedia(
        mobileQuery,
      ).matches
    ) {
      setMobileOpen(
        (value) => !value,
      );
    } else {
      setCollapsed(
        (value) => !value,
      );
    }
  };

  useEffect(() => {
    window.scrollTo(
      0,
      0,
    );
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const previous =
      document.activeElement as
        | HTMLElement
        | null;

    const overflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    const nodes = () =>
      Array.from(
        sidebar.current
          ?.querySelectorAll<HTMLElement>(
            "a, button",
          ) ?? [],
      );

    const focusFrame =
      window.requestAnimationFrame(
        () => {
          nodes()[0]?.focus();
        },
      );

    const keydown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === "Escape"
      ) {
        setMobileOpen(false);
      }

      if (
        event.key === "Tab"
      ) {
        const items =
          nodes();

        const first =
          items[0];

        const last =
          items.at(-1);

        if (
          !sidebar.current?.contains(
            document.activeElement,
          )
        ) {
          event.preventDefault();
          first?.focus();
        } else if (
          event.shiftKey &&
          document.activeElement ===
            first
        ) {
          event.preventDefault();
          last?.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement ===
            last
        ) {
          event.preventDefault();
          first?.focus();
        }
      }
    };

    const media =
      window.matchMedia(
        mobileQuery,
      );

    const resize = () => {
      if (!media.matches) {
        setMobileOpen(false);
      }
    };

    media.addEventListener(
      "change",
      resize,
    );

    document.addEventListener(
      "keydown",
      keydown,
    );

    return () => {
      window.cancelAnimationFrame(
        focusFrame,
      );

      document.body.style.overflow =
        overflow;

      document.removeEventListener(
        "keydown",
        keydown,
      );

      media.removeEventListener(
        "change",
        resize,
      );

      previous?.focus();
    };
  }, [mobileOpen]);

  return (
    <AdminAuthGuard>
      <AdminProductBootstrap>
        <AdminCustomerBootstrap>
          <AdminOrderBootstrap>
            <AdminBusinessSettingsBootstrap>
              <div
                className={`admin-shell ${
                  collapsed
                    ? "admin-collapsed"
                    : ""
                } ${
                  mobileOpen
                    ? "admin-mobile-open"
                    : ""
                }`}
              >
                <a
                  className="admin-skip-link"
                  href="#admin-main"
                >
                  Saltar al contenido
                </a>

                {mobileOpen && (
                  <button
                    className="admin-drawer-backdrop"
                    aria-label="Cerrar navegación"
                    onClick={() =>
                      setMobileOpen(
                        false,
                      )
                    }
                  />
                )}

                <aside
                  id="admin-navigation"
                  ref={sidebar}
                  onTransitionEnd={(
                    event,
                  ) => {
                    if (
                      mobileOpen &&
                      event.target ===
                        event.currentTarget &&
                      !event.currentTarget.contains(
                        document.activeElement,
                      )
                    ) {
                      event.currentTarget
                        .querySelector<HTMLElement>(
                          "a, button",
                        )
                        ?.focus();
                    }
                  }}
                  className="admin-sidebar"
                  role={
                    mobileOpen
                      ? "dialog"
                      : undefined
                  }
                  aria-modal={
                    mobileOpen
                      ? true
                      : undefined
                  }
                  aria-label="Navegación administrativa"
                >
                  <AdminSidebar
                    collapsed={
                      collapsed &&
                      !isMobile
                    }
                    onToggle={
                      toggle
                    }
                    onNavigate={() =>
                      setMobileOpen(
                        false,
                      )
                    }
                  />
                </aside>

                <div
                  className="admin-workspace"
                  inert={
                    mobileOpen
                  }
                >
                  <AdminTopbar
                    onToggle={
                      toggle
                    }
                    expanded={
                      isMobile
                        ? mobileOpen
                        : !collapsed
                    }
                  />

                  <main
                    id="admin-main"
                    className="admin-main"
                    tabIndex={-1}
                  >
                    <Outlet />
                  </main>

                  <footer className="admin-footer">
                    DGNG ADMIN

                    <span>
                      Tu negocio, con
                      perspectiva.
                    </span>

                    <span>
                      Firebase · Datos privados
                    </span>
                  </footer>
                </div>
              </div>
            </AdminBusinessSettingsBootstrap>
          </AdminOrderBootstrap>
        </AdminCustomerBootstrap>
      </AdminProductBootstrap>
    </AdminAuthGuard>
  );
}