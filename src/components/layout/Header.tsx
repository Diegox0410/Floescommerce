import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { useStoreConfigStore } from "../../store/storeConfigStore";
import { useCartStore } from "../../store/cartStore";

export function Header({ onOpenSearch }: { onOpenSearch: () => void }) {
  const config = useStoreConfigStore((s) => s.config);
  const openCart = useCartStore((s) => s.openCart);
  const quantity = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0)
  );
  const [mobile, setMobile] = useState(false);

  const nav = config.navigation
    .filter((n) => n.enabled && n.href && n.href !== "#")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <button
          className="header-mobile-toggle"
          onClick={() => setMobile(!mobile)}
          aria-label={mobile ? "Cerrar menú" : "Abrir menú"}
        >
          {mobile ? <X /> : <Menu />}
        </button>

        <Link to="/" className="header-brand" aria-label={config.identity.name}>
          {config.identity.logo ? (
            <img
              src={config.identity.logo}
              alt={config.identity.name}
              className="header-logo"
            />
          ) : (
            <span>{config.identity.shortName}</span>
          )}
        </Link>

        <nav className={mobile ? "header-nav is-open" : "header-nav"}>
          {nav.map((item) => (
            <NavLink
              key={item.id}
              to={item.href}
              onClick={() => setMobile(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <button onClick={onOpenSearch} aria-label="Buscar">
            <Search />
          </button>

          <button onClick={openCart} aria-label="Carrito">
            <ShoppingBag />
            <span>{quantity}</span>
          </button>
        </div>
      </div>
    </header>
  );
}