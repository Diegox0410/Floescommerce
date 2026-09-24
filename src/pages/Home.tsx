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

export function Home() {
  const sections = useStoreConfigStore((s) => s.config.home.sections);
  const components = { hero: HeroSection, categories: CategoryShowcase, "featured-products": FeaturedProducts, "brand-statement": BrandStatement, campaign: CampaignBanner, "best-sellers": BestSellers, benefits: BenefitsSection, social: SocialSection };
  return (
    <main>
      {sections.filter((s) => s.enabled).sort((a,b) => a.sortOrder-b.sortOrder).map((section) => {
        const Component = components[section.type];
        return <Fragment key={section.id}>
          <Component />
          {section.type === "hero" && <NewModels />}
          {section.type === "categories" && <><AudienceCollections /><MaterialsSection /></>}
        </Fragment>;
      })}
    </main>
  );
}
