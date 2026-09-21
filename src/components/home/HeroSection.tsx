import { ArrowDown } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useStoreConfigStore } from "../../store/storeConfigStore";

export function HeroSection() {
  const hero = useStoreConfigStore((state) => state.config.home.hero);
  if (!hero.enabled) return null;
  return <section className={`floes-hero${hero.image ? " has-image" : ""}`} style={hero.image ? { "--hero-image": `url(${hero.image})` } as CSSProperties : undefined}>
    <div className="floes-hero-overlay" />
    <div className="container floes-hero-inner">
      <span className="floes-hero-kicker">CATÁLOGO</span>
      <h1>FLOES</h1>
      <p>{hero.description || "Confección para salud, belleza y bienestar."}</p>
      <Link className="floes-hero-action" to={hero.primaryButtonHref || "/catalogo"}>{hero.primaryButtonLabel || "Ver modelos"}</Link>
      <a className="floes-hero-scroll" href="#nuevos-modelos" aria-label="Ir a nuevos modelos"><ArrowDown size={18} /></a>
    </div>
  </section>;
}
