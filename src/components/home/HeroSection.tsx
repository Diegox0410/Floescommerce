import { Link } from "react-router-dom";
import { useStoreConfigStore } from "../../store/storeConfigStore";

export function HeroSection() {
  const hero = useStoreConfigStore((s) => s.config.home.hero);

  if (!hero.enabled) return null;

  return (
    <section className="hero-section">
      <div className="hero-cover-background" aria-hidden="true" />

      <div className="container hero-grid">
        <div className="hero-content">
          <span className="eyebrow">
  {hero.eyebrow}
  <span className="usa-flag" aria-label="Estados Unidos" />
</span>

          <h1>{hero.title}</h1>

          <p>{hero.description}</p>

          <div className="hero-actions">
            <Link to={hero.primaryButtonHref}>
              {hero.primaryButtonLabel}
            </Link>

            {hero.secondaryButtonLabel && hero.secondaryButtonHref && (
              <Link to={hero.secondaryButtonHref}>
                {hero.secondaryButtonLabel}
              </Link>
            )}
          </div>
        </div>

        <div className="hero-media">
          <img
            src="/images/brand/Feed-home.png"
            alt="Confecciones y productos de FLOES.ec"
            className="hero-feed-image"
          />
        </div>
      </div>
    </section>
  );
}