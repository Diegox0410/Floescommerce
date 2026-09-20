import {
  MessageCircle,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";

import { useStoreConfigStore } from "../../store/storeConfigStore";

const icons = {
  truck: Truck,
  sparkles: Sparkles,
  message: MessageCircle,
  bag: ShoppingBag,
};

export function BenefitsSection() {
  const configuredBenefits = useStoreConfigStore(
    (s) => s.config.home.benefits
  );

  const benefits = configuredBenefits.filter(
    (benefit) => benefit.enabled
  );

  if (!benefits.length) return null;

  return (
    <section className="benefits-section dgng-benefits">
      <div className="container">
        <header className="dgng-benefits-header">
          <span className="eyebrow">POR QUÉ DGNG</span>

          <h2>Comprar fácil, elegir mejor.</h2>
        </header>

        <div className="dgng-benefits-grid">
          {benefits.map((benefit) => {
            const Icon =
              icons[benefit.iconKey as keyof typeof icons] ?? Sparkles;

            return (
              <article className="dgng-benefit-card" key={benefit.id}>
                <div className="dgng-benefit-icon">
                  <Icon />
                </div>

                <div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}