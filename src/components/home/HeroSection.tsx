import { ArrowDown, ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useStoreConfigStore } from "../../store/storeConfigStore";

export function HeroSection() {
  const hero = useStoreConfigStore((state) => state.config.home.hero);
  if (!hero.enabled) return null;
  const imagery = hero.image ? {
    "--hero-image": `url(${hero.image})`,
    "--hero-mobile-image": `url(${hero.mobileImage || hero.image})`,
  } as CSSProperties : undefined;
  return <section className={`floes-hero${hero.image ? " has-image" : ""}`} style={imagery}>
    <div className="floes-hero-overlay" />
    <div className="container floes-hero-inner">
      <span className="floes-hero-kicker">{hero.eyebrow}</span>
      <h1>{hero.title || "FLOES.ec"}</h1>
      <p>{hero.description || "Confección para salud, belleza y bienestar."}</p>
      <div className="floes-hero-actions">
        <Link className="floes-hero-action" to={hero.primaryButtonHref || "/catalogo"}>{hero.primaryButtonLabel || "Ver catálogo"}<ArrowUpRight size={17} /></Link>
        {hero.secondaryButtonHref && hero.secondaryButtonLabel && <a className="floes-hero-secondary" href={hero.secondaryButtonHref}>{hero.secondaryButtonLabel}</a>}
      </div>
      <a className="floes-hero-scroll" href="#nuevos-modelos" aria-label="Ir a nuevos modelos"><ArrowDown size={18} /></a>
    </div>
  </section>;
}
