import { HeroSection } from "../components/home/HeroSection";
import { CategoryShowcase } from "../components/home/CategoryShowcase";
import { FeaturedProducts } from "../components/home/FeaturedProducts";
import { BrandStatement } from "../components/home/BrandStatement";
import { CampaignBanner } from "../components/home/CampaignBanner";
import { BestSellers } from "../components/home/BestSellers";
import { BenefitsSection } from "../components/home/BenefitsSection";
import { SocialSection } from "../components/home/SocialSection";
import { useStoreConfigStore } from "../store/storeConfigStore";
import { AudienceCollections, MaterialsSection, NewModels } from "../components/home/ModelCollections";
import { Fragment } from "react";
import { StoreSEO } from "../components/common/StoreSEO";
import { ShoppingGuide } from "../components/home/ShoppingGuide";
import { useSectionReveals } from "../hooks/useSectionReveals";
import { useProductStore } from "../store/productStore";
import { EditorialCampaign } from "../components/home/EditorialCampaign";

function HomeCatalogStatus() {
  const remoteLoading = useProductStore((state) => state.remoteLoading);
  const remoteReady = useProductStore((state) => state.remoteReady);
  const remoteError = useProductStore((state) => state.remoteError);

  if (remoteReady) return null;

  return (
    <div className={`home-catalog-status${remoteError ? " is-error" : ""}`} role={remoteError ? "alert" : "status"} aria-live="polite">
      <div className="container">
        <span>{remoteError ? "No pudimos cargar el catálogo." : remoteLoading ? "Cargando modelos FLOES…" : "Conectando con el catálogo FLOES…"}</span>
        {remoteError && <>
          <p>{remoteError}</p>
          <button type="button" onClick={() => window.location.reload()}>Reintentar</button>
        </>}
      </div>
    </div>
  );
}

export function Home() {
  const sections = useStoreConfigStore((s) => s.config.home.sections);
  const catalogReady = useProductStore((s) => s.remoteReady);
  const revealRoot = useSectionReveals<HTMLElement>();
  const components = { hero: HeroSection, categories: CategoryShowcase, "featured-products": FeaturedProducts, "brand-statement": BrandStatement, campaign: CampaignBanner, "best-sellers": BestSellers, benefits: BenefitsSection, social: SocialSection };
  const orderedSections = sections.filter((s) => s.enabled).sort((a, b) => a.sortOrder - b.sortOrder);
  const hasHero = orderedSections.some((section) => section.type === "hero");
  const productSections = new Set(["featured-products", "best-sellers"]);
  return (
    <main className="floes-home" data-home-storyline="editorial" ref={revealRoot}>
      <StoreSEO />
      {!hasHero && <HomeCatalogStatus />}
      {orderedSections.map((section) => {
        const Component = components[section.type];
        return <Fragment key={section.id}>
          {(!productSections.has(section.type) || catalogReady) && <Component />}
          {section.type === "hero" && <><HomeCatalogStatus />{catalogReady && <NewModels />}</>}
          {section.type === "categories" && catalogReady && <><AudienceCollections /><MaterialsSection /></>}
          {section.type === "brand-statement" && <><EditorialCampaign /><ShoppingGuide /></>}
        </Fragment>;
      })}
    </main>
  );
}
