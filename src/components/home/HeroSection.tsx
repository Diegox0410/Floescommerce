import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useStoreConfigStore } from "../../store/storeConfigStore";
import { useProductStore } from "../../store/productStore";

export function HeroSection() {
  const hero = useStoreConfigStore((state) => state.config.home.hero);
  const catalogReady = useProductStore((state) => state.remoteReady);
  const editorialHero = "/images/editorial/campana-hero-scrub-negro.webp";
  if (!hero.enabled) return null;
  return <section className="floes-hero has-image">
    <picture className="floes-hero-media" aria-hidden="true">
      <img src={editorialHero} alt="" fetchPriority="high" decoding="async" width={1600} height={900} />
    </picture>
    <div className="floes-hero-overlay" />
    <div className="container floes-hero-inner">
      <span className="floes-hero-kicker">{hero.eyebrow}</span>
      <h1>{hero.title || "FLOES.ec"}</h1>
      <p>{hero.description || "Confección para salud, belleza y bienestar."}</p>
      <div className="floes-hero-actions">
        <Link className="floes-hero-action" to={hero.primaryButtonHref || "/catalogo"}>{hero.primaryButtonLabel || "Ver catálogo"}<ArrowUpRight size={17} /></Link>
        {hero.secondaryButtonHref && hero.secondaryButtonLabel && <a className="floes-hero-secondary" href={hero.secondaryButtonHref}>{hero.secondaryButtonLabel}</a>}
      </div>
      {catalogReady && <a className="floes-hero-scroll" href="#nuevos-modelos" aria-label="Ir a nuevos modelos"><ArrowDown size={18} /></a>}
    </div>
  </section>;
}
